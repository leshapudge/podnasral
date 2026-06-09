"use client";

import { Crown, Medal, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { OsPanelFrame } from "../os-panel-frame";
import { OsSectionTitle } from "../os-section-title";
import { McAvatar } from "../mc-avatar";
import type { HomeLeaderboardEntry } from "@/lib/landing/home-data.types";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

function TrendIcon({ trend }: { trend: "up" | "down" | "same" }) {
  if (trend === "up") return <TrendingUp className="h-3 w-3 text-primary" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3 text-mc-redstone" />;
  return <Minus className="h-3 w-3 text-[#5c4a32]" />;
}

const podiumOrder = [2, 1, 3] as const;

interface LeaderboardPanelProps {
  players: HomeLeaderboardEntry[];
}

export function LeaderboardPanel({ players }: LeaderboardPanelProps) {
  const topPlayers = players.slice(0, 8);
  const podium = podiumOrder
    .map((rank) => topPlayers.find((p) => p.rank === rank))
    .filter(Boolean) as HomeLeaderboardEntry[];

  if (!players.length) {
    return (
      <OsPanelFrame>
        <OsSectionTitle>Топ игроков сезона</OsSectionTitle>
        <p className="text-center text-sm text-[#7a6a52]">
          Пока никого в рейтинге — войдите и начните собирать силу
        </p>
      </OsPanelFrame>
    );
  }

  return (
    <OsPanelFrame>
      <OsSectionTitle>Топ игроков сезона</OsSectionTitle>
      <p className="mb-4 text-center text-xs text-[#7a6a52] sm:text-left">
        Рейтинг по силе — крафти предметы, проходи игры и поднимайся выше
      </p>

      {podium.length >= 3 && (
        <div className="mb-6 flex items-end justify-center gap-2 sm:gap-4">
          {podium.map((player) => {
            const isFirst = player.rank === 1;
            return (
              <div
                key={player.rank}
                className={cn(
                  "flex w-full max-w-[140px] flex-col items-center",
                  player.rank === 1 && "order-2",
                  player.rank === 2 && "order-1",
                  player.rank === 3 && "order-3",
                )}
              >
                <McAvatar nickname={player.nickname} src={player.avatar} size={isFirst ? 36 : 28} />
                <p className="mt-2 truncate text-xs font-semibold text-[#e8d5b0]">
                  {player.nickname}
                </p>
                <p className="text-[10px] text-hypixel-gold">{formatNumber(player.power)} PWR</p>
                <div
                  className={cn(
                    "mt-2 flex w-full items-center justify-center rounded-t border border-b-0 border-[#1a1208] bg-[#1a1208]/80",
                    isFirst ? "h-20" : player.rank === 2 ? "h-14" : "h-10",
                  )}
                >
                  {isFirst ? (
                    <Crown className="h-6 w-6 text-hypixel-gold" />
                  ) : (
                    <Medal className="h-5 w-5 text-[#7a6a52]" />
                  )}
                </div>
                <div className="w-full rounded-b border border-t-0 border-[#1a1208] bg-[#2a2118] py-1 text-center font-display text-sm text-primary">
                  #{player.rank}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ul className="space-y-1">
        {topPlayers
          .filter((p) => p.rank > 3)
          .map((player) => (
            <li
              key={player.rank}
              className="flex items-center gap-3 rounded border border-[#1a1208] bg-[#1a1208]/40 px-3 py-2"
            >
              <span className="w-5 font-display text-xs text-[#7a6a52]">{player.rank}</span>
              <McAvatar nickname={player.nickname} src={player.avatar} size={24} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[#e8d5b0]">{player.nickname}</p>
                <p className="truncate text-[10px] text-[#5c4a32]">{player.guild}</p>
              </div>
              <TrendIcon trend={player.trend} />
              <span className="font-display text-xs text-hypixel-gold">
                {formatNumber(player.power)}
              </span>
            </li>
          ))}
      </ul>
    </OsPanelFrame>
  );
}
