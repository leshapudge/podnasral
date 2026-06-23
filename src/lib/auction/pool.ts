import prisma from "@/lib/db/prisma";
import { getCatalogHltbMainStoryHours } from "@/lib/catalog/hltb-hours";
import type { ModifierEffects } from "@/lib/scoring/score-calculator";

const SHORT_GAME_HOURS = 15;
const LONG_GAME_HOURS = 25;

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

export async function getEligiblePoolGames(eventId: string, participantId: string) {
  const [completedGameIds, droppedGameIds, activeGameIds, pool] = await Promise.all([
    prisma.gameSession.findMany({
      where: { participantId, status: "COMPLETED" },
      select: { catalogGameId: true },
    }),
    prisma.gameSession.findMany({
      where: { participantId, status: "DROPPED" },
      select: { catalogGameId: true },
    }),
    prisma.gameSession.findMany({
      where: { status: { in: ["AWAITING_DIFFICULTY", "PLAYING", "PAUSED"] } },
      select: { catalogGameId: true },
    }),
    prisma.eventGamePool.findMany({
      where: { eventId, isEnabled: true },
      include: { catalogGame: true },
    }),
  ]);

  const exclude = new Set([
    ...completedGameIds.map((g) => g.catalogGameId),
    ...droppedGameIds.map((g) => g.catalogGameId),
    ...activeGameIds.map((g) => g.catalogGameId),
  ]);

  return pool.filter(
    (p) => !exclude.has(p.catalogGameId) && getCatalogHltbMainStoryHours(p.catalogGame),
  );
}

export function weightedPick<T extends { weight: number }>(
  items: T[],
  rand: () => number,
  count: number,
): T[] {
  const available = [...items];
  const picked: T[] = [];

  while (picked.length < count && available.length > 0) {
    const total = available.reduce((s, i) => s + i.weight, 0);
    let r = rand() * total;
    let idx = 0;
    for (let i = 0; i < available.length; i++) {
      r -= available[i].weight;
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    picked.push(available[idx]);
    available.splice(idx, 1);
  }

  return picked;
}

export function buildEliminationOrder(
  candidateIds: string[],
  seed: string,
): { order: string[]; winnerId: string } {
  const rand = seededRandom(seed);
  const remaining = [...candidateIds];
  const eliminationOrder: string[] = [];

  while (remaining.length > 1) {
    const idx = Math.floor(rand() * remaining.length);
    const eliminated = remaining.splice(idx, 1)[0];
    eliminationOrder.push(eliminated);
  }

  return { order: eliminationOrder, winnerId: remaining[0] };
}

type PoolEntry = {
  weight: number;
  catalogGame: { mainStoryHours: number | null };
};

export function applyModifierWeights<T extends PoolEntry>(
  pool: T[],
  modifiers: ModifierEffects[],
): T[] {
  const combined = modifiers.reduce(
    (acc, mod) => ({
      short: Math.max(acc.short, mod.auctionPoolShortBias ?? 1),
      long: Math.max(acc.long, mod.auctionPoolLongBias ?? 1),
      rare: Math.max(acc.rare, mod.auctionPoolRareBias ?? 1),
      rareDrop: acc.rareDrop * (mod.rareDropMult ?? 1),
    }),
    { short: 1, long: 1, rare: 1, rareDrop: 1 },
  );

  return pool.map((p) => {
    const hours = p.catalogGame.mainStoryHours ?? SHORT_GAME_HOURS;
    let mult = 1;

    if (hours <= SHORT_GAME_HOURS) mult *= combined.short;
    if (hours >= LONG_GAME_HOURS) mult *= combined.long;
    if (hours >= 20 && hours <= 40) mult *= combined.rare;
    if (combined.rareDrop > 1) mult *= 1 + (combined.rareDrop - 1) * 0.15;

    return {
      ...p,
      weight: Math.max(1, Math.round(p.weight * mult)),
    };
  });
}
