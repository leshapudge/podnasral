"use client";

import { MinecraftInventory } from "@/components/inventory/minecraft-inventory";

export function InventoryTab() {
  return (
    <div className="py-2">
      <MinecraftInventory />
    </div>
  );
}
