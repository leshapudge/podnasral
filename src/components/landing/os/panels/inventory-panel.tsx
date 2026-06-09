"use client";

import Link from "next/link";
import { OsPanelFrame } from "../os-panel-frame";
import { OsSectionTitle } from "../os-section-title";
import { MinecraftInventory } from "@/components/inventory/minecraft-inventory";
import { emptyGrid } from "@/lib/inventory/types";
import type { InventoryGrid } from "@/lib/inventory/types";

interface InventoryPanelProps {
  isAuthenticated: boolean;
  initialGrid: InventoryGrid | null;
}

export function InventoryPanel({ isAuthenticated, initialGrid }: InventoryPanelProps) {
  return (
    <OsPanelFrame>
      <OsSectionTitle>Инвентарь</OsSectionTitle>
      {!isAuthenticated && (
        <p className="mb-4 text-center text-xs text-[#7a6a52]">
          <Link href="/login" className="text-primary hover:underline">
            Войдите
          </Link>
          , чтобы открыть свой инвентарь сезона
        </p>
      )}
      <MinecraftInventory
        initialGrid={isAuthenticated ? (initialGrid ?? emptyGrid()) : emptyGrid()}
        persist={false}
      />
    </OsPanelFrame>
  );
}
