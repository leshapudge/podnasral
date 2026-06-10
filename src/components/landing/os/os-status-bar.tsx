"use client";

import { useEffect, useState } from "react";
import { EVENT_BRAND_VERSION } from "@/lib/event/event-brand";
import type { HomeSeasonData } from "@/lib/landing/home-data.types";

interface OsStatusBarProps {
  season: HomeSeasonData | null;
}

export function OsStatusBar({ season }: OsStatusBarProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now
    ? now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : "--:--";
  const dateStr = now
    ? now.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
    : "";

  return (
    <footer className="mc-os-status">
      <span className="tracking-wider">{EVENT_BRAND_VERSION}</span>
      <span className="hidden text-center text-[#7a6a52] sm:inline">
        {season
          ? season.isUpcoming
            ? `Старт ${season.startDateLong} · через ${season.daysUntilStart} дн.`
            : `До конца сезона: ${season.daysRemaining} дн. · ${season.phase}`
          : "Сезон не активен"}
      </span>
      <div className="flex items-center gap-3 tabular-nums text-[#a89070]">
        <a href="/settings" className="hidden hover:text-primary sm:inline">
          Звук
        </a>
        <span>{timeStr}</span>
        <span className="text-[#3a3020]">|</span>
        <span className="hidden sm:inline">{dateStr}</span>
      </div>
    </footer>
  );
}
