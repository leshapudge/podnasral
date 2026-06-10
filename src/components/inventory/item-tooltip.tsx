"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { McItemSlot } from "@/components/landing/os/mc-item-slot";
import type { InventoryStack } from "@/lib/inventory/types";
import { resolveItemIcon } from "@/lib/inventory/item-assets";
import { rarityConfig, kindLabels } from "@/lib/inventory/rarity";
import { cn } from "@/lib/utils";

interface ItemTooltipProps {
  stack: InventoryStack;
  x: number;
  y: number;
  visible: boolean;
}

export function ItemTooltip({ stack, x, y, visible }: ItemTooltipProps) {
  const [mounted, setMounted] = useState(false);
  const rarity = rarityConfig[stack.rarity];

  useEffect(() => setMounted(true), []);

  if (!mounted || !visible) return null;

  const offsetX = 16;
  const offsetY = 12;
  const maxX = typeof window !== "undefined" ? window.innerWidth - 280 : x;
  const maxY = typeof window !== "undefined" ? window.innerHeight - 200 : y;

  return createPortal(
    <div
      className={cn(
        "pointer-events-none fixed z-[9999] w-64 rounded-lg border-2 bg-card/95 p-3 shadow-2xl backdrop-blur-md",
        rarity.tooltipBorder,
      )}
      style={{
        left: Math.min(x + offsetX, maxX),
        top: Math.min(y + offsetY, maxY),
      }}
    >
      <div className="flex items-start gap-2">
        <McItemSlot
          slug={stack.templateId}
          src={resolveItemIcon(stack.templateId, stack.icon)}
          alt={stack.name}
          size="sm"
          enchanted={stack.rarity === "EPIC" || stack.rarity === "LEGENDARY"}
        />
        <div className="min-w-0 flex-1">
          <p className={cn("font-bold leading-tight", rarity.text)}>{stack.name}</p>
          <p className={cn("text-xs font-semibold uppercase tracking-wider", rarity.text)}>
            {rarity.label}
          </p>
        </div>
      </div>

      <div className="mt-2 space-y-1 border-t border-white/10 pt-2 text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>Тип</span>
          <span className="text-foreground">{kindLabels[stack.kind]}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Количество</span>
          <span className="text-foreground">
            {stack.quantity}
            {stack.maxStack > 1 ? ` / ${stack.maxStack}` : ""}
          </span>
        </div>
        {stack.slotType && (
          <div className="flex justify-between text-muted-foreground">
            <span>Слот</span>
            <span className="text-foreground">{stack.slotType}</span>
          </div>
        )}
        {stack.power !== undefined && (
          <div className="flex justify-between text-muted-foreground">
            <span>Сила</span>
            <span className="font-bold text-primary">+{stack.power}</span>
          </div>
        )}
      </div>

      {stack.description && (
        <p className="mt-2 border-t border-white/10 pt-2 text-xs italic text-muted-foreground leading-relaxed">
          {stack.description}
        </p>
      )}

      <p className="mt-2 text-[10px] text-muted-foreground/70">
        ПКМ — разделить стак пополам
      </p>
    </div>,
    document.body,
  );
}
