"use client";

import Link from "next/link";
import { ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MapMarker } from "@/lib/world-map/types";
import { getBiome } from "@/lib/world-map/biomes";

const KIND_LABELS: Record<MapMarker["kind"], string> = {
  player: "Игрок",
  boss: "Босс",
  dungeon: "Данж",
  event: "Ивент",
};

interface MarkerDetailProps {
  marker: MapMarker | null;
  onClose: () => void;
}

export function MarkerDetail({ marker, onClose }: MarkerDetailProps) {
  if (!marker) {
    return (
      <div className="glass-panel flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
        Выберите маркер на карте
      </div>
    );
  }

  const biome = getBiome(marker.biomeId);

  return (
    <div className="glass-panel rounded-xl border border-white/10 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{marker.icon}</span>
          <div>
            <Badge variant="outline" className="mb-1 text-[10px] uppercase">
              {KIND_LABELS[marker.kind]}
            </Badge>
            <h3 className="font-display text-lg font-bold">{marker.label}</h3>
            {marker.subtitle && (
              <p className="text-sm text-muted-foreground">{marker.subtitle}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-white/5 hover:text-foreground"
          aria-label="Закрыть"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {biome && (
        <p className="mt-4 text-xs text-muted-foreground">
          Биом: <span className="text-foreground">{biome.icon} {biome.label}</span>
        </p>
      )}

      {marker.status && (
        <p className="mt-2 text-xs">
          Статус:{" "}
          <span className="font-semibold text-boss">{marker.status}</span>
        </p>
      )}

      {marker.meta && (
        <dl className="mt-4 space-y-1 text-xs">
          {Object.entries(marker.meta).map(([key, value]) => (
            <div key={key} className="flex justify-between gap-4">
              <dt className="text-muted-foreground capitalize">{key}</dt>
              <dd className="font-mono font-semibold">
                {typeof value === "number" ? value.toLocaleString("ru-RU") : value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {marker.href && (
        <Button asChild variant="default" size="sm" className="mt-5 w-full">
          <Link href={marker.href}>
            <ExternalLink className="h-4 w-4" />
            Перейти
          </Link>
        </Button>
      )}
    </div>
  );
}
