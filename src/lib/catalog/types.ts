export interface RawgSearchResult {
  id: number;
  slug: string;
  name: string;
  released?: string;
  background_image?: string;
  rating?: number;
  metacritic?: number;
  genres?: { id: number; name: string; slug: string }[];
}

export interface RawgGameDetail extends RawgSearchResult {
  description_raw?: string;
  description?: string;
}

export interface HltbEntry {
  gameId: number;
  name: string;
  gameplayMain: number;
  gameplayMainExtra: number;
  gameplayCompletionist: number;
}
