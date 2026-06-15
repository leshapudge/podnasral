import prisma from "@/lib/db/prisma";
import { ApiError, badRequest, conflict, notFound } from "@/lib/api/errors";
import { getActiveEvent } from "@/lib/event/event.service";
import { parseEventConfig } from "@/lib/event/config";
import { logActivity } from "@/lib/activity/activity.service";
import { liveBroadcaster } from "@/lib/live/broadcaster";
import type { ModifierEffects } from "@/lib/scoring/score-calculator";
import { toJson } from "@/lib/utils/json";
import { buildModifiersSnapshot } from "@/lib/casino/modifiers";
import {
  parsePendingModifierIds,
  removePendingModifierIds,
} from "@/lib/modifiers/pending-modifiers";
import {
  buildEliminationOrder,
} from "./pool";

const DEFAULT_PRESTART_AUCTION_LOGINS = ["kazanfarik"];

function parseLoginList(envValue: string | undefined, fallback: string[]) {
  const parsed = (envValue ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : fallback;
}

function canStartAuctionsBeforeActive(twitchLogin: string | null | undefined) {
  const login = twitchLogin?.trim().toLowerCase();
  if (!login) return false;
  const allowed = parseLoginList(
    process.env.PRESTART_AUCTION_TWITCH_LOGINS,
    DEFAULT_PRESTART_AUCTION_LOGINS,
  );
  return allowed.includes(login);
}

function parseEffects(json: unknown): ModifierEffects {
  if (!json || typeof json !== "object") return {};
  const o = json as Record<string, number | boolean>;
  return {
    scoreMult: typeof o.scoreMult === "number" ? o.scoreMult : undefined,
    penaltyReduction: typeof o.penaltyReduction === "number" ? o.penaltyReduction : undefined,
    rareDropMult: typeof o.rareDropMult === "number" ? o.rareDropMult : undefined,
    extraLootRolls: typeof o.extraLootRolls === "number" ? o.extraLootRolls : undefined,
    auctionPoolShortBias: typeof o.auctionPoolShortBias === "number" ? o.auctionPoolShortBias : undefined,
    auctionPoolLongBias: typeof o.auctionPoolLongBias === "number" ? o.auctionPoolLongBias : undefined,
    auctionPoolRareBias: typeof o.auctionPoolRareBias === "number" ? o.auctionPoolRareBias : undefined,
    auctionCandidateBonus: typeof o.auctionCandidateBonus === "number" ? o.auctionCandidateBonus : undefined,
    difficultyRerolls: typeof o.difficultyRerolls === "number" ? o.difficultyRerolls : undefined,
    difficultyEasyBias: o.difficultyEasyBias === true,
    difficultyHardBias: o.difficultyHardBias === true,
    underdogScoreBonus: typeof o.underdogScoreBonus === "number" ? o.underdogScoreBonus : undefined,
    skipDropPenalty: o.skipDropPenalty === true,
    bossDamageMult: typeof o.bossDamageMult === "number" ? o.bossDamageMult : undefined,
    longGameHltbMin: typeof o.longGameHltbMin === "number" ? o.longGameHltbMin : undefined,
    longGameScoreBonus: typeof o.longGameScoreBonus === "number" ? o.longGameScoreBonus : undefined,
    longGameLootBonus: typeof o.longGameLootBonus === "number" ? o.longGameLootBonus : undefined,
    ratSteal: o.ratSteal === true,
    dropRefundMaterial: o.dropRefundMaterial === true,
    pinataLootBonus: typeof o.pinataLootBonus === "number" ? o.pinataLootBonus : undefined,
    flatScoreBonus: typeof o.flatScoreBonus === "number" ? o.flatScoreBonus : undefined,
    flatScorePenalty: typeof o.flatScorePenalty === "number" ? o.flatScorePenalty : undefined,
    factoryAssembly: o.factoryAssembly === true,
    speedrunTaxHours: typeof o.speedrunTaxHours === "number" ? o.speedrunTaxHours : undefined,
    speedrunTaxPenalty: typeof o.speedrunTaxPenalty === "number" ? o.speedrunTaxPenalty : undefined,
    shortGameHltbMax: typeof o.shortGameHltbMax === "number" ? o.shortGameHltbMax : undefined,
    shortGameFlatBonus: typeof o.shortGameFlatBonus === "number" ? o.shortGameFlatBonus : undefined,
    shortGameLootBonus: typeof o.shortGameLootBonus === "number" ? o.shortGameLootBonus : undefined,
    dropPenaltyMultiplier: typeof o.dropPenaltyMultiplier === "number" ? o.dropPenaltyMultiplier : undefined,
    wastedDrop: o.wastedDrop === true,
    blockRatSteal: o.blockRatSteal === true,
  };
}

export async function createAuction(participantId: string) {
  const event = await getActiveEvent();

  const { auction, totalPoints } = await prisma.$transaction(async (tx) => {
    const participant = await tx.participant.findUnique({
      where: { id: participantId },
      select: {
        id: true,
        status: true,
        totalPoints: true,
        user: { select: { twitchLogin: true } },
      },
    });
    if (!participant) throw notFound("Participant");
    const allowPrestart = canStartAuctionsBeforeActive(participant.user.twitchLogin);
    if (event.status !== "ACTIVE" && !allowPrestart) {
      throw badRequest("Event is not active");
    }
    if (participant.status !== "IDLE") {
      throw conflict("Cannot start auction in current status");
    }

    const existing = await tx.auctionRun.findFirst({
      where: { participantId, status: "PREPARING" },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      await tx.participant.update({
        where: { id: participantId },
        data: { status: "AUCTIONING" },
      });
      return { auction: existing, totalPoints: participant.totalPoints };
    }

    await tx.participant.update({
      where: { id: participantId },
      data: { status: "AUCTIONING" },
    });

    const auction = await tx.auctionRun.create({
      data: {
        participantId,
        status: "PREPARING",
        modifiersJson: [],
      },
    });

    return { auction, totalPoints: participant.totalPoints };
  });

  liveBroadcaster.publish({
    type: "leaderboard.patch",
    data: { participantId, status: "AUCTIONING", totalPoints },
  });

  const autoAppliedModifierIds = await applyQueuedBadModifiers(auction.id, participantId);
  return { auction, autoAppliedModifierIds };
}

async function applyQueuedBadModifiers(auctionId: string, participantId: string) {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { pendingModifierItemIds: true },
  });
  if (!participant) return [];

  const pendingIds = parsePendingModifierIds(participant.pendingModifierItemIds);
  if (pendingIds.length === 0) return [];

  const appliedIds: string[] = [];
  const staleIds: string[] = [];

  for (const inventoryItemId of pendingIds) {
    try {
      await applyModifier(auctionId, participantId, inventoryItemId, { ignoreCap: true });
      appliedIds.push(inventoryItemId);
    } catch (error) {
      // Invalid/missing items should be dropped from the queue;
      // transient errors stay queued for the next attempt.
      if (error instanceof ApiError && error.status < 500) {
        staleIds.push(inventoryItemId);
      }
    }
  }

  await removePendingModifierIds(participantId, [...appliedIds, ...staleIds]);
  return appliedIds;
}

