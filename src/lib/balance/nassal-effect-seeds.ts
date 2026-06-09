/**
 * Сиды предметов, напрямую сопоставленные с публичным API NASSAL:
 * GET https://api-game.nassal.pro/api/public/effect/list
 *
 * В NASSAL нет отдельного «инвентаря предметов» как в RGG — есть эффекты Колеса приколов.
 * Здесь — адаптация под MINESEASON (модификатор на аукционе → одна игра).
 */
import type { CatalogItemSeed, CatalogRecipeSeed } from "./item-catalog-types";

export const NASSAL_MATERIALS: CatalogItemSeed[] = [
  {
    slug: "iron_shard",
    name: "Осколок железа",
    description: "Базовый ресурс после игр. Нужен для крафта на верстаке.",
    rarity: "COMMON",
    kind: "MATERIAL",
    effectsJson: {},
  },
  {
    slug: "gold_dust",
    name: "Золотая пыль",
    description: "Редкий ресурс с игр посложнее.",
    rarity: "UNCOMMON",
    kind: "MATERIAL",
    effectsJson: {},
  },
  {
    slug: "emerald_splinter",
    name: "Изумрудная щепка",
    description: "Ценный кристалл для легендарных крафтов.",
    rarity: "RARE",
    kind: "MATERIAL",
    effectsJson: {},
  },
  {
    slug: "streamer_tear",
    name: "Слеза стримера",
    description: "Копится с дропов и неудач. Валюта для особых рецептов.",
    rarity: "UNCOMMON",
    kind: "MATERIAL",
    effectsJson: {},
  },
  {
    slug: "junk_scrap",
    name: "Хлам",
    description: "Как «Контейнер с хламом» в NASSAL: пять штук перерабатываются на верстаке.",
    rarity: "COMMON",
    kind: "MATERIAL",
    effectsJson: {},
  },
];

