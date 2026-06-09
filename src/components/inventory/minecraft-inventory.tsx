"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioOptional } from "@/components/audio/audio-provider";
import { resolveResourceSound } from "@/lib/audio";
import { motion } from "framer-motion";
import { Package, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InventoryDndProvider } from "./dnd-provider";
import { InventorySlot } from "./inventory-slot";
import { INVENTORY_COLS, INVENTORY_ROWS, type InventoryGrid } from "@/lib/inventory/types";
import { emptyGrid } from "@/lib/inventory/types";
import { moveStack, splitStackHalf, countOccupiedSlots, totalItems } from "@/lib/inventory/stack-logic";
import { kindLabels } from "@/lib/inventory/rarity";

interface MinecraftInventoryProps {
  initialGrid?: InventoryGrid | null;
  persist?: boolean;
}

export function MinecraftInventory({ initialGrid, persist = false }: MinecraftInventoryProps) {
  const audio = useAudioOptional();
  const [grid, setGrid] = useState<InventoryGrid>(() => initialGrid ?? emptyGrid());
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialGrid) {
      setGrid(initialGrid);
    }
  }, [initialGrid]);

  useEffect(() => {
    audio?.emit("chest:open");
  }, [audio]);

  const scheduleSave = useCallback(
    (nextGrid: InventoryGrid) => {
      if (!persist) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        try {
          await fetch("/api/inventory", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ grid: nextGrid }),
          });
        } catch {
          /* offline */
        } finally {
          setSaving(false);
        }
      }, 600);
    },
    [persist],
  );

  const handleMove = useCallback(
    (from: number, to: number) => {
      setGrid((prev) => {
        const stack = prev[from];
        const next = moveStack(prev, from, to);
        if (stack && next !== prev) {
          audio?.emit("resource:collect", {
            templateId: stack.templateId,
            rarity: stack.rarity,
            type: resolveResourceSound({ templateId: stack.templateId, rarity: stack.rarity }),
          });
          if (stack.kind === "ARTIFACT") {
            audio?.emit("drop:legendary");
          }
          scheduleSave(next);
        }
        return next;
      });
    },
    [audio, scheduleSave],
  );

  const handleSplit = useCallback(
    (from: number, _to: number) => {
      setGrid((prev) => {
        const emptyIndex = prev.findIndex((slot, i) => i !== from && slot === null);
        if (emptyIndex === -1) return prev;
        const next = splitStackHalf(prev, from, emptyIndex);
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const handleReset = useCallback(async () => {
    if (persist) {
      const res = await fetch("/api/inventory", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.data?.grid) {
          setGrid(data.data.grid);
          return;
        }
      }
    }
    setGrid(initialGrid ?? emptyGrid());
  }, [persist, initialGrid]);

  const occupied = countOccupiedSlots(grid);
  const items = totalItems(grid);

  const kindCounts = grid.reduce(
    (acc, slot) => {
      if (slot) acc[slot.kind] = (acc[slot.kind] ?? 0) + slot.quantity;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <InventoryDndProvider>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-lg"
      >
        <div
          className="rounded-lg border-4 border-[#1a1208] p-3 sm:p-4"
          style={{
            background: "linear-gradient(180deg, #3d3024 0%, #2a2118 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 0 #1a1208, 0 12px 24px rgba(0,0,0,0.5)",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-hypixel-gold" />
              <span className="font-display text-sm font-bold text-[#e8d5b0] tracking-wider">
                ИНВЕНТАРЬ
              </span>
              {persist && saving && (
                <span className="text-[10px] text-[#7a6a52]">сохранение…</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 text-[10px] text-[#a89070] hover:text-[#e8d5b0] hover:bg-black/20"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Обновить
            </Button>
          </div>

          <div
            className="grid gap-1 sm:gap-1.5 p-2 rounded-md"
            style={{
              gridTemplateColumns: `repeat(${INVENTORY_COLS}, minmax(0, 1fr))`,
              background: "rgba(0,0,0,0.35)",
              boxShadow: "inset 0 2px 6px rgba(0,0,0,0.5)",
            }}
          >
            {grid.map((stack, index) => (
              <InventorySlot
                key={index}
                index={index}
                stack={stack}
                onMove={handleMove}
                onSplit={handleSplit}
              />
            ))}
          </div>

          <div className="mt-2 flex justify-center gap-1">
            {Array.from({ length: INVENTORY_ROWS }).map((_, row) => (
              <span key={row} className="text-[9px] text-[#6a5840] font-mono">
                {row + 1}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {occupied}/{INVENTORY_COLS * INVENTORY_ROWS} слотов
            </Badge>
            <Badge variant="outline" className="text-xs">
              {items} предметов
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(kindLabels) as Array<keyof typeof kindLabels>).map((kind) => (
              <Badge key={kind} variant="outline" className="text-[10px]">
                {kindLabels[kind]}: {kindCounts[kind] ?? 0}
              </Badge>
            ))}
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          {persist
            ? "Перетаскивание сохраняется в аккаунт · ПКМ — разделить стак"
            : "Войдите, чтобы сохранять инвентарь в аккаунт"}
        </p>
      </motion.div>
    </InventoryDndProvider>
  );
}
