import {
  HowLongToBeatService,
  SearchModifier,
  type HowLongToBeatEntry,
} from "howlongtobeat-ts";

const hltb = new HowLongToBeatService(0.4);

export interface HltbEntry {
  gameId: number;
  name: string;
  gameplayMain: number;
  gameplayMainExtra: number;
  gameplayCompletionist: number;
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

export async function searchHltb(
  title: string,
  options?: { preferId?: number },
): Promise<HltbEntry | null> {
  const query = title.trim();
  if (!query) return null;

  try {
    const result = await hltb.search(query, SearchModifier.HIDE_DLC);
    if (!result.success || !result.data.length) {
      if (result.error) console.warn("[HLTB] search:", result.error);
      return null;
    }

    if (options?.preferId) {
      const exact = result.data.find((entry) => entry.id === options.preferId);
      if (exact) return mapEntry(exact);
    }

    return mapEntry(result.data[0]);
  } catch (error) {
    console.error("[HLTB] search failed:", error);
    return null;
  }
}

export async function getHltbById(hltbId: number, title?: string): Promise<HltbEntry | null> {
  if (!title?.trim()) return null;
  return searchHltb(title, { preferId: hltbId });
}
