import type { Difficulty } from "@prisma/client";
import type { EventConfig } from "@/lib/event/config";
import type { CompetitionContext } from "@/lib/balance/catch-up";
import {
  catchUpScoreMultiplier,
  leaderSoftCapMultiplier,
} from "@/lib/balance/catch-up";

export interface ModifierEffects {
  scoreMult?: number;
  penaltyReduction?: number;
  rareDropMult?: number;
  extraLootRolls?: number;
  auctionPoolShortBias?: number;
  auctionPoolLongBias?: number;
  auctionPoolRareBias?: number;
  auctionCandidateBonus?: number;
  difficultyRerolls?: number;
  difficultyEasyBias?: boolean;
  difficultyHardBias?: boolean;
  underdogScoreBonus?: number;
  skipDropPenalty?: boolean;
  bossDamageMult?: number;
  longGameHltbMin?: number;
  longGameScoreBonus?: number;
  longGameLootBonus?: number;
  ratSteal?: boolean;
  dropRefundMaterial?: boolean;
  pinataLootBonus?: number;
  flatScoreBonus?: number;
  flatScorePenalty?: number;
  factoryAssembly?: boolean;
  speedrunTaxHours?: number;
  speedrunTaxPenalty?: number;
  shortGameHltbMax?: number;
  shortGameFlatBonus?: number;
  shortGameLootBonus?: number;
  dropPenaltyMultiplier?: number;
  wastedDrop?: boolean;
  blockRatSteal?: boolean;
}

export interface ScoreBreakdown {
  baseScore: number;
  hltbMainHours: number;
  elapsedHours: number;
  timeRatio: number;
  timeMultiplier: number;
  difficulty: Difficulty;
  difficultyMultiplier: number;
  modifierMultiplier: number;
  catchUpMultiplier: number;
  leaderCapMultiplier: number;
  underdogItemBonus: number;
  finalScore: number;
}

export function getTimeMultiplier(ratio: number, config: EventConfig): number {
  for (const tier of config.timeMultipliers) {
    if (ratio <= tier.maxRatio) return tier.multiplier;
  }
  return 1;
}

