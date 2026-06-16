import type { Rarity } from "@prisma/client";

export type SecretEventType =
  | "LOGO_CLICK"
  | "PAGE_VISIT"
  | "AFK_MILESTONE"
  | "CORNER_HIT"
  | "COMMAND_RUN"
  | "ARTIFACT_FOUND"
  | "SECRET_PAGE_VISIT"
  | "NIGHT_OWL"
  | "DEVTOOLS_OPEN";

export interface SecretAchievementDef {
  slug: string;
  name: string;
  description: string;
  icon: string;
  rarity: Rarity;
  points: number;
  hidden: boolean;
}

export interface ArtifactDef {
  slug: string;
  name: string;
  icon: string;
  rarity: Rarity;
  description: string;
  pages: string[];
}

export interface SecretCommandDef {
  command: string;
  description: string;
  hidden?: boolean;
}

export interface GuestSecretState {
  achievements: string[];
  artifacts: string[];
  visitedPages: string[];
  logoClicks: number;
  activeMs: number;
  lastActiveAt: number;
  cornerHit: boolean;
  commandsRun: string[];
}

export interface CollectionState {
  achievements: {
    slug: string;
    name: string;
    description: string;
    icon: string;
    rarity: Rarity;
    points: number;
    hidden: boolean;
    unlocked: boolean;
    unlockedAt?: string;
  }[];
  artifacts: {
    slug: string;
    name: string;
    icon: string;
    rarity: Rarity;
    description: string;
    pages: string[];
    found: boolean;
    foundAt?: string;
  }[];
  progress: {
    achievementsPercent: number;
    artifactsPercent: number;
    totalPercent: number;
    points: number;
  };
}

export interface UnlockResult {
  unlocked: boolean;
  slug: string;
  name?: string;
  icon?: string;
  alreadyHad?: boolean;
}
