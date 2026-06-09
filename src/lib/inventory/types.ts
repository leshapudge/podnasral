export type Rarity = "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";

export type ItemKind = "RESOURCE" | "ITEM" | "ARTIFACT";

export interface InventoryStack {
  templateId: string;
  kind: ItemKind;
  name: string;
  icon: string;
  rarity: Rarity;
  quantity: number;
  maxStack: number;
  description?: string;
  power?: number;
  slotType?: string;
}

export type InventoryGrid = (InventoryStack | null)[];

export const INVENTORY_COLS = 9;
export const INVENTORY_ROWS = 4;
export const INVENTORY_SIZE = INVENTORY_COLS * INVENTORY_ROWS;

export function emptyGrid(): InventoryGrid {
  return Array.from({ length: INVENTORY_SIZE }, () => null);
}

export const DND_TYPE_INVENTORY = "INVENTORY_ITEM";

export interface DragInventoryItem {
  slotIndex: number;
  stack: InventoryStack;
}
