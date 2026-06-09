import {
  buildAchievementCollection,
  getUserAchievementSlugs,
  totalAchievementPoints,
} from "./achievement.engine";
import { buildArtifactCollection, getUserArtifactSlugs } from "./artifact.engine";
import { SECRET_ACHIEVEMENTS, ARTIFACTS } from "./definitions";
import type { CollectionState, GuestSecretState } from "./types";

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

  const achievementsPercent = Math.round(
    (achievementSet.size / SECRET_ACHIEVEMENTS.length) * 100,
  );
  const artifactsPercent = Math.round((artifactSet.size / ARTIFACTS.length) * 100);
  const totalPercent = Math.round(
    ((achievementSet.size + artifactSet.size) /
      (SECRET_ACHIEVEMENTS.length + ARTIFACTS.length)) *
      100,
  );

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

  const achievementsPercent = Math.round(
    (achievementSet.size / SECRET_ACHIEVEMENTS.length) * 100,
  );
  const artifactsPercent = Math.round((artifactSet.size / ARTIFACTS.length) * 100);
  const totalPercent = Math.round(
    ((achievementSet.size + artifactSet.size) /
      (SECRET_ACHIEVEMENTS.length + ARTIFACTS.length)) *
      100,
  );

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
