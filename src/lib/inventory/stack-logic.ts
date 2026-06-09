import type { InventoryGrid, InventoryStack } from "./types";
import { INVENTORY_SIZE } from "./types";

export function canStack(a: InventoryStack, b: InventoryStack): boolean {
  return (
    a.templateId === b.templateId &&
    a.kind === b.kind &&
    a.maxStack > 1
  );
}

export function mergeStacks(
  source: InventoryStack,
  target: InventoryStack,
): { merged: InventoryStack; remainder: InventoryStack | null } {
  const total = source.quantity + target.quantity;
  const mergedQty = Math.min(total, target.maxStack);
  const remainderQty = total - mergedQty;

  const merged: InventoryStack = { ...target, quantity: mergedQty };
  const remainder =
    remainderQty > 0 ? { ...source, quantity: remainderQty } : null;

  return { merged, remainder };
}

export function moveStack(
  grid: InventoryGrid,
  fromIndex: number,
  toIndex: number,
): InventoryGrid {
  if (fromIndex === toIndex) return grid;
  if (fromIndex < 0 || fromIndex >= INVENTORY_SIZE) return grid;
  if (toIndex < 0 || toIndex >= INVENTORY_SIZE) return grid;

  const next = [...grid];
  const source = next[fromIndex];
  if (!source) return grid;

  const target = next[toIndex];

  if (!target) {
    next[toIndex] = source;
    next[fromIndex] = null;
    return next;
  }

  if (canStack(source, target)) {
    const { merged, remainder } = mergeStacks(source, target);
    next[toIndex] = merged;
    next[fromIndex] = remainder;
    return next;
  }

  next[fromIndex] = target;
  next[toIndex] = source;
  return next;
}

export function splitStackHalf(
  grid: InventoryGrid,
  fromIndex: number,
  toIndex: number,
): InventoryGrid {
  if (fromIndex === toIndex) return grid;

  const next = [...grid];
  const source = next[fromIndex];
  if (!source || source.quantity <= 1) return grid;

  const target = next[toIndex];
  const half = Math.floor(source.quantity / 2);
  const splitStack: InventoryStack = { ...source, quantity: half };

  if (!target) {
    next[fromIndex] = { ...source, quantity: source.quantity - half };
    next[toIndex] = splitStack;
    return next;
  }

  if (canStack(splitStack, target)) {
    const { merged, remainder } = mergeStacks(splitStack, target);
    next[toIndex] = merged;
    if (remainder) {
      next[fromIndex] = { ...source, quantity: source.quantity - half + remainder.quantity };
    } else {
      next[fromIndex] = { ...source, quantity: source.quantity - half };
    }
    if (next[fromIndex]?.quantity === 0) next[fromIndex] = null;
    return next;
  }

  return grid;
}

export function countOccupiedSlots(grid: InventoryGrid): number {
  return grid.filter(Boolean).length;
}

export function totalItems(grid: InventoryGrid): number {
  return grid.reduce((sum, slot) => sum + (slot?.quantity ?? 0), 0);
}
