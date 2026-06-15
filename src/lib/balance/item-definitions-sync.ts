import prisma from "@/lib/db/prisma";
import { getItemTexture } from "@/lib/inventory/item-assets";
import { BALANCE_ITEM_CATALOG } from "./item-catalog";

const SYNC_TTL_MS = 10 * 60 * 1000;

let lastSyncedAt = 0;
let syncInFlight: Promise<void> | null = null;

async function syncAllItemDefinitions() {
  for (const item of BALANCE_ITEM_CATALOG) {
    await prisma.itemDefinition.upsert({
      where: { slug: item.slug },
      create: {
        slug: item.slug,
        name: item.name,
        description: item.description,
        rarity: item.rarity,
        kind: item.kind,
        effectsJson: item.effectsJson,
        iconUrl: getItemTexture(item.slug),
      },
      update: {
        name: item.name,
        description: item.description,
        rarity: item.rarity,
        kind: item.kind,
        effectsJson: item.effectsJson,
        iconUrl: getItemTexture(item.slug),
      },
    });
  }
}

export async function ensureBalanceItemDefinitions() {
  const now = Date.now();
  if (now - lastSyncedAt < SYNC_TTL_MS) return;

  if (!syncInFlight) {
    syncInFlight = syncAllItemDefinitions()
      .then(() => {
        lastSyncedAt = Date.now();
      })
      .finally(() => {
        syncInFlight = null;
      });
  }

  await syncInFlight;
}
