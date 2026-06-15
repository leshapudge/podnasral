#!/usr/bin/env node
/**
 * Скачивает текстуры предметов сезона в public/assets/mc/items/{slug}.png
 * Запуск: npm run icons:sync
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "public/assets/mc/items");

const MC_ITEM = (name) =>
  `https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/item/${name}.png`;
const MC_BLOCK = (name) =>
  `https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/block/${name}.png`;

/** slug → URL источника (должен совпадать с item-assets.ts REMOTE_TEXTURES) */
const REMOTE_TEXTURES = {
  iron_shard: MC_ITEM("raw_iron"),
  gold_dust: MC_ITEM("gold_nugget"),
  emerald_splinter: MC_ITEM("emerald"),
  streamer_tear: MC_ITEM("ghast_tear"),
  junk_scrap: MC_ITEM("iron_ingot"),
  good_flat_4: MC_ITEM("apple"),
  good_flat_8: MC_ITEM("golden_apple"),
  bad_flat_3: MC_ITEM("rotten_flesh"),
  bad_flat_6: MC_ITEM("poisonous_potato"),
  anabolics: MC_ITEM("potion"),
  one_of_oneils: MC_ITEM("netherite_sword"),
  parachute: MC_ITEM("feather"),
  wasted: MC_ITEM("firework_rocket"),
  asnaeb: MC_ITEM("totem_of_undying"),
  body_armor: MC_ITEM("netherite_chestplate"),
  small_theft_effect: MC_ITEM("bone"),
  snatched: MC_ITEM("golden_pickaxe"),
  factory_assembly: MC_BLOCK("crafting_table_front"),
  speedometer: MC_ITEM("clock_00"),
  number_9_extra: MC_ITEM("experience_bottle"),
  reroll_fetishist: MC_ITEM("recovery_compass_00"),
  city_map: MC_ITEM("compass_00"),
  container_with_junk: MC_ITEM("chest_minecart"),
  genre_expert: MC_ITEM("enchanted_book"),
  genre_fever: MC_ITEM("blaze_rod"),
  old_timer_lawlessness: MC_ITEM("music_disc_13"),
  shorties_epidemic: MC_BLOCK("hay_block_side"),
  free_spins: MC_ITEM("echo_shard"),
  leprechaun_boost: MC_ITEM("golden_carrot"),
  leprechaun_debuff: MC_ITEM("fermented_spider_eye"),
  bowling_bro: MC_ITEM("snowball"),
  movie_ticket: MC_ITEM("name_tag"),
  emerald_charm: MC_ITEM("emerald"),
  shield_totem: MC_ITEM("totem_of_undying"),
  nether_star: MC_ITEM("nether_star"),
  _unknown: MC_ITEM("chest_minecart"),
  // символы аркадного слота
  slot_rotten_flesh: MC_ITEM("rotten_flesh"),
  slot_coal: MC_ITEM("coal"),
  slot_iron: MC_ITEM("iron_ingot"),
  slot_gold: MC_ITEM("gold_ingot"),
  slot_emerald: MC_ITEM("emerald"),
  slot_diamond: MC_ITEM("diamond"),
  slot_nether_star: MC_ITEM("nether_star"),
};

async function download(slug, url) {
  const outFile = path.join(OUT, `${slug}.png`);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${slug}: HTTP ${res.status} ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outFile, buf);
    return true;
  } catch (error) {
    if (fs.existsSync(outFile)) {
      console.warn(`[icons:sync] keep ${slug}.png (${error instanceof Error ? error.message : "download failed"})`);
      return false;
    }
    throw error;
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  let updated = 0;
  let kept = 0;
  for (const [slug, url] of Object.entries(REMOTE_TEXTURES)) {
    const changed = await download(slug, url);
    if (changed) {
      updated++;
      console.log("✓", slug);
    } else {
      kept++;
    }
  }
  console.log(`Synced icons → updated: ${updated}, kept: ${kept}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
