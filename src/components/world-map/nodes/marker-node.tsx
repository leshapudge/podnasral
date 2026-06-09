"use client";

import { memo } from "react";
import { type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { MapMarker, MarkerKind } from "@/lib/world-map/types";

const KIND_STYLES: Record<MarkerKind, { ring: string; glow: string; pulse?: boolean }> = {
  player: { ring: "border-primary", glow: "shadow-primary/40" },
  boss: { ring: "border-boss", glow: "shadow-boss/50", pulse: true },
  dungeon: { ring: "border-hypixel-gold", glow: "shadow-hypixel-gold/40" },
  event: { ring: "border-mc-diamond", glow: "shadow-mc-diamond/40", pulse: true },
};

export type MarkerNodeData = MapMarker & { selected?: boolean };

function MarkerNodeComponent({ data }: NodeProps & { data: MarkerNodeData }) {
  const style = KIND_STYLES[data.kind];

  return (
    <button
      type="button"
      className={cn(
        "group flex flex-col items-center gap-1 outline-none",
        data.selected && "scale-110",
      )}
      title={data.label}
    >
      <div
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-full border-2 bg-card/90 text-lg backdrop-blur-sm transition-transform group-hover:scale-110",
          style.ring,
          style.glow,
          style.pulse && "animate-pulse",
          data.selected && "ring-2 ring-white/50",
        )}
      >
        <span className="drop-shadow-md">{data.icon}</span>
        {data.kind === "boss" && data.status === "ACTIVE" && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-boss ring-2 ring-card" />
        )}
        {data.kind === "event" && data.status === "ACTIVE" && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-mc-diamond ring-2 ring-card" />
        )}
      </div>
      <span className="max-w-[80px] truncate rounded bg-card/80 px-1.5 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur-sm">
        {data.label}
      </span>
    </button>
  );
}

export const MarkerNode = memo(MarkerNodeComponent);
