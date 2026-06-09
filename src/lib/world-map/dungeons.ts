import type { BiomeId, MapMarker } from "./types";

const DUNGEON_DEFS: {
  id: string;
  biomeId: BiomeId;
  label: string;
  icon: string;
  difficulty: string;
  offset: { x: number; y: number };
}[] = [
  {
    id: "dungeon-forest-mansion",
    biomeId: "forest",
    label: "Лесной особняк",
    icon: "🏚️",
    difficulty: "Средний",
    offset: { x: 180, y: 120 },
  },
  {
    id: "dungeon-snow-temple",
    biomeId: "snow",
    label: "Ледяной храм",
    icon: "🧊",
    difficulty: "Сложный",
    offset: { x: 160, y: 130 },
  },
  {
    id: "dungeon-desert-pyramid",
    biomeId: "desert",
    label: "Пирамидальный данж",
    icon: "🔺",
    difficulty: "Средний",
    offset: { x: 200, y: 100 },
  },
  {
    id: "dungeon-jungle-temple",
    biomeId: "jungle",
    label: "Храм джунглей",
    icon: "🗿",
    difficulty: "Сложный",
    offset: { x: 150, y: 140 },
  },
  {
    id: "dungeon-nether-bastion",
    biomeId: "nether",
    label: "Бастион",
    icon: "🏰",
    difficulty: "Экстремальный",
    offset: { x: 170, y: 110 },
  },
  {
    id: "dungeon-end-city",
    biomeId: "end",
    label: "Город Края",
    icon: "🏙️",
    difficulty: "Легендарный",
    offset: { x: 140, y: 120 },
  },
];

export function getDungeonMarkers(): MapMarker[] {
  return DUNGEON_DEFS.map((d) => ({
    id: d.id,
    kind: "dungeon",
    biomeId: d.biomeId,
    label: d.label,
    subtitle: d.difficulty,
    icon: d.icon,
    position: d.offset,
    meta: { difficulty: d.difficulty },
  }));
}