export async function applyModifier(
  auctionId: string,
  participantId: string,
  inventoryItemId: string,
  options?: { ignoreCap?: boolean },
) {
  const auction = await prisma.auctionRun.findUnique({
    where: { id: auctionId },
    include: {
      modifierUses: {
        include: {
          inventoryItem: {
            include: {
              itemDefinition: {
                select: { slug: true, effectsJson: true },
              },
            },
          },
        },
      },
    },
  });
  if (!auction || auction.participantId !== participantId) throw notFound("Auction");
  if (auction.status !== "PREPARING") throw badRequest("Auction not in preparing state");

  const event = await getActiveEvent();
  const config = parseEventConfig(event.config);
  if (!options?.ignoreCap && auction.modifierUses.length >= config.maxModifiersPerAuction) {
    throw badRequest("Max modifiers reached");
  }

  const item = await prisma.inventoryItem.findFirst({
    where: { id: inventoryItemId, participantId },
    include: { itemDefinition: true },
  });
  if (!item || item.itemDefinition.kind !== "MODIFIER") {
    throw badRequest("Invalid modifier item");
  }

  const alreadyUsed = await prisma.modifierConsumption.findFirst({
    where: { inventoryItemId },
  });
  if (alreadyUsed) throw badRequest("Item already consumed");

  const effects = parseEffects(item.itemDefinition.effectsJson);
  const effectsSig = JSON.stringify(effects);
  const hasSameEffect = auction.modifierUses.some((use) => {
    const existing = use.inventoryItem.itemDefinition;
    if (existing.slug === item.itemDefinition.slug) return true;
    return JSON.stringify(parseEffects(existing.effectsJson)) === effectsSig;
  });
  if (hasSameEffect) {
    throw badRequest("Duplicate modifier effect for this auction");
  }
  const current = (auction.modifiersJson as ModifierEffects[]) ?? [];

  try {
    await prisma.$transaction([
      prisma.modifierConsumption.create({
        data: { auctionRunId: auctionId, inventoryItemId },
      }),
      prisma.auctionRun.update({
        where: { id: auctionId },
        data: { modifiersJson: toJson([...current, effects]) },
      }),
    ]);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      throw badRequest("Item already consumed");
    }
    throw error;
  }

  return prisma.auctionRun.findUnique({
    where: { id: auctionId },
    include: { modifierUses: { include: { inventoryItem: { include: { itemDefinition: true } } } } },
  });
}

