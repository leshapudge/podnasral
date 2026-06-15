import { BALANCE_ITEM_CATALOG } from "@/lib/balance/item-catalog";

export type ItemEffects = Record<string, number | boolean | string | string[]>;

const EFFECT_LABELS: Record<string, (value: number | boolean | string | string[]) => string> = {
  scoreMult: (v) => {
    if (typeof v !== "number") return "";
    if (v > 1) return `+${Math.round((v - 1) * 100)}% к очкам за прохождение`;
    if (v < 1) return `−${Math.round((1 - v) * 100)}% к очкам за прохождение`;
    return "Без изменения очков";
  },
  rareDropMult: (v) => {
    if (typeof v !== "number") return "";
    if (v > 1) return `+${Math.round((v - 1) * 100)}% шанс редкого лута`;
    return `×${v} к шансу редкого лута`;
  },
  penaltyReduction: (v) =>
    typeof v === "number" ? `−${Math.round(v * 100)}% штрафа при дропе` : "",
  extraLootRolls: (v) =>
    typeof v === "number" && v > 0 ? `+${v} спин слота наград после игры` : "",
  auctionPoolShortBias: () => "",
  auctionPoolLongBias: () => "",
  auctionPoolRareBias: () => "",
  difficultyRerolls: (v) =>
    typeof v === "number" && v > 0
      ? `Переброс сложности: ${v + 1} броска, остаётся лучший`
      : "",
  underdogScoreBonus: (v) =>
    typeof v === "number" && v > 0
      ? `+${Math.round(v * 100)}% очков в нижней половине таблицы`
      : "",
  skipDropPenalty: (v) => (v === true ? "Полная отмена штрафа при дропе (одноразово)" : ""),
  auctionCandidateBonus: () => "",
  genreExpertChoice: (v) =>
    v === true ? "Можно выбрать жанр перед завершением следующего аукциона" : "",
  auctionForcedGenres: (v) => {
    const genres = Array.isArray(v)
      ? v.filter((g): g is string => typeof g === "string" && g.trim().length > 0)
      : typeof v === "string" && v.trim().length > 0
        ? [v]
        : [];
    if (genres.length === 0) return "";
    return `Следующий аукцион только по жанрам: ${genres.join(", ")}`;
  },
  audiobookChallenge: (v) =>
    v === true ? "Челлендж: проходить игру под аудиокнигу Ozon" : "",
  difficultyEasyBias: (v) =>
    v === true ? "Переброс сложности: остаётся самый лёгкий вариант" : "",
  difficultyHardBias: (v) =>
    v === true ? "Переброс сложности: остаётся самый жёсткий вариант" : "",
  bossDamageMult: (v) =>
    typeof v === "number" && v > 1
      ? `+${Math.round((v - 1) * 100)}% урона по боссу`
      : "",
  longGameHltbMin: () => "",
  longGameScoreBonus: (v) =>
    typeof v === "number" && v > 0 ? `+${Math.round(v * 100)}% очков на длинных играх` : "",
  longGameLootBonus: (v) =>
    typeof v === "number" && v > 0 ? `+${v} лут на длинных играх (15+ ч HLTB)` : "",
  ratSteal: (v) =>
    v === true ? "После прохождения: шанс украсть материал у лидера" : "",
  dropRefundMaterial: (v) =>
    v === true ? "При дропе: осколок железа в инвентарь" : "",
  pinataLootBonus: (v) =>
    typeof v === "number" && v > 0 ? `+${v} спин слота наград при победе` : "",
  flatScoreBonus: (v) =>
    typeof v === "number" && v > 0 ? `+${v} очков за прохождение` : "",
  flatScorePenalty: (v) =>
    typeof v === "number" && v > 0 ? `−${v} очков за прохождение` : "",
  factoryAssembly: (v) =>
    v === true ? "Очки только от HLTB, без бонуса за скорость" : "",
  speedrunTaxHours: () => "",
  speedrunTaxPenalty: (v) =>
    typeof v === "number" && v > 0 ? `−${v} очков при спидране (быстрее HLTB)` : "",
  shortGameHltbMax: () => "",
  shortGameFlatBonus: (v) =>
    typeof v === "number" && v > 0 ? `+${v} очков на коротких играх` : "",
  shortGameLootBonus: (v) =>
    typeof v === "number" && v > 0 ? `+${v} лут на коротких играх` : "",
  dropPenaltyMultiplier: (v) =>
    typeof v === "number" && v > 0 && v < 1
      ? `Штраф при дропе ×${v}`
      : typeof v === "number" && v > 1
        ? `Штраф при дропе ×${v}`
        : "",
  wastedDrop: (v) => (v === true ? "При дропе: штраф = 100% потенциала" : ""),
  blockRatSteal: (v) => (v === true ? "Защита от кражи материалов в инвентаре" : ""),
};

