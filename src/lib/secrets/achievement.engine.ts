import { getAchievementDef, SECRET_ACHIEVEMENTS } from "./definitions";
import type { UnlockResult } from "./types";

export async function unlockAchievementForUser(
  _userId: string,
  slug: string,
): Promise<UnlockResult> {
  const def = getAchievementDef(slug);
  if (!def) return { unlocked: false, slug };
  return { unlocked: true, slug, name: def.name, icon: def.icon };
}

export async function getUserAchievementSlugs(_userId: string): Promise<string[]> {
  return [];
}

export function buildAchievementCollection(unlockedSlugs: Set<string>) {
  return SECRET_ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: unlockedSlugs.has(a.slug),
  }));
}

export function totalAchievementPoints(unlockedSlugs: Set<string>) {
  return SECRET_ACHIEVEMENTS.filter((a) => unlockedSlugs.has(a.slug)).reduce(
    (sum, a) => sum + a.points,
    0,
  );
}
