"use client";

import { McItemSlot } from "@/components/landing/os/mc-item-slot";
import type { SessionData } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface ActiveModifiersStripProps {
  modifiers: SessionData["activeModifiers"];
  maxCount?: number;
  className?: string;
  compact?: boolean;
  hint?: string;
}

export function ActiveModifiersStrip({
  modifiers,
  maxCount = 2,
  className,
  compact = false,
  hint,
}: ActiveModifiersStripProps) {
  if (modifiers.length === 0 && !hint) return null;

  return (
    <div
      className={cn(
        "rounded border border-[#2a2118] bg-[#0d0a08]/80 px-3 py-2.5",
        className,
      )}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wider text-[#7a6a52]">
          Модификаторы забега
          {maxCount > 0 && (
            <span className="ml-1 text-[#6a5840]">
              ({modifiers.length}/{maxCount})
            </span>
          )}
        </p>
        {hint && <p className="text-[10px] text-[#6a5840]">{hint}</p>}
      </div>
      {modifiers.length === 0 ? (
        <p className="text-xs text-[#6a5840]">Без модификаторов</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {modifiers.map((m) => (
            <div
              key={m.slug}
              className={cn(
                "flex items-start gap-2 rounded border border-[#2a2118] bg-[#14100c]/90",
                compact ? "px-2 py-1.5" : "px-2.5 py-2",
              )}
              title={m.effects.join(" · ")}
            >
              <McItemSlot slug={m.slug} alt={m.name} size={compact ? "sm" : "md"} />
              <div className="min-w-0 text-left">
                <p className={cn("font-display text-[#e8d5b0]", compact ? "text-[10px]" : "text-xs")}>
                  {m.name}
                </p>
                {!compact && m.effects[0] && (
                  <p className="mt-0.5 text-[10px] leading-snug text-[#7a6a52]">{m.effects[0]}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
