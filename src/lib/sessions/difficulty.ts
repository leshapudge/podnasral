import type { Difficulty } from "@prisma/client";
import type { EventConfig } from "@/lib/event/config";

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

export function rollDifficulty(seed: string, config: EventConfig): Difficulty {
  const weights = config.difficultyWeights;
  const entries: [Difficulty, number][] = [
    ["EASY", weights.EASY],
    ["NORMAL", weights.NORMAL],
    ["HARD", weights.HARD],
    ["NIGHTMARE", weights.NIGHTMARE],
  ];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  const rand = seededRandom(seed)() * total;
  let cumulative = 0;
  for (const [diff, weight] of entries) {
    cumulative += weight;
    if (rand <= cumulative) return diff;
  }
  return "NORMAL";
}

const DIFFICULTY_SCORE: Record<Difficulty, number> = {
  EASY: 0.85,
  NORMAL: 1,
  HARD: 1.45,
  NIGHTMARE: 2.2,
};

export type DifficultyRollMode = "hardest" | "easiest";

/** Несколько бросков — остаётся лучший по режиму (кристалл / медовый реролл / диск DS). */
export function rollDifficultyWithRerolls(
  baseSeed: string,
  config: EventConfig,
  extraRerolls: number,
  mode: DifficultyRollMode = "hardest",
): Difficulty {
  const rolls = 1 + Math.max(0, extraRerolls);
  let picked: Difficulty = "NORMAL";
  let pickedScore = mode === "hardest" ? -1 : Infinity;

  for (let i = 0; i < rolls; i++) {
    const d = rollDifficulty(`${baseSeed}-reroll-${i}`, config);
    const score = DIFFICULTY_SCORE[d] * config.difficultyMultipliers[d];
    if (mode === "easiest") {
      if (score < pickedScore) {
        pickedScore = score;
        picked = d;
      }
    } else if (score > pickedScore) {
      pickedScore = score;
      picked = d;
    }
  }

  return picked;
}