/** Эффекты NASSAL → модификаторы MINESEASON */
export const NASSAL_MODIFIER_ITEMS: CatalogItemSeed[] = [
  // —— Колесо: плоские очки (good_flat / bad_flat) ——
  {
    slug: "good_flat_4",
    name: "ГО-Д-НО",
    description: "NASSAL · positive · +4 очка за прохождение.",
    rarity: "COMMON",
    kind: "MODIFIER",
    effectsJson: { flatScoreBonus: 4 },
  },
  {
    slug: "good_flat_8",
    name: "ГО-Д-НОТА",
    description: "NASSAL · positive · +8 очков за прохождение.",
    rarity: "UNCOMMON",
    kind: "MODIFIER",
    effectsJson: { flatScoreBonus: 8 },
  },
  {
    slug: "bad_flat_3",
    name: "Shit",
    description: "NASSAL · negative · −3 очка за прохождение.",
    rarity: "COMMON",
    kind: "MODIFIER",
    effectsJson: { flatScorePenalty: 3 },
  },
  {
    slug: "bad_flat_6",
    name: "Oh shit, here we go again",
    description: "NASSAL · negative · −6 очков за прохождение.",
    rarity: "UNCOMMON",
    kind: "MODIFIER",
    effectsJson: { flatScorePenalty: 6 },
  },

  // —— Сложность ——
  {
    slug: "anabolics",
    name: "Анаболики",
    description: "NASSAL · inventory · игра на самом лёгком уровне сложности.",
    rarity: "RARE",
    kind: "MODIFIER",
    effectsJson: { difficultyEasyBias: true, difficultyRerolls: 2 },
  },
  {
    slug: "one_of_oneils",
    name: "Один из О'Нилов",
    description: "NASSAL · inventory · максимальная сложность (кроме one-life).",
    rarity: "EPIC",
    kind: "MODIFIER",
    effectsJson: { difficultyHardBias: true, difficultyRerolls: 2 },
  },

  // —— Дроп ——
  {
    slug: "parachute",
    name: "Парашют",
    description: "NASSAL · attached · при дропе теряется ~25% потенциала вместо полного штрафа.",
    rarity: "RARE",
    kind: "MODIFIER",
    effectsJson: { dropPenaltyMultiplier: 0.5 },
  },
  {
    slug: "wasted",
    name: "П О Т Р А Ч Е Н О",
    description: "NASSAL · attached · при дропе штраф = 100% от потенциала прохождения.",
    rarity: "EPIC",
    kind: "MODIFIER",
    effectsJson: { wastedDrop: true },
  },

  // —— Защита / сброс ——
  {
    slug: "asnaeb",
    name: "ASNAEB",
    description: "NASSAL · positive · снимает один негативный модификатор со стака (упрощённо: −50% штрафа дропа).",
    rarity: "RARE",
    kind: "MODIFIER",
    effectsJson: { penaltyReduction: 0.5 },
  },
  {
    slug: "body_armor",
    name: "Бронежилет",
    description: "NASSAL · positive · блокирует кражу материала у вас после игры.",
    rarity: "UNCOMMON",
    kind: "MODIFIER",
    effectsJson: { blockRatSteal: true },
  },

  // —— PvP ——
  {
    slug: "small_theft_effect",
    name: "Small Theft Effect",
    description: "NASSAL · negative · цель теряет случайный материал после вашего прохождения.",
    rarity: "RARE",
    kind: "MODIFIER",
    effectsJson: { ratSteal: true },
  },
  {
    slug: "snatched",
    name: "Snatched",
    description: "NASSAL · attached · −6 очков за игру цели; вы получаете +3, когда цель проходит (упрощённо: +3 вам, кража у лидера).",
    rarity: "EPIC",
    kind: "MODIFIER",
    effectsJson: { flatScoreBonus: 3, ratSteal: true },
  },

  // —— Скоринг / мета ——
  {
    slug: "factory_assembly",
    name: "Заводская сборка",
    description: "NASSAL · negative PvP · очки только от времени HLTB, без бонуса за скорость.",
    rarity: "EPIC",
    kind: "MODIFIER",
    effectsJson: { factoryAssembly: true },
  },
  {
    slug: "speedometer",
    name: "Спидометр",
    description: "NASSAL · attached · −10 очков, если прошли на 2+ ч быстрее HLTB.",
    rarity: "RARE",
    kind: "MODIFIER",
    effectsJson: { speedrunTaxHours: 2, speedrunTaxPenalty: 10 },
  },
  {
    slug: "number_9_extra",
    name: "Number 9 EXTRA",
    description: "NASSAL · inventory · +25% к очкам за прохождение.",
    rarity: "EPIC",
    kind: "MODIFIER",
    effectsJson: { scoreMult: 1.25 },
  },

  // —— Аукцион ——
  {
    slug: "reroll_fetishist",
    name: "Реролло-фетишист",
    description: "NASSAL · inventory · +2 кандидата аукциона и переброс сложности, если вы не лидер.",
    rarity: "RARE",
    kind: "MODIFIER",
    effectsJson: { auctionCandidateBonus: 2, difficultyRerolls: 1, underdogScoreBonus: 0.05 },
  },
  {
    slug: "city_map",
    name: "Карта города",
    description: "NASSAL · inventory · можно смотреть гайды: −10% очков, но −35% штрафа при дропе.",
    rarity: "UNCOMMON",
    kind: "MODIFIER",
    effectsJson: { scoreMult: 0.9, penaltyReduction: 0.35 },
  },
  {
    slug: "container_with_junk",
    name: "Контейнер с хламом",
    description: "NASSAL · attached · в пуле аукциона чаще короткие «странные» игры; +1 лут.",
    rarity: "UNCOMMON",
    kind: "MODIFIER",
    effectsJson: { auctionPoolShortBias: 2, extraLootRolls: 1 },
  },
  {
    slug: "genre_expert",
    name: "Жанровый эксперт",
    description: "NASSAL · attached · аукцион смещён к «средним» играм 15–35 ч.",
    rarity: "RARE",
    kind: "MODIFIER",
    effectsJson: { auctionPoolRareBias: 1.8, auctionCandidateBonus: 1 },
  },

  // —— Глобальные ивенты (на одну игру) ——
  {
    slug: "genre_fever",
    name: "Жанровая лихорадка",
    description: "NASSAL · global · +10% очков на длинных играх (15+ ч HLTB).",
    rarity: "EPIC",
    kind: "MODIFIER",
    effectsJson: { longGameHltbMin: 15, longGameScoreBonus: 0.1 },
  },
  {
    slug: "old_timer_lawlessness",
    name: "Стариковский беспредел",
    description: "NASSAL · global · аукцион чаще даёт длинные игры; +12% очков на HLTB 25+ ч.",
    rarity: "EPIC",
    kind: "MODIFIER",
    effectsJson: { auctionPoolLongBias: 2, longGameHltbMin: 25, longGameScoreBonus: 0.12 },
  },
  {
    slug: "shorties_epidemic",
    name: "Эпидемия коротышей",
    description: "NASSAL · global · игры до 8 ч HLTB: +10 очков и +1 лут.",
    rarity: "RARE",
    kind: "MODIFIER",
    effectsJson: { shortGameHltbMax: 8, shortGameFlatBonus: 10, shortGameLootBonus: 1 },
  },
  {
    slug: "free_spins",
    name: "Фри спины",
    description: "NASSAL · global · +2 фри-спина на Колесе приколов после игры.",
    rarity: "LEGENDARY",
    kind: "MODIFIER",
    effectsJson: { extraLootRolls: 2, pinataLootBonus: 1 },
  },

  // —— Колесо / лут ——
  {
    slug: "leprechaun_boost",
    name: "Лепреконский подгон",
    description: "NASSAL · roll_modifier · негативы колеса → +4 очка: выше шанс редкого лута.",
    rarity: "RARE",
    kind: "MODIFIER",
    effectsJson: { rareDropMult: 1.4, flatScoreBonus: 2 },
  },
  {
    slug: "leprechaun_debuff",
    name: "Лепреконский подсер",
    description: "NASSAL · roll_modifier · −5% очков, но +2 лута (риск ради экономики).",
    rarity: "UNCOMMON",
    kind: "MODIFIER",
    effectsJson: { scoreMult: 0.95, extraLootRolls: 2 },
  },
  {
    slug: "bowling_bro",
    name: "Йоу бро, летс го боулинг",
    description: "NASSAL · inventory · кооп-бонус: +5% очков и +1 лут.",
    rarity: "UNCOMMON",
    kind: "MODIFIER",
    effectsJson: { scoreMult: 1.05, extraLootRolls: 1 },
  },
  {
    slug: "movie_ticket",
    name: "Билет в кино",
    description: "NASSAL · inventory · короткий «киноаукцион»: игры до 10 ч HLTB, фикс +15 очков при победе.",
    rarity: "RARE",
    kind: "MODIFIER",
    effectsJson: { auctionPoolShortBias: 3, flatScoreBonus: 15 },
  },
];

