import type { CompetitionContext } from "@/lib/balance/catch-up";
import { combineModifierEffects, type ModifierEffects } from "@/lib/scoring/score-calculator";

const BASE_COMPLETE_SPINS = 3;

/** Сколько фри-спинов в слоте наград после игры. */
export function calculateCasinoSpins(params: {
  modifiers: ModifierEffects[];
  hltbMainHours?: number;
  competition?: CompetitionContext;
  isDrop?: boolean;
}): number {
  if (params.isDrop) return 1;

  const combined = combineModifierEffects(params.modifiers);
  const baseRolls = BASE_COMPLETE_SPINS;
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
