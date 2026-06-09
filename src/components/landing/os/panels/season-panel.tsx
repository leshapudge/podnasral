"use client";

import { CheckCircle2, Circle, Clock, Calendar } from "lucide-react";
import { OsPanelFrame } from "../os-panel-frame";
import { OsSectionTitle } from "../os-section-title";
import { McItemSlot } from "../mc-item-slot";
import { Progress } from "@/components/ui/progress";
import { MC_ASSETS } from "@/lib/landing/assets";
import type { HomeSeasonData } from "@/lib/landing/home-data.types";

const milestoneTextures = [
  MC_ASSETS.blocks.grassTop,
  MC_ASSETS.items.ironPickaxe,
  MC_ASSETS.items.witherSkull,
  MC_ASSETS.items.netherStar,
];

interface SeasonPanelProps {
  season: HomeSeasonData | null;
}

export function SeasonPanel({ season }: SeasonPanelProps) {
  if (!season) {
    return (
      <OsPanelFrame>
        <p className="text-center text-sm text-[#7a6a52]">Активный сезон не найден</p>
      </OsPanelFrame>
    );
  }

  if (season.isUpcoming) {
    return (
      <OsPanelFrame>
        <OsSectionTitle>Прогресс ивента</OsSectionTitle>

        <div className="mt-2 rounded border border-primary/30 bg-primary/10 p-5 text-center">
          <Calendar className="mx-auto mb-3 h-8 w-8 text-primary" />
          <p className="font-display text-lg text-[#e8d5b0]">Ивент начнётся {season.startDateLong}</p>
          <p className="mt-2 text-sm text-[#7a6a52]">
            {season.daysUntilStart > 0
              ? `До старта ${season.daysUntilStart} дн.`
              : "Старт сегодня"}
          </p>
          <p className="mt-4 text-xs leading-relaxed text-[#7a6a52]">
            14 дней · аукционы игр · прохождения по HLTB · мировой босс · рейтинг стримеров
          </p>
        </div>

        <div className="mt-4 rounded border border-[#1a1208] bg-[#1a1208]/40 p-4">
          <p className="text-[10px] uppercase tracking-wider text-[#7a6a52]">Период</p>
          <p className="mt-1 text-sm font-medium text-[#e8d5b0]">
            {season.startDate} — {season.endDate}
          </p>
        </div>
      </OsPanelFrame>
    );
  }

  return (
    <OsPanelFrame>
      <OsSectionTitle>Прогресс ивента</OsSectionTitle>

      <div className="mt-2 rounded border border-primary/20 bg-[#1a1208]/60 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-display text-lg text-[#e8d5b0]">{season.name}</p>
            <p className="text-sm text-[#7a6a52]">{season.phase}</p>
          </div>
          <p className="font-display text-4xl text-primary">{season.progress}%</p>
        </div>

        <Progress
          value={season.progress}
          className="mt-4 h-3 bg-[#0d0a08]"
          indicatorClassName="bg-gradient-to-r from-mc-grass-dark via-primary to-mc-diamond"
        />
        <div className="mt-1 flex justify-between text-[10px] text-[#7a6a52]">
          <span>День {season.totalDays - season.daysRemaining}</span>
          <span>День {season.totalDays}</span>
        </div>
      </div>

      <OsSectionTitle className="mt-4">Фазы сезона</OsSectionTitle>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {season.milestones.map((m, i) => (
          <div
            key={m.label}
            className={`flex flex-col items-center gap-2 rounded border p-3 text-center ${
              m.completed
                ? "border-primary/30 bg-primary/10"
                : "border-[#1a1208] bg-[#1a1208]/40 opacity-60"
            }`}
          >
            <McItemSlot
              src={milestoneTextures[i] ?? MC_ASSETS.blocks.stone}
              alt={m.label}
              size="sm"
              active={m.completed}
              enchanted={m.completed}
            />
            <span className="text-xs font-medium text-[#e8d5b0]">{m.label}</span>
            {m.completed ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-[#5c4a32]" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-hypixel-gold/20 bg-hypixel-gold/5 p-4">
          <Clock className="mb-2 h-5 w-5 text-hypixel-gold" />
          <p className="text-[10px] uppercase tracking-wider text-[#7a6a52]">Осталось</p>
          <p className="font-display text-3xl text-hypixel-gold">{season.daysRemaining}</p>
          <p className="text-xs text-[#7a6a52]">дней до конца сезона</p>
        </div>
        <div className="rounded border border-[#1a1208] bg-[#1a1208]/40 p-4">
          <Calendar className="mb-2 h-5 w-5 text-mc-diamond" />
          <p className="text-[10px] uppercase tracking-wider text-[#7a6a52]">Период</p>
          <p className="mt-1 text-sm font-medium text-[#e8d5b0]">
            {season.startDate} — {season.endDate}
          </p>
          <p className="mt-1 text-xs text-[#7a6a52]">{season.totalDays} дней ивента</p>
        </div>
      </div>
    </OsPanelFrame>
  );
}
