"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react";
import { McItemSlot } from "@/components/landing/os/mc-item-slot";
import { useAudioOptional } from "@/components/audio/audio-provider";
import { MC_ASSETS } from "@/lib/landing/assets";
import {
  SLOT_SYMBOLS,
  isBigSlotWin,
  isEnchantedSlotSymbol,
  isRottenTriple,
} from "@/lib/arcade/slot-symbols";
import { cn } from "@/lib/utils";

export const REEL_ITEM_H = 88;
const LOOP_LEN = 20;
const FAST_SPEED = [1680, 1750, 1820] as const;
const REEL_STOP_DELAY = [0, 520, 1100] as const;
const REEL_DECEL_MS = [1000, 1450, 2800] as const;
const REEL_EXTRA = [8, 12, 16] as const;

export interface SlotSpinResult {
  id: string;
  label: string;
  texture: string;
}

export interface SlotSpinOutcome {
  matchKind: "none" | "pair" | "triple";
  payout: number;
  symbolId: string | null;
  reels: SlotSpinResult[];
}

function randomSymbol(): SlotSpinResult {
  const s = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
  return { id: s.id, label: s.label, texture: s.texture };
}

function buildLoopStrip(): SlotSpinResult[] {
  return Array.from({ length: LOOP_LEN }, () => randomSymbol());
}

function slotDecelEase(t: number): number {
  if (t <= 0.42) return 0.7 * (t / 0.42);
  if (t <= 0.76) {
    const u = (t - 0.42) / 0.34;
    return 0.7 + 0.24 * u;
  }
  const u = (t - 0.76) / 0.24;
  return 0.94 + 0.06 * (1 - (1 - u) ** 5);
}

function cellIndex(y: number): number {
  return Math.floor(Math.abs(y) / REEL_ITEM_H);
}

function ReelSymbol({ sym }: { sym: SlotSpinResult }) {
  return (
    <McItemSlot
      src={sym.texture}
      alt=""
      size="xl"
      enchanted={isEnchantedSlotSymbol(sym.id)}
    />
  );
}

function visibleSymbol(offset: number, strip: SlotSpinResult[]): SlotSpinResult {
  if (!strip.length) return randomSymbol();
  const loopH = strip.length * REEL_ITEM_H;
  const pos = ((Math.abs(offset) % loopH) + loopH) % loopH;
  const idx = Math.min(strip.length - 1, Math.floor(pos / REEL_ITEM_H));
  return strip[idx] ?? strip[0];
}

export interface ReelHandle {
  startLoop: () => void;
  stopOn: (target: SlotSpinResult, index: number) => Promise<void>;
  showResult: (symbol: SlotSpinResult) => void;
}

interface SlotReelProps {
  index: number;
  spinKey: number;
  initialSymbol?: SlotSpinResult | null;
  onTick?: () => void;
}

interface PendingStop {
  target: SlotSpinResult;
  reelIndex: number;
  resolve: () => void;
}

interface DecelState {
  finalY: number;
  startTs: number;
  duration: number;
  lastCell: number;
  resolve: () => void;
  target: SlotSpinResult;
}

type ReelMode = "idle" | "spin" | "decel";

interface ReelRuntime {
  mode: ReelMode;
  loopStrip: SlotSpinResult[];
  offset: number;
  rafId: number;
  lastTs: number;
  pendingStop: PendingStop | null;
  stopAt: number;
  decel: DecelState | null;
  lastTickCell: number;
}

