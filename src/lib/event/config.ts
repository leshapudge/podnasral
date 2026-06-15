import { z } from "zod";

/** JSON/Prisma не хранит Infinity — используем большой порог для последнего тира времени. */
export const TIME_MULTIPLIER_FALLBACK_MAX_RATIO = 999;

export const difficultyWeightsSchema = z.object({
  EASY: z.number().default(15),
  NORMAL: z.number().default(60),
  HARD: z.number().default(20),
  NIGHTMARE: z.number().default(5),
});

export const eventConfigSchema = z.object({
  /** Версия пресета баланса, чтобы можно было безболезненно обновлять старые ивенты. */
  balanceVersion: z.number().default(2),
  pointsPerHour: z.number().default(10),
  dropPenaltyRatio: z.number().default(0.18),
  bossDamageRatio: z.number().default(0.45),
  auctionCandidateCount: z.number().default(8),
  maxModifiersPerAuction: z.number().default(2),
  /** Макс. доп. спинов, которые стример может ввести вручную один раз за сессию казино. */
  maxManualCasinoBonusSpins: z.number().default(10),
  difficultyWeights: difficultyWeightsSchema.default({}),
  difficultyMultipliers: z
    .object({
      EASY: z.number().default(0.85),
      NORMAL: z.number().default(1.0),
      HARD: z.number().default(1.35),
      NIGHTMARE: z.number().default(1.9),
    })
    .default({}),
  /** Быстрее HLTB — бонус; медленнее — штраф (честная гонка). */
  timeMultipliers: z
    .array(
      z.object({
        maxRatio: z.number(),
        multiplier: z.number(),
      }),
    )
    .default([
      { maxRatio: 0.5, multiplier: 1.15 },
      { maxRatio: 0.75, multiplier: 1.08 },
      { maxRatio: 1.0, multiplier: 1.0 },
      { maxRatio: 1.35, multiplier: 0.95 },
      { maxRatio: 1.75, multiplier: 0.9 },
      { maxRatio: TIME_MULTIPLIER_FALLBACK_MAX_RATIO, multiplier: 0.84 },
    ]),
  lootWeights: z
    .record(z.string(), z.record(z.string(), z.number()))
    .default({
      EASY: { COMMON: 65, UNCOMMON: 28, RARE: 6, EPIC: 1, LEGENDARY: 0 },
      NORMAL: { COMMON: 48, UNCOMMON: 32, RARE: 14, EPIC: 5, LEGENDARY: 1 },
      HARD: { COMMON: 28, UNCOMMON: 34, RARE: 26, EPIC: 9, LEGENDARY: 3 },
      NIGHTMARE: { COMMON: 12, UNCOMMON: 28, RARE: 32, EPIC: 20, LEGENDARY: 8 },
    }),
  modifierScoreMultMin: z.number().default(0.75),
  modifierScoreMultMax: z.number().default(1.35),
  catchUp: z
    .object({
      enabled: z.boolean().default(true),
      /** Места с этим рангом и ниже получают догоняющий бонус (3 = 3-е место и хуже). */
      rankThreshold: z.number().default(3),
      rankStepBonus: z.number().default(0.05),
      pointsBehindStep: z.number().default(90),
      pointsBehindBonus: z.number().default(0.035),
      gamesBehindMedianBonus: z.number().default(0.05),
      minimumForBottomHalf: z.number().default(1.1),
      maxMultiplier: z.number().default(1.55),
    })
    .default({}),
  leaderSoftCap: z
    .object({
      enabled: z.boolean().default(true),
      applyToTopRanks: z.number().default(3),
      gamesAheadOfMedian: z.number().default(1),
      scoreMultiplier: z.number().default(0.9),
    })
    .default({}),
  boss: z
    .object({
      hpPerParticipant: z.number().default(17_500),
      damageSoftCapByRank: z
        .array(z.number())
        .default([1.0, 0.98, 0.94, 0.9, 0.86, 0.82, 0.78, 0.75]),
    })
    .default({}),
});

export type EventConfig = z.infer<typeof eventConfigSchema>;

function sanitizeEventConfigRaw(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const o = { ...(raw as Record<string, unknown>) };
  const balanceVersion = typeof o.balanceVersion === "number" ? o.balanceVersion : 1;

  // Legacy configs (до ручного аука и catch-up v2) автоматически переходят на новый баланс.
  if (balanceVersion < 2) {
    delete o.dropPenaltyRatio;
    delete o.difficultyMultipliers;
    delete o.timeMultipliers;
    delete o.catchUp;
    delete o.leaderSoftCap;
    o.balanceVersion = 2;
  }

  if (Array.isArray(o.timeMultipliers)) {
    o.timeMultipliers = o.timeMultipliers.map((tier) => {
      if (!tier || typeof tier !== "object") return tier;
      const t = { ...(tier as Record<string, unknown>) };
      if (t.maxRatio == null || t.maxRatio === Infinity) {
        t.maxRatio = TIME_MULTIPLIER_FALLBACK_MAX_RATIO;
      }
      return t;
    });
  }

  return o;
}

export function parseEventConfig(raw: unknown): EventConfig {
  return eventConfigSchema.parse(sanitizeEventConfigRaw(raw ?? {}));
}

/** Полный конфиг для seed / документации. */
export function defaultEventConfigJson(): EventConfig {
  return parseEventConfig({});
}
