import type { CatalogGame } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import { notFound } from "@/lib/api/errors";
import { searchHltb } from "./hltb.service";
import { getCatalogHltbMainStoryHours, normalizeHltbMainHours } from "./hltb-hours";
import { getRawgGameById } from "./rawg.service";
import type { RawgGameDetail } from "./types";

function normalizeHours(hours: number | null | undefined) {
  if (typeof hours !== "number" || !Number.isFinite(hours) || hours <= 0) return null;
  return hours;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

/** Slug is unique per RAWG id so seed rows and live search never collide. */
export function buildCatalogSlug(rawg: Pick<RawgGameDetail, "slug" | "name">, rawgId: number) {
  const base = slugify(rawg.slug || rawg.name) || "game";
  return `${base}-r${rawgId}`;
}

export async function findCatalogGameByRawgId(rawgId: number) {
  return prisma.catalogGame.findUnique({ where: { rawgId } });
}

export async function findCatalogGameById(id: string) {
  return prisma.catalogGame.findUnique({ where: { id } });
}

async function reconcileLegacyCatalogRow(
  rawg: RawgGameDetail,
  rawgId: number,
): Promise<CatalogGame | null> {
  const baseSlug = slugify(rawg.slug || rawg.name);
  if (!baseSlug) return null;

  const legacy = await prisma.catalogGame.findFirst({
    where: {
      OR: [{ slug: baseSlug }, { slug: { startsWith: `${baseSlug}-r` } }],
      NOT: { rawgId },
    },
  });
  if (!legacy) return null;

  const legacyTitle = legacy.title.trim().toLowerCase();
  const rawgTitle = rawg.name.trim().toLowerCase();
  if (legacyTitle !== rawgTitle && !legacyTitle.includes(rawgTitle) && !rawgTitle.includes(legacyTitle)) {
    return null;
  }

  return legacy;
}

async function resolveAvailableHltbId(
  hltbGameId: number | null | undefined,
  rawgId: number,
  catalogGameId?: string,
) {
  if (!hltbGameId) return null;

  const conflict = await prisma.catalogGame.findFirst({
    where: {
      hltbId: hltbGameId,
      NOT: catalogGameId ? { id: catalogGameId } : { rawgId },
    },
    select: { id: true },
  });

  return conflict ? null : hltbGameId;
}

function parseReleaseYear(released?: string | null) {
  if (!released) return undefined;
  const year = Number.parseInt(released.slice(0, 4), 10);
  return Number.isFinite(year) ? year : undefined;
}

export async function syncCatalogGameFromRawg(
  rawgId: number,
  options?: { fetchHltb?: boolean; forceHltb?: boolean },
): Promise<CatalogGame> {
  const fetchHltb = options?.fetchHltb !== false;
  const existing = await findCatalogGameByRawgId(rawgId);
  if (existing && getCatalogHltbMainStoryHours(existing) && !options?.forceHltb) {
    return existing;
  }

  const rawg = await getRawgGameById(rawgId);
  if (!rawg) throw notFound("RAWG game");

  let hltb: Awaited<ReturnType<typeof searchHltb>> = null;
  if (fetchHltb) {
    try {
      hltb = await searchHltb(rawg.name, {
        preferId: existing?.hltbId ?? undefined,
        releaseYear: parseReleaseYear(rawg.released),
      });
    } catch (error) {
      console.warn("[catalog] HLTB lookup failed for", rawg.name, error);
    }
  }
  const existingMainExtra = normalizeHours(existing?.mainExtraHours);
  const existingCompletionist = normalizeHours(existing?.completionistHours);
  const hltbMain = normalizeHours(hltb?.gameplayMain);
  const hltbMainExtra = normalizeHours(hltb?.gameplayMainExtra);
  const hltbCompletionist = normalizeHours(hltb?.gameplayCompletionist);
  const legacy = existing ? null : await reconcileLegacyCatalogRow(rawg, rawgId);
  const hltbId = await resolveAvailableHltbId(
    hltb?.gameId ?? existing?.hltbId ?? legacy?.hltbId ?? null,
    rawgId,
    existing?.id ?? legacy?.id,
  );
  const verifiedExisting = getCatalogHltbMainStoryHours(existing);

  const data = {
    rawgId,
    hltbId,
    title: rawg.name,
    slug: buildCatalogSlug(rawg, rawgId),
    coverImage: rawg.background_image ?? null,
    mainStoryHours: hltbMain ?? (verifiedExisting ? existing?.mainStoryHours ?? null : null),
    mainExtraHours: hltbMainExtra ?? existingMainExtra ?? null,
    completionistHours: hltbCompletionist ?? existingCompletionist ?? null,
    hltbSyncedAt: hltbMain ? new Date() : verifiedExisting ? existing?.hltbSyncedAt ?? null : null,
  };

  if (existing) {
    return prisma.catalogGame.update({
      where: { id: existing.id },
      data,
    });
  }

  if (legacy) {
    return prisma.catalogGame.update({
      where: { id: legacy.id },
      data,
    });
  }

  return prisma.catalogGame.create({ data });
}

export async function ensureCatalogGame(rawgId: number): Promise<CatalogGame> {
  const existing = await findCatalogGameByRawgId(rawgId);
  if (existing) return existing;
  return syncCatalogGameFromRawg(rawgId);
}

export async function syncGameHltb(catalogGameId: string) {
  const game = await prisma.catalogGame.findUnique({ where: { id: catalogGameId } });
  if (!game) throw notFound("Game");

  const hltb = await searchHltb(game.title, {
    preferId: game.hltbId ?? undefined,
  });
  if (!hltb) return game;

  const hltbId = await resolveAvailableHltbId(hltb.gameId, game.rawgId, game.id);

  return prisma.catalogGame.update({
    where: { id: catalogGameId },
    data: {
      hltbId,
      mainStoryHours: normalizeHours(hltb.gameplayMain),
      mainExtraHours: normalizeHours(hltb.gameplayMainExtra),
      completionistHours: normalizeHours(hltb.gameplayCompletionist),
      hltbSyncedAt: new Date(),
    },
  });
}

export async function importGameFromRawg(rawgId: number) {
  return syncCatalogGameFromRawg(rawgId);
}

export async function addGameToPool(eventId: string, catalogGameId: string, weight = 100) {
  return prisma.eventGamePool.upsert({
    where: { eventId_catalogGameId: { eventId, catalogGameId } },
    create: { eventId, catalogGameId, weight },
    update: { isEnabled: true, weight },
  });
}

export async function syncAllPoolHltb(eventId: string) {
  const pool = await prisma.eventGamePool.findMany({
    where: { eventId, isEnabled: true },
    include: { catalogGame: true },
  });

  const results = [];
  for (const entry of pool) {
    if (!getCatalogHltbMainStoryHours(entry.catalogGame)) {
      results.push(await syncGameHltb(entry.catalogGameId));
    }
  }
  return results;
}
