import { randomBytes } from "crypto";
import prisma from "@/lib/db/prisma";
import { badRequest, conflict, notFound } from "@/lib/api/errors";
import { getActiveEvent } from "@/lib/event/event.service";
import { parseEventConfig } from "@/lib/event/config";
import { updateParticipantStatus } from "@/lib/participants/participant.service";
import { logActivity } from "@/lib/activity/activity.service";
import { liveBroadcaster } from "@/lib/live/broadcaster";
import { combineModifierEffects, type ModifierEffects } from "@/lib/scoring/score-calculator";
import { toJson } from "@/lib/utils/json";
import { buildModifiersSnapshot } from "@/lib/casino/modifiers";
import {
  applyModifierWeights,
  buildEliminationOrder,
  getEligiblePoolGames,
  weightedPick,
} from "./pool";

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
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
  });
  if (!participant) throw notFound("Participant");
  if (participant.status !== "IDLE") {
    throw conflict("Cannot start auction in current status");
  }

  const event = await getActiveEvent();
  if (event.status !== "ACTIVE") throw badRequest("Event is not active");

  const auction = await prisma.auctionRun.create({
    data: {
      participantId,
      status: "PREPARING",
      modifiersJson: [],
    },
  });

  await updateParticipantStatus(participantId, "AUCTIONING");
  return auction;
}

export async function applyModifier(
  auctionId: string,
  participantId: string,
  inventoryItemId: string,
) {
  const auction = await prisma.auctionRun.findUnique({
    where: { id: auctionId },
    include: { modifierUses: true },
  });
  if (!auction || auction.participantId !== participantId) throw notFound("Auction");
  if (auction.status !== "PREPARING") throw badRequest("Auction not in preparing state");

  const event = await getActiveEvent();
  const config = parseEventConfig(event.config);
  if (auction.modifierUses.length >= config.maxModifiersPerAuction) {
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
  const current = (auction.modifiersJson as ModifierEffects[]) ?? [];

  await prisma.$transaction([
    prisma.modifierConsumption.create({
      data: { auctionRunId: auctionId, inventoryItemId },
    }),
    prisma.auctionRun.update({
      where: { id: auctionId },
      data: { modifiersJson: toJson([...current, effects]) },
    }),
  ]);

  return prisma.auctionRun.findUnique({
    where: { id: auctionId },
    include: { modifierUses: { include: { inventoryItem: { include: { itemDefinition: true } } } } },
  });
}

export async function startAuction(auctionId: string, participantId: string) {
  const auction = await prisma.auctionRun.findUnique({
    where: { id: auctionId },
    include: {
      modifierUses: { include: { inventoryItem: { include: { itemDefinition: true } } } },
    },
  });
  if (!auction || auction.participantId !== participantId) throw notFound("Auction");
  if (auction.status !== "PREPARING") throw badRequest("Auction not in preparing state");

  const event = await getActiveEvent();
  const config = parseEventConfig(event.config);
  const modifiers = (auction.modifiersJson as ModifierEffects[]) ?? [];

  let pool = await getEligiblePoolGames(event.id, participantId);
  pool = applyModifierWeights(pool, modifiers);

  if (pool.length === 0) throw badRequest("No eligible games in pool");

  const seed = randomBytes(16).toString("hex");
  let state = 0;
  for (let i = 0; i < seed.length; i++) {
    state = (Math.imul(31, state) + seed.charCodeAt(i)) | 0;
  }
  const rand = () => {
    state = Math.imul(state ^ (state >>> 16), 2246822507);
    state = Math.imul(state ^ (state >>> 13), 3266489909);
    state ^= state >>> 16;
    return (state >>> 0) / 4294967296;
  };

  const combined = combineModifierEffects(modifiers);
  const candidateBonus = combined.auctionCandidateBonus ?? 0;
  const count = Math.min(config.auctionCandidateCount + candidateBonus, pool.length);
  const picked = weightedPick(pool, rand, count);
  const candidateIds = picked.map((p) => p.catalogGameId);
  const { order, winnerId } = buildEliminationOrder(candidateIds, seed);

  const winnerGame = picked.find((p) => p.catalogGameId === winnerId)!;

  await prisma.$transaction(async (tx) => {
    for (const use of auction.modifierUses) {
      await tx.inventoryItem.delete({ where: { id: use.inventoryItemId } });
    }

    await tx.auctionRun.update({
      where: { id: auctionId },
      data: {
        status: "RUNNING",
        seed,
        candidateCount: count,
        resolvedGameId: winnerId,
      },
    });

    let orderIndex = 0;
    for (const gameId of candidateIds) {
      await tx.auctionCandidate.create({
        data: {
          auctionRunId: auctionId,
          catalogGameId: gameId,
          orderIndex: orderIndex++,
          eliminatedAt: order.includes(gameId) ? new Date() : null,
        },
      });
    }
  });

  const timeline = buildTimeline(auctionId, candidateIds, order, winnerId);

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

  const hltbHours = winnerGame.catalogGame.mainStoryHours ?? 10;
  const modifiersSnapshot = buildModifiersSnapshot(auction.modifierUses);

  const session = await prisma.$transaction(async (tx) => {
    await tx.auctionRun.update({
      where: { id: auctionId },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });

    const gameSession = await tx.gameSession.create({
      data: {
        participantId,
        catalogGameId: winnerId,
        auctionRunId: auctionId,
        hltbMainHours: hltbHours,
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

  await logActivity({
    eventId: event.id,
    type: "AUCTION_WON",
    actorId: (await prisma.participant.findUnique({ where: { id: participantId } }))?.userId,
    payload: {
      auctionId,
      gameTitle: session.catalogGame.title,
      participantId,
    },
  });

  return {
    auction: await getAuction(auctionId),
    session,
    timeline,
  };
}

function buildTimeline(
  _auctionId: string,
  candidateIds: string[],
  eliminationOrder: string[],
  winnerId: string,
) {
  const timeline: { step: number; eliminatedGameId?: string; winnerGameId?: string }[] = [];
  let step = 0;
  for (const eliminated of eliminationOrder) {
    timeline.push({ step: step++, eliminatedGameId: eliminated });
  }
  timeline.push({ step, winnerGameId: winnerId });
  return timeline;
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
  if (!auction.seed || !auction.resolvedGameId) return [];

  const candidateIds = auction.candidates
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((c) => c.catalogGameId);

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
