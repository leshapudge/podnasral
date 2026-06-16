import type { Difficulty, GameSession, Prisma, Rarity } from "@prisma/client";
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

const MATERIAL_BAG_SLUG = "material_bag";
const MATERIAL_BAG_NAME = "Мешочек с материалами";

type MaterialBagQuality = "common" | "mixed" | "jackpot";

type MaterialBagItem = {
  slug: string;
  name: string;
  rarity: Rarity;
  iconUrl: string;
};

type MaterialBagResult = {
  quality: MaterialBagQuality;
  drop: {
    slug: string;
    name: string;
    rarity: Rarity;
    iconUrl: string;
  };
  items: MaterialBagItem[];
};

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i);
    h |= 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function pickUniqueMaterial(
  preferred: {
    id: string;
    slug: string;
    name: string;
    rarity: Rarity;
    iconUrl: string | null;
  }[],
  fallback: {
    id: string;
    slug: string;
    name: string;
    rarity: Rarity;
    iconUrl: string | null;
  }[],
  usedIds: Set<string>,
  rng: () => number,
) {
  const pickFrom = preferred.length > 0 ? preferred : fallback;
  const available = pickFrom.filter((item) => !usedIds.has(item.id));
  const source = available.length > 0 ? available : pickFrom;
  const chosen = source[Math.floor(rng() * source.length)] ?? fallback[0];
  if (chosen) usedIds.add(chosen.id);
  return chosen;
}

async function convertMaterialDropToBag(params: {
  tx: Prisma.TransactionClient;
  gameSessionId: string;
  participantId: string;
  sourceDropId: string;
  sourceInventoryItemId: string;
  seed: string;
}) {
  const materials = await params.tx.itemDefinition.findMany({
    where: { kind: "MATERIAL" },
    select: {
      id: true,
      slug: true,
      name: true,
      rarity: true,
      iconUrl: true,
    },
  });
  if (materials.length === 0) return null;

  const commonPool = materials.filter(
    (item) => item.rarity === "COMMON" || item.rarity === "UNCOMMON",
  );
  const rarePool = materials.filter(
    (item) =>
      item.rarity === "RARE" || item.rarity === "EPIC" || item.rarity === "LEGENDARY",
  );

  const rng = seededRandom(params.seed);
  const roll = rng();
  const quality: MaterialBagQuality =
    rarePool.length > 0 && roll < 0.12
      ? "jackpot"
      : rarePool.length > 0 && roll < 0.4
        ? "mixed"
        : "common";

  const used = new Set<string>();
  const first =
    quality === "jackpot"
      ? pickUniqueMaterial(rarePool, materials, used, rng)
      : pickUniqueMaterial(commonPool, materials, used, rng);
  const second =
    quality === "common"
      ? pickUniqueMaterial(commonPool, materials, used, rng)
      : pickUniqueMaterial(rarePool, materials, used, rng);
  const picked = [first, second].filter(
    (
      item,
    ): item is {
      id: string;
      slug: string;
      name: string;
      rarity: Rarity;
      iconUrl: string | null;
    } => Boolean(item),
  );
  if (picked.length === 0) return null;

  await params.tx.lootDrop.delete({ where: { id: params.sourceDropId } });
  await params.tx.inventoryItem.delete({ where: { id: params.sourceInventoryItemId } });

  for (const material of picked) {
    await params.tx.lootDrop.create({
      data: {
        gameSessionId: params.gameSessionId,
        itemDefinitionId: material.id,
        rarity: material.rarity,
      },
    });
    await params.tx.inventoryItem.create({
      data: {
        participantId: params.participantId,
        itemDefinitionId: material.id,
        quantity: 1,
      },
    });
  }

  const bagRarity: Rarity =
    quality === "jackpot" ? "EPIC" : quality === "mixed" ? "RARE" : "UNCOMMON";

  return {
    quality,
    drop: {
      slug: MATERIAL_BAG_SLUG,
      name: MATERIAL_BAG_NAME,
      rarity: bagRarity,
      iconUrl: resolveItemIcon(MATERIAL_BAG_SLUG, null),
    },
    items: picked.map((material) => ({
      slug: material.slug,
      name: material.name,
      rarity: material.rarity,
      iconUrl: resolveItemIcon(material.slug, material.iconUrl),
    })),
  } satisfies MaterialBagResult;
}

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
  const [spinIndex, drops, materialBag] = await prisma.$transaction(async (tx) => {
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

    const preferMaterial =
      spinIndex === 0 || seededRandom(`${sessionId}-casino-${spinIndex}-prefer-material`)() < 0.45;

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
      preferMaterial,
      db: tx,
    });

    const primary = rolled[0];
    let materialBag: MaterialBagResult | null = null;
    if (primary?.drop.itemDefinition.kind === "MATERIAL") {
      materialBag = await convertMaterialDropToBag({
        tx,
        gameSessionId: sessionId,
        participantId,
        sourceDropId: primary.drop.id,
        sourceInventoryItemId: primary.inventoryItemId,
        seed: `${sessionId}-casino-${spinIndex}-material-bag`,
      });
    }

    return [spinIndex, rolled, materialBag] as const;
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

  const dropPayload = materialBag?.drop ?? {
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
      item: materialBag
        ? {
            name: MATERIAL_BAG_NAME,
            rarity: materialBag.drop.rarity,
            quality: materialBag.quality,
            materials: materialBag.items.map((item) => ({
              name: item.name,
              rarity: item.rarity,
            })),
          }
        : { name: drop.itemDefinition.name, rarity: drop.rarity },
    },
  });

  const updated = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: { lootDrops: { include: { itemDefinition: true } } },
  });

  return {
    drop: dropPayload,
    reels: buildLootSlotReels(dropPayload),
    materialBag,
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
