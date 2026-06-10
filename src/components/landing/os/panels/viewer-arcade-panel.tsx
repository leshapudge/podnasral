"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Coins, Skull, Trophy } from "lucide-react";
import { useAudioOptional } from "@/components/audio/audio-provider";
import { OsPanelFrame } from "../os-panel-frame";
import {
  MinecraftSlotMachine,
  useSlotAnimation,
} from "@/components/arcade/minecraft-slot-machine";
import { SLOT_BET } from "@/lib/arcade/slot-symbols";
import { SlotRulesButton } from "@/components/arcade/slot-rules-dialog";
import {
  api,
  type ArcadeLeaderboardEntry,
  type ArcadeLeaderboards,
  type ArcadeSpinResult,
  type ArcadeWallet,
} from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface ViewerArcadePanelProps {
  isAuthenticated: boolean;
  /** Без OsPanelFrame — для встраивания в панель стримера */
  embedded?: boolean;
}

const TOAST_MS = 4200;

function ArcadeToast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, TOAST_MS);
    return () => clearTimeout(t);
  }, [message, onDone]);

  const positive = message.startsWith("+");
  const negative = message.startsWith("−") || message.startsWith("-");

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.22 }}
      className={cn(
        "pointer-events-none fixed bottom-6 left-1/2 z-[90] w-[min(92vw,360px)] -translate-x-1/2",
        "border-4 border-[#1a1208] px-4 py-3 text-center text-sm shadow-[0_6px_0_#0a0806]",
        positive && "bg-[#1a2e1a] text-emerald-200",
        negative && "bg-[#2e1a1a] text-[#e8a090]",
        !positive && !negative && "bg-[#1a1208] text-[#e8d5b0]",
      )}
      style={{
        imageRendering: "pixelated",
      }}
    >
      {message}
    </motion.div>
  );
}

const EMPTY_BOARDS: ArcadeLeaderboards = { winners: [], losers: [] };

