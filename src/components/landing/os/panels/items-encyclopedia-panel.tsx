"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { OsPanelFrame } from "../os-panel-frame";
import { OsSectionTitle } from "../os-section-title";
import { McItemSlot } from "../mc-item-slot";
import { resolveItemIcon } from "@/lib/inventory/item-assets";
import {
  describeItemEffects,
  getItemFlavorText,
  ITEM_KIND_LABELS,
} from "@/lib/inventory/item-effects";
import type { Rarity } from "@/lib/inventory/types";
import { rarityConfig } from "@/lib/inventory/rarity";
import { api, type CatalogItemData } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const RARITY_ORDER: Rarity[] = ["LEGENDARY", "EPIC", "RARE", "UNCOMMON", "COMMON"];

type KindFilter = "all" | "MODIFIER" | "MATERIAL" | "CRAFTABLE";

export function ItemsEncyclopediaPanel() {
  const [items, setItems] = useState<CatalogItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    api
      .getItemCatalog()
      .then((list) => {
        setItems(list);
        if (list[0]) setSelectedSlug(list[0].slug);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (kindFilter === "all") return items;
    return items.filter((i) => i.kind === kindFilter);
  }, [items, kindFilter]);

  const selected = useMemo(
    () => items.find((i) => i.slug === selectedSlug) ?? filtered[0] ?? null,
    [items, filtered, selectedSlug],
  );

  const filters: { id: KindFilter; label: string }[] = [
    { id: "all", label: "Все" },
    { id: "MODIFIER", label: "Модификаторы" },
    { id: "MATERIAL", label: "Материалы" },
    { id: "CRAFTABLE", label: "Крафт" },
  ];

  return (
    <OsPanelFrame>
      <OsSectionTitle>Справочник предметов</OsSectionTitle>
      <p className="mb-4 text-center text-xs text-[#7a6a52] sm:text-left">
        Все предметы сезона, их редкость и эффекты. Добыча — из слота наград после игры,
        модификаторы вешаются на аукцион (макс. 2 за раз).
      </p>

      <div className="mb-4 flex flex-wrap justify-center gap-1.5 sm:justify-start">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setKindFilter(f.id)}
            className={cn(
              "rounded border px-2.5 py-1 font-display text-[10px] uppercase tracking-wide transition-colors",
              kindFilter === f.id
                ? "border-primary/50 bg-primary/15 text-[#e8d5b0]"
                : "border-[#2a2118] text-[#7a6a52] hover:border-[#4a3828] hover:text-[#a89070]",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-[#7a6a52]">Загрузка каталога…</p>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#7a6a52]">Предметы не найдены</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="os-scrollbar max-h-[min(60vh,520px)] space-y-2 overflow-y-auto pr-1">
            {filtered.map((item) => {
              const r = item.rarity as Rarity;
              const rc = rarityConfig[r] ?? rarityConfig.COMMON;
              const active = selected?.slug === item.slug;
              const effects = describeItemEffects(item.effects);

              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setSelectedSlug(item.slug)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                    active
                      ? "border-primary/40 bg-primary/10"
                      : "border-[#1a1208] bg-[#0d0a08]/60 hover:border-[#3d3024]",
                  )}
                >
                  <McItemSlot
                    slug={item.slug}
                    src={resolveItemIcon(item.slug, item.iconUrl)}
                    alt={item.name}
                    size="sm"
                    enchanted={r === "LEGENDARY" || r === "EPIC"}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn("font-display text-sm", rc.text)}>{item.name}</p>
                    <p className="text-[10px] text-[#7a6a52]">
                      {rc.label} · {ITEM_KIND_LABELS[item.kind] ?? item.kind}
                    </p>
                    {effects.length > 0 ? (
                      <p className="mt-1 text-[10px] leading-snug text-[#a89070]">
                        {effects.join(" · ")}
                      </p>
                    ) : (
                      <p className="mt-1 text-[10px] text-[#6a5840]">
                        {getItemFlavorText(item.slug, item.description) ?? "Без боевых эффектов"}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {selected && (
            <aside
              className="rounded-lg border-2 border-[#1a1208] p-4"
              style={{
                background: "linear-gradient(180deg, #2a2118 0%, #14100c 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex flex-col items-center text-center">
                <McItemSlot
                  slug={selected.slug}
                  src={resolveItemIcon(selected.slug, selected.iconUrl)}
                  alt={selected.name}
                  size="lg"
                  enchanted={
                    selected.rarity === "LEGENDARY" || selected.rarity === "EPIC"
                  }
                />
                <h3
                  className={cn(
                    "mt-3 font-display text-base uppercase tracking-wide",
                    rarityConfig[selected.rarity as Rarity]?.text ?? "text-[#e8d5b0]",
                  )}
                >
                  {selected.name}
                </h3>
                <p className="mt-1 text-[10px] text-[#7a6a52]">
                  {rarityConfig[selected.rarity as Rarity]?.label} ·{" "}
                  {ITEM_KIND_LABELS[selected.kind] ?? selected.kind}
                </p>
              </div>

              <div className="mt-4 space-y-3 border-t border-[#2a2118] pt-4 text-xs">
                <div>
                  <p className="mb-1 font-display text-[10px] uppercase tracking-widest text-[#a89070]">
                    Описание
                  </p>
                  <p className="text-[#c8b898]">
                    {getItemFlavorText(selected.slug, selected.description) ??
                      "Описание пока не добавлено."}
                  </p>
                </div>

                <div>
                  <p className="mb-1 font-display text-[10px] uppercase tracking-widest text-[#a89070]">
                    Эффекты
                  </p>
                  {describeItemEffects(selected.effects).length > 0 ? (
                    <ul className="space-y-1 text-[#e8d5b0]">
                      {describeItemEffects(selected.effects).map((line) => (
                        <li key={line} className="flex items-start gap-1.5">
                          <BookOpen className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#7a6a52]">Нет игровых бонусов</p>
                  )}
                </div>

                {selected.recipes.length > 0 && (
                  <div>
                    <p className="mb-1 font-display text-[10px] uppercase tracking-widest text-[#a89070]">
                      Крафт
                    </p>
                    {selected.recipes.map((r) => (
                      <p key={r.recipeName} className="text-[#a89070]">
                        {r.ingredients.join(" + ")}
                      </p>
                    ))}
                  </div>
                )}

                {selected.kind === "MATERIAL" && (
                  <p className="rounded border border-[#3d3024] bg-[#1a1208]/50 px-2 py-1.5 text-[10px] text-[#7a6a52]">
                    Выпадает из слота наград после игры
                  </p>
                )}
                {selected.kind === "MODIFIER" && (
                  <p className="rounded border border-[#3d3024] bg-[#1a1208]/50 px-2 py-1.5 text-[10px] text-[#7a6a52]">
                    Применяется на аукционе перед стартом забега
                  </p>
                )}
              </div>
            </aside>
          )}
        </div>
      )}

      {!loading && items.length > 0 && (
        <p className="mt-4 text-center text-[10px] text-[#6a5840]">
          Редкость:{" "}
          {RARITY_ORDER.map((r) => rarityConfig[r].label.toLowerCase()).join(" → ")}
        </p>
      )}
    </OsPanelFrame>
  );
}
