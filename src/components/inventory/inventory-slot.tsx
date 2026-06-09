"use client";

import { useRef, useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { InventoryStack, DragInventoryItem } from "@/lib/inventory/types";
import { DND_TYPE_INVENTORY } from "@/lib/inventory/types";
import { McTexture } from "@/components/landing/os/mc-texture";
import { ItemTooltip } from "./item-tooltip";
import { getItemTexture } from "@/lib/inventory/item-assets";
import { rarityConfig } from "@/lib/inventory/rarity";
import { cn } from "@/lib/utils";

interface InventorySlotProps {
  index: number;
  stack: InventoryStack | null;
  onMove: (from: number, to: number) => void;
  onSplit: (from: number, to: number) => void;
}

export function InventorySlot({ index, stack, onMove, onSplit }: InventorySlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });

  const [{ isOver, canDrop }, drop] = useDrop<
    DragInventoryItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >({
    accept: DND_TYPE_INVENTORY,
    drop: (item) => {
      if (item.slotIndex !== index) {
        onMove(item.slotIndex, index);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const [{ isDragging }, drag] = useDrag<
    DragInventoryItem,
    void,
    { isDragging: boolean }
  >({
    type: DND_TYPE_INVENTORY,
    item: () => ({ slotIndex: index, stack: stack! }),
    canDrag: () => !!stack,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  const rarity = stack ? rarityConfig[stack.rarity] : null;

  function handleMouseEnter(e: React.MouseEvent) {
    if (!stack) return;
    setTooltip({ visible: true, x: e.clientX, y: e.clientY });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!stack || !tooltip.visible) return;
    setTooltip({ visible: true, x: e.clientX, y: e.clientY });
  }

  function handleMouseLeave() {
    setTooltip((t) => ({ ...t, visible: false }));
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    if (!stack || stack.quantity <= 1) return;
    // Find first empty slot for split - parent handles via onSplit to same slot logic
    // We'll pass split to adjacent empty - for simplicity split in place to next empty
    onSplit(index, -1);
  }

  return (
    <>
      <div
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onContextMenu={handleContextMenu}
        className={cn(
          "relative aspect-square w-full cursor-default select-none",
          "rounded-sm border-2 transition-all duration-150",
          "bg-[#1a1a1a]/80",
          "border-[#2a2a2a]",
          "shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]",
          isOver && canDrop && "border-primary/80 bg-primary/10 ring-2 ring-primary/30",
          !stack && isOver && canDrop && "bg-primary/5",
        )}
      >
        {stack && (
          <div
            className={cn(
              "absolute inset-0.5 flex flex-col items-center justify-center rounded-sm transition-opacity",
              rarity?.bg,
              rarity?.border,
              "border",
              isDragging && "opacity-30",
            )}
          >
            <McTexture
              src={getItemTexture(stack.templateId)}
              alt={stack.name}
              size={28}
              className={cn("sm:h-8 sm:w-8", isDragging && "scale-90 opacity-80")}
            />
            {stack.quantity > 1 && (
              <span
                className={cn(
                  "absolute bottom-0.5 right-1 font-display text-[10px] sm:text-xs font-bold",
                  "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)]",
                )}
              >
                {stack.quantity}
              </span>
            )}
            {stack.kind === "ARTIFACT" && (
              <span className="absolute top-0.5 left-0.5 text-[8px] opacity-80">✦</span>
            )}
          </div>
        )}
      </div>

      {stack && (
        <ItemTooltip
          stack={stack}
          x={tooltip.x}
          y={tooltip.y}
          visible={tooltip.visible && !isDragging}
        />
      )}
    </>
  );
}
