import {
  HowLongToBeatService,
  SearchModifier,
  type HowLongToBeatEntry,
} from "howlongtobeat-ts";

const hltb = new HowLongToBeatService(0.35);

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runHltbSearch(title: string) {
  return hltb.search(title, SearchModifier.HIDE_DLC);
}

export async function searchHltb(
  title: string,
  options?: { preferId?: number },
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

      if (options?.preferId) {
        const exact = result.data.find((entry) => entry.id === options.preferId);
        if (exact) return mapEntry(exact);
      }

      const withMainTime = result.data.find((entry) => (entry.mainTime ?? 0) > 0);
      return mapEntry(withMainTime ?? result.data[0]);
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
