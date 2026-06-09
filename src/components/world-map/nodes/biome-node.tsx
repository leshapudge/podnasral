"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { BiomeDefinition } from "@/lib/world-map/types";

export type BiomeNodeData = BiomeDefinition;

function BiomeNodeComponent({ data }: NodeProps & { data: BiomeNodeData }) {
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-2xl border-2 shadow-xl transition-shadow hover:shadow-2xl"
      style={{
        background: `linear-gradient(145deg, ${data.color} 0%, ${data.color}cc 50%, #070b1299 100%)`,
        borderColor: data.borderColor,
        boxShadow: `0 0 30px ${data.borderColor}22, inset 0 1px 0 rgba(255,255,255,0.08)`,
      }}
    >
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-0 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-0 !w-2 !h-2" />
      <Handle type="target" position={Position.Top} id="top" className="!bg-transparent !border-0 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-transparent !border-0 !w-2 !h-2" />

      <div className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, ${data.borderColor} 0%, transparent 50%)`,
        }}
      />

      <div className="relative flex h-full flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-3xl drop-shadow-lg">{data.icon}</span>
          <span
            className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: data.borderColor, background: `${data.borderColor}22` }}
          >
            {data.name}
          </span>
        </div>
        <h3 className="mt-2 font-display text-lg font-bold text-foreground">{data.label}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {data.description}
        </p>
      </div>
    </div>
  );
}

export const BiomeNode = memo(BiomeNodeComponent);
