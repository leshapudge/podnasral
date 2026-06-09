import type { BiomeId, MapMarker } from "./types";

const EVENT_DEFS: {
  id: string;
  biomeId: BiomeId;
  label: string;
  icon: string;
  description: string;
  offset: { x: number; y: number };
  active: boolean;
}[] = [
  {
    id: "event-forest-gather",
    biomeId: "forest",
    label: "Сбор ресурсов ×2",
    icon: "✨",
    description: "Удвоенный дроп дерева и камня",
    offset: { x: 60, y: 60 },
    active: true,
  },
  {
    id: "event-snow-race",
    biomeId: "snow",
    label: "Ледяной спринт",
    icon: "⛷️",
    description: "Гонка на скорость прохождения",
    offset: { x: 70, y: 70 },
    active: false,
  },
  {
    id: "event-desert-treasure",
    biomeId: "desert",
    label: "Охота за сокровищами",
    icon: "💰",
    description: "Скрытые сундуки в пустыне",
    offset: { x: 80, y: 55 },
    active: true,
  },
  {
    id: "event-jungle-raid",
    biomeId: "jungle",
    label: "Рейд гильдий",
    icon: "⚔️",
    description: "Совместный рейд на храм",
    offset: { x: 55, y: 65 },
    active: true,
  },
  {
    id: "event-nether-invasion",
    biomeId: "nether",
    label: "Вторжение в Незер",
    icon: "🔥",
    description: "Волны мобов и бонусный XP",
    offset: { x: 90, y: 50 },
    active: true,
  },
  {
    id: "event-end-convergence",
    biomeId: "end",
    label: "Схождение Края",
    icon: "🌠",
    description: "Финальный ивент сезона",
    offset: { x: 65, y: 55 },
    active: false,
  },
];

export function getEventMarkers(): MapMarker[] {
  return EVENT_DEFS.map((e) => ({
    id: e.id,
    kind: "event",
    biomeId: e.biomeId,
    label: e.label,
    subtitle: e.description,
    icon: e.icon,
    position: e.offset,
    status: e.active ? "ACTIVE" : "UPCOMING",
    meta: { active: e.active ? 1 : 0 },
  }));
}