function buildDonationTimeline(
  ranked: { catalogGameId: string }[],
) {
  const timeline: { step: number; eliminatedGameId?: string; winnerGameId?: string }[] = [];
  let step = 0;

  for (let i = ranked.length - 1; i >= 1; i -= 1) {
    timeline.push({ step: step++, eliminatedGameId: ranked[i].catalogGameId });
  }
  timeline.push({ step, winnerGameId: ranked[0].catalogGameId });
  return timeline;
}

export async function startAuction(auctionId: string, participantId: string) {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { status: true, currentSessionId: true },
  });
  if (!participant) throw notFound("Participant");
  if (participant.status !== "AUCTIONING") {
    throw conflict("Cannot start auction in current status");
  }
  if (participant.currentSessionId) {
    const activeSession = await prisma.gameSession.findUnique({
      where: { id: participant.currentSessionId },
      select: { status: true },
    });
    if (activeSession && activeSession.status !== "COMPLETED" && activeSession.status !== "DROPPED") {
      throw conflict("Finish current session before starting a new auction");
    }
  }

  const auction = await prisma.auctionRun.findUnique({
    where: { id: auctionId },
    include: { modifierUses: true },
  });
  if (!auction || auction.participantId !== participantId) throw notFound("Auction");
  if (auction.status !== "PREPARING") throw badRequest("Auction not in preparing state");

  const claimed = await prisma.auctionRun.updateMany({
    where: { id: auctionId, status: "PREPARING" },
    data: {
      status: "RUNNING",
      resolvedGameId: null,
      resolvedAt: null,
      seed: null,
      candidateCount: 0,
    },
  });
  if (claimed.count !== 1) {
    throw conflict("Auction already started");
  }

  return {
    auction: await getAuction(auctionId),
  };
}

