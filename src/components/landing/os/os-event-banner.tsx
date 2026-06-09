import { CalendarClock } from "lucide-react";
import type { HomeSeasonData } from "@/lib/landing/home-data.types";
import { cn } from "@/lib/utils";

interface OsEventBannerProps {
  season: HomeSeasonData | null;
  className?: string;
}

export function OsEventBanner({ season, className }: OsEventBannerProps) {
  if (!season?.isUpcoming) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded border border-primary/30 bg-primary/10 px-4 py-3",
        className,
      )}
    >
      <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="font-display text-sm text-[#e8d5b0]">
          Ивент начнётся {season.startDateLong}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[#7a6a52]">
          {season.daysUntilStart > 0
            ? `До старта ${season.daysUntilStart} дн. · аукционы, игры и босс откроются вместе с ивентом`
            : "Старт сегодня — скоро откроются аукционы и игры"}
        </p>
      </div>
    </div>
  );
}
