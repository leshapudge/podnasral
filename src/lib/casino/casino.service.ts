import type { Difficulty, GameSession } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import { badRequest, conflict } from "@/lib/api/errors";
import { getActiveEvent } from "@/lib/event/event.service";
import { parseEventConfig } from "@/lib/event/config";
import { getCompetitionContext } from "@/lib/balance/catch-up";
import { rollLoot } from "@/lib/loot/loot.service";
import type { ModifierEffects } from "@/lib/scoring/score-calculator";
import { logActivity } from "@/lib/activity/activity.service";
import { calculateCasinoSpins } from "./spin-count";

export async function grantCasinoSpins(
  session: GameSession,
  opts: { isDrop?: boolean } = {},
) {
  const event = await getActiveEvent();
  const competition = await getCompetitionContext(session.participantId, event.id);
  const modifiers = (session.modifiersJson as ModifierEffects[]) ?? [];
  const spins = calculateCasinoSpins({
    modifiers,
    hltbMainHours: session.hltbMainHours,
    seed: `${session.id}-${opts.isDrop ? "drop" : "complete"}`,
    competition,
    isDrop: opts.isDrop,
  });

  await prisma.$transaction([
    prisma.gameSession.update({
      where: { id: session.id },
      data: {
        casinoSpinsTotal: spins,
        casinoSpinsUsed: 0,
      },
    }),
    prisma.participant.update({
      where: { id: session.participantId },
      data: { status: "CASINO" },
    }),
  ]);

  return spins;
}

export async function spinCasinoWheel(sessionId: string, participantId: string) {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: {
      participant: { include: { user: true } },
      lootDrops: { include: { itemDefinition: true } },
    },
  });
  if (!session) throw badRequest("Session not found");
  if (session.participantId !== participantId) throw badRequest("Session not found");

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
  });
  if (participant?.status !== "CASINO") {
    throw conflict("Casino not active");
  }

  const remaining = session.casinoSpinsTotal - session.casinoSpinsUsed;
  if (remaining <= 0) {
    throw badRequest("No spins remaining");
  }

  if (!session.difficulty) throw badRequest("Difficulty required");

  const event = await getActiveEvent();
  const config = parseEventConfig(event.config);
  const modifiers = (session.modifiersJson as ModifierEffects[]) ?? [];
  const competition = await getCompetitionContext(participantId, event.id);
  const spinIndex = session.casinoSpinsUsed;

  const [drops] = await prisma.$transaction(async (tx) => {
    await tx.gameSession.update({
      where: { id: sessionId },
      data: { casinoSpinsUsed: { increment: 1 } },
    });

    const rolled = await rollLoot({
      gameSessionId: sessionId,
      participantId,
      difficulty: session.difficulty as Difficulty,
      hltbMainHours: session.hltbMainHours,
      config,
      modifiers,
      seed: `${sessionId}-casino-${spinIndex}`,
      count: 1,
      competition,
      preferMaterial: spinIndex === 0,
    });

    return [rolled];
  });

  const drop = drops[0];
  if (!drop) throw badRequest("Loot roll failed");

  await logActivity({
    eventId: event.id,
    type: "LOOT",
    actorId: session.participant.userId,
    payload: {
      source: "casino",
      spin: spinIndex + 1,
      item: { name: drop.itemDefinition.name, rarity: drop.rarity },
    },
  });

  const updated = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: { lootDrops: { include: { itemDefinition: true } } },
  });

  return {
    drop: {
      slug: drop.itemDefinition.slug,
      name: drop.itemDefinition.name,
      rarity: drop.rarity,
      iconUrl: drop.itemDefinition.iconUrl,
    },
    casino: formatCasinoState(updated!),
  };
}

export function formatCasinoState(
  session: Pick<GameSession, "casinoSpinsTotal" | "casinoSpinsUsed">,
) {
  const remaining = Math.max(0, session.casinoSpinsTotal - session.casinoSpinsUsed);
  return {
    spinsTotal: session.casinoSpinsTotal,
    spinsUsed: session.casinoSpinsUsed,
    spinsRemaining: remaining,
    finished: remaining <= 0 && session.casinoSpinsTotal > 0,
  };
}