export function describeItemEffects(effects: ItemEffects): string[] {
  return Object.entries(effects)
    .filter(([key, v]) => {
      if (
        key === "longGameHltbMin" ||
        key === "shortGameHltbMax" ||
        key === "speedrunTaxHours" ||
        key === "auctionPoolShortBias" ||
        key === "auctionPoolLongBias" ||
        key === "auctionPoolRareBias" ||
        key === "auctionCandidateBonus"
      ) {
        return false;
      }
      if (v === 0 || v === 1 || v === false || v === "") return false;
      if (Array.isArray(v) && v.length === 0) return false;
      if (key === "skipDropPenalty" && v !== true) return false;
      if (key === "difficultyEasyBias" && v !== true) return false;
      if (key === "difficultyHardBias" && v !== true) return false;
      if (key === "ratSteal" && v !== true) return false;
      if (key === "dropRefundMaterial" && v !== true) return false;
      if (key === "factoryAssembly" && v !== true) return false;
      if (key === "wastedDrop" && v !== true) return false;
      if (key === "blockRatSteal" && v !== true) return false;
      if (key === "genreExpertChoice" && v !== true) return false;
      if (key === "audiobookChallenge" && v !== true) return false;
      return true;
    })
    .map(([key, value]) => {
      const formatter = EFFECT_LABELS[key];
      if (formatter) return formatter(value);
      return `${key}: ${String(value)}`;
    })
    .filter(Boolean);
}

export function summarizeItemEffects(effects: ItemEffects): string {
  const lines = describeItemEffects(effects);
  return lines.length > 0 ? lines.join(" · ") : "Без эффектов";
}

/** Penalties from casino that must auto-apply on the streamer's next run. */
export function isBadModifierForAutoApply(slug: string, effects: ItemEffects): boolean {
  const num = (v: number | boolean | string | string[] | undefined) =>
    typeof v === "number" ? v : 0;
  if (slug.startsWith("bad_")) return true;
  if (num(effects.flatScorePenalty) > 0) return true;
  if (effects.wastedDrop === true) return true;
  if (num(effects.speedrunTaxPenalty) > 0) return true;
  if (effects.factoryAssembly === true) return true;
  if (effects.difficultyHardBias === true) return true;
  if (effects.audiobookChallenge === true && num(effects.scoreMult) < 1) return true;
  if (
    (Array.isArray(effects.auctionForcedGenres) && effects.auctionForcedGenres.length > 0) ||
    (typeof effects.auctionForcedGenres === "string" && effects.auctionForcedGenres.length > 0)
  ) {
    return true;
  }
  if (slug === "leprechaun_debuff") return true;
  return false;
}

export const ITEM_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  BALANCE_ITEM_CATALOG.map((i) => [i.slug, i.description]),
);

export const ITEM_KIND_LABELS: Record<string, string> = {
  MODIFIER: "Модификатор · забег",
  MATERIAL: "Материал · лут",
  CRAFTABLE: "Крафтовый предмет",
  RESOURCE: "Ресурс",
  ITEM: "Предмет",
  ARTIFACT: "Артефакт",
};

export function getItemFlavorText(slug: string, description?: string | null): string | null {
  return description ?? ITEM_DESCRIPTIONS[slug] ?? null;
}
