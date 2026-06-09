import type { SecretAchievementDef, ArtifactDef, SecretCommandDef } from "./types";

export const EXPLORER_PAGES = [
  "/",
  "/login",
  "/dashboard",
  "/profile",
  "/world",
  "/bosses",
  "/completions",
  "/collection",
] as const;

export const SECRET_PAGES = [
  "/stronghold",
  "/ancient-city",
  "/lost-chunk",
  "/herobrine",
] as const;

export const SECRET_ACHIEVEMENTS: SecretAchievementDef[] = [
  {
    slug: "creeper-fan",
    name: "Creeper Fan",
    description: "Кликнул по логотипу 10 раз",
    icon: "💥",
    rarity: "UNCOMMON",
    points: 25,
    hidden: true,
  },
  {
    slug: "night-owl",
    name: "Night Owl",
    description: "Посетил сайт между 03:00 и 04:00",
    icon: "🦉",
    rarity: "RARE",
    points: 50,
    hidden: true,
  },
  {
    slug: "explorer",
    name: "Explorer",
    description: "Посетил все основные страницы",
    icon: "🧭",
    rarity: "EPIC",
    points: 75,
    hidden: true,
  },
  {
    slug: "afk",
    name: "AFK",
    description: "Провёл на сайте 1 час без перерыва",
    icon: "😴",
    rarity: "RARE",
    points: 40,
    hidden: true,
  },
  {
    slug: "herobrine-witness",
    name: "Herobrine Witness",
    description: "Увидел Херобрина",
    icon: "👁️",
    rarity: "LEGENDARY",
    points: 100,
    hidden: true,
  },
  {
    slug: "chunk-explorer",
    name: "Chunk Explorer",
    description: "Нашёл секретную страницу Lost Chunk",
    icon: "🗺️",
    rarity: "EPIC",
    points: 80,
    hidden: true,
  },
  {
    slug: "corner-hit",
    name: "Corner Hit",
    description: "Блок земли коснулся угла экрана",
    icon: "📐",
    rarity: "UNCOMMON",
    points: 30,
    hidden: true,
  },
];

export const ARTIFACTS: ArtifactDef[] = [
  {
    slug: "dragon-egg",
    name: "Dragon Egg",
    icon: "🥚",
    rarity: "LEGENDARY",
    description: "Яйцо дракона Края. Пульсирует тёмной энергией.",
    pages: ["/", "/stronghold"],
  },
  {
    slug: "totem-of-undying",
    name: "Totem of Undying",
    icon: "🪶",
    rarity: "EPIC",
    description: "Даёт второй шанс... или просто красиво светится.",
    pages: ["/profile", "/ancient-city"],
  },
  {
    slug: "nether-star",
    name: "Nether Star",
    icon: "⭐",
    rarity: "LEGENDARY",
    description: "Осколок побеждённого Иссушителя.",
    pages: ["/bosses", "/herobrine"],
  },
  {
    slug: "elytra",
    name: "Elytra",
    icon: "🪽",
    rarity: "EPIC",
    description: "Крылья для полёта над миром MINESEASON.",
    pages: ["/world", "/lost-chunk"],
  },
  {
    slug: "music-disc-11",
    name: "Music Disc 11",
    icon: "💿",
    rarity: "RARE",
    description: "Жуткая пластинка из заброшенной шахты.",
    pages: ["/", "/login"],
  },
  {
    slug: "music-disc-pigstep",
    name: "Music Disc Pigstep",
    icon: "🎵",
    rarity: "RARE",
    description: "Бастионный бит из Незера.",
    pages: ["/completions", "/dashboard"],
  },
  {
    slug: "notch-apple",
    name: "Notch Apple",
    icon: "🍎",
    rarity: "LEGENDARY",
    description: "Зачарованное золотое яблоко Notch.",
    pages: ["/inventory", "/stronghold"],
  },
  {
    slug: "end-crystal",
    name: "End Crystal",
    icon: "🔮",
    rarity: "EPIC",
    description: "Кристалл, питающий дракона Края.",
    pages: ["/herobrine", "/ancient-city"],
  },
];

export const SECRET_COMMANDS: SecretCommandDef[] = [
  { command: "/help", description: "Список секретных команд" },
  { command: "/seed", description: "Показать сид мира" },
  { command: "/herobrine", description: "Вызвать Херобрина" },
  { command: "/notch", description: "Сообщение от Notch" },
  { command: "/chunk", description: "Подсказка к Lost Chunk" },
  { command: "/debug", description: "Статистика секретов", hidden: true },
];

export const WORLD_SEED = "MINESEASON-2026-8406129";

export function getAchievementDef(slug: string) {
  return SECRET_ACHIEVEMENTS.find((a) => a.slug === slug);
}

export function getArtifactDef(slug: string) {
  return ARTIFACTS.find((a) => a.slug === slug);
}