export function ViewerArcadePanel({ isAuthenticated, embedded = false }: ViewerArcadePanelProps) {
  const audio = useAudioOptional();
  const [wallet, setWallet] = useState<ArcadeWallet | null>(null);
  const [leaderboards, setLeaderboards] = useState<ArcadeLeaderboards>(EMPTY_BOARDS);
  const [toast, setToast] = useState<string | null>(null);
  const [wonFlash, setWonFlash] = useState(false);
  const [spinOutcome, setSpinOutcome] = useState<ArcadeSpinResult | null>(null);
  const pendingRef = useRef<ArcadeSpinResult | null>(null);

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

  const refreshLeaderboard = useCallback(() => {
    api
      .getArcadeLeaderboard()
      .then(setLeaderboards)
      .catch(() => setLeaderboards(EMPTY_BOARDS));
  }, []);

  const refreshWallet = useCallback(() => {
    if (!isAuthenticated) return;
    api.getArcadeMe().then(setWallet).catch(() => setWallet(null));
  }, [isAuthenticated]);

  useEffect(() => {
    refreshLeaderboard();
    refreshWallet();
    const t = setInterval(refreshLeaderboard, 30_000);
    return () => clearInterval(t);
  }, [refreshLeaderboard, refreshWallet]);

  const applyResult = useCallback(
    (r: ArcadeSpinResult) => {
      setWallet({ coins: r.coins, diamonds: r.diamonds, netWorth: r.netWorth });
      if (r.payout > 0) {
        const label =
          r.matchKind === "triple" && r.winTitle
            ? `+${r.payout} · ${r.winTitle}`
            : r.matchKind === "pair"
              ? `+${r.payout} · пара`
              : `+${r.payout}`;
        setToast(label);
        setWonFlash(true);
        window.setTimeout(() => setWonFlash(false), 1400);
      } else if (r.payout < 0) {
        setToast(`−${Math.abs(r.payout)} · ${r.winTitle ?? "штраф"}`);
      } else {
        setToast(`−${SLOT_BET}`);
      }
      refreshLeaderboard();
      refreshWallet();
    },
    [refreshLeaderboard, refreshWallet],
  );

  const handleSpinComplete = useCallback(() => {
    const r = pendingRef.current;
    if (r) {
      setResults(r.reels);
      applyResult(r);
    }
    pendingRef.current = null;
    setSpinOutcome(null);
    finishAnimation();
  }, [applyResult, finishAnimation, setResults]);

  async function runSpin() {
    if (!isAuthenticated || spinning) return;
    setToast(null);
    pendingRef.current = null;
    setSpinOutcome(null);
    await audio?.unlock();
    startSpin();
    try {
      const [r] = await Promise.all([
        api.arcadeSpin(SLOT_BET),
        new Promise<void>((res) => window.setTimeout(res, 2200)),
      ]);
      pendingRef.current = r;
      setSpinOutcome(r);
      resolveSpin(r.reels);
    } catch (e) {
      cancelSpin();
      setSpinOutcome(null);
      setToast(e instanceof Error ? e.message : "Ошибка");
    }
  }

  const frameProps = embedded ? { className: "relative min-h-[420px] p-2" } : { className: "relative min-h-[420px]" };
  const Frame = embedded ? "div" : OsPanelFrame;

  if (!isAuthenticated) {
    const loginBlock = (
      <ArcadeLeaderboardRow boards={leaderboards}>
        <div className="flex flex-col items-center gap-4 py-6">
          <Image
            src="/assets/mc/grass-block-3d.png"
            alt=""
            width={72}
            height={72}
            className="mc-pixel-image drop-shadow-[3px_4px_0_rgba(0,0,0,0.4)]"
          />
          <Link
            href="/login?callbackUrl=%2F%3Ftab%3Dkazik"
            className="mc-os-btn px-6 py-2 text-xs uppercase"
          >
            Twitch
          </Link>
        </div>
      </ArcadeLeaderboardRow>
    );
    if (embedded) return <div {...frameProps}>{loginBlock}</div>;
    return <OsPanelFrame>{loginBlock}</OsPanelFrame>;
  }

  return (
    <Frame {...frameProps}>
      <AnimatePresence>
        {toast && <ArcadeToast key={toast} message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {wallet && (
        <div className="mb-3 flex justify-center">
          <div
            className={cn(
              "inline-flex items-center gap-2 border-2 border-[#1a1208] px-3 py-1.5",
              wallet.coins < 0 ? "bg-mc-redstone/15" : "bg-[#14100c]",
            )}
          >
            <Coins className="h-4 w-4 text-[var(--mc-gold)]" />
            <span className="font-display text-base text-[#e8d5b0]">{wallet.coins}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-5">
        <ArcadeLeaderboardRow boards={leaderboards}>
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-start justify-center gap-2 sm:gap-3">
              <MinecraftSlotMachine
                spinning={spinning}
                targets={targets}
                spinKey={spinKey}
                resultSymbols={resultSymbols}
                won={wonFlash}
                spinOutcome={
                  spinOutcome
                    ? {
                        matchKind: spinOutcome.matchKind,
                        payout: spinOutcome.payout,
                        symbolId: spinOutcome.symbolId ?? null,
                        reels: spinOutcome.reels,
                      }
                    : null
                }
                onSpinComplete={handleSpinComplete}
              />
              <SlotRulesButton disabled={spinning} className="mt-6 sm:mt-8" />
            </div>

            <button
              type="button"
              disabled={spinning}
              onPointerDown={() => void audio?.unlock()}
              onClick={runSpin}
              className={cn(
                "font-display min-w-[148px] border-2 border-[#2d6b3a] px-10 py-3",
                "bg-gradient-to-b from-[#6fd88a] to-[#3a9f55] text-sm uppercase tracking-[0.14em] text-[#0a1208]",
                "shadow-[0_4px_0_#1e4d28] transition hover:brightness-110",
                "active:translate-y-0.5 active:shadow-[0_2px_0_#1e4d28]",
                "disabled:opacity-40 disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_#1e4d28]",
                spinning && "animate-pulse",
              )}
            >
              Крутить
            </button>
          </div>
        </ArcadeLeaderboardRow>
      </div>
    </Frame>
  );
}

function ArcadeLeaderboardRow({
  boards,
  children,
}: {
  boards: ArcadeLeaderboards;
  children: ReactNode;
}) {
  return (
    <>
      <div className="mx-auto hidden w-full max-w-7xl items-start justify-center gap-4 sm:flex md:gap-5 lg:gap-6">
        <LeaderboardColumn
          title="Киты"
          icon={Trophy}
          rows={boards.winners}
          variant="winners"
          layout="side"
          className="w-[min(100%,260px)] shrink-0 pt-6 sm:w-[260px] md:w-[280px] lg:w-[300px] xl:w-[320px]"
        />
        <div className="min-w-0 shrink-0">{children}</div>
        <LeaderboardColumn
          title="Лохи"
          icon={Skull}
          rows={boards.losers}
          variant="losers"
          layout="side"
          className="w-[min(100%,260px)] shrink-0 pt-6 sm:w-[260px] md:w-[280px] lg:w-[300px] xl:w-[320px]"
        />
      </div>

      <div className="flex w-full flex-col items-center gap-5 sm:hidden">
        {children}
        <div className="grid w-full max-w-2xl grid-cols-2 gap-4 border-t-2 border-[#2a2118] pt-4">
          <LeaderboardColumn
            title="Киты"
            icon={Trophy}
            rows={boards.winners}
            variant="winners"
          />
          <LeaderboardColumn
            title="Лохи"
            icon={Skull}
            rows={boards.losers}
            variant="losers"
          />
        </div>
      </div>
    </>
  );
}

function LeaderboardColumn({
  title,
  icon: Icon,
  rows,
  variant,
  layout = "stacked",
  className,
}: {
  title: string;
  icon: typeof Trophy;
  rows: ArcadeLeaderboardEntry[];
  variant: "winners" | "losers";
  layout?: "side" | "stacked";
  className?: string;
}) {
  const isLosers = variant === "losers";
  const isSide = layout === "side";

  return (
    <div
      className={cn(
        "min-w-0 border-2 border-[#2a2118] bg-[#0d0a08]/90 p-2.5",
        isSide && "p-3.5 md:p-4",
        className,
      )}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <Icon
          className={cn(
            "shrink-0",
            isSide ? "h-4 w-4" : "h-3.5 w-3.5",
            isLosers ? "text-mc-redstone" : "text-[var(--mc-gold)]",
          )}
        />
        <span
          className={cn(
            "truncate font-display uppercase tracking-wide text-[#a89070]",
            isSide ? "text-xs md:text-sm" : "text-[10px]",
          )}
        >
          {title}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="text-[11px] text-[#6a5840]">—</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.slice(0, 5).map((row) => (
            <li
              key={`${variant}-${row.twitchLogin ?? row.rank}`}
              className={cn(
                "flex items-center gap-2 border px-2 py-1.5",
                isSide ? "gap-2.5 px-2.5 py-2 text-xs md:text-sm" : "text-[10px]",
                row.rank <= 3
                  ? isLosers
                    ? "border-mc-redstone/30 bg-mc-redstone/5"
                    : "border-[var(--mc-gold)]/25 bg-[#14100c]"
                  : "border-[#2a2118]",
              )}
            >
              <span
                className={cn(
                  "w-5 shrink-0 font-display",
                  isLosers ? "text-mc-redstone" : "text-[var(--mc-gold)]",
                )}
              >
                {row.rank}
              </span>
              {row.image ? (
                <Image
                  src={row.image}
                  alt=""
                  width={24}
                  height={24}
                  className="h-5 w-5 shrink-0 rounded-full sm:h-6 sm:w-6"
                />
              ) : (
                <div className="h-5 w-5 shrink-0 rounded-full bg-[#2a2118] sm:h-6 sm:w-6" />
              )}
              <span className="min-w-0 flex-1 truncate text-[#e8d5b0]">{row.name}</span>
              <span
                className={cn(
                  "shrink-0 font-display tabular-nums",
                  isLosers ? "text-mc-redstone" : "text-emerald-400/90",
                )}
              >
                {row.coins}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
