import { MC_ASSETS } from "@/lib/landing/assets";

const MC_ITEM = (name: string) =>
  `https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/item/${name}.png`;

const MC_BLOCK = (name: string) =>
  `https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/block/${name}.png`;

/** Инвентарные предметы → текстуры Minecraft */
export const ITEM_TEXTURES: Record<string, string> = {
  // materials
  iron_shard: MC_ITEM("iron_nugget"),
  gold_dust: MC_ITEM("gold_nugget"),
  emerald_splinter: MC_ASSETS.items.emerald,
  streamer_tear: MC_ITEM("ghast_tear"),
  junk_scrap: MC_ITEM("rotten_flesh"),
  // NASSAL effects
  good_flat_4: MC_ITEM("emerald"),
  good_flat_8: MC_ITEM("diamond"),
  bad_flat_3: MC_ITEM("poisonous_potato"),
  bad_flat_6: MC_ITEM("spider_eye"),
  anabolics: MC_ITEM("potion"),
  one_of_oneils: MC_ITEM("netherite_sword"),
  parachute: MC_ITEM("feather"),
  wasted: MC_ITEM("fire_charge"),
  asnaeb: MC_ITEM("totem_of_undying"),
  body_armor: MC_ITEM("iron_chestplate"),
  small_theft_effect: MC_ITEM("rabbit_hide"),
  snatched: MC_ITEM("golden_sword"),
  factory_assembly: MC_ITEM("comparator"),
  speedometer: MC_ITEM("clock"),
  number_9_extra: MC_ITEM("experience_bottle"),
  reroll_fetishist: MC_ITEM("recovery_compass"),
  city_map: MC_ITEM("filled_map"),
  container_with_junk: MC_BLOCK("barrel"),
  genre_expert: MC_ITEM("writable_book"),
  genre_fever: MC_ITEM("blaze_powder"),
  old_timer_lawlessness: MC_ITEM("music_disc_13"),
  shorties_epidemic: MC_BLOCK("hay_block_side"),
  free_spins: MC_ASSETS.items.netherStar,
  leprechaun_boost: MC_ITEM("golden_carrot"),
  leprechaun_debuff: MC_ITEM("fermented_spider_eye"),
  bowling_bro: MC_ITEM("snowball"),
  movie_ticket: MC_ITEM("paper"),
  // legacy
  emerald_charm: MC_ASSETS.items.emerald,
  shield_totem: MC_ASSETS.items.totem,
  nether_star: MC_ASSETS.items.netherStar,
};

export function getItemTexture(templateId: string) {
  return ITEM_TEXTURES[templateId] ?? MC_BLOCK("stone");
}
