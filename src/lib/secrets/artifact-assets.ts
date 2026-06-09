import { MC_ASSETS } from "@/lib/landing/assets";

/** Секретные артефакты → текстуры предметов Minecraft */
export const ARTIFACT_TEXTURES: Record<string, string> = {
  "dragon-egg": "https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/block/dragon_egg.png",
  "totem-of-undying": MC_ASSETS.items.totem,
  "nether-star": MC_ASSETS.items.netherStar,
  elytra: "https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/item/elytra.png",
  "music-disc-11": MC_ASSETS.items.musicDisc11,
  "music-disc-pigstep": MC_ASSETS.items.musicDiscPigstep,
  "notch-apple": MC_ASSETS.items.enchantedGoldenApple,
  "end-crystal": "https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/item/end_crystal.png",
};

export function getArtifactTexture(slug: string) {
  return ARTIFACT_TEXTURES[slug] ?? MC_ASSETS.items.enderPearl;
}
