"use client";

import { HelpCircle } from "lucide-react";
import { McItemSlot } from "@/components/landing/os/mc-item-slot";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  SLOT_BET,
  SLOT_PAIR_MULT,
  SLOT_ROTTEN_TRIPLE_PENALTY,
  getPaytableLines,
  isEnchantedSlotSymbol,
  pairPayout,
  symbolById,
} from "@/lib/arcade/slot-symbols";
import { cn } from "@/lib/utils";

const TIER_COLOR: Record<string, string> = {
  ДЖЕКПОТ: "text-[#ff6ec7] border-[#ff6ec7]/40 bg-[#ff6ec7]/10",
  Супер: "text-[#c9a227] border-[var(--mc-gold)]/40 bg-[var(--mc-gold)]/10",
  Большой: "text-emerald-300 border-emerald-700/40 bg-emerald-900/20",
  Средний: "text-[#e8d5b0] border-[#5c4a32]/60 bg-[#1a1208]",
  Малый: "text-[#a89070] border-[#2a2118] bg-[#14100c]",
  Мини: "text-[#7a6a52] border-[#2a2118] bg-[#14100c]",
};

interface SlotRulesButtonProps {
  className?: string;
  disabled?: boolean;
}

export function SlotRulesButton({ className, disabled }: SlotRulesButtonProps) {
  const lines = getPaytableLines(SLOT_BET);
  const pairPay = pairPayout(SLOT_BET);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          data-silent
          className={cn(
            "flex shrink-0 flex-col items-center justify-center gap-1.5",
            "border-2 border-[#5c4a32] bg-gradient-to-b from-[#3d3020] to-[#1a1208]",
            "px-2.5 py-4 text-[10px] uppercase tracking-wide text-[#e8d5b0]",
            "shadow-[0_3px_0_#0a0806] transition hover:brightness-110 disabled:opacity-40",
            className,
          )}
          aria-label="Правила слота"
        >
          <HelpCircle className="h-5 w-5 text-[var(--mc-gold)]" />
          <span className="font-display [writing-mode:vertical-rl] rotate-180">Правила</span>
        </button>
      </DialogTrigger>

      <DialogContent
        className={cn(
          "max-h-[min(90vh,640px)] max-w-md overflow-y-auto",
          "border-4 border-[#1a1208] bg-[#14100c] p-0 text-[#e8d5b0]",
          "shadow-[0_8px_0_#0a0806]",
          "[&>button]:border-2 [&>button]:border-[#2a2118] [&>button]:bg-[#1a1208] [&>button]:text-[#e8d5b0]",
        )}
      >
        <DialogHeader className="border-b-2 border-[#2a2118] px-4 py-3 text-left">
          <DialogTitle className="font-display text-sm uppercase tracking-[0.2em] text-[var(--mc-gold)]">
            Таблица выплат
          </DialogTitle>
          <p className="text-[11px] text-[#7a6a52]">Ставка {SLOT_BET} монет · 3 барабана</p>
        </DialogHeader>

        <div className="space-y-4 px-4 py-4">
          <section>
            <h3 className="mb-2 font-display text-[10px] uppercase tracking-wider text-[#a89070]">
              Тройка · линия
            </h3>
            <ul className="space-y-1.5">
              {lines.map((row) => (
                <li
                  key={row.symbol.id}
                  className={cn(
                    "flex items-center gap-2 border-2 px-2 py-1.5",
                    TIER_COLOR[row.tierLabel] ?? "border-[#2a2118] bg-[#14100c]",
                  )}
                >
                  <div className="flex shrink-0 items-center gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <McItemSlot
                        key={i}
                        src={row.symbol.texture}
                        alt=""
                        size="sm"
                        enchanted={isEnchantedSlotSymbol(row.symbol.id)}
                      />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium">{row.symbol.label}</p>
                    <p className="text-[9px] uppercase opacity-70">{row.tierLabel}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-sm text-[var(--mc-gold)]">
                      {row.triplePayout}
                    </p>
                    <p className="text-[9px] text-[#6a5840]">×{row.tripleMult}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="border-2 border-[#2a2118] bg-[#1a1208] px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium">Любая пара</p>
                <p className="text-[9px] text-[#6a5840]">2 одинаковых символа</p>
              </div>
              <div className="text-right">
                <p className="font-display text-sm text-[var(--mc-gold)]">{pairPay}</p>
                <p className="text-[9px] text-[#6a5840]">×{SLOT_PAIR_MULT}</p>
              </div>
            </div>
          </section>

          <section className="border-2 border-mc-redstone/40 bg-mc-redstone/5 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <McItemSlot
                    key={i}
                    src={symbolById("rotten_flesh").texture}
                    alt=""
                    size="sm"
                  />
                ))}
                <div className="ml-1">
                  <p className="text-[11px] font-medium text-mc-redstone">Тройка гнили</p>
                  <p className="text-[9px] text-[#6a5840]">Проклятие</p>
                </div>
              </div>
              <p className="font-display text-sm text-mc-redstone">−{SLOT_ROTTEN_TRIPLE_PENALTY}</p>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
