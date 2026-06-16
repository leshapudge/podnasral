import prisma from "@/lib/db/prisma";
import { ApiError, badRequest, conflict, notFound } from "@/lib/api/errors";
import { getActiveEvent } from "@/lib/event/event.service";
import { parseEventConfig } from "@/lib/event/config";
import { logActivity } from "@/lib/activity/activity.service";
import { liveBroadcaster } from "@/lib/live/broadcaster";
import {
  getRawgGameByIdCached,
  searchRawgGamesCached,
} from "@/lib/catalog/rawg.service";
import { syncCatalogGameFromRawg } from "@/lib/catalog/catalog.service";
import type { ModifierEffects } from "@/lib/scoring/score-calculator";
import { toJson } from "@/lib/utils/json";
import { buildModifiersSnapshot } from "@/lib/casino/modifiers";
import {
  parsePendingModifierIds,
  removePendingModifierIds,
} from "@/lib/modifiers/pending-modifiers";
import {
  buildEliminationOrder,
  getEligiblePoolGames,
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
  const o = json as Record<string, number | boolean | string | string[]>;
  const parseGenres = (value: unknown) => {
    if (Array.isArray(value)) {
      return value
        .filter((genre): genre is string => typeof genre === "string")
        .map((genre) => normalizeGenreSlug(genre))
        .filter(Boolean);
    }
    if (typeof value === "string") {
      const genre = normalizeGenreSlug(value);
      return genre ? [genre] : [];
    }
    return [];
  };
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
    genreExpertChoice: o.genreExpertChoice === true,
    auctionForcedGenres: parseGenres(o.auctionForcedGenres),
    audiobookChallenge: o.audiobookChallenge === true,
  };
}

function normalizeGenreSlug(value: string) {
  return value.trim().toLowerCase();
}

function normalizeHltbMainHours(hours: number | null | undefined) {
  if (typeof hours !== "number" || !Number.isFinite(hours) || hours <= 0) return null;
  return hours;
}

function hasGenreMatch(gameGenres: string[], requiredGenres: string[]) {
  if (requiredGenres.length === 0) return true;
  return gameGenres.some((genre) => requiredGenres.includes(genre));
}

