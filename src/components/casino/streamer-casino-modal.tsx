"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LoaderPinwheel, Sparkles } from "lucide-react";
import {
  MinecraftSlotMachine,
  useSlotAnimation,
  type SlotSpinResult,
} from "@/components/arcade/minecraft-slot-machine";
import { McItemSlot } from "@/components/landing/os/mc-item-slot";
import { OsSectionTitle } from "@/components/landing/os/os-section-title";
import { ActiveModifiersStrip } from "@/components/casino/active-modifiers-strip";
import { useAudioOptional } from "@/components/audio/audio-provider";
import { api, type CasinoSpinResult, type SessionData } from "@/lib/api/client";
import { resolveItemIcon } from "@/lib/inventory/item-assets";
import { cn } from "@/lib/utils";

interface StreamerCasinoModalProps {
  session: SessionData;
  loading: boolean;
  onSpinComplete: (result: CasinoSpinResult) => void | Promise<void>;
  onAcknowledge: () => void;
  showScore?: { points?: number | null; penalty?: number | null };
}

const TOAST_MS = 3800;

export function StreamerCasinoModal({
  session,
  loading,
  onSpinComplete,
  onAcknowledge,
  showScore,
}: StreamerCasinoModalProps) {
  const audio = useAudioOptional();
  const [localSession, setLocalSession] = useState(session);
  const [toast, setToast] = useState<string | null>(null);
  const [bonusInput, setBonusInput] = useState("0");
  const [applyingBonus, setApplyingBonus] = useState(false);
  const [spinOutcome, setSpinOutcome] = useState<CasinoSpinResult | null>(null);
  const pendingRef = useRef<CasinoSpinResult | null>(null);

  useEffect(() => {
    setLocalSession(session);
  }, [session]);

  const {
    spinning,
    targets,
    spinKey,
    resultSymbols,
    startSpin,
    resolveSpin,
    finishAnimation,
    setResults,
    cancelSpin,
  } = useSlotAnimation();

  const { spinsRemaining, spinsTotal, finished, manualBonusApplied, maxManualBonusSpins } =
    localSession.casino;
  const canSpin = spinsRemaining > 0 && !spinning && !loading && !applyingBonus;
  const needsBonusStep = !manualBonusApplied;

  const handleSpinComplete = useCallback(() => {
    const r = pendingRef.current;
    if (r) {
      setResults(r.reels);
      setLocalSession(r.session);
      setToast(`Выпало: ${r.drop.name}`);
      window.setTimeout(() => setToast(null), TOAST_MS);
      void onSpinComplete(r);
    }
    pendingRef.current = null;
    setSpinOutcome(null);
    finishAnimation();
  }, [finishAnimation, onSpinComplete, setResults]);

  async function applyBonusSpins() {
    if (applyingBonus || manualBonusApplied) return;
    const n = Math.max(0, Math.min(maxManualBonusSpins, Math.floor(Number(bonusInput) || 0)));
    setApplyingBonus(true);
    try {
      const result = await api.addCasinoBonusSpins(localSession.id, n);
      setLocalSession(result.session);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Ошибка");
      window.setTimeout(() => setToast(null), TOAST_MS);
    } finally {
      setApplyingBonus(false);
    }
  }

  async function handleSpin() {
    if (!canSpin || needsBonusStep) return;
    setToast(null);
    pendingRef.current = null;
    setSpinOutcome(null);
    await audio?.unlock();
    startSpin();
    try {
      const [result] = await Promise.all([
        api.spinCasino(localSession.id),
        new Promise<void>((res) => window.setTimeout(res, 2200)),
      ]);
      pendingRef.current = result;
      setSpinOutcome(result);
      resolveSpin(result.reels as SlotSpinResult[]);
    } catch (e) {
      cancelSpin();
      setSpinOutcome(null);
      setToast(e instanceof Error ? e.message : "Ошибка");
      window.setTimeout(() => setToast(null), TOAST_MS);
    }
  }

  return (
    <div className="space-y-5 text-center">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 z-[80] w-[min(92vw,360px)] -translate-x-1/2 border-4 border-[#1a1208] bg-[#1a1208] px-4 py-3 text-center text-sm text-[#e8d5b0] shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

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
          Слот наград
        </OsSectionTitle>
        <p className="mb-4 text-[10px] uppercase tracking-widest text-[#7a6a52]">
          Предметы в инвентарь сезона · модификаторы влияют на редкость
        </p>

        <ActiveModifiersStrip
          modifiers={localSession.activeModifiers}
          hint="Влияют на редкость дропа и число спинов"
          className="mb-4 text-left"
          compact
        />

        {needsBonusStep && (
          <div className="mb-4 rounded border border-primary/30 bg-primary/5 px-3 py-3 text-left">
            <p className="mb-2 text-xs text-[#a89070]">
              Доп. спины (один раз за забег, макс. {maxManualBonusSpins})
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <input
                type="number"
                min={0}
                max={maxManualBonusSpins}
                value={bonusInput}
                onChange={(e) => setBonusInput(e.target.value)}
                className="w-20 border-2 border-[#2a2118] bg-[#0d0a08] px-2 py-1.5 text-center font-display text-sm text-[#e8d5b0]"
              />
              <button
                type="button"
                className="mc-os-btn px-4 py-2 text-xs"
                disabled={applyingBonus || loading}
                onClick={() => void applyBonusSpins()}
              >
                {applyingBonus ? "…" : "Применить"}
              </button>
            </div>
          </div>
        )}

        <MinecraftSlotMachine
          spinning={spinning}
          targets={targets}
          spinKey={spinKey}
          resultSymbols={resultSymbols}
          spinOutcome={
            spinOutcome
              ? {
                  matchKind: "triple",
                  payout: 0,
                  symbolId: spinOutcome.drop.slug,
                  reels: spinOutcome.reels,
                }
              : null
          }
          onSpinComplete={handleSpinComplete}
        />

        <div className="mb-4 mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: Math.min(spinsTotal, 8) }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2.5 w-2.5 rounded-sm border border-[#1a1208]",
                i < localSession.casino.spinsUsed
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
          Спины: <span className="text-hypixel-gold">{spinsRemaining}</span>
          <span className="text-[#7a6a52]"> / {spinsTotal}</span>
        </p>

        {canSpin && !needsBonusStep && (
          <button
            type="button"
            className={cn(
              "font-display inline-flex min-w-[148px] items-center justify-center gap-2 border-2 border-[#2d6b3a] px-10 py-3",
              "bg-gradient-to-b from-[#6fd88a] to-[#3a9f55] text-sm uppercase tracking-[0.14em] text-[#0a1208]",
              "shadow-[0_4px_0_#1e4d28] transition hover:brightness-110",
              "active:translate-y-0.5 active:shadow-[0_2px_0_#1e4d28]",
              spinning && "animate-pulse opacity-70",
            )}
            disabled={!canSpin}
            onPointerDown={() => void audio?.unlock()}
            onClick={() => void handleSpin()}
          >
            {spinning ? (
              <LoaderPinwheel className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Крутить
          </button>
        )}

        {needsBonusStep && (
          <p className="text-[10px] text-[#7a6a52]">Сначала подтвердите доп. спины (можно 0)</p>
        )}
      </div>

      {localSession.loot.length > 0 && (
        <div>
          <OsSectionTitle className="mb-3 justify-center">Добыча за забег</OsSectionTitle>
          <div className="flex flex-wrap justify-center gap-3">
            {localSession.loot.map((l, idx) => (
              <div key={`${l.slug}-${idx}`} className="text-center">
                <McItemSlot
                  slug={l.slug}
                  src={resolveItemIcon(l.slug, l.iconUrl)}
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
