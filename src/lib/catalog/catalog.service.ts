import type { CatalogGame } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import { notFound } from "@/lib/api/errors";
import { searchHltb, getHltbById } from "./hltb.service";
import { getRawgGameById } from "./rawg.service";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 100);
}

export async function findCatalogGameByRawgId(rawgId: number) {
  return prisma.catalogGame.findUnique({ where: { rawgId } });
}

export async function findCatalogGameById(id: string) {
  return prisma.catalogGame.findUnique({ where: { id } });
}

export async function syncCatalogGameFromRawg(rawgId: number): Promise<CatalogGame> {
  const existing = await findCatalogGameByRawgId(rawgId);
  if (existing?.hltbSyncedAt && existing.mainStoryHours) {
    return existing;
  }

  const rawg = await getRawgGameById(rawgId);
  if (!rawg) throw notFound("RAWG game");

  const hltb = await searchHltb(rawg.name);

  const data = {
    rawgId,
    hltbId: hltb?.gameId ?? existing?.hltbId ?? null,
    title: rawg.name,
    slug: rawg.slug || slugify(rawg.name),
    coverImage: rawg.background_image ?? null,
    mainStoryHours: hltb?.gameplayMain ?? existing?.mainStoryHours ?? null,
    mainExtraHours: hltb?.gameplayMainExtra ?? existing?.mainExtraHours ?? null,
    completionistHours: hltb?.gameplayCompletionist ?? existing?.completionistHours ?? null,
    hltbSyncedAt: hltb ? new Date() : existing?.hltbSyncedAt ?? null,
  };

  return prisma.catalogGame.upsert({
    where: { rawgId },
    create: data,
    update: data,
  });
}

export async function ensureCatalogGame(rawgId: number): Promise<CatalogGame> {
  const existing = await findCatalogGameByRawgId(rawgId);
  if (existing) return existing;
  return syncCatalogGameFromRawg(rawgId);
}

export async function syncGameHltb(catalogGameId: string) {
  const game = await prisma.catalogGame.findUnique({ where: { id: catalogGameId } });
  if (!game) throw notFound("Game");

  const hltb = game.hltbId ? await getHltbById(game.hltbId) : await searchHltb(game.title);
  if (!hltb) return game;

  return prisma.catalogGame.update({
    where: { id: catalogGameId },
    data: {
      hltbId: hltb.gameId,
      mainStoryHours: hltb.gameplayMain || null,
      mainExtraHours: hltb.gameplayMainExtra || null,
      completionistHours: hltb.gameplayCompletionist || null,
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
    if (!entry.catalogGame.mainStoryHours) {
      results.push(await syncGameHltb(entry.catalogGameId));
    }
  }
  return results;
}