export async function resolveAuctionFromDonations(auctionId: string, participantId: string) {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { status: true, currentSessionId: true, userId: true },
  });
  if (!participant) throw notFound("Participant");
  if (participant.status !== "AUCTIONING") {
    throw conflict("Cannot resolve auction in current status");
  }
  if (participant.currentSessionId) {
    const activeSession = await prisma.gameSession.findUnique({
      where: { id: participant.currentSessionId },
      select: { status: true },
    });
    if (activeSession && activeSession.status !== "COMPLETED" && activeSession.status !== "DROPPED") {
      throw conflict("Finish current session before starting a new auction");
    }
  }

  const auction = await prisma.auctionRun.findUnique({
    where: { id: auctionId },
    include: {
      modifierUses: { include: { inventoryItem: { include: { itemDefinition: true } } } },
    },
  });
  if (!auction || auction.participantId !== participantId) throw notFound("Auction");
  if (auction.status !== "RUNNING") throw badRequest("Donation auction is not running");

  const event = await getActiveEvent();
  const modifiers = (auction.modifiersJson as ModifierEffects[]) ?? [];
  const modifiersSnapshot = buildModifiersSnapshot(auction.modifierUses);

  const grouped = await prisma.donationRequest.groupBy({
    by: ["catalogGameId"],
    where: {
      participantId,
      status: "ADDED",
      catalogGameId: { not: null },
      createdAt: { gte: auction.createdAt },
    },
    _sum: { amount: true },
    _max: { createdAt: true },
  });

  const ranked = grouped
    .filter((row): row is typeof row & { catalogGameId: string } => !!row.catalogGameId)
    .map((row) => ({
      catalogGameId: row.catalogGameId,
      totalAmount: Number(row._sum.amount ?? 0),
      lastDonationAt: row._max.createdAt ?? auction.createdAt,
    }))
    .sort((a, b) => {
      if (b.totalAmount !== a.totalAmount) return b.totalAmount - a.totalAmount;
      return b.lastDonationAt.getTime() - a.lastDonationAt.getTime();
    });

  if (ranked.length === 0) {
    throw badRequest("Нет донатов с играми для завершения аукциона");
  }

  const games = await prisma.catalogGame.findMany({
    where: { id: { in: ranked.map((r) => r.catalogGameId) } },
    select: { id: true, title: true, mainStoryHours: true },
  });
  const gameById = new Map(games.map((g) => [g.id, g]));

  const winner = gameById.get(ranked[0].catalogGameId);
  if (!winner) throw badRequest("Winning game not found");
  const timeline = buildDonationTimeline(ranked);
  const now = new Date();

  const session = await prisma.$transaction(async (tx) => {
    const claimed = await tx.auctionRun.updateMany({
      where: { id: auctionId, status: "RUNNING" },
      data: {
        status: "RESOLVED",
        resolvedAt: now,
        resolvedGameId: winner.id,
        candidateCount: ranked.length,
      },
    });
    if (claimed.count !== 1) {
      throw conflict("Auction already resolved");
    }

    await tx.auctionCandidate.deleteMany({ where: { auctionRunId: auctionId } });
    for (const [orderIndex, row] of ranked.entries()) {
      await tx.auctionCandidate.create({
        data: {
          auctionRunId: auctionId,
          catalogGameId: row.catalogGameId,
          orderIndex,
          eliminatedAt: row.catalogGameId === winner.id ? null : now,
        },
      });
    }

    const consumedIds = auction.modifierUses.map((use) => use.inventoryItemId);
    if (consumedIds.length > 0) {
      await tx.inventoryItem.deleteMany({
        where: { id: { in: consumedIds } },
      });
    }

    const gameSession = await tx.gameSession.create({
      data: {
        participantId,
        catalogGameId: winner.id,
        auctionRunId: auctionId,
        hltbMainHours: winner.mainStoryHours ?? 10,
        modifiersJson: toJson(modifiers),
        modifiersSnapshotJson: toJson(modifiersSnapshot),
        status: "AWAITING_DIFFICULTY",
      },
      include: { catalogGame: true },
    });

    await tx.participant.update({
      where: { id: participantId },
      data: {
        status: "AWAITING_DIFFICULTY",
        currentSessionId: gameSession.id,
        currentGameTitle: gameSession.catalogGame.title,
        gameProgressPct: 0,
      },
    });

    return gameSession;
  });

  for (const [step, tick] of timeline.entries()) {
    liveBroadcaster.publish({
      type: "auction.tick",
      data: {
        auctionId,
        step,
        eliminatedGameId: tick.eliminatedGameId,
        winnerGameId: tick.winnerGameId,
      },
    });
  }

  await logActivity({
    eventId: event.id,
    type: "AUCTION_WON",
    actorId: participant.userId,
    payload: {
      auctionId,
      gameTitle: session.catalogGame.title,
      participantId,
      source: "donations",
      totalDonations: ranked[0].totalAmount,
    },
  });

  return {
    auction: await getAuction(auctionId),
    session,
    timeline,
  };
}

export async function getAuction(auctionId: string) {
  const auction = await prisma.auctionRun.findUnique({
    where: { id: auctionId },
    include: {
      candidates: {
        orderBy: { orderIndex: "asc" },
        include: { catalogGame: true },
      },
      resolvedGame: true,
      gameSession: true,
    },
  });
  if (!auction) throw notFound("Auction");
  return auction;
}

export function getAuctionTimeline(auction: {
  id: string;
  seed: string | null;
  candidates: { catalogGameId: string; orderIndex: number }[];
  resolvedGameId: string | null;
}) {
  if (!auction.resolvedGameId) return [];

  const candidateIds = auction.candidates
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((c) => c.catalogGameId);

  if (!auction.seed) {
    const timeline: { step: number; eliminatedGameId?: string; winnerGameId?: string }[] = [];
    let step = 0;
    for (let i = candidateIds.length - 1; i >= 0; i -= 1) {
      const id = candidateIds[i];
      if (id !== auction.resolvedGameId) {
        timeline.push({ step: step++, eliminatedGameId: id });
      }
    }
    timeline.push({ step, winnerGameId: auction.resolvedGameId });
    return timeline;
  }

  const others = candidateIds.filter((id) => id !== auction.resolvedGameId);
  const { order } = buildEliminationOrder(candidateIds, auction.seed);

  const timeline: { step: number; eliminatedGameId?: string; winnerGameId?: string }[] = [];
  let step = 0;
  for (const id of order) {
    if (others.includes(id)) timeline.push({ step: step++, eliminatedGameId: id });
  }
  timeline.push({ step, winnerGameId: auction.resolvedGameId });
  return timeline;
}
