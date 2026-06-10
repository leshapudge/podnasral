import { EVENT_BRAND } from "@/lib/event/event-brand";
import type { MeData } from "@/lib/api/client";
import type { PlayerClass } from "./profile-types";

export interface ProfileSummary {
  level: number;
  experience: number;
  experienceToNext: number;
  power: number;
  rating: number;
  guild: string;
  seasonName: string;
  playerClass: PlayerClass;
}

export interface ProfileAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  unlockedAt: string | null;
  powerBonus: number;
  secret: boolean;
}

export interface ProfileCompletion {
  id: string;
  game: string;
  type: string;
  score: number;
  maxScore: number;
  rewards: string;
  completedAt: string;
  duration: string;
  status: string;
}

export interface ProfileQuest {
  id: string;
  name: string;
  type: string;
  progress: number;
  target: number;
  status: string;
  reward: string;
  expiresIn: string;
}

export interface ProfileHistoryEntry {
  id: string;
  type: string;
  title: string;
  detail: string;
  timestamp: string;
}

export interface ProfilePageData {
  summary: ProfileSummary | null;
  achievements: ProfileAchievement[];
  completions: ProfileCompletion[];
  quests: ProfileQuest[];
  history: ProfileHistoryEntry[];
}

export function buildProfileFromMe(me: MeData, seasonName = EVENT_BRAND): ProfilePageData {
  const points = me.participant?.totalPoints ?? 0;
  const level = Math.max(1, Math.floor(points / 500) + 1);
  const xpInLevel = points % 500;

  return {
    summary: {
      level,
      experience: xpInLevel,
      experienceToNext: 500,
      power: points,
      rating: points,
      guild: me.participant?.status ?? "IDLE",
      seasonName,
      playerClass: "MINER",
    },
    achievements: [],
    completions: me.currentSession
      ? [
          {
            id: me.currentSession.id,
            game: me.currentSession.game.title,
            type: "В процессе",
            score: me.currentSession.finalScore ?? 0,
            maxScore: 100,
            rewards: me.currentSession.loot.map((l) => l.name).join(", ") || "—",
            completedAt: "—",
            duration: "—",
            status: me.currentSession.status,
          },
        ]
      : [],
    quests: [],
    history: [],
  };
}
