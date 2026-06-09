"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Hammer, Sparkles } from "lucide-react";
import { CraftingSlot } from "./crafting-slot";
import { buildRecipeGrid } from "@/lib/craft/recipe-layouts";
import { getItemTexture } from "@/lib/inventory/item-assets";
import { getItemFlavorText } from "@/lib/inventory/item-effects";
import type { CraftRecipeData } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface InventoryCounts {
  [slug: string]: number;
}

interface MinecraftCraftingTableProps {
  recipes: CraftRecipeData[];
  inventory: InventoryCounts;
  disabled?: boolean;
  loading?: boolean;
  onCraft: (recipeId: string) => Promise<void>;
}

function countOwned(inventory: InventoryCounts, slug: string) {
  return inventory[slug] ?? 0;
}

function canCraftRecipe(recipe: CraftRecipeData, inventory: InventoryCounts) {
  return recipe.ingredients.every(
    (ing) => countOwned(inventory, ing.itemDefinition.slug) >= ing.quantity,
  );
}

export function MinecraftCraftingTable({
  recipes,
  inventory,
  disabled = false,
  loading = false,
  onCraft,
}: MinecraftCraftingTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(recipes[0]?.id ?? null);
  const [craftFlash, setCraftFlash] = useState(false);

  useEffect(() => {
    if (!selectedId && recipes[0]) setSelectedId(recipes[0].id);
    if (selectedId && !recipes.find((r) => r.id === selectedId)) {
      setSelectedId(recipes[0]?.id ?? null);
    }
  }, [recipes, selectedId]);

  const selected = useMemo(
    () => recipes.find((r) => r.id === selectedId) ?? null,
    [recipes, selectedId],
  );

  const grid = useMemo(() => {
    if (!selected) return Array(9).fill(null) as (string | null)[];
    return buildRecipeGrid(
      selected.slug,
      selected.ingredients.map((i) => ({
        slug: i.itemDefinition.slug,
        quantity: i.quantity,
      })),
    );
  }, [selected]);

  const craftable = selected ? canCraftRecipe(selected, inventory) : false;

  const handleCraft = useCallback(async () => {
    if (!selected || !craftable || disabled || loading) return;
    await onCraft(selected.id);
    setCraftFlash(true);
    setTimeout(() => setCraftFlash(false), 600);
  }, [selected, craftable, disabled, loading, onCraft]);

  if (recipes.length === 0) {
    return (
      <div className="rounded border border-[#2a2118] bg-[#1a1208]/60 p-8 text-center text-sm text-[#7a6a52]">
        Рецепты крафта пока не настроены.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="overflow-hidden rounded-lg border-4 border-[#1a1208] p-3 sm:p-5"
        style={{
          background: "linear-gradient(180deg, #4a3828 0%, #2a2118 55%, #1a1208 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.1), 0 8px 0 #0d0a08, 0 14px 28px rgba(0,0,0,0.55)",
        }}
      >
        <div className="mb-4 flex items-center gap-3">
          <Image
            src="https://assets.mcasset.cloud/1.21.4/assets/minecraft/textures/block/crafting_table_front.png"
            alt=""
            width={32}
            height={32}
            className="mc-pixel-image shrink-0"
            unoptimized
          />
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-widest text-[#e8d5b0]">
              Верстак
            </h3>
            <p className="text-[10px] text-[#7a6a52]">
              Собирайте модификаторы из ресурсов после прохождения игр
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <div
              className="grid grid-cols-3 gap-1.5 rounded-md p-2"
              style={{
                background: "rgba(0,0,0,0.45)",
                boxShadow: "inset 0 2px 8px rgba(0,0,0,0.55)",
              }}
            >
              {grid.map((slug, i) => (
                <CraftingSlot
                  key={i}
                  slug={slug}
                  name={slug ?? undefined}
                  dimmed={Boolean(slug && !craftable)}
                />
              ))}
            </div>

            <div className="flex flex-col items-center gap-3">
              <span className="font-display text-2xl text-[#7a6a52]">→</span>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selected?.id}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: craftFlash ? 1.12 : 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className={cn(
                    "relative w-[72px]",
                    craftable && !disabled && "cursor-pointer",
                  )}
                  onClick={() => void handleCraft()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") void handleCraft();
                  }}
                >
                  <CraftingSlot
                    slug={selected?.resultItem.slug}
                    name={selected?.resultItem.name}
                    quantity={selected?.resultQty}
                    rarity={selected?.resultItem.rarity}
                    size="lg"
                    highlight={craftable}
                    dimmed={!craftable}
                  />
                  {craftFlash && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="pointer-events-none absolute -right-1 -top-1 text-primary"
                    >
                      <Sparkles className="h-5 w-5" />
                    </motion.span>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-display text-[10px] uppercase tracking-widest text-[#a89070]">
              Книга рецептов
            </p>
            <div className="os-scrollbar max-h-[220px] space-y-1.5 overflow-y-auto pr-1">
              {recipes.map((recipe) => {
                const ok = canCraftRecipe(recipe, inventory);
                const active = recipe.id === selectedId;
                return (
                  <button
                    key={recipe.id}
                    type="button"
                    onClick={() => setSelectedId(recipe.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded border px-2 py-2 text-left transition-colors",
                      active
                        ? "border-primary/50 bg-primary/10"
                        : "border-[#2a2118] bg-[#14100c]/80 hover:border-[#4a3828]",
                      ok && !active && "border-[#3d5a32]/60",
                    )}
                  >
                    <CraftingSlot
                      slug={recipe.resultItem.slug}
                      name={recipe.resultItem.name}
                      rarity={recipe.resultItem.rarity}
                      size="sm"
                      className="!w-10 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-semibold text-[#e8d5b0]">
                        {recipe.name}
                      </span>
                      <span
                        className={cn(
                          "block text-[9px]",
                          ok ? "text-primary" : "text-[#7a6a52]",
                        )}
                      >
                        {ok ? "Можно скрафтить" : "Не хватает ресурсов"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {selected && (
          <div className="mt-4 rounded border border-[#2a2118] bg-[#14100c]/70 p-3">
            <p className="mb-2 font-display text-[10px] uppercase tracking-widest text-[#a89070]">
              {selected.name}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              {selected.ingredients.map((ing) => {
                const owned = countOwned(inventory, ing.itemDefinition.slug);
                const enough = owned >= ing.quantity;
                return (
                  <span
                    key={ing.itemDefinition.slug}
                    className={cn(
                      "inline-flex items-center gap-1 rounded border px-2 py-1",
                      enough
                        ? "border-primary/30 bg-primary/5 text-[#c8e6c0]"
                        : "border-mc-redstone/30 bg-mc-redstone/5 text-mc-redstone",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getItemTexture(ing.itemDefinition.slug)}
                      alt=""
                      width={16}
                      height={16}
                      className="mc-pixel-image"
                    />
                    {owned}/{ing.quantity}
                  </span>
                );
              })}
              <span className="text-[#7a6a52]">→</span>
              <span className="text-hypixel-gold">{selected.resultItem.name}</span>
            </div>
            {getItemFlavorText(selected.resultItem.slug) && (
              <p className="mt-2 text-[10px] text-[#7a6a52]">
                {getItemFlavorText(selected.resultItem.slug)}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-center">
          <button
            type="button"
            className="mc-os-btn inline-flex items-center gap-2 px-6 py-2.5 text-xs disabled:opacity-45"
            disabled={!craftable || disabled || loading || !selected}
            onClick={() => void handleCraft()}
          >
            <Hammer className="h-3.5 w-3.5" />
            {loading ? "Крафт…" : "Скрафтить"}
          </button>
        </div>
      </div>

      <p className="text-center text-[10px] text-[#6a5840]">
        Крафт доступен между играми · ресурсы выпадают после прохождения
      </p>
    </div>
  );
}
