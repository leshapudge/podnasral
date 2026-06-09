"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { LoaderPinwheel, Sparkles } from "lucide-react";
import { McItemSlot } from "@/components/landing/os/mc-item-slot";
import { OsSectionTitle } from "@/components/landing/os/os-section-title";
import { getItemTexture } from "@/lib/inventory/item-assets";
import type { CatalogItemData, SessionData } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const SLOT_W = 60;
const VISIBLE = 5;

interface MinecraftCasinoWheelProps {
  session: SessionData;
  catalog: CatalogItemData[];
  loading: boolean;
  onSpin: () => Promise<{ slug: string; name: string; rarity: string } | null>;
  onAcknowledge: () => void;
  showScore?: { points?: number | null; penalty?: number | null };
}

function pickReelItems(catalog: CatalogItemData[], winnerSlug: string, length: number) {
  const pool = catalog.length > 0 ? catalog : [{ slug: winnerSlug, name: winnerSlug, rarity: "COMMON" } as CatalogItemData];
  const items: CatalogItemData[] = [];
  for (let i = 0; i < length; i++) {
    items.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  const winIdx = length - 3;
  const winner = pool.find((c) => c.slug === winnerSlug) ?? pool[0];
  items[winIdx] = winner;
  return { items, winIdx };
}

export function MinecraftCasinoWheel({
  session,
  catalog,
  loading,
  onSpin,
  onAcknowledge,
  showScore,
}: MinecraftCasinoWheelProps) {
  const controls = useAnimation();
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<{ slug: string; name: string; rarity: string } | null>(
    null,
  );
  const [reel, setReel] = useState<CatalogItemData[]>([]);
  const [winIndex, setWinIndex] = useState(0);

  const { spinsRemaining, spinsTotal, finished } = session.casino;
  const canSpin = spinsRemaining > 0 && !spinning && !loading;

  const previewPool = useMemo(() => {
    const mods = catalog.filter((c) => c.kind === "MODIFIER" || c.kind === "MATERIAL");
    return mods.length > 0 ? mods : catalog;
  }, [catalog]);

  useEffect(() => {
    if (previewPool.length > 0 && reel.length === 0) {
      const filler = Array.from({ length: 12 }, () => previewPool[Math.floor(Math.random() * previewPool.length)]);
      setReel(filler);
    }
  }, [previewPool, reel.length]);

  const runSpinAnimation = useCallback(
    async (winnerSlug: string) => {
      const { items, winIdx } = pickReelItems(previewPool, winnerSlug, 24);
      setReel(items);
      setWinIndex(winIdx);
      const offset = winIdx * SLOT_W - Math.floor(VISIBLE / 2) * SLOT_W;
      controls.set({ x: 0 });
      await controls.start({
        x: -offset,
        transition: { duration: 2.8, ease: [0.12, 0.8, 0.2, 1] },
      });
    },
    [controls, previewPool],
  );

  async function handleSpin() {
    if (!canSpin) return;
    setSpinning(true);
    setLastWin(null);
    try {
      const drop = await onSpin();
      if (drop) {
        await runSpinAnimation(drop.slug);
        setLastWin(drop);
      }
    } finally {
      setSpinning(false);
    }
  }

  return (
    <div className="space-y-5 text-center">
      {showScore?.points != null && showScore.points > 0 && (
        <p className="font-display text-2xl text-hypixel-gold">+{showScore.points} очков</p>
      )}
      {showScore?.penalty != null && showScore.penalty > 0 && (
        <p className="font-display text-xl text-mc-redstone">−{showScore.penalty} штраф</p>
      )}

      <div
        className="mx-auto max-w-lg overflow-hidden rounded-lg border-2 border-[#1a1208] p-4"
        style={{
          background:
            "linear-gradient(180deg, #2a1810 0%, #1a1208 40%, #0d0a08 100%), repeating-linear-gradient(90deg, #3d3024 0, #3d3024 8px, #2a2118 8px, #2a2118 16px)",
          boxShadow: "inset 0 4px 12px rgba(0,0,0,0.6), 0 4px 0 #0d0a08",
        }}
      >
        <OsSectionTitle className="mb-1 justify-center gap-2">
          <Sparkles className="h-4 w-4 text-hypixel-gold" />
          Колесо приколов
        </OsSectionTitle>
        <p className="mb-4 text-[10px] uppercase tracking-widest text-[#7a6a52]">
          Добыча только с казино · как в NASSAL
        </p>

        <div className="relative mx-auto mb-4 max-w-[300px]">
          <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-0.5 -translate-x-1/2 bg-hypixel-gold/80 shadow-[0_0_8px_rgba(255,170,0,0.8)]" />
          <div className="overflow-hidden rounded border-2 border-[#3d3024] bg-[#0d0a08]/90 px-1 py-2">
            <motion.div className="flex" animate={controls} initial={{ x: 0 }}>
              {reel.map((item, i) => (
                <div
                  key={`${item.slug}-${i}`}
                  className="flex shrink-0 items-center justify-center"
                  style={{ width: SLOT_W }}
                >
                  <McItemSlot
                    src={getItemTexture(item.slug)}
                    alt={item.name}
                    size="md"
                    enchanted={item.rarity === "LEGENDARY" || item.rarity === "EPIC"}
                    active={i === winIndex && lastWin != null}
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-center gap-2">
          {Array.from({ length: Math.min(spinsTotal, 8) }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2.5 w-2.5 rounded-sm border border-[#1a1208]",
                i < session.casino.spinsUsed
                  ? "bg-[#3d3024]"
                  : i < spinsTotal
                    ? "bg-hypixel-gold shadow-[0_0_6px_rgba(255,170,0,0.5)]"
                    : "bg-[#1a1208]",
              )}
            />
          ))}
          {spinsTotal > 8 && (
            <span className="text-[10px] text-[#7a6a52]">+{spinsTotal - 8}</span>
          )}
        </div>

        <p className="mb-3 font-display text-sm text-[#e8d5b0]">
          Фри-спины:{" "}
          <span className="text-hypixel-gold">{spinsRemaining}</span>
          <span className="text-[#7a6a52]"> / {spinsTotal}</span>
        </p>

        {canSpin && (
          <button
            type="button"
            className="mc-os-btn inline-flex items-center gap-2 px-8 py-2.5 text-xs uppercase tracking-wider"
            disabled={!canSpin}
            onClick={() => void handleSpin()}
          >
            {spinning ? (
              <LoaderPinwheel className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-hypixel-gold" />
            )}
            Крутить
          </button>
        )}

        {spinning && (
          <p className="mt-2 animate-pulse text-[10px] text-[#a89070]">Редстоун механизм крутится…</p>
        )}

        {lastWin && !spinning && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("mt-3 text-sm font-display", `rarity-${lastWin.rarity.toLowerCase()}`)}
          >
            Выпало: {lastWin.name}
          </motion.p>
        )}
      </div>

      {session.loot.length > 0 && (
        <div>
          <OsSectionTitle className="mb-3 justify-center">Добыча с колеса</OsSectionTitle>
          <div className="flex flex-wrap justify-center gap-3">
            {session.loot.map((l, idx) => (
              <div key={`${l.slug}-${idx}`} className="text-center">
                <McItemSlot
                  src={getItemTexture(l.slug)}
                  alt={l.name}
                  size="md"
                  enchanted={l.rarity === "LEGENDARY" || l.rarity === "EPIC"}
                />
                <p className={`mt-1 text-[10px] rarity-${l.rarity.toLowerCase()}`}>{l.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {finished && (
        <div className="space-y-3 pt-2">
          <p className="text-xs text-[#7a6a52]">
            Все спины использованы · предметы в инвентаре
          </p>
          <button
            type="button"
            className="mc-os-btn px-6 py-2 text-xs"
            disabled={loading}
            onClick={onAcknowledge}
          >
            Продолжить
          </button>
        </div>
      )}
    </div>
  );
}
