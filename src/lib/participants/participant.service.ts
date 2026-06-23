import { resolveItemIcon } from "@/lib/inventory/item-assets";
import prisma from "@/lib/db/prisma";
import { getInventory } from "@/lib/craft/craft.service";
import { liveBroadcaster } from "@/lib/live/broadcaster";
import type { Difficulty, ParticipantStatus } from "@prisma/client";
import { getActiveEventOrNull } from "@/lib/event/event.service";
import { parseEventConfig, type EventConfig } from "@/lib/event/config";
import { formatSessionPublic, getSession } from "@/lib/sessions/session.service";
import { resolveGameCover } from "@/lib/landing/game-covers";
import { getElapsedMs, getProgressPct } from "@/lib/sessions/timer";
import { getCatalogHltbMainStoryHours } from "@/lib/catalog/hltb-hours";
import {
  calculateScore,
  type ModifierEffects,
} from "@/lib/scoring/score-calculator";
import { EVENT_STREAMERS } from "@/lib/event/event-roster";
import { assignCompetitionRanks } from "./leaderboard-ranks";
import { authorizedParticipantsWhere, authorizedStreamerUserFilter } from "./authorized-streamer";
import { syncTwitchLiveStatus } from "@/lib/twitch/twitch.service";

function buildCurrentGameStats(params: {
  hltbMainHours: number | null | undefined;
  elapsedMs: number;
  difficulty: Difficulty | null | undefined;
  modifiers: ModifierEffects[];
  config: EventConfig;
}) {
  const { hltbMainHours, elapsedMs, difficulty, modifiers, config } = params;
  if (!hltbMainHours || hltbMainHours <= 0) {
    return { hltbHours: null as number | null, playTimeMs: elapsedMs, projectedPoints: null as number | null };
  }
  let projectedPoints: number | null = null;

  if (difficulty) {
    projectedPoints = calculateScore({
      hltbMainHours,
      elapsedMs,
      difficulty,
      modifiers,
      config,
    }).finalScore;
  }

  return {
    hltbHours: hltbMainHours,
    playTimeMs: elapsedMs,
    projectedPoints,
  };
}

type ParticipantWithSession = Awaited<
  ReturnType<
    typeof prisma.participant.findMany<{
      include: {
        user: { select: { name: true; image: true; twitchLogin: true } };
        currentSession: { include: { catalogGame: true } };
      };
    }>
  >
>[number];

function mapParticipantToEntry(
  p: ParticipantWithSession,
  gamesEnabled: boolean,
) {
  const session = p.currentSession;
  let progressPct = p.gameProgressPct ?? 0;
  let elapsedMs = session ? Number(session.activePlayMs ?? 0) : 0;
  if (session && (session.status === "PLAYING" || session.status === "PAUSED")) {
    const elapsed = getElapsedMs(session.activePlayMs, session.lastResumedAt, session.status);
    elapsedMs = Number(elapsed);
    progressPct = getProgressPct(elapsed, session.hltbMainHours);
  }

  return {
    id: p.id,
    nickname: p.user.twitchLogin ?? p.user.name ?? "Unknown",
    twitchLogin: p.user.twitchLogin,
    avatar: p.user.image,
    totalPoints: p.totalPoints,
    status: p.status,
    isLive: p.isLive,
    currentGame:
      gamesEnabled && session
        ? {
            title: session.catalogGame.title,
            coverImage: session.catalogGame.coverImage,
            difficulty: session.difficulty,
            sessionStatus: session.status,
            progressPct,
            hltbHours: session.hltbMainHours,
            playTimeMs: elapsedMs,
          }
        : gamesEnabled && p.currentGameTitle
          ? { title: p.currentGameTitle, progressPct }
          : null,
  };
}

async function refreshTwitchLiveForEvent(eventId: string) {
  try {
    return await syncTwitchLiveStatus({ eventId });
  } catch {
    return [];
  }
}

export async function getLeaderboard(eventId: string) {
  await refreshTwitchLiveForEvent(eventId);
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  const gamesEnabled = event?.status === "ACTIVE";

  const participants = await prisma.participant.findMany({
    where: authorizedParticipantsWhere(eventId),
    orderBy: [{ totalPoints: "desc" }, { displayOrder: "asc" }],
    include: {
      user: { select: { name: true, image: true, twitchLogin: true } },
      currentSession: {
        include: { catalogGame: true },
      },
    },
  });

  const entries = participants.map((p) => mapParticipantToEntry(p, gamesEnabled));

  return assignCompetitionRanks(entries);
}