export function combineModifierEffects(modifiers: ModifierEffects[]): ModifierEffects {
  return modifiers.reduce(
    (acc, m) => ({
      scoreMult: (acc.scoreMult ?? 1) * (m.scoreMult ?? 1),
      penaltyReduction: Math.min(1, (acc.penaltyReduction ?? 0) + (m.penaltyReduction ?? 0)),
      rareDropMult: (acc.rareDropMult ?? 1) * (m.rareDropMult ?? 1),
      extraLootRolls: (acc.extraLootRolls ?? 0) + (m.extraLootRolls ?? 0),
      auctionPoolShortBias: Math.max(acc.auctionPoolShortBias ?? 1, m.auctionPoolShortBias ?? 1),
      auctionPoolLongBias: Math.max(acc.auctionPoolLongBias ?? 1, m.auctionPoolLongBias ?? 1),
      auctionPoolRareBias: Math.max(acc.auctionPoolRareBias ?? 1, m.auctionPoolRareBias ?? 1),
      auctionCandidateBonus: (acc.auctionCandidateBonus ?? 0) + (m.auctionCandidateBonus ?? 0),
      difficultyRerolls: (acc.difficultyRerolls ?? 0) + (m.difficultyRerolls ?? 0),
      difficultyEasyBias: acc.difficultyEasyBias || Boolean(m.difficultyEasyBias),
      difficultyHardBias: acc.difficultyHardBias || Boolean(m.difficultyHardBias),
      underdogScoreBonus: (acc.underdogScoreBonus ?? 0) + (m.underdogScoreBonus ?? 0),
      skipDropPenalty: acc.skipDropPenalty || Boolean(m.skipDropPenalty),
      bossDamageMult: (acc.bossDamageMult ?? 1) * (m.bossDamageMult ?? 1),
      longGameHltbMin: Math.max(acc.longGameHltbMin ?? 0, m.longGameHltbMin ?? 0),
      longGameScoreBonus: (acc.longGameScoreBonus ?? 0) + (m.longGameScoreBonus ?? 0),
      longGameLootBonus: (acc.longGameLootBonus ?? 0) + (m.longGameLootBonus ?? 0),
      ratSteal: acc.ratSteal || Boolean(m.ratSteal),
      dropRefundMaterial: acc.dropRefundMaterial || Boolean(m.dropRefundMaterial),
      pinataLootBonus: (acc.pinataLootBonus ?? 0) + (m.pinataLootBonus ?? 0),
      flatScoreBonus: (acc.flatScoreBonus ?? 0) + (m.flatScoreBonus ?? 0),
      flatScorePenalty: (acc.flatScorePenalty ?? 0) + (m.flatScorePenalty ?? 0),
      factoryAssembly: acc.factoryAssembly || Boolean(m.factoryAssembly),
      speedrunTaxHours: Math.max(acc.speedrunTaxHours ?? 0, m.speedrunTaxHours ?? 0),
      speedrunTaxPenalty: Math.max(acc.speedrunTaxPenalty ?? 0, m.speedrunTaxPenalty ?? 0),
      shortGameHltbMax: Math.max(acc.shortGameHltbMax ?? 0, m.shortGameHltbMax ?? 0),
      shortGameFlatBonus: (acc.shortGameFlatBonus ?? 0) + (m.shortGameFlatBonus ?? 0),
      shortGameLootBonus: (acc.shortGameLootBonus ?? 0) + (m.shortGameLootBonus ?? 0),
      dropPenaltyMultiplier: (acc.dropPenaltyMultiplier ?? 1) * (m.dropPenaltyMultiplier ?? 1),
      wastedDrop: acc.wastedDrop || Boolean(m.wastedDrop),
      blockRatSteal: acc.blockRatSteal || Boolean(m.blockRatSteal),
    }),
    {} as ModifierEffects,
  );
}

function clampModifierScoreMult(mult: number, config: EventConfig): number {
  return Math.min(
    config.modifierScoreMultMax,
    Math.max(config.modifierScoreMultMin, mult),
  );
}

export function calculateScore(params: {
  hltbMainHours: number;
  elapsedMs: number;
  difficulty: Difficulty;
  modifiers: ModifierEffects[];
  config: EventConfig;
  competition?: CompetitionContext;
}): ScoreBreakdown {
  const { hltbMainHours, elapsedMs, difficulty, modifiers, config, competition } = params;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const timeRatio = hltbMainHours > 0 ? elapsedHours / hltbMainHours : 1;
  const combined = combineModifierEffects(modifiers);
  const timeMultiplier = combined.factoryAssembly
    ? 1
    : getTimeMultiplier(timeRatio, config);
  const difficultyMultiplier = config.difficultyMultipliers[difficulty] ?? 1;
  const modifierMultiplier = clampModifierScoreMult(combined.scoreMult ?? 1, config);

  const catchUpMultiplier = competition
    ? catchUpScoreMultiplier(competition, config)
    : 1;
  const leaderCapMultiplier = competition
    ? leaderSoftCapMultiplier(competition, config)
    : 1;

  let underdogItemBonus = 1;
  if (competition && (combined.underdogScoreBonus ?? 0) > 0) {
    const half = Math.ceil(competition.totalParticipants / 2);
    if (competition.rank > half) {
      underdogItemBonus = 1 + (combined.underdogScoreBonus ?? 0);
    }
  }

  const longGameThreshold = combined.longGameHltbMin ?? 15;
  const longGameBonus =
    (combined.longGameScoreBonus ?? 0) > 0 && hltbMainHours >= longGameThreshold
      ? 1 + (combined.longGameScoreBonus ?? 0)
      : 1;

  const shortMax = combined.shortGameHltbMax ?? 0;
  const shortFlat =
    shortMax > 0 && hltbMainHours <= shortMax ? (combined.shortGameFlatBonus ?? 0) : 0;

  const baseScore = Math.round(hltbMainHours * config.pointsPerHour);
  let finalScore = Math.round(
    baseScore *
      timeMultiplier *
      difficultyMultiplier *
      modifierMultiplier *
      catchUpMultiplier *
      leaderCapMultiplier *
      underdogItemBonus *
      longGameBonus,
  );

  finalScore += (combined.flatScoreBonus ?? 0) - (combined.flatScorePenalty ?? 0) + shortFlat;

  const taxHours = combined.speedrunTaxHours ?? 0;
  const taxPenalty = combined.speedrunTaxPenalty ?? 0;
  if (taxHours > 0 && taxPenalty > 0 && hltbMainHours > 0 && elapsedHours < hltbMainHours - taxHours) {
    finalScore -= taxPenalty;
  }

  finalScore = Math.max(0, finalScore);

  return {
    baseScore,
    hltbMainHours,
    elapsedHours: Math.round(elapsedHours * 100) / 100,
    timeRatio: Math.round(timeRatio * 100) / 100,
    timeMultiplier,
    difficulty,
    difficultyMultiplier,
    modifierMultiplier,
    catchUpMultiplier,
    leaderCapMultiplier,
    underdogItemBonus,
    finalScore,
  };
}

