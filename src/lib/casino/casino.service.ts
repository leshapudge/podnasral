import type { Difficulty, GameSession } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import { badRequest, conflict } from "@/lib/api/errors";
import { getActiveEvent } from "@/lib/event/event.service";
import { parseEventConfig } from "@/lib/event/config";
import { getCompetitionContext } from "@/lib/balance/catch-up";
import { rollLoot } from "@/lib/loot/loot.service";
import type { ModifierEffects } from "@/lib/scoring/score-calculator";
import { logActivity } from "@/lib/activity/activity.service";
import { resolveItemIcon } from "@/lib/inventory/item-assets";
import { isBadModifierForAutoApply } from "@/lib/inventory/item-effects";
import { queuePendingModifier } from "@/lib/modifiers/pending-modifiers";
import { calculateCasinoSpins } from "./spin-count";
import { buildLootSlotReels, getActiveModifiers } from "./modifiers";

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
    competition,
    isDrop: opts.isDrop,
  });

  await prisma.$transaction([
    prisma.gameSession.update({
      where: { id: session.id },
      data: {
        casinoSpinsTotal: spins,
        casinoSpinsUsed: 0,
        casinoManualBonusApplied: false,
      },
    }),
    prisma.participant.update({
      where: { id: session.participantId },
      data: { status: "CASINO" },
    }),
  ]);

  return spins;
}

export async function addCasinoBonusSpins(
  sessionId: string,
  participantId: string,
  bonusSpins: number,
) {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
  });
  if (!session) throw badRequest("Session not found");
  if (session.participantId !== participantId) throw badRequest("Session not found");

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
  });
  if (participant?.status !== "CASINO") {
    throw conflict("Casino not active");
  }

  if (session.casinoManualBonusApplied) {
    throw badRequest("Manual bonus spins already applied");
  }

  const event = await getActiveEvent();
  const config = parseEventConfig(event.config);
  const count = Math.floor(bonusSpins);
  if (count < 0) throw badRequest("Bonus spins must be non-negative");
  if (count > config.maxManualCasinoBonusSpins) {
    throw badRequest(`Max ${config.maxManualCasinoBonusSpins} bonus spins`);
  }

  const updated = await prisma.gameSession.update({
    where: { id: sessionId },
    data: {
      casinoSpinsTotal: { increment: count },
      casinoManualBonusApplied: true,
    },
  });

  return formatCasinoState(updated, config.maxManualCasinoBonusSpins);
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
  if (remaining <= 0) throw badRequest("No spins remaining");

  if (!session.difficulty) throw badRequest("Difficulty required");

  const event = await getActiveEvent();
  const config = parseEventConfig(event.config);
  const modifiers = (session.modifiersJson as ModifierEffects[]) ?? [];
  const competition = await getCompetitionContext(participantId, event.id);
  const activeModifiers = getActiveModifiers(session);
  const existingCasinoDropItemIds = session.lootDrops.map((d) => d.itemDefinitionId);

  const [spinIndex, drops] = await prisma.$transaction(async (tx) => {
    const claimed = await tx.gameSession.updateMany({
      where: {
        id: sessionId,
        // optimistic guard to prevent double-spend on concurrent spins
        casinoSpinsUsed: session.casinoSpinsUsed,
        casinoSpinsTotal: { gt: session.casinoSpinsUsed },
      },
      data: { casinoSpinsUsed: { increment: 1 } },
    });
    if (claimed.count !== 1) throw badRequest("No spins remaining");

    const spinIndex = session.casinoSpinsUsed;

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
      excludeItemDefinitionIds: existingCasinoDropItemIds,
      db: tx,
    });

    return [spinIndex, rolled] as const;
  });

  const rolled = drops[0];
  if (!rolled?.drop) throw badRequest("Loot roll failed");
  const drop = rolled.drop;

  if (drop.itemDefinition.kind === "MODIFIER") {
    const effects = drop.itemDefinition.effectsJson as Record<
      string,
      number | boolean | string | string[]
    >;
    if (isBadModifierForAutoApply(drop.itemDefinition.slug, effects)) {
      await queuePendingModifier(participantId, rolled.inventoryItemId);
    }
  }

  const dropPayload = {
    slug: drop.itemDefinition.slug,
    name: drop.itemDefinition.name,
    rarity: drop.rarity,
    iconUrl: resolveItemIcon(drop.itemDefinition.slug, drop.itemDefinition.iconUrl),
  };

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
    drop: dropPayload,
    reels: buildLootSlotReels(dropPayload),
    activeModifiers,
    casino: formatCasinoState(updated!, config.maxManualCasinoBonusSpins),
  };
}

export function formatCasinoState(
  session: Pick<
    GameSession,
    "casinoSpinsTotal" | "casinoSpinsUsed" | "casinoManualBonusApplied"
  >,
  maxManualBonusSpins = 10,
) {
  const remaining = Math.max(0, session.casinoSpinsTotal - session.casinoSpinsUsed);
  return {
    spinsTotal: session.casinoSpinsTotal,
    spinsUsed: session.casinoSpinsUsed,
    spinsRemaining: remaining,
    finished: remaining <= 0 && session.casinoManualBonusApplied,
    manualBonusApplied: session.casinoManualBonusApplied,
    maxManualBonusSpins,
  };
}
