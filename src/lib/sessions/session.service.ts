import prisma from "@/lib/db/prisma";
import { badRequest, conflict, notFound } from "@/lib/api/errors";
import { getActiveEvent } from "@/lib/event/event.service";
import { parseEventConfig } from "@/lib/event/config";
import { updateParticipantStatus } from "@/lib/participants/participant.service";
import { combineModifierEffects, type ModifierEffects } from "@/lib/scoring/score-calculator";
import { rollDifficultyWithRerolls } from "./difficulty";
import { getElapsedMs, getProgressPct } from "./timer";
import { formatCasinoState } from "@/lib/casino/casino.service";
import { getActiveModifiers } from "@/lib/casino/modifiers";
import { resolveItemIcon } from "@/lib/inventory/item-assets";
import { completeSession } from "./complete.service";
import { dropSession } from "./drop.service";

export async function getSession(sessionId: string, participantId?: string) {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: {
      catalogGame: true,
      participant: { include: { user: true } },
      timerEvents: { orderBy: { occurredAt: "asc" } },
      lootDrops: { include: { itemDefinition: true } },
    },
  });
  if (!session) throw notFound("Session");
  if (participantId && session.participantId !== participantId) throw notFound("Session");
  return session;
}

export async function rollSessionDifficulty(sessionId: string, participantId: string) {
  const session = await getSession(sessionId, participantId);
  if (session.status !== "AWAITING_DIFFICULTY") {
    throw badRequest("Session not awaiting difficulty");
  }

  const event = await getActiveEvent();
  const config = parseEventConfig(event.config);
  const seed = `${session.id}-${session.auctionRunId}`;
  const modifiers = (session.modifiersJson as ModifierEffects[]) ?? [];
  const combined = combineModifierEffects(modifiers);
  const rollMode = combined.difficultyEasyBias
    ? "easiest"
    : combined.difficultyHardBias
      ? "hardest"
      : "hardest";
  const difficulty = rollDifficultyWithRerolls(
    seed,
    config,
    combined.difficultyRerolls ?? 0,
    rollMode,
  );

  return prisma.gameSession.update({
    where: { id: sessionId },
    data: { difficulty },
    include: { catalogGame: true },
  });
}

export async function confirmSession(sessionId: string, participantId: string) {
  const session = await getSession(sessionId, participantId);
  if (session.status !== "AWAITING_DIFFICULTY") throw badRequest("Session not awaiting difficulty");
  if (!session.difficulty) throw badRequest("Roll difficulty first");

  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const s = await tx.gameSession.update({
      where: { id: sessionId },
      data: {
        status: "PLAYING",
        startedAt: now,
        lastResumedAt: now,
      },
      include: { catalogGame: true },
    });

    await tx.timerEvent.create({
      data: {
        gameSessionId: sessionId,
        type: "START",
        occurredAt: now,
        activePlayMs: BigInt(0),
      },
    });

    await tx.participant.update({
      where: { id: participantId },
      data: { status: "PLAYING", gameProgressPct: 0 },
    });

    return s;
  });

  return updated;
}

export async function pauseSession(sessionId: string, participantId: string) {
  const session = await getSession(sessionId, participantId);
  if (session.status !== "PLAYING") throw badRequest("Session not playing");

  const now = new Date();
  const newActiveMs = getElapsedMs(session.activePlayMs, session.lastResumedAt, "PLAYING", now);

  const updated = await prisma.$transaction(async (tx) => {
    const s = await tx.gameSession.update({
      where: { id: sessionId },
      data: {
        status: "PAUSED",
        activePlayMs: newActiveMs,
        lastResumedAt: null,
      },
      include: { catalogGame: true },
    });

    await tx.timerEvent.create({
      data: {
        gameSessionId: sessionId,
        type: "PAUSE",
        occurredAt: now,
        activePlayMs: newActiveMs,
      },
    });

    await tx.participant.update({
      where: { id: participantId },
      data: {
        status: "PAUSED",
        gameProgressPct: getProgressPct(newActiveMs, session.hltbMainHours),
        isLive: false,
      },
    });

    return s;
  });

  return updated;
}

