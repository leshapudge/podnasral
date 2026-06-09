"use client";

import Link from "next/link";
import { Flame, Shield, Skull, Swords, Timer } from "lucide-react";
import { OsPanelFrame } from "../os-panel-frame";
import { OsSectionTitle } from "../os-section-title";
import { Progress } from "@/components/ui/progress";
import { BossDragonPortrait } from "../boss-dragon-portrait";
import type { HomeBossData, HomeSeasonData } from "@/lib/landing/home-data.types";
import { formatNumber } from "@/lib/utils";
import { OsEventBanner } from "../os-event-banner";

interface BossPanelProps {
  boss: HomeBossData | null;
  bosses: HomeBossData[];
  season?: HomeSeasonData | null;
}

export function BossPanel({ boss, bosses, season = null }: BossPanelProps) {
  const eventUpcoming = season?.isUpcoming ?? false;
  if (!boss) {
    return (
      <OsPanelFrame>
        <OsSectionTitle>Мировой босс</OsSectionTitle>
        <p className="text-center text-sm text-[#7a6a52]">
          Боссы сезона ещё не активированы
        </p>
      </OsPanelFrame>
    );
  }

  return (
    <OsPanelFrame>
      <OsSectionTitle>Мировой босс</OsSectionTitle>
      <OsEventBanner season={season} className="mt-2" />

      {bosses.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {bosses.map((b) => (
            <Link
              key={b.slug}
              href={`/?tab=boss`}
              className={`rounded border px-2 py-1 text-[10px] uppercase ${
                b.slug === boss.slug
                  ? "border-boss/50 bg-boss/10 text-boss"
                  : "border-[#1a1208] text-[#7a6a52] hover:text-[#e8d5b0]"
              }`}
            >
              {b.name}
            </Link>
          ))}
        </div>
      )}

      <div className="boss-arena-card mt-2 flex flex-col items-center overflow-visible px-4 py-6">
        <BossDragonPortrait slug={boss.slug} name={boss.name} />
        <p className="mt-2 font-display text-xl text-[#e8d5b0]">{boss.name}</p>
        <p className="text-sm text-[#7a6a52]">{boss.subtitle}</p>
        <span className="mt-2 inline-flex items-center gap-1 rounded border border-boss/40 bg-boss/10 px-2 py-0.5 text-[10px] uppercase text-boss">
          <Flame className="h-3 w-3" />
          {eventUpcoming ? "ОЖИДАНИЕ" : boss.status}
        </span>
      </div>

      {eventUpcoming ? (
        <p className="mt-4 text-center text-sm text-[#7a6a52]">
          Босс проснётся вместе с ивентом {season?.startDateLong ?? ""}
        </p>
      ) : (
      <div className="mt-4 rounded border border-[#1a1208] bg-[#1a1208]/60 p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase text-[#7a6a52]">Здоровье</p>
            <p className="font-display text-2xl text-boss">
              {formatNumber(boss.currentHp)}
              <span className="text-sm font-normal text-[#7a6a52]">
                {" "}/ {formatNumber(boss.maxHp)}
              </span>
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs text-[#7a6a52]">
            <Timer className="h-3.5 w-3.5" />
            {boss.timeRemaining}
          </span>
        </div>
        <Progress
          value={boss.hpPercent}
          className="mt-3 h-4 bg-mc-redstone/20"
          indicatorClassName="bg-gradient-to-r from-mc-redstone via-boss to-hypixel-gold"
        />
        <p className="mt-1 text-right text-xs text-boss">{boss.hpPercent}% осталось</p>
      </div>
      )}

      {!eventUpcoming && boss.topDamagers.length > 0 && (
        <>
          <OsSectionTitle className="mt-4">Топ урон</OsSectionTitle>
          <ul className="mt-2 space-y-2">
            {boss.topDamagers.map((d, i) => (
              <li
                key={`${d.nickname}-${i}`}
                className="rounded border border-[#1a1208] bg-[#1a1208]/40 px-3 py-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#e8d5b0]">
                    <span className="mr-2 text-[#7a6a52]">#{i + 1}</span>
                    {d.nickname}
                  </span>
                  <span className="font-display text-boss">{formatNumber(d.damage)}</span>
                </div>
                <Progress
                  value={d.percent * 5}
                  className="mt-1.5 h-1"
                  indicatorClassName="bg-boss"
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {!eventUpcoming && (
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link href="/streamer" className="mc-os-btn inline-flex items-center gap-2 px-5 py-2 text-xs">
          <Swords className="h-3.5 w-3.5" />
          В бой
        </Link>
        <span className="flex items-center gap-1.5 text-xs text-[#7a6a52]">
          <Shield className="h-3.5 w-3.5" />
          {formatNumber(boss.totalDamagers)} бойцов
        </span>
        <span className="flex items-center gap-1.5 text-xs text-[#7a6a52]">
          <Skull className="h-3.5 w-3.5" />
          Loot Pool сезона
        </span>
      </div>
      )}
    </OsPanelFrame>
  );
}
