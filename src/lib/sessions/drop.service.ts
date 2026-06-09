import type { GameSession } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import { getActiveEvent } from "@/lib/event/event.service";
import { parseEventConfig } from "@/lib/event/config";
import { getCompetitionContext } from "@/lib/balance/catch-up";
import {
  calculateDropPenalty,
  combineModifierEffects,
  type ModifierEffects,
} from "@/lib/scoring/score-calculator";
import { getElapsedMs } from "./timer";
import { grantCasinoSpins } from "@/lib/casino/casino.service";
import { logActivity } from "@/lib/activity/activity.service";

export async function dropSession(session: GameSession & { catalogGame?: { title: string } }) {
  const now = new Date();
  const elapsed = getElapsedMs(session.activePlayMs, session.lastResumedAt, "PLAYING", now);

  const event = await getActiveEvent();
  const config = parseEventConfig(event.config);
  const modifiers = (session.modifiersJson as ModifierEffects[]) ?? [];

  const difficulty = session.difficulty ?? "NORMAL";
  const competition = await getCompetitionContext(session.participantId, event.id);
  const penalty = calculateDropPenalty({
    hltbMainHours: session.hltbMainHours,
    elapsedMs: Number(elapsed),
    difficulty,
    modifiers,
    config,
    competition,
  });

  const participant = await prisma.participant.findUnique({
    where: { id: session.participantId },
  });

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.gameSession.update({
      where: { id: session.id },
      data: {
        status: "DROPPED",
        activePlayMs: elapsed,
        lastResumedAt: null,
        completedAt: now,
        dropPenalty: penalty,
        finalScore: 0,
      },
    });

    await tx.timerEvent.create({
      data: {
        gameSessionId: session.id,
        type: "DROP",
        occurredAt: now,
        activePlayMs: elapsed,
      },
    });

    const current = await tx.participant.findUnique({
      where: { id: session.participantId },
      select: { totalPoints: true },
    });
    const nextPoints = Math.max(0, (current?.totalPoints ?? 0) - penalty);

    await tx.participant.update({
      where: { id: session.participantId },
      data: { totalPoints: nextPoints },
    });

    return updated;
  });

  const combined = combineModifierEffects(modifiers);
  if (combined.dropRefundMaterial) {
    const iron = await prisma.itemDefinition.findUnique({ where: { slug: "iron_shard" } });
    if (iron) {
      const existing = await prisma.inventoryItem.findFirst({
        where: {
          participantId: session.participantId,
          itemDefinitionId: iron.id,
          instanceId: null,
        },
      });
      if (existing) {
        await prisma.inventoryItem.update({
          where: { id: existing.id },
          data: { quantity: { increment: 1 } },
        });
      } else {
        await prisma.inventoryItem.create({
          data: {
            participantId: session.participantId,
            itemDefinitionId: iron.id,
            quantity: 1,
          },
        });
      }
    }
  }

  const casinoSpins = await grantCasinoSpins(result, { isDrop: true });

  await logActivity({
    eventId: event.id,
    type: "GAME_DROPPED",
    actorId: participant?.userId,
    payload: {
      gameTitle: session.catalogGame?.title,
      penalty,
      boomerangRefund: combined.dropRefundMaterial ?? false,
      casinoSpins,
    },
  });

  return { session: result, penalty, casinoSpins };
}
