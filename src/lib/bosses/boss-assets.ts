import { MC_ASSETS } from "@/lib/landing/assets";

const MC_ITEM = (name: string) =>
  `https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/item/${name}.png`;

const ENDER_DRAGON_PORTRAIT = "/assets/mc/ender-dragon-3d.png?v=8";

/** Крупные портреты боссов для панели */
export const BOSS_PORTRAITS: Record<string, string> = {
  ender_dragon: ENDER_DRAGON_PORTRAIT,
  "ender-dragon": ENDER_DRAGON_PORTRAIT,
  wither: MC_ASSETS.items.witherSkull,
};

/** Мелкие иконки (слоты, карта) */
export const BOSS_TEXTURES: Record<string, string> = {
  ender_dragon: ENDER_DRAGON_PORTRAIT,
  "ender-dragon": ENDER_DRAGON_PORTRAIT,
  wither: MC_ASSETS.items.witherSkull,
  warden: MC_ITEM("echo_shard"),
};

export function normalizeBossSlug(slug: string) {
  return slug.replace(/_/g, "-");
}

export function isDragonBoss(slug: string) {
  const n = slug.toLowerCase();
  return n.includes("ender") && n.includes("dragon");
}

export function getBossPortrait(slug: string) {
  return BOSS_PORTRAITS[slug] ?? BOSS_PORTRAITS[normalizeBossSlug(slug)] ?? ENDER_DRAGON_PORTRAIT;
}

export function getBossTexture(slug: string) {
  return BOSS_TEXTURES[slug] ?? BOSS_TEXTURES[normalizeBossSlug(slug)] ?? MC_ASSETS.items.netherStar;
}
