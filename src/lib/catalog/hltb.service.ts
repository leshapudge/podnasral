import { HowLongToBeatService } from "howlongtobeat";

const hltb = new HowLongToBeatService();

export interface HltbEntry {
  gameId: number;
  name: string;
  gameplayMain: number;
  gameplayMainExtra: number;
  gameplayCompletionist: number;
}

function mapEntry(entry: {
  id: string;
  name: string;
  gameplayMain: number;
  gameplayMainExtra: number;
  gameplayCompletionist: number;
}): HltbEntry {
  return {
    gameId: parseInt(entry.id, 10),
    name: entry.name,
    gameplayMain: entry.gameplayMain,
    gameplayMainExtra: entry.gameplayMainExtra,
    gameplayCompletionist: entry.gameplayCompletionist,
  };
}

export async function searchHltb(title: string): Promise<HltbEntry | null> {
  try {
    const results = await hltb.search(title);
    if (!results?.length) return null;
    const best = results.reduce((a, b) => (b.similarity > a.similarity ? b : a));
    if (best.similarity < 0.4) return null;
    return mapEntry(best);
  } catch (error) {
    console.error("[HLTB] search failed:", error);
    return null;
  }
}

export async function getHltbById(hltbId: number): Promise<HltbEntry | null> {
  try {
    const detail = await hltb.detail(String(hltbId));
    if (!detail) return null;
    return mapEntry(detail);
  } catch (error) {
    console.error("[HLTB] detail failed:", error);
    return null;
  }
}