function getAuctionGenreRules(modifiers: ModifierEffects[]) {
  const forced = new Set<string>();
  let canSelectGenre = false;

  for (const mod of modifiers) {
    if (mod.genreExpertChoice) {
      canSelectGenre = true;
    }
    for (const genre of mod.auctionForcedGenres ?? []) {
      const normalized = normalizeGenreSlug(genre);
      if (normalized) forced.add(normalized);
    }
  }

  return {
    canSelectGenre,
    forcedGenres: [...forced],
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
      await applyModifier(auctionId, participantId, inventoryItemId);
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
  candidateIds: string[],
  winnerId: string,
) {
  const timeline: { step: number; eliminatedGameId?: string; winnerGameId?: string }[] = [];
  let step = 0;

  const losers = candidateIds.filter((id) => id !== winnerId);
  for (let i = losers.length - 1; i >= 0; i -= 1) {
    timeline.push({ step: step++, eliminatedGameId: losers[i] });
  }
  timeline.push({ step, winnerGameId: winnerId });
  return timeline;
}

export type AuctionSelectionOption = {
  catalogGameId: string;
  title: string;
  coverImage: string | null;
  mainStoryHours: number;
  projectedBaseScore: number;
  genres: string[];
};

export type AuctionGameSearchResult = {
  catalogGameId: string;
  rawgId: number;
  title: string;
  coverImage: string | null;
  mainStoryHours: number;
  mainExtraHours: number | null;
  completionistHours: number | null;
  projectedBaseScore: number;
  genres: string[];
  releaseDate: string | null;
  rating: number | null;
  metacritic: number | null;
};

export async function searchAuctionGames(
  auctionId: string,
  participantId: string,
  query: string,
) {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) {
    throw badRequest("Search query must be at least 2 characters");
  }

  const auction = await prisma.auctionRun.findUnique({
    where: { id: auctionId },
    select: {
      id: true,
      participantId: true,
      status: true,
      modifiersJson: true,
    },
  });
  if (!auction || auction.participantId !== participantId) throw notFound("Auction");
  if (auction.status !== "RUNNING") throw badRequest("Auction is not running");

  const event = await getActiveEvent();
  const config = parseEventConfig(event.config);
  const modifiers = (auction.modifiersJson as ModifierEffects[]) ?? [];
  const genreRules = getAuctionGenreRules(modifiers);
  const needsGenres = genreRules.canSelectGenre || genreRules.forcedGenres.length > 0;

  const rawgResults = await searchRawgGamesCached(normalizedQuery);
  const rawgTop = rawgResults.slice(0, 10);
  const rawgIds = rawgTop.map((game) => game.id);

  const existingCatalog = await prisma.catalogGame.findMany({
    where: { rawgId: { in: rawgIds } },
    select: {
      id: true,
      rawgId: true,
      title: true,
      coverImage: true,
      mainStoryHours: true,
      mainExtraHours: true,
      completionistHours: true,
      hltbSyncedAt: true,
    },
  });
  const existingByRawgId = new Map(existingCatalog.map((game) => [game.rawgId, game]));

  const withCatalog = await Promise.all(
    rawgTop.map(async (rawgGame) => {
      let catalog = existingByRawgId.get(rawgGame.id) ?? null;
      if (!catalog || !catalog.mainStoryHours || !catalog.hltbSyncedAt) {
        catalog = await syncCatalogGameFromRawg(rawgGame.id).catch(() => catalog);
      }
      if (!catalog) return null;

      const mainStoryHours = normalizeHltbMainHours(catalog.mainStoryHours);
      if (!mainStoryHours) return null;
      const genres = (rawgGame.genres ?? [])
        .map((genre) => normalizeGenreSlug(genre.slug || genre.name || ""))
        .filter(Boolean);

      return {
        catalogGameId: catalog.id,
        rawgId: rawgGame.id,
        title: catalog.title,
        coverImage: catalog.coverImage ?? rawgGame.background_image ?? null,
        mainStoryHours,
        mainExtraHours: catalog.mainExtraHours,
        completionistHours: catalog.completionistHours,
        projectedBaseScore: Math.round(mainStoryHours * config.pointsPerHour),
        genres: [...new Set(genres)],
        releaseDate: rawgGame.released ?? null,
        rating: rawgGame.rating ?? null,
        metacritic: rawgGame.metacritic ?? null,
      } satisfies AuctionGameSearchResult;
    }),
  );

  const gamesWithGenres = withCatalog.filter(
    (game): game is AuctionGameSearchResult => game !== null,
  );
  const missingHltbCount = Math.max(0, rawgTop.length - gamesWithGenres.length);

  let genreRestrictionApplied = false;
  let games = gamesWithGenres;
  if (genreRules.forcedGenres.length > 0) {
    const hasGenreData = gamesWithGenres.some((game) => game.genres.length > 0);
    if (hasGenreData) {
      const filtered = gamesWithGenres.filter((game) =>
        hasGenreMatch(game.genres, genreRules.forcedGenres),
      );
      if (filtered.length > 0) {
        games = filtered;
        genreRestrictionApplied = true;
      }
    }
  }

  const availableGenres = [...new Set(games.flatMap((game) => game.genres))].sort((a, b) =>
    a.localeCompare(b, "en"),
  );

  return {
    auctionId: auction.id,
    status: auction.status,
    pointsPerHour: config.pointsPerHour,
    missingHltbCount,
    canSelectGenre: genreRules.canSelectGenre,
    forcedGenres: genreRules.forcedGenres,
    genreRestrictionApplied,
    genreDataReady: !needsGenres || gamesWithGenres.some((game) => game.genres.length > 0),
    availableGenres,
    games,
  };
}

