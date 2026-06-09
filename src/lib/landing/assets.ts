/** Minecraft item textures (mcasset.cloud — vanilla assets CDN) */
const MC_ITEM = (name: string) =>
  `https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/item/${name}.png`;

const MC_BLOCK = (name: string) =>
  `https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/block/${name}.png`;

export const MC_ASSETS = {
  items: {
    goldenApple: MC_ITEM("golden_apple"),
    enchantedGoldenApple: MC_ITEM("enchanted_golden_apple"),
    redstone: MC_ITEM("redstone"),
    comparator: MC_ITEM("comparator"),
    shulkerBox: MC_ITEM("shulker_box"),
    emerald: MC_ITEM("emerald"),
    netherStar: MC_ITEM("nether_star"),
    witherSkull: MC_ITEM("wither_skeleton_skull"),
    ironPickaxe: MC_ITEM("iron_pickaxe"),
    clock: MC_ITEM("clock"),
    totem: MC_ITEM("totem_of_undying"),
    diamond: MC_ITEM("diamond"),
    experienceBottle: MC_ITEM("experience_bottle"),
    blazeRod: MC_ITEM("blaze_rod"),
    enderPearl: MC_ITEM("ender_pearl"),
    musicDisc11: MC_ITEM("music_disc_11"),
    musicDiscPigstep: MC_ITEM("music_disc_pigstep"),
  },
  blocks: {
    grassTop: MC_BLOCK("grass_block_top"),
    dirt: MC_BLOCK("dirt"),
    stone: MC_BLOCK("stone"),
    oakPlanks: MC_BLOCK("oak_planks"),
  },
  ui: {
    slot: "/assets/mc/slot.svg",
    fallbackGame: "/assets/mc/fallback-game.svg",
  },
} as const;

export function mcAvatarUrl(nickname: string, size = 32) {
  return `https://mc-heads.net/avatar/${encodeURIComponent(nickname)}/${size}`;
}

export function mcBodyUrl(nickname: string, size = 128) {
  return `https://mc-heads.net/body/${encodeURIComponent(nickname)}/${size}`;
}

export { GAME_COVERS, GAME_COVER_FALLBACK, getGameCoverUrl as getGameCover } from "./game-covers";

export interface EffectAsset {
  id: string;
  name: string;
  image: string;
  active: boolean;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

export const EFFECT_ASSETS: EffectAsset[] = [
  {
    id: "1",
    name: "Number 9 EXTRA",
    image: MC_ASSETS.items.goldenApple,
    active: true,
    rarity: "rare",
  },
  {
    id: "2",
    name: "ASNAEB",
    image: MC_ASSETS.items.comparator,
    active: true,
    rarity: "epic",
  },
  {
    id: "3",
    name: "MIL-SPEC",
    image: MC_ASSETS.items.shulkerBox,
    active: false,
    rarity: "common",
  },
  {
    id: "4",
    name: "Emerald Rush",
    image: MC_ASSETS.items.emerald,
    active: true,
    rarity: "rare",
  },
  {
    id: "5",
    name: "Boss Fury",
    image: MC_ASSETS.items.netherStar,
    active: false,
    rarity: "legendary",
  },
  {
    id: "6",
    name: "Craft Boost",
    image: MC_ASSETS.items.ironPickaxe,
    active: true,
    rarity: "uncommon",
  },
  {
    id: "7",
    name: "Night Owl",
    image: MC_ASSETS.items.clock,
    active: false,
    rarity: "rare",
  },
];

export const STAT_ASSETS = [
  { label: "Сезон", value: "67%", image: MC_ASSETS.blocks.grassTop },
  { label: "Босс", value: "24.8%", image: MC_ASSETS.items.witherSkull },
  { label: "Онлайн", value: "2.8K", image: MC_ASSETS.items.experienceBottle },
  { label: "Крафт", value: "42K", image: MC_ASSETS.items.ironPickaxe },
] as const;
