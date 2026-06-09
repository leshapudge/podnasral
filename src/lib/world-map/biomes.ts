import type { BiomeDefinition, BiomePath } from "./types";

export const WORLD_BIOMES: BiomeDefinition[] = [
  {
    id: "forest",
    name: "Forest",
    label: "Лес",
    description: "Зелёные равнины и тёмные рощи. Стартовая зона сезона.",
    icon: "🌲",
    color: "#1a3d2e",
    borderColor: "#55c57a",
    position: { x: 40, y: 80 },
    size: { width: 300, height: 220 },
  },
  {
    id: "snow",
    name: "Snow",
    label: "Снег",
    description: "Замёрзшие вершины и ледяные пещеры.",
    icon: "❄️",
    color: "#1e2d42",
    borderColor: "#a8d8ff",
    position: { x: 400, y: 40 },
    size: { width: 300, height: 220 },
  },
  {
    id: "desert",
    name: "Desert",
    label: "Пустыня",
    description: "Раскалённые дюны и древние храмы.",
    icon: "🏜️",
    color: "#3d3018",
    borderColor: "#e8b84a",
    position: { x: 40, y: 360 },
    size: { width: 300, height: 220 },
  },
  {
    id: "jungle",
    name: "Jungle",
    label: "Джунгли",
    description: "Густые заросли и затерянные руины.",
    icon: "🌴",
    color: "#1a3328",
    borderColor: "#2d8f5a",
    position: { x: 400, y: 320 },
    size: { width: 300, height: 220 },
  },
  {
    id: "nether",
    name: "Nether",
    label: "Незер",
    description: "Адское измерение. Опасно, но щедро на ресурсы.",
    icon: "🔥",
    color: "#3d1515",
    borderColor: "#ff5555",
    position: { x: 160, y: 640 },
    size: { width: 300, height: 220 },
  },
  {
    id: "end",
    name: "End",
    label: "Край",
    description: "Пустота между мирами. Финальные боссы сезона.",
    icon: "🌌",
    color: "#1a1a2e",
    borderColor: "#c77dff",
    position: { x: 520, y: 640 },
    size: { width: 300, height: 220 },
  },
];

export const BIOME_PATHS: BiomePath[] = [
  { id: "forest-snow", from: "forest", to: "snow" },
  { id: "forest-desert", from: "forest", to: "desert" },
  { id: "snow-jungle", from: "snow", to: "jungle" },
  { id: "desert-jungle", from: "desert", to: "jungle" },
  { id: "desert-nether", from: "desert", to: "nether" },
  { id: "jungle-nether", from: "jungle", to: "nether" },
  { id: "nether-end", from: "nether", to: "end" },
];

export function getBiome(id: string) {
  return WORLD_BIOMES.find((b) => b.id === id);
}
