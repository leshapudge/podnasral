#!/usr/bin/env node
/**
 * Sync vanilla MC 1.12.2 title panoramas (256×256 PNG) + dirt overlay tile.
 */
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../public/assets/mc/panorama");
const BASE =
  "https://assets.mcasset.cloud/1.12.2/assets/minecraft/textures/gui/title/background";

await mkdir(OUT, { recursive: true });

for (let i = 0; i < 6; i++) {
  const dest = path.join(OUT, `${i}.png`);
  try {
    await access(dest);
    console.log(`[panorama:sync] keep ${i}.png`);
    continue;
  } catch {
    /* download missing face */
  }

  const res = await fetch(`${BASE}/panorama_${i}.png`);
  if (!res.ok) {
    console.warn(`[panorama:sync] skip ${i}.png (${res.status})`);
    continue;
  }
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  console.log(`[panorama:sync] ${i}.png`);
}

try {
  const dirt = await fetch(
    "https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/block/dirt.png",
  );
  if (dirt.ok) {
    await writeFile(path.join(OUT, "dirt.png"), Buffer.from(await dirt.arrayBuffer()));
    console.log("[panorama:sync] dirt.png");
  }
} catch {
  /* optional */
}
