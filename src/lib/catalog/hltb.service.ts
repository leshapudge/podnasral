import {
  HowLongToBeatService,
  SearchModifier,
  type HowLongToBeatEntry,
} from "howlongtobeat-ts";

const hltb = new HowLongToBeatService(0.35);
const MIN_TITLE_MATCH = 0.52;

export interface HltbEntry {
  gameId: number;
  name: string;
  gameplayMain: number;
  gameplayMainExtra: number;
  gameplayCompletionist: number;
}

export interface HltbSearchOptions {
  preferId?: number;
  releaseYear?: number;
}

function secondsToHours(seconds: number | undefined) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) return 0;
  return seconds / 3600;
}

function mapEntry(entry: HowLongToBeatEntry): HltbEntry {
  return {
    gameId: entry.id,
    name: entry.name,
    gameplayMain: secondsToHours(entry.mainTime),
    gameplayMainExtra: secondsToHours(entry.mainExtraTime),
    gameplayCompletionist: secondsToHours(entry.completionistTime),
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(
      /\s*[-–:]\s*(game of the year|goty|definitive|complete|ultimate|remastered|remake|director's cut|edition).*$/i,
      "",
    )
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleMatchScore(query: string, candidate: string) {
  const q = normalizeTitle(query);
  const c = normalizeTitle(candidate);
  if (!q || !c) return 0;
  if (q === c) return 1;
  if (c.includes(q) || q.includes(c)) return 0.9;

  const qTokens = new Set(q.split(" ").filter(Boolean));
  const cTokens = c.split(" ").filter(Boolean);
  if (qTokens.size === 0 || cTokens.length === 0) return 0;

  let overlap = 0;
  for (const token of qTokens) {
    if (cTokens.includes(token)) overlap += 1;
  }
  return overlap / Math.max(qTokens.size, cTokens.length);
}

function hasMainStory(entry: HowLongToBeatEntry) {
  return (entry.mainTime ?? 0) > 0;
}

function scoreHltbCandidate(
  query: string,
  entry: HowLongToBeatEntry,
  options?: HltbSearchOptions,
) {
  if (!hasMainStory(entry)) return -1;

  const titleScore = Math.max(entry.similarity ?? 0, titleMatchScore(query, entry.name));
  let score = titleScore;

  if (options?.preferId && entry.id === options.preferId) {
    score += 0.25;
  }

  if (options?.releaseYear && entry.releaseYear) {
    const delta = Math.abs(entry.releaseYear - options.releaseYear);
    if (delta === 0) score += 0.08;
    else if (delta <= 1) score += 0.04;
    else if (delta > 3) score -= 0.06;
  }

  const normalizedType = entry.type?.toLowerCase() ?? "";
  if (normalizedType.includes("dlc") && titleScore < 0.75) {
    score -= 0.2;
  }

  return score;
}

export function pickBestHltbEntry(
  query: string,
  entries: HowLongToBeatEntry[],
  options?: HltbSearchOptions,
): HowLongToBeatEntry | null {
  if (!entries.length) return null;

  if (options?.preferId) {
    const preferred = entries.find((entry) => entry.id === options.preferId);
    if (preferred && hasMainStory(preferred)) return preferred;
  }

  const ranked = entries
    .map((entry) => ({ entry, score: scoreHltbCandidate(query, entry, options) }))
    .filter((row) => row.score >= MIN_TITLE_MATCH)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.entry ?? null;
}

async function runHltbSearch(title: string) {
  return hltb.search(title, SearchModifier.HIDE_DLC);
}

export async function searchHltb(
  title: string,
  options?: HltbSearchOptions,
): Promise<HltbEntry | null> {
  const query = title.trim();
  if (!query) return null;

  let lastError: unknown = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await runHltbSearch(query);
      if (!result.success || !result.data.length) {
        if (result.error) console.warn("[HLTB] search:", result.error);
        if (attempt === 0) {
          await sleep(400);
          continue;
        }
        return null;
      }

      const best = pickBestHltbEntry(query, result.data, options);
      if (!best) {
        if (attempt === 0) {
          await sleep(400);
          continue;
        }
        return null;
      }

      return mapEntry(best);
    } catch (error) {
      lastError = error;
      if (attempt === 0) {
        await sleep(400);
        continue;
      }
    }
  }

  console.error("[HLTB] search failed:", lastError);
  return null;
}

export async function getHltbById(hltbId: number, title?: string): Promise<HltbEntry | null> {
  if (!title?.trim()) return null;
  return searchHltb(title, { preferId: hltbId });
}