export const NASSAL_RECIPES: CatalogRecipeSeed[] = [
  {
    slug: "anabolics_recipe",
    name: "Анаболики",
    resultSlug: "anabolics",
    ingredients: [
      { slug: "iron_shard", quantity: 3 },
      { slug: "streamer_tear", quantity: 1 },
    ],
  },
  {
    slug: "parachute_recipe",
    name: "Парашют",
    resultSlug: "parachute",
    ingredients: [
      { slug: "iron_shard", quantity: 2 },
      { slug: "gold_dust", quantity: 2 },
    ],
  },
  {
    slug: "city_map_recipe",
    name: "Карта города",
    resultSlug: "city_map",
    ingredients: [
      { slug: "iron_shard", quantity: 2 },
      { slug: "gold_dust", quantity: 1 },
    ],
  },
  {
    slug: "junk_recycle_recipe",
    name: "Переработка хлама",
    resultSlug: "bad_flat_3",
    ingredients: [{ slug: "junk_scrap", quantity: 5 }],
  },
  {
    slug: "reroll_fetishist_recipe",
    name: "Реролло-фетишист",
    resultSlug: "reroll_fetishist",
    ingredients: [
      { slug: "gold_dust", quantity: 2 },
      { slug: "emerald_splinter", quantity: 1 },
    ],
  },
  {
    slug: "free_spins_recipe",
    name: "Фри спины",
    resultSlug: "free_spins",
    ingredients: [
      { slug: "emerald_splinter", quantity: 2 },
      { slug: "streamer_tear", quantity: 3 },
      { slug: "gold_dust", quantity: 2 },
    ],
  },
];
