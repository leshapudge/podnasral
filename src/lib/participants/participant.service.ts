import prisma from "@/lib/db/prisma";
import { getInventory } from "@/lib/craft/craft.service";
import { liveBroadcaster } from "@/lib/live/broadcaster";
import type { Difficulty, ParticipantStatus } from "@prisma/client";
import { getActiveEventOrNull } from "@/lib/event/event.service";
import { parseEventConfig } from "@/lib/event/config";
import { formatSessionPublic, getSession } from "@/lib/sessions/session.service";
import { resolveGameCover } from "@/lib/landing/game-covers";
import { getElapsedMs, getProgressPct } from "@/lib/sessions/timer";
import {
  calculateScore,
  type ModifierEffects,
} from "@/lib/scoring/score-calculator";
import { assignCompetitionRanks } from "./leaderboard-ranks";

async function buildCurrentGameStats(params: {
  hltbMainHours: number | null | undefined;
  elapsedMs: number;
  difficulty: Difficulty | null | undefined;
  modifiers: ModifierEffects[];
}) {
  const { hltbMainHours, elapsedMs, difficulty, modifiers } = params;
  if (!hltbMainHours || hltbMainHours <= 0) {
    return { hltbHours: null as number | null, playTimeMs: elapsedMs, projectedPoints: null as number | null };
  }

  const event = await getActiveEventOrNull();
  const config = parseEventConfig(event?.config);
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

export async function getLeaderboard(eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  const gamesEnabled = event?.status === "ACTIVE";

  const participants = await prisma.participant.findMany({
    where: { eventId },
    orderBy: [{ totalPoints: "desc" }, { displayOrder: "asc" }],
    include: {
      user: { select: { name: true, image: true, twitchLogin: true } },
      currentSession: {
        include: { catalogGame: true },
      },
    },
  });

  const entries = participants.map((p) => {
    const session = p.currentSession;
    let progressPct = p.gameProgressPct ?? 0;
    if (session && (session.status === "PLAYING" || session.status === "PAUSED")) {
      const elapsed = getElapsedMs(session.activePlayMs, session.lastResumedAt, session.status);
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
            }
          : gamesEnabled && p.currentGameTitle
            ? { title: p.currentGameTitle, progressPct }
            : null,
    };
  });

  return assignCompetitionRanks(entries);
}

async function getParticipantRank(eventId: string, participantId: string): Promise<number> {
  const participants = await prisma.participant.findMany({
    where: { eventId },
    orderBy: [{ totalPoints: "desc" }, { displayOrder: "asc" }],
    select: { id: true, totalPoints: true },
  });
  const ranked = assignCompetitionRanks(participants);
  return ranked.find((p) => p.id === participantId)?.rank ?? participants.length;
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

  const event = await prisma.event.findUnique({ where: { id: participant.eventId } });
  const gamesEnabled = event?.status === "ACTIVE";

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
    currentGameStats = await buildCurrentGameStats({
      hltbMainHours: session.hltbMainHours,
      elapsedMs,
      difficulty: session.difficulty,
      modifiers,
    });
  } else if (gamesEnabled && participant.currentGameTitle) {
    const catalogGame = await prisma.catalogGame.findFirst({
      where: { title: participant.currentGameTitle },
      select: { mainStoryHours: true },
    });
    const hltb = catalogGame?.mainStoryHours ?? null;
    if (hltb && progressPct > 0) {
      elapsedMs = Math.round((progressPct / 100) * hltb * 3_600_000);
    }
    currentGameStats = await buildCurrentGameStats({
      hltbMainHours: hltb,
      elapsedMs,
      difficulty: "NORMAL",
      modifiers: [],
    });
  }

  const rank = await getParticipantRank(participant.eventId, participant.id);

  return {
    id: participant.id,
    rank,
    nickname,
    twitchLogin,
    avatar: participant.user.image,
    totalPoints: participant.totalPoints,
    status: participant.status,
    isLive: participant.isLive,
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
      effects: i.itemDefinition.effectsJson as Record<string, number>,
      iconUrl: i.itemDefinition.iconUrl,
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
      completedAt: s.completedAt?.toISOString() ?? null,
    })),
    stats: {
      gamesPlayed: participant.gameSessions.length,
      gamesCompleted: participant.gameSessions.filter((s) => s.status === "COMPLETED").length,
    },
  };
}
