import { MC_ASSETS } from "@/lib/landing/assets";

const MC_ITEM = (name: string) =>
  `https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/item/${name}.png`;

const MC_BLOCK = (name: string) =>
  `https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/block/${name}.png`;

/** Секретные достижения → текстуры предметов Minecraft */
export const ACHIEVEMENT_TEXTURES: Record<string, string> = {
  "creeper-fan": MC_ITEM("gunpowder"),
  "night-owl": MC_ASSETS.items.clock,
  explorer: MC_ITEM("recovery_compass"),
  afk: MC_ITEM("red_bed"),
  "herobrine-witness": MC_ASSETS.items.witherSkull,
  "chunk-explorer": MC_ITEM("filled_map"),
  "corner-hit": MC_BLOCK("dirt"),
};

export function getAchievementTexture(slug: string) {
  return ACHIEVEMENT_TEXTURES[slug] ?? MC_ASSETS.items.experienceBottle;
}
