import type { CompetitionContext } from "@/lib/balance/catch-up";
import { combineModifierEffects, type ModifierEffects } from "@/lib/scoring/score-calculator";

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

/** Сколько фри-спинов на «Колесе приколов» после игры. */
export function calculateCasinoSpins(params: {
  modifiers: ModifierEffects[];
  hltbMainHours?: number;
  seed: string;
  competition?: CompetitionContext;
  isDrop?: boolean;
}): number {
  if (params.isDrop) return 1;

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

  return baseRolls + extra + pinata + longGameLoot + shortLoot + behindBonus;
}
