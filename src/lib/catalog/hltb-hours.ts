import type { CatalogGame } from "@prisma/client";

export function normalizeHltbMainHours(hours: number | null | undefined) {
  if (typeof hours !== "number" || !Number.isFinite(hours) || hours <= 0) return null;
  return hours;
}

/** Main Story from HLTB only — RAWG playtime and legacy rows without sync do not count. */
export function getCatalogHltbMainStoryHours(
  game: Pick<CatalogGame, "mainStoryHours" | "hltbSyncedAt"> | null | undefined,
) {
  if (!game?.hltbSyncedAt) return null;
  return normalizeHltbMainHours(game.mainStoryHours);
}
