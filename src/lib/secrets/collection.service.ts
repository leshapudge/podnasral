import {
  buildAchievementCollection,
  getUserAchievementSlugs,
  totalAchievementPoints,
} from "./achievement.engine";
import { buildArtifactCollection, getUserArtifactSlugs } from "./artifact.engine";
import { SECRET_ACHIEVEMENTS, ARTIFACTS } from "./definitions";
import type { CollectionState, GuestSecretState } from "./types";

function calcPercent(unlocked: number, total: number) {
  if (total <= 0) return 100;
  return Math.round((Math.min(unlocked, total) / total) * 100);
}

export function buildCollectionFromGuest(state: GuestSecretState): CollectionState {
  const achievementSet = new Set(state.achievements);
  const artifactSet = new Set(state.artifacts);

  const achievements = buildAchievementCollection(achievementSet).map((a) => ({
    ...a,
    unlockedAt: a.unlocked ? new Date().toISOString() : undefined,
  }));

  const artifacts = buildArtifactCollection(artifactSet).map((a) => ({
    ...a,
    foundAt: a.found ? new Date().toISOString() : undefined,
  }));

  const achievementsUnlocked = achievements.filter((a) => a.unlocked).length;
  const artifactsUnlocked = artifacts.filter((a) => a.found).length;
  const achievementsTotal = SECRET_ACHIEVEMENTS.length;
  const artifactsTotal = ARTIFACTS.length;
  const allSecretsTotal = achievementsTotal + artifactsTotal;

  const achievementsPercent = calcPercent(achievementsUnlocked, achievementsTotal);
  const artifactsPercent = calcPercent(artifactsUnlocked, artifactsTotal);
  const totalPercent =
    allSecretsTotal > 0 ? Math.round(((achievementsUnlocked + artifactsUnlocked) / allSecretsTotal) * 100) : 100;

  return {
    achievements,
    artifacts,
    progress: {
      achievementsPercent,
      artifactsPercent,
      totalPercent,
      points: totalAchievementPoints(achievementSet),
    },
  };
}

export async function buildCollectionForUser(userId: string): Promise<CollectionState> {
  const [achievementSlugs, artifactSlugs] = await Promise.all([
    getUserAchievementSlugs(userId),
    getUserArtifactSlugs(userId),
  ]);

  const achievementSet = new Set(achievementSlugs);
  const artifactSet = new Set(artifactSlugs);

  const achievements = buildAchievementCollection(achievementSet);
  const artifacts = buildArtifactCollection(artifactSet);

  const achievementsUnlocked = achievements.filter((a) => a.unlocked).length;
  const artifactsUnlocked = artifacts.filter((a) => a.found).length;
  const achievementsTotal = SECRET_ACHIEVEMENTS.length;
  const artifactsTotal = ARTIFACTS.length;
  const allSecretsTotal = achievementsTotal + artifactsTotal;

  const achievementsPercent = calcPercent(achievementsUnlocked, achievementsTotal);
  const artifactsPercent = calcPercent(artifactsUnlocked, artifactsTotal);
  const totalPercent =
    allSecretsTotal > 0 ? Math.round(((achievementsUnlocked + artifactsUnlocked) / allSecretsTotal) * 100) : 100;

  return {
    achievements,
    artifacts,
    progress: {
      achievementsPercent,
      artifactsPercent,
      totalPercent,
      points: totalAchievementPoints(achievementSet),
    },
  };
}