export async function getAuctionSelectionOptions(auctionId: string, participantId: string) {
  const auction = await prisma.auctionRun.findUnique({
    where: { id: auctionId },
    select: {
      id: true,
      participantId: true,
      status: true,
      resolvedGameId: true,
      modifiersJson: true,
    },
  });
  if (!auction || auction.participantId !== participantId) throw notFound("Auction");
  if (auction.status !== "RUNNING" && auction.status !== "PREPARING") {
    throw badRequest("Auction is not in selection stage");
  }

  const event = await getActiveEvent();
  const config = parseEventConfig(event.config);
  const pool = await getEligiblePoolGames(event.id, participantId);
  const modifiers = (auction.modifiersJson as ModifierEffects[]) ?? [];
  const genreRules = getAuctionGenreRules(modifiers);
  const needsGenres = genreRules.canSelectGenre || genreRules.forcedGenres.length > 0;

  const gamesWithGenres = await Promise.all(
    pool.map(async (entry) => {
      const mainStoryHours = normalizeHltbMainHours(entry.catalogGame.mainStoryHours);
      if (!mainStoryHours) return null;

      let genres: string[] = [];
      if (needsGenres && entry.catalogGame.rawgId) {
        const rawg = await getRawgGameByIdCached(entry.catalogGame.rawgId).catch(() => null);
        genres = (rawg?.genres ?? [])
          .map((genre) => normalizeGenreSlug(genre.slug || genre.name || ""))
          .filter(Boolean);
      }

      return {
        catalogGameId: entry.catalogGameId,
        title: entry.catalogGame.title,
        coverImage: entry.catalogGame.coverImage ?? null,
        mainStoryHours,
        projectedBaseScore: Math.round(mainStoryHours * config.pointsPerHour),
        genres: [...new Set(genres)],
      } satisfies AuctionSelectionOption;
    }),
  );
  const validGamesWithGenres = gamesWithGenres.filter(
    (game): game is AuctionSelectionOption => game !== null,
  );

  let genreRestrictionApplied = false;
  let games = validGamesWithGenres;
  if (genreRules.forcedGenres.length > 0) {
    const hasGenreData = validGamesWithGenres.some((game) => game.genres.length > 0);
    if (hasGenreData) {
      const filtered = validGamesWithGenres.filter((game) =>
        hasGenreMatch(game.genres, genreRules.forcedGenres),
      );
      if (filtered.length > 0) {
        games = filtered;
        genreRestrictionApplied = true;
      }
    }
  }

  games = games
    .map((entry) => ({
      catalogGameId: entry.catalogGameId,
      title: entry.title,
      coverImage: entry.coverImage,
      mainStoryHours: entry.mainStoryHours,
      projectedBaseScore: entry.projectedBaseScore,
      genres: entry.genres,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "ru"));

  const availableGenres = [...new Set(games.flatMap((game) => game.genres))].sort((a, b) =>
    a.localeCompare(b, "en"),
  );

  return {
    auctionId: auction.id,
    status: auction.status,
    selectedCatalogGameId: auction.resolvedGameId,
    games,
    canSelectGenre: genreRules.canSelectGenre,
    forcedGenres: genreRules.forcedGenres,
    genreRestrictionApplied,
    genreDataReady: validGamesWithGenres.some((game) => game.genres.length > 0),
    availableGenres,
  };
}

export async function startAuction(auctionId: string, participantId: string) {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { status: true, currentSessionId: true, userId: true },
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
    include: {
      candidates: { orderBy: { orderIndex: "asc" }, select: { catalogGameId: true } },
      modifierUses: { include: { inventoryItem: { include: { itemDefinition: true } } } },
    },
  });
  if (!auction || auction.participantId !== participantId) throw notFound("Auction");
  if (auction.status === "RUNNING") {
    throw badRequest("Auction is running on external platform");
  }
  if (auction.status !== "PREPARING") throw badRequest("Auction not in preparing state");

  if (!auction.resolvedGameId) {
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

    await prisma.auctionCandidate.deleteMany({ where: { auctionRunId: auctionId } });
    return {
      auction: await getAuction(auctionId),
    };
  }

  const winner = await prisma.catalogGame.findUnique({
    where: { id: auction.resolvedGameId },
    select: { id: true, title: true, mainStoryHours: true },
  });
  if (!winner) throw badRequest("Selected game not found");
  const winnerMainStoryHours = normalizeHltbMainHours(winner.mainStoryHours);
  if (!winnerMainStoryHours) {
    throw badRequest("У выбранной игры нет данных HLTB. Выберите другую игру.");
  }

  const event = await getActiveEvent();
  const modifiers = (auction.modifiersJson as ModifierEffects[]) ?? [];
  const modifiersSnapshot = buildModifiersSnapshot(auction.modifierUses);
  const candidateIds = auction.candidates.length
    ? auction.candidates.map((c) => c.catalogGameId)
    : [winner.id];
  if (!candidateIds.includes(winner.id)) candidateIds.unshift(winner.id);
  const timeline = buildDonationTimeline(candidateIds, winner.id);
  const now = new Date();

  const session = await prisma.$transaction(async (tx) => {
    const claimed = await tx.auctionRun.updateMany({
      where: { id: auctionId, status: "PREPARING", resolvedGameId: winner.id },
      data: {
        status: "RESOLVED",
        resolvedAt: now,
        candidateCount: candidateIds.length,
      },
    });
    if (claimed.count !== 1) {
      throw conflict("Auction already resolved");
    }

    if (auction.candidates.length === 0) {
      await tx.auctionCandidate.create({
        data: {
          auctionRunId: auctionId,
          catalogGameId: winner.id,
          orderIndex: 0,
          eliminatedAt: null,
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
        hltbMainHours: winnerMainStoryHours,
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
      source: "manual_selection",
    },
  });

  return {
    auction: await getAuction(auctionId),
    session,
    timeline,
  };
}

export async function resolveAuctionFromDonations(
  auctionId: string,
  participantId: string,
  catalogGameId: string,
  selectedGenre?: string | null,
) {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { status: true, currentSessionId: true },
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
    select: { id: true, participantId: true, status: true, modifiersJson: true },
  });
  if (!auction || auction.participantId !== participantId) throw notFound("Auction");
  if (auction.status !== "RUNNING") throw badRequest("Auction is not running");

  const selected = await prisma.catalogGame.findUnique({
    where: { id: catalogGameId },
    select: {
      id: true,
      rawgId: true,
      title: true,
      coverImage: true,
      mainStoryHours: true,
      mainExtraHours: true,
      completionistHours: true,
    },
  });
  if (!selected) throw badRequest("Selected game not found");
  let selectedMainStoryHours = selected.mainStoryHours;
  let selectedMainExtraHours = selected.mainExtraHours;
  let selectedCompletionistHours = selected.completionistHours;

  if (!normalizeHltbMainHours(selectedMainStoryHours) && selected.rawgId) {
    const synced = await syncCatalogGameFromRawg(selected.rawgId).catch(() => null);
    if (synced) {
      selectedMainStoryHours = synced.mainStoryHours;
      selectedMainExtraHours = synced.mainExtraHours;
      selectedCompletionistHours = synced.completionistHours;
    }
  }

  const mainStoryHours = normalizeHltbMainHours(selectedMainStoryHours);
  if (!mainStoryHours) {
    throw badRequest("Для этой игры нет данных HLTB. Выберите игру с доступным HLTB.");
  }

  const modifiers = (auction.modifiersJson as ModifierEffects[]) ?? [];
  const genreRules = getAuctionGenreRules(modifiers);
  const needsGenres = genreRules.canSelectGenre || genreRules.forcedGenres.length > 0;
  const normalizedGenre = selectedGenre ? normalizeGenreSlug(selectedGenre) : null;
  const needsRawg = needsGenres;
  const rawg =
    needsRawg && selected.rawgId
      ? await getRawgGameByIdCached(selected.rawgId).catch(() => null)
      : null;
  const selectedGenres = (rawg?.genres ?? [])
    .map((genre) => normalizeGenreSlug(genre.slug || genre.name || ""))
    .filter(Boolean);
  const genreDataReady = !needsGenres || selectedGenres.length > 0;

  if (
    genreRules.canSelectGenre &&
    genreDataReady &&
    genreRules.forcedGenres.length === 0 &&
    !normalizedGenre
  ) {
    throw badRequest("Выберите жанр для завершения аукциона");
  }
  if (genreDataReady && normalizedGenre && !selectedGenres.includes(normalizedGenre)) {
    throw badRequest("Выбранная игра не относится к выбранному жанру");
  }
  if (
    genreDataReady &&
    genreRules.forcedGenres.length > 0 &&
    !hasGenreMatch(selectedGenres, genreRules.forcedGenres)
  ) {
    throw badRequest("Эта игра не подходит под жанровое ограничение модификатора");
  }

  const claimed = await prisma.$transaction(async (tx) => {
    const updated = await tx.auctionRun.updateMany({
      where: { id: auctionId, status: "RUNNING" },
      data: {
        status: "PREPARING",
        resolvedGameId: selected.id,
        candidateCount: 1,
        resolvedAt: null,
      },
    });
    if (updated.count !== 1) return 0;

    await tx.auctionCandidate.deleteMany({ where: { auctionRunId: auctionId } });
    await tx.auctionCandidate.create({
      data: {
        auctionRunId: auctionId,
        catalogGameId: selected.id,
        orderIndex: 0,
        eliminatedAt: null,
      },
    });

    return updated.count;
  });

  if (claimed !== 1) throw conflict("Auction already resolved");

  const started = await startAuction(auctionId, participantId);

  return {
    ...started,
    selectedGame: {
      catalogGameId: selected.id,
      title: selected.title,
      coverImage: selected.coverImage ?? null,
      mainStoryHours,
      mainExtraHours: selectedMainExtraHours,
      completionistHours: selectedCompletionistHours,
      genres: selectedGenres,
    },
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