export async function resumeSession(sessionId: string, participantId: string) {
  const session = await getSession(sessionId, participantId);
  if (session.status !== "PAUSED") throw badRequest("Session not paused");

  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const s = await tx.gameSession.update({
      where: { id: sessionId },
      data: {
        status: "PLAYING",
        lastResumedAt: now,
      },
      include: { catalogGame: true },
    });

    await tx.timerEvent.create({
      data: {
        gameSessionId: sessionId,
        type: "RESUME",
        occurredAt: now,
        activePlayMs: session.activePlayMs,
      },
    });

    await tx.participant.update({
      where: { id: participantId },
      data: { status: "PLAYING", isLive: true, lastLiveAt: now },
    });

    return s;
  });

  return updated;
}

export async function completeGameSession(sessionId: string, participantId: string) {
  const session = await getSession(sessionId, participantId);
  if (session.status !== "PLAYING") {
    throw conflict("Must resume before completing if paused");
  }
  return completeSession(session);
}

export async function dropGameSession(sessionId: string, participantId: string) {
  const session = await getSession(sessionId, participantId);
  if (session.status !== "PLAYING") {
    throw conflict("Must resume before dropping if paused");
  }
  return dropSession(session);
}

export async function acknowledgeSession(participantId: string) {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { id: true, status: true, currentSessionId: true },
  });
  if (!participant) throw notFound("Participant");

  if (participant.status === "COMPLETED" && participant.currentSessionId) {
    const pending = await prisma.gameSession.findUnique({
      where: { id: participant.currentSessionId },
      select: { status: true, playerRating: true },
    });
    if (pending?.status === "COMPLETED" && pending.playerRating == null) {
      throw badRequest("Submit a game review before continuing");
    }
  }

  if (participant.status === "CASINO") {
    const session = participant.currentSessionId
      ? await prisma.gameSession.findUnique({
          where: { id: participant.currentSessionId },
          select: { casinoSpinsTotal: true, casinoSpinsUsed: true },
        })
      : null;
    if (session && session.casinoSpinsUsed < session.casinoSpinsTotal) {
      throw badRequest("Use all casino spins first");
    }
  } else if (participant.status !== "COMPLETED" && participant.status !== "DROPPED") {
    throw badRequest("Nothing to acknowledge");
  }

  return updateParticipantStatus(participantId, "IDLE", {
    currentSessionId: null,
    currentGameTitle: null,
    gameProgressPct: null,
  });
}

type SessionWithRelations = Awaited<ReturnType<typeof getSession>>;

export function formatSessionPublic(session: SessionWithRelations | (SessionWithRelations & { lootDrops?: never })) {
  const elapsed = getElapsedMs(session.activePlayMs, session.lastResumedAt, session.status);
  return {
    id: session.id,
    status: session.status,
    difficulty: session.difficulty,
    hltbMainHours: session.hltbMainHours,
    activePlayMs: Number(elapsed),
    progressPct: getProgressPct(elapsed, session.hltbMainHours),
    startedAt: session.startedAt?.toISOString() ?? null,
    completedAt: session.completedAt?.toISOString() ?? null,
    finalScore: session.finalScore,
    dropPenalty: session.dropPenalty,
    playerRating: session.playerRating,
    playerReview: session.playerReview,
    needsReview: session.status === "COMPLETED" && session.playerRating == null,
    scoreBreakdown: session.scoreBreakdown,
    game: {
      title: session.catalogGame.title,
      coverImage: session.catalogGame.coverImage,
    },
    loot: (session.lootDrops ?? []).map((l) => ({
      slug: l.itemDefinition.slug,
      name: l.itemDefinition.name,
      rarity: l.rarity,
      iconUrl: resolveItemIcon(l.itemDefinition.slug, l.itemDefinition.iconUrl),
    })),
    activeModifiers: getActiveModifiers(session),
    casino: formatCasinoState(session),
  };
}