/** Полный пул стримеров сезона — вкладка «Стримеры» (включая ещё не вошедших). */
export async function getStreamersRoster(eventId: string) {
  await refreshTwitchLiveForEvent(eventId);
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  const gamesEnabled = event?.status === "ACTIVE";

  const participants = await prisma.participant.findMany({
    where: {
      eventId,
      user: authorizedStreamerUserFilter,
    },
    include: {
      user: { select: { name: true, image: true, twitchLogin: true } },
      currentSession: { include: { catalogGame: true } },
    },
  });

  const byLogin = new Map(
    participants
      .filter((p) => p.user.twitchLogin)
      .map((p) => [p.user.twitchLogin!.toLowerCase(), p]),
  );

  const ranked = assignCompetitionRanks(
    participants.map((p) => mapParticipantToEntry(p, gamesEnabled)),
  );
  const rankedById = new Map(ranked.map((e) => [e.id, e]));

  return EVENT_STREAMERS.map((roster) => {
    const linked = byLogin.get(roster.twitchLogin.toLowerCase());
    if (linked) {
      const entry = rankedById.get(linked.id)!;
      return {
        ...entry,
        registered: true as const,
        displayOrder: roster.displayOrder,
        avatar: entry.avatar ?? roster.image,
        nickname: entry.nickname || roster.displayName,
      };
    }

    return {
      id: `roster:${roster.twitchLogin}`,
      registered: false as const,
      displayOrder: roster.displayOrder,
      rank: roster.displayOrder,
      nickname: roster.displayName,
      twitchLogin: roster.twitchLogin,
      avatar: roster.image,
      totalPoints: 0,
      status: "IDLE",
      isLive: false,
      currentGame: null,
    };
  }).sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
    return a.displayOrder - b.displayOrder;
  });
}

async function getParticipantRank(eventId: string, totalPoints: number): Promise<number> {
  const higherCount = await prisma.participant.count({
    where: {
      ...authorizedParticipantsWhere(eventId),
      totalPoints: { gt: totalPoints },
    },
  });
  return higherCount + 1;
}

export async function updateParticipantStatus(
  participantId: string,
  status: ParticipantStatus,
  extra?: {
    currentSessionId?: string | null;
    currentGameTitle?: string | null;
    gameProgressPct?: number | null;
  },
) {
  const updated = await prisma.participant.update({
    where: { id: participantId },
    data: {
      status,
      ...extra,
    },
  });

  liveBroadcaster.publish({
    type: "leaderboard.patch",
    data: { participantId, status, totalPoints: updated.totalPoints },
  });

  return updated;
}

export async function getParticipantProfile(participantId: string) {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      user: { select: { name: true, image: true, twitchLogin: true } },
      currentSession: { include: { catalogGame: true } },
      gameSessions: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { catalogGame: true },
      },
    },
  });
  return participant;
}

