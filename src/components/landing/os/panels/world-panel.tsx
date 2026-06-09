"use client";

import { useEffect, useState } from "react";
import { Map } from "lucide-react";
import { OsPanelFrame } from "../os-panel-frame";
import { OsSectionTitle } from "../os-section-title";
import { WorldMapCanvas } from "@/components/world-map/world-map-canvas";
import type { WorldMapData } from "@/lib/world-map/types";

export function WorldPanel() {
  const [data, setData] = useState<WorldMapData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/world-map")
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && json?.data) setData(json.data);
        else setError(true);
      })
      .catch(() => setError(true));
  }, []);

  return (
    <OsPanelFrame className="p-2 sm:p-3">
      <OsSectionTitle>
        <span className="inline-flex items-center gap-2">
          <Map className="h-3.5 w-3.5" />
          Карта мира
        </span>
      </OsSectionTitle>
      <p className="mb-3 text-center text-xs text-[#7a6a52] sm:text-left">
        6 биомов · игроки, боссы, данжи и ивенты
      </p>
      {error && (
        <p className="text-center text-sm text-mc-redstone">Не удалось загрузить карту</p>
      )}
      {!data && !error && (
        <p className="text-center text-sm text-[#7a6a52]">Загрузка карты...</p>
      )}
      {data && (
        <div className="min-h-[400px] flex-1 [&_.react-flow]:bg-[#0d0a08]">
          <WorldMapCanvas data={data} />
        </div>
      )}
    </OsPanelFrame>
  );
}
