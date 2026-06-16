import type { Difficulty, Prisma, Rarity } from "@prisma/client";
import { ensureBalanceItemDefinitions } from "@/lib/balance/item-definitions-sync";
import type { EventConfig } from "@/lib/event/config";
import type { CompetitionContext } from "@/lib/balance/catch-up";
import { combineModifierEffects, type ModifierEffects } from "@/lib/scoring/score-calculator";
import prisma from "@/lib/db/prisma";

const RARITIES: Rarity[] = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"];

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export function rollRarity(
  difficulty: Difficulty,
  config: EventConfig,
  modifiers: ModifierEffects[],
  seed: string,
): Rarity {
  const weights = { ...config.lootWeights[difficulty] };
  const rareMult = modifiers.reduce((m, mod) => m * (mod.rareDropMult ?? 1), 1);

  if (rareMult > 1) {
    weights.COMMON = Math.max(0, (weights.COMMON ?? 0) - 10 * (rareMult - 1));
    weights.RARE = (weights.RARE ?? 0) + 5 * (rareMult - 1);
    weights.EPIC = (weights.EPIC ?? 0) + 3 * (rareMult - 1);
    weights.LEGENDARY = (weights.LEGENDARY ?? 0) + 2 * (rareMult - 1);
  }

  const rand = seededRandom(seed)();
  const total = RARITIES.reduce((s, r) => s + (weights[r] ?? 0), 0);
  let cumulative = 0;
  const roll = rand * total;

  for (const rarity of RARITIES) {
    cumulative += weights[rarity] ?? 0;
    if (roll <= cumulative) return rarity;
  }
  return "COMMON";
}

export async function rollLoot(params: {
  gameSessionId: string;
  participantId: string;
  difficulty: Difficulty;
  hltbMainHours?: number;
  config: EventConfig;
  modifiers: ModifierEffects[];
  seed: string;
  count?: number;
  competition?: CompetitionContext;
  db?: Prisma.TransactionClient;
  /** Первый спин казино — чаще материал для верстака */
  preferMaterial?: boolean;
  /** If provided, these item definitions cannot be rolled. */
  excludeItemDefinitionIds?: string[];
}) {
  await ensureBalanceItemDefinitions();

  const db = params.db ?? prisma;
  const items = await db.itemDefinition.findMany({
    where: { kind: { in: ["MODIFIER", "MATERIAL"] } },
  });

  if (items.length === 0) return [];

  const combined = combineModifierEffects(params.modifiers);
  const baseRolls = 1 + Math.floor(seededRandom(params.seed)() * 2);
  const extra = combined.extraLootRolls ?? 0;
  const pinata = combined.pinataLootBonus ?? 0;
  const longGameThreshold = combined.longGameHltbMin ?? 15;
  const longGameLoot =
    params.hltbMainHours != null &&
    (combined.longGameLootBonus ?? 0) > 0 &&
    params.hltbMainHours >= longGameThreshold
      ? combined.longGameLootBonus ?? 0
      : 0;
  const shortMax = combined.shortGameHltbMax ?? 0;
  const shortLoot =
    params.hltbMainHours != null &&
    shortMax > 0 &&
    params.hltbMainHours <= shortMax
      ? combined.shortGameLootBonus ?? 0
      : 0;
  const behindBonus =
    params.competition &&
    params.competition.rank >= Math.ceil(params.competition.totalParticipants * 0.6)
      ? 1
      : 0;
  const lootCount =
    params.count ?? baseRolls + extra + pinata + longGameLoot + shortLoot + behindBonus;

  const drops = [];
  const enforceUnique = params.excludeItemDefinitionIds !== undefined;
  const blockedItemIds = new Set(params.excludeItemDefinitionIds ?? []);

  for (let i = 0; i < lootCount; i++) {
    const rarity = rollRarity(
      params.difficulty,
      params.config,
      params.modifiers,
      `${params.seed}-loot-${i}`,
    );

    let pool = items.filter((it) => it.rarity === rarity);
    if (pool.length === 0) pool = items;

    if (params.preferMaterial && i === 0) {
      const materials = pool.filter((it) => it.kind === "MATERIAL");
      if (materials.length > 0) pool = materials;
    }

    let candidates = pool;
    if (enforceUnique) {
      const uniqueCandidates = candidates.filter((it) => !blockedItemIds.has(it.id));
      if (uniqueCandidates.length > 0) {
        candidates = uniqueCandidates;
      } else {
        // Уникальные закончились: мягко откатываемся к обычному пулу,
        // чтобы спин никогда не падал с "No unique bonuses remaining".
        blockedItemIds.clear();
        candidates = pool;
      }
    }
    if (candidates.length === 0) candidates = items;
    const idx = Math.floor(seededRandom(`${params.seed}-item-${i}`)() * candidates.length);
    const item = candidates[idx];

    const drop = await db.lootDrop.create({
      data: {
        gameSessionId: params.gameSessionId,
        itemDefinitionId: item.id,
        rarity,
      },
      include: { itemDefinition: true },
    });

    const inv = await db.inventoryItem.create({
      data: {
        participantId: params.participantId,
        itemDefinitionId: item.id,
        quantity: 1,
        instanceId: item.kind === "MODIFIER" ? crypto.randomUUID() : null,
      },
    });

    drops.push({ drop, inventoryItemId: inv.id });
    if (enforceUnique) blockedItemIds.add(item.id);
  }

  return drops;
}
