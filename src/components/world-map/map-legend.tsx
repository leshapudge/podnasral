"use client";

import { Crown, DoorOpen, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarkerKind } from "@/lib/world-map/types";

const LEGEND: { kind: MarkerKind; label: string; icon: React.ReactNode; color: string }[] = [
  { kind: "player", label: "Игроки", icon: <Users className="h-3.5 w-3.5" />, color: "text-primary" },
  { kind: "boss", label: "Боссы", icon: <Crown className="h-3.5 w-3.5" />, color: "text-boss" },
  { kind: "dungeon", label: "Данжи", icon: <DoorOpen className="h-3.5 w-3.5" />, color: "text-hypixel-gold" },
  { kind: "event", label: "Ивенты", icon: <Sparkles className="h-3.5 w-3.5" />, color: "text-mc-diamond" },
];

interface MapLegendProps {
  filters: Record<MarkerKind, boolean>;
  counts: Record<MarkerKind, number>;
  onToggle: (kind: MarkerKind) => void;
}

export function MapLegend({ filters, counts, onToggle }: MapLegendProps) {
  return (
    <div className="glass-panel rounded-xl border border-white/10 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Легенда
      </p>
      <ul className="space-y-2">
        {LEGEND.map((item) => (
          <li key={item.kind}>
            <button
              type="button"
              onClick={() => onToggle(item.kind)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                filters[item.kind] ? "bg-white/5" : "opacity-40",
              )}
            >
              <span className={cn("flex items-center gap-2 font-medium", item.color)}>
                {item.icon}
                {item.label}
              </span>
              <span className="text-xs text-muted-foreground">{counts[item.kind]}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
