import { unstable_cache } from "next/cache";
import type { RawgGameDetail, RawgSearchResult } from "./types";

const RAWG_BASE = "https://api.rawg.io/api";

function getApiKey() {
  const key = process.env.RAWG_API_KEY;
  if (!key) return null;
  return key;
}

async function rawgFetch<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  const key = getApiKey();
  if (!key) return null;

  const url = new URL(`${RAWG_BASE}${path}`);
  url.searchParams.set("key", key);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

export async function searchRawgGames(query: string, pageSize = 10): Promise<RawgSearchResult[]> {
  if (!query.trim() || !getApiKey()) return [];

  const data = await rawgFetch<{ results: RawgSearchResult[] }>("/games", {
    search: query.trim(),
    page_size: String(pageSize),
    search_precise: "true",
  });

  return data?.results ?? [];
}

export const searchRawgGamesCached = unstable_cache(
  async (query: string) => searchRawgGames(query),
  ["rawg-search"],
  { revalidate: 300, tags: ["rawg-search"] },
);

export async function getRawgGameById(rawgId: number): Promise<RawgGameDetail | null> {
  return rawgFetch<RawgGameDetail>(`/games/${rawgId}`);
}

export const getRawgGameByIdCached = unstable_cache(
  async (rawgId: number) => getRawgGameById(rawgId),
  ["rawg-game"],
  { revalidate: 86400, tags: ["rawg-game"] },
);

// Backward-compatible aliases
export const searchRawg = searchRawgGames;
export const getRawgGame = getRawgGameById;