const SlotReel = forwardRef<ReelHandle, SlotReelProps>(function SlotReel(
  { index, spinKey, initialSymbol, onTick },
  ref,
) {
  const innerRef = useRef<HTMLDivElement>(null);
  const rt = useRef<ReelRuntime>({
    mode: "idle",
    loopStrip: [],
    offset: 0,
    rafId: 0,
    lastTs: 0,
    pendingStop: null,
    stopAt: 0,
    decel: null,
    lastTickCell: 0,
  });
  const [displayStrip, setDisplayStrip] = useState<SlotSpinResult[]>(() => [
    initialSymbol ?? randomSymbol(),
  ]);
  const [active, setActive] = useState(false);

  const loopH = LOOP_LEN * REEL_ITEM_H;

  const applyTransform = useCallback((y: number) => {
    innerRef.current?.style.setProperty("transform", `translate3d(0, ${y}px, 0)`);
  }, []);

  const landOn = useCallback(
    (symbol: SlotSpinResult, y = 0) => {
      rt.current.mode = "idle";
      rt.current.offset = y;
      rt.current.decel = null;
      rt.current.pendingStop = null;
      setDisplayStrip([symbol]);
      setActive(false);
      applyTransform(y);
    },
    [applyTransform],
  );

  const cancelRaf = useCallback(() => {
    if (rt.current.rafId) {
      cancelAnimationFrame(rt.current.rafId);
      rt.current.rafId = 0;
    }
  }, []);

  const beginDecel = useCallback(
    (pending: PendingStop) => {
      const r = rt.current;
      const loop = r.loopStrip.length ? r.loopStrip : buildLoopStrip();
      const current = visibleSymbol(r.offset, loop);
      const extra = REEL_EXTRA[pending.reelIndex];
      const stopStrip = [
        current,
        ...Array.from({ length: extra }, () => randomSymbol()),
        pending.target,
      ];
      const finalY = -(stopStrip.length - 1) * REEL_ITEM_H;

      setDisplayStrip(stopStrip);
      r.mode = "decel";
      r.pendingStop = null;
      r.offset = 0;
      applyTransform(0);

      r.lastTickCell = 0;
      r.decel = {
        finalY,
        startTs: performance.now(),
        duration: REEL_DECEL_MS[pending.reelIndex],
        lastCell: 0,
        resolve: pending.resolve,
        target: pending.target,
      };
    },
    [applyTransform],
  );

  const tickCells = useCallback(
    (y: number, lastCell: number) => {
      const cell = cellIndex(y);
      if (cell > lastCell && onTick) {
        for (let c = lastCell; c < cell; c++) onTick();
        return cell;
      }
      return lastCell;
    },
    [onTick],
  );

  const frame = useCallback(
    (ts: number) => {
      const r = rt.current;

      if (r.mode === "spin") {
        if (!r.lastTs) r.lastTs = ts;
        const dt = Math.min(0.032, (ts - r.lastTs) / 1000);
        r.lastTs = ts;

        r.offset -= FAST_SPEED[index] * dt;
        while (r.offset <= -loopH) {
          r.offset += loopH;
          r.lastTickCell = Math.max(0, r.lastTickCell - LOOP_LEN);
        }
        applyTransform(r.offset);
        r.lastTickCell = tickCells(r.offset, r.lastTickCell);

        if (r.pendingStop && ts >= r.stopAt) beginDecel(r.pendingStop);
      } else if (r.mode === "decel" && r.decel) {
        const d = r.decel;
        const t = Math.min(1, (performance.now() - d.startTs) / d.duration);
        const y = d.finalY * slotDecelEase(t);
        r.offset = y;
        applyTransform(y);
        d.lastCell = tickCells(y, d.lastCell);

        if (t >= 1) {
          applyTransform(d.finalY);
          r.mode = "idle";
          r.offset = d.finalY;
          r.decel = null;
          r.pendingStop = null;
          setActive(false);
          d.resolve();
          return;
        }
      } else {
        r.rafId = 0;
        return;
      }

      r.rafId = requestAnimationFrame(frame);
    },
    [index, loopH, applyTransform, beginDecel, tickCells],
  );

  const ensureRaf = useCallback(() => {
    if (!rt.current.rafId) {
      rt.current.lastTs = 0;
      rt.current.rafId = requestAnimationFrame(frame);
    }
  }, [frame]);

  useEffect(() => {
    cancelRaf();
    const sym = initialSymbol ?? randomSymbol();
    rt.current = {
      mode: "idle",
      loopStrip: [],
      offset: 0,
      rafId: 0,
      lastTs: 0,
      pendingStop: null,
      stopAt: 0,
      decel: null,
      lastTickCell: 0,
    };
    setDisplayStrip([sym]);
    setActive(false);
    applyTransform(0);
  }, [spinKey, cancelRaf, applyTransform, initialSymbol]);

  const startLoop = useCallback(() => {
    cancelRaf();
    const strip = buildLoopStrip();
    rt.current.loopStrip = strip;
    rt.current.mode = "spin";
    rt.current.offset = 0;
    rt.current.lastTs = 0;
    rt.current.pendingStop = null;
    rt.current.decel = null;
    rt.current.lastTickCell = 0;
    setDisplayStrip([...strip, ...strip]);
    setActive(true);
    applyTransform(0);
    ensureRaf();
  }, [cancelRaf, applyTransform, ensureRaf]);

  const stopOn = useCallback(
    (target: SlotSpinResult, reelIndex: number) => {
      return new Promise<void>((resolve) => {
        rt.current.pendingStop = { target, reelIndex, resolve };
        rt.current.stopAt = performance.now() + REEL_STOP_DELAY[reelIndex];
        ensureRaf();
      });
    },
    [ensureRaf],
  );

  const showResult = useCallback(
    (symbol: SlotSpinResult) => {
      cancelRaf();
      landOn(symbol, 0);
    },
    [cancelRaf, landOn],
  );

  useImperativeHandle(ref, () => ({ startLoop, stopOn, showResult }), [
    startLoop,
    stopOn,
    showResult,
  ]);

  useEffect(() => cancelRaf, [cancelRaf]);

  return (
    <div
      className={cn(
        "relative overflow-hidden border-4 border-[#1a1208]",
        active && "border-[#5a4a28]",
      )}
      style={{
        width: REEL_ITEM_H,
        height: REEL_ITEM_H,
        backgroundImage: `url(${MC_ASSETS.blocks.stone})`,
        backgroundSize: "32px 32px",
        imageRendering: "pixelated",
        boxShadow: "inset 0 0 0 2px #2a2a2a, inset 0 6px 18px rgba(0,0,0,0.65)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-4"
        style={{ background: "linear-gradient(to bottom, rgba(10,8,6,0.95), transparent)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-4"
        style={{ background: "linear-gradient(to top, rgba(10,8,6,0.95), transparent)" }}
        aria-hidden
      />
      <div
        ref={innerRef}
        className="flex flex-col will-change-transform"
        style={{ transform: "translate3d(0, 0, 0)" }}
      >
        {displayStrip.map((sym, i) => (
          <div
            key={`${spinKey}-${i}-${sym.id}`}
            className="flex shrink-0 items-center justify-center"
            style={{ height: REEL_ITEM_H, width: REEL_ITEM_H }}
          >
            <ReelSymbol sym={sym} />
          </div>
        ))}
      </div>
    </div>
  );
});

interface MinecraftSlotMachineProps {
  spinning: boolean;
  targets: SlotSpinResult[] | null;
  spinKey: number;
  won?: boolean;
  spinOutcome?: SlotSpinOutcome | null;
  resultSymbols?: SlotSpinResult[] | null;
  onSpinComplete?: () => void;
}

export function MinecraftSlotMachine({
  spinning,
  targets,
  spinKey,
  won,
  spinOutcome,
  resultSymbols,
  onSpinComplete,
}: MinecraftSlotMachineProps) {
  const audio = useAudioOptional();
  const reel0 = useRef<ReelHandle>(null);
  const reel1 = useRef<ReelHandle>(null);
  const reel2 = useRef<ReelHandle>(null);
  const reels = useMemo(() => [reel0, reel1, reel2], []);
  const stoppingRef = useRef(false);

  const playTick = useCallback(() => {
    void audio?.playSound("arcade.slotTick");
  }, [audio]);

  const playStop = useCallback(
    (reelIndex: number) => {
      void audio?.playSound("arcade.slotStop");
      window.setTimeout(() => {
        void audio?.playSound("arcade.slotLand", { volume: 0.26 + reelIndex * 0.04 });
      }, 30);
    },
    [audio],
  );

  const playFinalSound = useCallback(
    (outcome: SlotSpinOutcome) => {
      const rotten =
        isRottenTriple(outcome.reels) ||
        (outcome.matchKind === "triple" && outcome.symbolId === "rotten_flesh");
      if (rotten) {
        void audio?.playSound("arcade.slotRotten");
        return;
      }
      if (isBigSlotWin(outcome.matchKind, outcome.payout, outcome.symbolId)) {
        void audio?.playSound("player.levelUp");
        return;
      }
      if (outcome.payout > 0) {
        void audio?.playSound("arcade.slotWin");
      }
    },
    [audio],
  );

  useEffect(() => {
    if (spinning) {
      stoppingRef.current = false;
      void audio?.unlock();
      reels.forEach((r) => r.current?.startLoop());
      return;
    }
  }, [spinning, audio, reels, spinKey]);

  useEffect(() => {
    if (!targets || stoppingRef.current) return;
    stoppingRef.current = true;

    void (async () => {
      await Promise.all(
        targets.map((t, i) =>
          reels[i].current?.stopOn(t, i).then(() => {
            playStop(i);
            if (i === 2 && spinOutcome) {
              window.setTimeout(() => playFinalSound(spinOutcome), 160);
            }
          }),
        ),
      );
      onSpinComplete?.();
    })();
  }, [targets, reels, spinOutcome, onSpinComplete, playStop, playFinalSound]);

  const initial = resultSymbols ?? null;

  return (
    <div
      className={cn(
        "relative mx-auto w-fit p-3 sm:p-4",
        won && !spinning && !targets && "animate-[slot-win-pulse_1.2s_ease-out_1]",
      )}
      style={{
        backgroundImage: `url(${MC_ASSETS.blocks.oakPlanks})`,
        backgroundSize: "64px 64px",
        imageRendering: "pixelated",
        boxShadow:
          "0 6px 0 #1a1208, 0 10px 24px rgba(0,0,0,0.45), inset 0 0 0 3px #3d2817, inset 0 2px 0 rgba(255,255,255,0.12)",
      }}
    >
      <style>{`
        @keyframes slot-win-pulse {
          0%, 100% { filter: brightness(1); }
          40% { filter: brightness(1.15); }
        }
      `}</style>

      <div
        className="border-4 border-[#1a1208] p-2 sm:p-3"
        style={{
          backgroundImage: `url(${MC_ASSETS.blocks.dirt})`,
          backgroundSize: "32px 32px",
          imageRendering: "pixelated",
        }}
      >
        <div className="relative flex items-center justify-center gap-2 sm:gap-3">
          <div
            className="pointer-events-none absolute inset-x-1 top-1/2 z-20 -translate-y-1/2 border-y-[3px] border-[#c9a227]/50"
            style={{ height: REEL_ITEM_H + 2 }}
            aria-hidden
          />
          <SlotReel
            ref={reel0}
            index={0}
            spinKey={spinKey}
            initialSymbol={initial?.[0]}
            onTick={spinning ? playTick : undefined}
          />
          <SlotReel
            ref={reel1}
            index={1}
            spinKey={spinKey}
            initialSymbol={initial?.[1]}
            onTick={spinning ? playTick : undefined}
          />
          <SlotReel
            ref={reel2}
            index={2}
            spinKey={spinKey}
            initialSymbol={initial?.[2]}
            onTick={spinning ? playTick : undefined}
          />
        </div>
      </div>
    </div>
  );
}

export function useSlotAnimation() {
  const [spinning, setSpinning] = useState(false);
  const [targets, setTargets] = useState<SlotSpinResult[] | null>(null);
  const [spinKey, setSpinKey] = useState(0);
  const [resultSymbols, setResultSymbols] = useState<SlotSpinResult[] | null>(null);

  const startSpin = useCallback(() => {
    setTargets(null);
    setSpinning(true);
  }, []);

  const resolveSpin = useCallback((reels: SlotSpinResult[]) => {
    setTargets(reels);
  }, []);

  const finishAnimation = useCallback(() => {
    setSpinning(false);
    setTargets(null);
  }, []);

  const setResults = useCallback((reels: SlotSpinResult[]) => {
    setResultSymbols(reels);
  }, []);

  const cancelSpin = useCallback(() => {
    setSpinning(false);
    setTargets(null);
  }, []);

  return {
    spinning,
    targets,
    spinKey,
    resultSymbols,
    startSpin,
    resolveSpin,
    finishAnimation,
    setResults,
    cancelSpin,
  };
}