export async function getParticipantPublicDetail(participantId: string) {
  const participant = await getParticipantProfile(participantId);
  if (!participant) return null;
  const liveUpdates = await refreshTwitchLiveForEvent(participant.eventId);
  const liveByParticipantId = new Map(liveUpdates.map((u) => [u.participantId, u.isLive]));
  const isLive = liveByParticipantId.get(participant.id) ?? participant.isLive;

  const event = await prisma.event.findUnique({ where: { id: participant.eventId } });
  const gamesEnabled = event?.status === "ACTIVE";
  const config = parseEventConfig(event?.config);

  const inventory = await getInventory(participantId);
  const twitchLogin = participant.user.twitchLogin;
  const nickname = twitchLogin ?? participant.user.name ?? "Unknown";

  let progressPct = participant.gameProgressPct ?? 0;
  let elapsedMs = 0;
  const session = participant.currentSession;
  if (session && (session.status === "PLAYING" || session.status === "PAUSED")) {
    const elapsed = getElapsedMs(session.activePlayMs, session.lastResumedAt, session.status);
    elapsedMs = Number(elapsed);
    progressPct = getProgressPct(elapsed, session.hltbMainHours);
  }

  const modifiersAvailable = participant.status === "IDLE";

  let currentGameStats: {
    hltbHours: number | null;
    playTimeMs: number;
    projectedPoints: number | null;
  } | null = null;

  if (gamesEnabled && session) {
    const modifiers = (session.modifiersJson as ModifierEffects[]) ?? [];
    currentGameStats = buildCurrentGameStats({
      hltbMainHours: session.hltbMainHours,
      elapsedMs,
      difficulty: session.difficulty,
      modifiers,
      config,
    });
  } else if (gamesEnabled && participant.currentGameTitle) {
    const catalogGame = await prisma.catalogGame.findFirst({
      where: { title: participant.currentGameTitle },
      select: { mainStoryHours: true, hltbSyncedAt: true },
    });
    const hltb = getCatalogHltbMainStoryHours(catalogGame);
    if (hltb && progressPct > 0) {
      elapsedMs = Math.round((progressPct / 100) * hltb * 3_600_000);
    }
    currentGameStats = buildCurrentGameStats({
      hltbMainHours: hltb,
      elapsedMs,
      difficulty: "NORMAL",
      modifiers: [],
      config,
    });
  }

  const rank = await getParticipantRank(participant.eventId, participant.totalPoints);

  return {
    id: participant.id,
    rank,
    nickname,
    twitchLogin,
    avatar: participant.user.image,
    totalPoints: participant.totalPoints,
    status: participant.status,
    isLive,
    eventStatus: event?.status ?? "UPCOMING",
    eventStartsAt: event?.startsAt.toISOString() ?? null,
    currentGame: gamesEnabled && session
      ? {
          title: session.catalogGame.title,
          coverImage: resolveGameCover(session.catalogGame.title, session.catalogGame.coverImage),
          difficulty: session.difficulty,
          sessionStatus: session.status,
          progressPct,
          hltbHours: currentGameStats?.hltbHours ?? session.hltbMainHours,
          playTimeMs: currentGameStats?.playTimeMs ?? elapsedMs,
          projectedPoints: currentGameStats?.projectedPoints ?? null,
        }
      : gamesEnabled && participant.currentGameTitle
        ? {
            title: participant.currentGameTitle,
            coverImage: resolveGameCover(participant.currentGameTitle),
            progressPct,
            hltbHours: currentGameStats?.hltbHours ?? null,
            playTimeMs: currentGameStats?.playTimeMs ?? 0,
            projectedPoints: currentGameStats?.projectedPoints ?? null,
          }
        : null,
    currentSession: session
      ? await formatSessionPublic(await getSession(session.id))
      : null,
    inventory: inventory.map((i) => ({
      id: i.id,
      slug: i.itemDefinition.slug,
      name: i.itemDefinition.name,
      description: i.itemDefinition.description,
      rarity: i.itemDefinition.rarity,
      kind: i.itemDefinition.kind,
      quantity: i.quantity,
      effects: i.itemDefinition.effectsJson as Record<
        string,
        number | boolean | string | string[]
      >,
      iconUrl: resolveItemIcon(i.itemDefinition.slug, i.itemDefinition.iconUrl),
      active: i.itemDefinition.kind === "MODIFIER" && modifiersAvailable && i.quantity > 0,
    })),
    history: participant.gameSessions.map((s) => ({
      id: s.id,
      game: s.catalogGame.title,
      cover: resolveGameCover(s.catalogGame.title, s.catalogGame.coverImage),
      status: s.status,
      finalScore: s.finalScore,
      dropPenalty: s.dropPenalty,
      difficulty: s.difficulty,
      playTimeMs: Number(s.activePlayMs ?? 0),
      completedAt: s.completedAt?.toISOString() ?? null,
      playerRating: s.playerRating,
      playerReview: s.playerReview,
    })),
    completedGames: participant.gameSessions
      .filter(
        (s) =>
          (s.status === "COMPLETED" || s.status === "DROPPED") &&
          s.playerRating != null &&
          s.playerReview,
      )
      .map((s) => ({
        id: s.id,
        title: s.catalogGame.title,
        cover: resolveGameCover(s.catalogGame.title, s.catalogGame.coverImage),
        rating: s.playerRating!,
        review: s.playerReview!,
        status: s.status,
        finalScore: s.finalScore,
        dropPenalty: s.dropPenalty,
        difficulty: s.difficulty,
        playTimeMs: Number(s.activePlayMs ?? 0),
        completedAt: s.completedAt?.toISOString() ?? null,
      })),
    stats: {
      gamesPlayed: participant.gameSessions.length,
      gamesCompleted: participant.gameSessions.filter(
        (s) => s.status === "COMPLETED" && s.playerRating != null,
      ).length,
    },
  };
}
