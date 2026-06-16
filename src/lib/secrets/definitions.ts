import type { SecretAchievementDef, ArtifactDef, SecretCommandDef } from "./types";
import { EVENT_WORLD_SEED } from "@/lib/event/event-brand";

export const EXPLORER_PAGES = [
  "/?tab=overview",
  "/?tab=kazik",
  "/?tab=inventory",
  "/?tab=items",
  "/?tab=achievements",
] as const;

export const SECRET_PAGES = [
  "/?tab=achievements",
  "/streamer",
  "/settings",
  "/auk",
] as const;

export const SECRET_ROUTE_LABELS: Record<string, string> = {
  "/?tab=overview": "вкладка «Стримеры»",
  "/?tab=kazik": "вкладка «Казик»",
  "/?tab=inventory": "вкладка «Инвентарь»",
  "/?tab=items": "вкладка «Предметы»",
  "/?tab=achievements": "вкладка «Достижения»",
  "/login": "страница входа",
  "/streamer": "панель стримера",
  "/settings": "страница настроек",
  "/auk": "страница донатов аукциона",
  "/admin": "админ-панель",
};

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
    description: "Открыл все основные вкладки OS",
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
    slug: "chunk-explorer",
    name: "Chunk Explorer",
    description: "Запустил секретную команду /chunk",
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

export const ARTIFACTS: ArtifactDef[] = [];

export const SECRET_COMMANDS: SecretCommandDef[] = [
  { command: "/help", description: "Список секретных команд" },
  { command: "/seed", description: "Показать сид мира" },
  { command: "/notch", description: "Сообщение от Notch" },
  { command: "/chunk", description: "Подсказка к достижениям" },
  { command: "/debug", description: "Статистика секретов", hidden: true },
];

export const WORLD_SEED = EVENT_WORLD_SEED;

export function getAchievementDef(slug: string) {
  return SECRET_ACHIEVEMENTS.find((a) => a.slug === slug);
}

export function getArtifactDef(slug: string) {
  return ARTIFACTS.find((a) => a.slug === slug);
}

export function getSecretRouteLabel(route: string) {
  return SECRET_ROUTE_LABELS[route] ?? route;
}
