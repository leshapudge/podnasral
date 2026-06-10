"use client";

import { McItemSlot } from "@/components/landing/os/mc-item-slot";
import { getItemTexture } from "@/lib/inventory/item-assets";
import { rarityConfig } from "@/lib/inventory/rarity";
import type { Rarity } from "@/lib/inventory/types";
import { cn } from "@/lib/utils";

interface CraftingSlotProps {
  slug?: string | null;
  name?: string;
  quantity?: number;
  rarity?: string;
  size?: "sm" | "md" | "lg";
  dimmed?: boolean;
  highlight?: boolean;
  className?: string;
}

export function CraftingSlot({
  slug,
  name,
  quantity,
  rarity = "COMMON",
  size = "md",
  dimmed = false,
  highlight = false,
  className,
}: CraftingSlotProps) {
  const r = rarity.toUpperCase() as Rarity;
  const rarityStyle = rarityConfig[r] ?? rarityConfig.COMMON;

  return (
    <div
      className={cn(
        "relative flex aspect-square w-full items-center justify-center rounded-sm border-2",
        "border-[#2a2a2a] bg-[#1a1a1a]/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.65)]",
        highlight && "border-primary/70 ring-1 ring-primary/40",
        dimmed && "opacity-40",
        className,
      )}
    >
      {slug ? (
        <>
          <div
            className={cn(
              "absolute inset-0.5 rounded-sm border",
              rarityStyle.bg,
              rarityStyle.border,
            )}
          />
          <McItemSlot
            slug={slug}
            src={getItemTexture(slug)}
            alt={name ?? slug}
            size={size}
            active={!dimmed}
            enchanted={r === "LEGENDARY" || r === "EPIC"}
            className="relative z-[1] border-0 bg-transparent shadow-none"
          />
          {quantity != null && quantity > 1 && (
            <span className="absolute bottom-0.5 right-1 z-[2] font-display text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
              {quantity}
            </span>
          )}
        </>
      ) : null}
    </div>
  );
}
