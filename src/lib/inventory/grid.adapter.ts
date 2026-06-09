import type { MeData } from "@/lib/api/client";
import { getItemTexture } from "@/lib/inventory/item-assets";
import {
  INVENTORY_SIZE,
  emptyGrid,
  type InventoryGrid,
  type InventoryStack,
  type Rarity,
} from "@/lib/inventory/types";

function mapRarity(r: string): Rarity {
  const upper = r.toUpperCase() as Rarity;
  if (["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"].includes(upper)) return upper;
  return "COMMON";
}

export function inventoryGridFromMe(me: MeData): InventoryGrid {
  const grid = emptyGrid();
  me.inventory.forEach((item, index) => {
    if (index >= INVENTORY_SIZE) return;
    const stack: InventoryStack = {
      templateId: item.slug,
      kind:
        item.kind === "MATERIAL"
          ? "RESOURCE"
          : item.kind === "ARTIFACT"
            ? "ARTIFACT"
            : "ITEM",
      name: item.name,
      icon: item.iconUrl ?? getItemTexture(item.slug),
      rarity: mapRarity(item.rarity),
      quantity: item.quantity,
      maxStack: 64,
      power: Object.values(item.effects ?? {}).reduce((a, b) => a + b, 0) || undefined,
    };
    grid[index] = stack;
  });
  return grid;
}
