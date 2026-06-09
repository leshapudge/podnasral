"use client";

import {
  Activity,
  Award,
  BarChart3,
  Gamepad2,
  Hammer,
  Shield,
  Skull,
  Swords,
  TrendingUp,
  Tv,
  Users,
} from "lucide-react";
import { OsPanelFrame } from "../os-panel-frame";
import { OsSectionTitle } from "../os-section-title";
import type { HomeFeedItem, HomeSeasonData, HomeStat } from "@/lib/landing/home-data.types";
import { OsEventBanner } from "../os-event-banner";
import { formatNumber } from "@/lib/utils";

const activityConfig = {
  craft: { icon: Hammer, color: "text-mc-diamond" },
  game: { icon: Gamepad2, color: "text-primary" },
  boss: { icon: Skull, color: "text-boss" },
  achievement: { icon: Award, color: "text-hypixel-gold" },
  rank: { icon: TrendingUp, color: "text-mc-diamond" },
} as const;

const statIcons = {
  users: Users,
  gamepad: Gamepad2,
  hammer: Hammer,
  swords: Swords,
  shield: Shield,
  twitch: Tv,
} as const;

interface FeedPanelProps {
  feed: HomeFeedItem[];
  eventStats: HomeStat[];
  season?: HomeSeasonData | null;
}

export function FeedPanel({ feed, eventStats, season = null }: FeedPanelProps) {
  return (
    <OsPanelFrame>
      <OsSectionTitle>Последняя активность</OsSectionTitle>
      <OsEventBanner season={season} className="mt-2" />

      {feed.length === 0 ? (
        <p className="mt-2 text-center text-sm text-[#7a6a52]">
          {season?.isUpcoming
            ? `Лента откроется ${season.startDateLong} вместе со стартом ивента`
            : "Пока нет активности — сыграйте, атакуйте босса или отправьте прохождение"}
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {feed.map((item) => {
            const config = activityConfig[item.type];
            const Icon = config.icon;
            return (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded border border-[#1a1208] bg-[#1a1208]/40 px-3 py-2.5"
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.color}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#e8d5b0]">
                    <span className="font-semibold text-primary">{item.player}</span>{" "}
                    {item.action} {item.item}
                  </p>
                  <p className="text-[10px] text-[#5c4a32]">{item.time}</p>
                </div>
                {item.power && (
                  <span className="shrink-0 font-display text-xs text-hypixel-gold">
                    {item.power}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <OsSectionTitle className="mt-6">Статистика ивента</OsSectionTitle>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {eventStats.map((stat) => {
          const Icon = statIcons[stat.icon as keyof typeof statIcons] ?? BarChart3;
          return (
            <div
              key={stat.label}
              className="rounded border border-[#1a1208] bg-[#1a1208]/40 p-3"
            >
              <Icon className="mb-1.5 h-4 w-4 text-[#7a6a52]" />
              <p className="font-display text-lg text-[#e8d5b0]">
                {typeof stat.value === "number" ? formatNumber(stat.value) : stat.value}
              </p>
              <p className="text-[10px] text-[#5c4a32]">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[#5c4a32]">
        <Activity className="h-3 w-3 text-primary" />
        Лента из базы данных · обновляется при перезагрузке
      </div>
    </OsPanelFrame>
  );
}
