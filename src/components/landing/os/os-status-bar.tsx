"use client";

import { useEffect, useState } from "react";
import type { AppTabSlug } from "@/lib/landing/app-tabs";
import type { HomeSeasonData } from "@/lib/landing/home-data.types";

interface OsStatusBarProps {
  season: HomeSeasonData | null;
  onTabChange: (tab: AppTabSlug) => void;
}

export function OsStatusBar({ season, onTabChange }: OsStatusBarProps) {
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
      <span className="tracking-wider">mineseason_v1.0.0</span>
      <span className="hidden text-center text-[#7a6a52] sm:inline">
        {season
          ? season.isUpcoming
            ? `Старт ${season.startDateLong} · через ${season.daysUntilStart} дн.`
            : `До конца сезона: ${season.daysRemaining} дн. · ${season.phase}`
          : "Сезон не активен"}
      </span>
      <div className="flex items-center gap-3 tabular-nums text-[#a89070]">
        <button
          type="button"
          onClick={() => onTabChange("secrets")}
          className="hidden hover:text-primary sm:inline"
        >
          Секреты
        </button>
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
