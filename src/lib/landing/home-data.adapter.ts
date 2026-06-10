import type { BossData, EventData, LeaderboardEntry } from "@/lib/api/client";
import { getEventPhaseLabel, isEventUpcoming } from "@/lib/event/event-timing";
import {
  formatDateRu,
  formatDateRuLong,
  formatTimeRemaining,
} from "@/lib/utils/time";
import type {
  HomeBossData,
  HomeLeaderboardEntry,
  HomePageData,
  HomeSeasonData,
  HomeStat,
} from "./home-data.types";

function buildSeason(event: EventData): HomeSeasonData {
  const progress = event.progress;
  const quarter = progress / 25;
  const upcoming = isEventUpcoming(event.status, event.startsAt);
  return {
    name: event.name,
    slug: "current",
    status: event.status,
    progress,
    daysRemaining: event.daysRemaining,
    daysUntilStart: event.daysUntilStart ?? 0,
    totalDays: event.totalDays,
    phase: getEventPhaseLabel(event.status, progress),
    startDate: formatDateRu(new Date(event.startsAt)),
    startDateLong: formatDateRuLong(event.startsAt),
    endDate: formatDateRu(new Date(event.endsAt)),
    isUpcoming: upcoming,
    milestones: [
      { label: "Открытие", completed: !upcoming && quarter >= 1 },
      { label: "Аукционы", completed: !upcoming && quarter >= 2 },
      { label: "Боссы", completed: !upcoming && quarter >= 3 },
      { label: "Финал", completed: !upcoming && quarter >= 4 },
    ],
  };
}

function buildBoss(boss: BossData): HomeBossData {
  const endsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const slug = boss.slug ?? "ender_dragon";
  return {
    slug,
    name: boss.name,
    subtitle: "Мировой босс сезона",
    currentHp: boss.currentHp,
    maxHp: boss.maxHp,
    hpPercent: boss.hpPercent,
    status: boss.status,
    timeRemaining: formatTimeRemaining(endsAt),
    totalDamagers: boss.topDamagers.length,
    topDamagers: boss.topDamagers,
  };
}

function mapLeaderboard(entries: LeaderboardEntry[]): HomeLeaderboardEntry[] {
  return entries.map((e) => ({
    rank: e.rank,
    nickname: e.nickname,
    power: e.totalPoints,
    avatar: e.avatar,
    guild: e.isLive ? "🔴 LIVE" : e.status,
    trend: "same" as const,
  }));
}

export function buildHomePageData(input: {
  event: EventData | null;
  leaderboard: LeaderboardEntry[];
  boss: BossData | null;
}): HomePageData {
  const season = input.event ? buildSeason(input.event) : null;
  const bosses = input.boss ? [buildBoss(input.boss)] : [];

  const upcoming = season?.isUpcoming ?? false;

  const stats: HomeStat[] = upcoming
    ? [
        { label: "Участники", value: input.leaderboard.length, icon: "users" },
        { label: "До старта", value: season?.daysUntilStart ?? "—", icon: "shield" },
        { label: "Старт", value: season?.startDateLong ?? "—", icon: "gamepad" },
        { label: "Длительность", value: season ? `${season.totalDays} дн.` : "—", icon: "swords" },
      ]
    : [
        { label: "Участники", value: input.leaderboard.length, icon: "users" },
        { label: "Дней осталось", value: season?.daysRemaining ?? "—", icon: "shield" },
        { label: "Прогресс", value: season ? `${season.progress}%` : "—", icon: "gamepad" },
        { label: "Босс HP", value: input.boss ? `${input.boss.hpPercent}%` : "—", icon: "swords" },
      ];

  return {
    season,
    stats,
    leaderboard: mapLeaderboard(input.leaderboard),
    featuredBoss: bosses[0] ?? null,
    bosses,
  };
}
