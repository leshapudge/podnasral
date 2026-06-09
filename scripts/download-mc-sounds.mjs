#!/usr/bin/env node
/**
 * Скачивает ванильные звуки Minecraft (1.21.4) в public/audio/.
 * Источник: assets.mcasset.cloud
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const OUT = join(ROOT, "public", "audio");
const BASE = "https://assets.mcasset.cloud/1.21.4/assets/minecraft/sounds";

/** localPath → minecraft/sounds/... */
const MAP = {
  "ui/click.ogg": "random/click.ogg",
  "ui/hover.ogg": "random/wood_click.ogg",
  "ui/page-open.ogg": "ui/toast/in.ogg",
  "ui/craft.ogg": "random/anvil_land.ogg",
  "ui/chest-open.ogg": "block/chest/open.ogg",
  "ui/level-up.ogg": "random/levelup.ogg",
  "ui/legendary.ogg": "block/enchantment_table/enchant1.ogg",
  "resources/wood.ogg": "dig/wood1.ogg",
  "resources/stone.ogg": "dig/stone1.ogg",
  "resources/iron.ogg": "item/armor/equip_iron1.ogg",
  "resources/gold.ogg": "random/orb.ogg",
  "resources/diamond.ogg": "item/armor/equip_diamond1.ogg",
  "resources/emerald.ogg": "block/amethyst_cluster/break1.ogg",
  "achievements/unlock.ogg": "ui/toast/challenge_complete.ogg",
  "achievements/secret.ogg": "block/respawn_anchor/charge1.ogg",
  "artifacts/epic.ogg": "random/levelup.ogg",
  "bosses/victory.ogg": "ui/toast/challenge_complete.ogg",
  "bosses/attack.ogg": "random/break.ogg",
  "eastereggs/explosion.ogg": "random/explode1.ogg",
  "eastereggs/creeper-hiss.ogg": "mob/creeper/say1.ogg",
  "eastereggs/herobrine.ogg": "ambient/cave/cave1.ogg",
  "eastereggs/enderman.ogg": "ambient/underwater/enter1.ogg",
  "eastereggs/secret-page.ogg": "block/enchantment_table/enchant1.ogg",
  "ambient/wind.ogg": "ambient/weather/rain1.ogg",
  "ambient/cave.ogg": "ambient/cave/cave1.ogg",
  "ambient/footsteps.ogg": "dig/gravel1.ogg",
  "ambient/torch.ogg": "random/wood_click.ogg",
  "ambient/water.ogg": "ambient/weather/rain1.ogg",
  "ambient/wood-creak.ogg": "random/wood_click.ogg",
  "ambient/night-cave.ogg": "ambient/cave/cave1.ogg",
  "ambient/night-footsteps.ogg": "dig/gravel1.ogg",
  "ambient/night-enderman.ogg": "ambient/underwater/enter1.ogg",
  "ambient/season-forest.ogg": "dig/grass1.ogg",
  "ambient/season-desert.ogg": "dig/sand1.ogg",
  "ambient/season-snow.ogg": "dig/gravel1.ogg",
  "ambient/season-nether.ogg": "ambient/nether/nether_wastes/mood1.ogg",
  "ambient/season-end.ogg": "block/respawn_anchor/charge1.ogg",
};

async function download(localRel, mcPath) {
  const url = `${BASE}/${mcPath}`;
  const dest = join(OUT, localRel);
  await mkdir(dirname(dest), { recursive: true });

  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`SKIP ${localRel} (${res.status}) ${url}`);
    return false;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  console.log(`OK   ${localRel}`);
  return true;
}

let ok = 0;
let fail = 0;
for (const [local, mc] of Object.entries(MAP)) {
  if (await download(local, mc)) ok++;
  else fail++;
}
console.log(`\nDone: ${ok} ok, ${fail} failed → ${OUT}`);
