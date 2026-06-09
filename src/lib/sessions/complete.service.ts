import type { GameSession } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import { getActiveEvent } from "@/lib/event/event.service";
import { parseEventConfig } from "@/lib/event/config";
import { getCompetitionContext } from "@/lib/balance/catch-up";
import {
  calculateScore,
  combineModifierEffects,
  type ModifierEffects,
} from "@/lib/scoring/score-calculator";
import { tryRatSteal } from "@/lib/inventory/rat-steal.service";
import { getElapsedMs } from "./timer";
import { grantCasinoSpins } from "@/lib/casino/casino.service";
import { dealBossDamage } from "@/lib/boss/boss.service";
import { logActivity } from "@/lib/activity/activity.service";
import { toJson } from "@/lib/utils/json";

export async function completeSession(
  session: GameSession & { catalogGame?: { title: string } },
) {
  const fullSession = await prisma.gameSession.findUnique({
    where: { id: session.id },
    include: { catalogGame: true },
  });
  const gameTitle = fullSession?.catalogGame.title ?? session.catalogGame?.title;
  const now = new Date();
  const elapsed = getElapsedMs(session.activePlayMs, session.lastResumedAt, "PLAYING", now);

  const event = await getActiveEvent();
  const config = parseEventConfig(event.config);
  const modifiers = (session.modifiersJson as ModifierEffects[]) ?? [];

  if (!session.difficulty) throw new Error("Difficulty required");

  const competition = await getCompetitionContext(session.participantId, event.id);

  const breakdown = calculateScore({
    hltbMainHours: session.hltbMainHours,
    elapsedMs: Number(elapsed),
    difficulty: session.difficulty,
    modifiers,
    config,
    competition,
  });

  const participant = await prisma.participant.findUnique({
    where: { id: session.participantId },
    include: { user: true },
  });

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.gameSession.update({
      where: { id: session.id },
      data: {
        status: "COMPLETED",
        activePlayMs: elapsed,
        lastResumedAt: null,
        completedAt: now,
        finalScore: breakdown.finalScore,
        scoreBreakdown: toJson(breakdown),
      },
    });

    await tx.timerEvent.create({
      data: {
        gameSessionId: session.id,
        type: "COMPLETE",
        occurredAt: now,
        activePlayMs: elapsed,
      },
    });

    await tx.participant.update({
      where: { id: session.participantId },
      data: {
        totalPoints: { increment: breakdown.finalScore },
        gameProgressPct: 100,
      },
    });

    return updated;
  });

  const casinoSpins = await grantCasinoSpins(result);

  const combined = combineModifierEffects(modifiers);
  let ratStealResult: Awaited<ReturnType<typeof tryRatSteal>> | null = null;
  if (combined.ratSteal) {
    ratStealResult = await tryRatSteal({
      thiefParticipantId: session.participantId,
      eventId: event.id,
      actorUserId: participant?.userId,
    });
  }

  await dealBossDamage({
    eventId: event.id,
    participantId: session.participantId,
    gameSessionId: session.id,
    finalScore: breakdown.finalScore,
    config,
    rank: competition.rank,
    bossItemMult: combined.bossDamageMult ?? 1,
    actorUserId: participant?.userId,
  });

  await logActivity({
    eventId: event.id,
    type: "GAME_COMPLETED",
    actorId: participant?.userId,
    payload: {
      gameTitle,
      score: breakdown.finalScore,
      casinoSpins,
    },
  });

  return { session: result, breakdown, casinoSpins, ratSteal: ratStealResult };
}