export function calculatePotentialMax(params: {
  hltbMainHours: number;
  difficulty: Difficulty;
  modifiers: ModifierEffects[];
  config: EventConfig;
  competition?: CompetitionContext;
}): number {
  const bestTimeMult = Math.max(...params.config.timeMultipliers.map((t) => t.multiplier));
  const difficultyMultiplier = params.config.difficultyMultipliers[params.difficulty] ?? 1;
  const combined = combineModifierEffects(params.modifiers);
  const modifierMultiplier = clampModifierScoreMult(combined.scoreMult ?? 1, params.config);
  const catchUp = params.competition
    ? catchUpScoreMultiplier(params.competition, params.config)
    : 1;
  const baseScore = Math.round(params.hltbMainHours * params.config.pointsPerHour);
  return Math.round(baseScore * bestTimeMult * difficultyMultiplier * modifierMultiplier * catchUp);
}

export function calculateDropPenalty(params: {
  hltbMainHours: number;
  elapsedMs: number;
  difficulty: Difficulty;
  modifiers: ModifierEffects[];
  config: EventConfig;
  competition?: CompetitionContext;
}): number {
  const combined = combineModifierEffects(params.modifiers);
  if (combined.skipDropPenalty) return 0;

  const potential = calculatePotentialMax({
    hltbMainHours: params.hltbMainHours,
    difficulty: params.difficulty,
    modifiers: params.modifiers,
    config: params.config,
    competition: params.competition,
  });

  if (combined.wastedDrop) {
    return Math.max(0, potential);
  }

  const reduction = Math.min(1, combined.penaltyReduction ?? 0);
  const hltbMs = params.hltbMainHours * 3600 * 1000;
  const playRatio = hltbMs > 0 ? Math.min(1, params.elapsedMs / hltbMs) : 0.35;
  const minRatio = 0.35;
  const scaledRatio = minRatio + (1 - minRatio) * playRatio;
  const dropMult = combined.dropPenaltyMultiplier ?? 1;

  const penalty = Math.round(
    potential * params.config.dropPenaltyRatio * (1 - reduction) * scaledRatio * dropMult,
  );
  return Math.max(0, penalty);
}

export function calculateBossDamage(
  finalScore: number,
  config: EventConfig,
  rankMultiplier = 1,
  itemMultiplier = 1,
): number {
  return Math.max(
    1,
    Math.round(finalScore * config.bossDamageRatio * rankMultiplier * itemMultiplier),
  );
}
