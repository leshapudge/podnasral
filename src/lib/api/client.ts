/**
 * Unified API client for PODNASRAL.
 * All routes return { success: true, data } or legacy shapes (auto-unwrapped).
 */

const API = "/api/v1";
const ROOT = "/api";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function unwrap<T>(json: unknown): T {
  if (!json || typeof json !== "object") return json as T;
  const o = json as Record<string, unknown>;

  if (o.success === true && "data" in o) return o.data as T;

  // Legacy v2 wrappers
  if ("event" in o) return o.event as T;
  if ("leaderboard" in o) return o.leaderboard as T;
  if ("streamers" in o) return o.streamers as T;
  if ("boss" in o) return o.boss as T;
  if ("items" in o && !("nextCursor" in o)) return o.items as T;
  if ("recipes" in o) return o.recipes as T;
  if ("auction" in o && Object.keys(o).length <= 2) return o as T;
  if ("participant" in o && Object.keys(o).length === 1) return o.participant as T;
  if ("session" in o && Object.keys(o).length === 1) return o.session as T;

  return json as T;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const json = await parseJson(res);

  if (!res.ok) {
    const err = json as { error?: { message?: string; code?: string } } | null;
    throw new ApiClientError(
      err?.error?.message ?? `HTTP ${res.status}`,
      err?.error?.code,
      res.status,
    );
  }

  return unwrap<T>(json);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EventData {
  id: string;
  name: string;
  status: string;
  startsAt: string;
  endsAt: string;
  progress: number;
  daysRemaining: number;
  daysUntilStart?: number;
  totalDays: number;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  nickname: string;
  twitchLogin?: string | null;
  avatar: string | null;
  totalPoints: number;
  status: string;
  isLive: boolean;
  currentGame: {
    title: string;
    coverImage?: string | null;
    progressPct?: number;
    difficulty?: string | null;
    sessionStatus?: string;
    hltbHours?: number | null;
    playTimeMs?: number;
    projectedPoints?: number | null;
  } | null;
}

export interface StreamerRosterEntry extends LeaderboardEntry {
  registered: boolean;
  displayOrder: number;
}

export interface ParticipantInventoryItem {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  rarity: string;
  kind: string;
  quantity: number;
  effects: Record<string, number>;
  iconUrl?: string | null;
  active: boolean;
}

export interface ParticipantDetail {
  id: string;
  nickname: string;
  twitchLogin?: string | null;
  avatar: string | null;
  totalPoints: number;
  status: string;
  isLive: boolean;
  currentGame: LeaderboardEntry["currentGame"];
  currentSession: SessionData | null;
  inventory: ParticipantInventoryItem[];
  history: {
    id: string;
    game: string;
    cover: string | null;
    status: string;
    finalScore: number | null;
    dropPenalty: number | null;
    difficulty: string | null;
    completedAt: string | null;
    playerRating: number | null;
    playerReview: string | null;
  }[];
  completedGames: {
    id: string;
    title: string;
    cover: string | null;
    rating: number;
    review: string;
    finalScore: number | null;
    difficulty: string | null;
    completedAt: string | null;
  }[];
  stats: { gamesPlayed: number; gamesCompleted: number };
}

export interface BossData {
  slug?: string;
  name: string;
  currentHp: number;
  maxHp: number;
  hpPercent: number;
  status: string;
  topDamagers: { nickname: string; damage: number; percent: number }[];
}

export interface FeedItem {
  id: string;
  type: string;
  actor: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface MeData {
  user: { id: string; name: string | null; image: string | null; role: string; twitchLogin: string | null };
  participant: { id: string; totalPoints: number; status: string } | null;
  inventory: {
    id: string;
    slug: string;
    name: string;
    rarity: string;
    kind: string;
    quantity: number;
    effects: Record<string, number>;
    iconUrl?: string | null;
  }[];
  currentSession: SessionData | null;
}

export interface SessionData {
  id: string;
  status: string;
  difficulty: string | null;
  activePlayMs: number;
  progressPct: number;
  hltbMainHours: number;
  game: { title: string; coverImage: string | null };
  finalScore: number | null;
  dropPenalty: number | null;
  playerRating: number | null;
  playerReview: string | null;
  needsReview: boolean;
  scoreBreakdown: Record<string, number> | null;
  loot: { slug: string; name: string; rarity: string; iconUrl?: string | null }[];
  activeModifiers: {
    slug: string;
    name: string;
    iconUrl: string;
    effects: string[];
  }[];
  casino: {
    spinsTotal: number;
    spinsUsed: number;
    spinsRemaining: number;
    finished: boolean;
    manualBonusApplied: boolean;
    maxManualBonusSpins: number;
  };
}

export interface CasinoSpinResult {
  drop: { slug: string; name: string; rarity: string; iconUrl?: string | null };
  reels: { id: string; label: string; texture: string }[];
  activeModifiers: SessionData["activeModifiers"];
  casino: SessionData["casino"];
  session: SessionData;
}

export interface CatalogItemData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  rarity: string;
  kind: string;
  effects: Record<string, number>;
  iconUrl: string | null;
  recipes: { recipeName: string; ingredients: string[] }[];
}

export interface CraftRecipeData {
  id: string;
  slug: string;
  name: string;
  resultQty: number;
  resultItem: { slug: string; name: string; rarity: string; kind: string };
  ingredients: {
    quantity: number;
    itemDefinition: { slug: string; name: string; rarity: string };
  }[];
}

export interface ArcadeWallet {
  coins: number;
  diamonds: number;
  netWorth: number;
}

export interface ArcadeLeaderboardEntry {
  rank: number;
  twitchLogin: string | null;
  name: string;
  image: string | null;
  coins: number;
  diamonds: number;
  netWorth: number;
}

export interface ArcadeLeaderboards {
  winners: ArcadeLeaderboardEntry[];
  losers: ArcadeLeaderboardEntry[];
}

export interface ArcadeSpinResult {
  won: boolean;
  delta: number;
  payout: number;
  bet: number;
  matchKind: "none" | "pair" | "triple";
  winTitle?: string | null;
  symbolId?: string | null;
  symbolLabel?: string | null;
  multiplier?: number;
  reels: { id: string; label: string; texture: string }[];
  coins: number;
  diamonds: number;
  netWorth: number;
}

export interface GameSearchResult {
  rawgId: number;
  title: string;
  slug: string;
  coverImage: string | null;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const api = {
  health: () => request<{ status: string; service: string }>(`${ROOT}/health`),

  authMe: () => request<Record<string, unknown>>(`${ROOT}/auth/me`),

  getEvent: () => request<EventData | null>(`${API}/event`),
  getLeaderboard: () => request<LeaderboardEntry[]>(`${API}/leaderboard`),
  getStreamersRoster: () => request<StreamerRosterEntry[]>(`${API}/streamers`),
  getParticipant: (id: string) => request<ParticipantDetail>(`${API}/participants/${id}`),
  getBoss: () => request<BossData | null>(`${API}/boss`),
  getFeed: (limit = 30) =>
    request<{ items: FeedItem[]; nextCursor: string | null }>(`${API}/feed?limit=${limit}`),

  getMe: () => request<MeData>(`${API}/me`),

  searchGames: (q: string) => request<GameSearchResult[]>(`${API}/games/search?q=${encodeURIComponent(q)}`),

  createAuction: async () => {
    const r = await request<{ id: string } | { auction: { id: string } }>(`${API}/auctions`, {
      method: "POST",
    });
    if (r && typeof r === "object" && "auction" in r) return r.auction;
    return r as { id: string };
  },

  applyModifier: (auctionId: string, inventoryItemId: string) =>
    request(`${API}/auctions/${auctionId}/modifiers`, {
      method: "POST",
      body: JSON.stringify({ inventoryItemId }),
    }),

  startAuction: (auctionId: string) =>
    request<{ session?: SessionData; timeline?: unknown[] }>(`${API}/auctions/${auctionId}/start`, {
      method: "POST",
    }),

  rollDifficulty: async (sessionId: string) => {
    const r = await request<{ difficulty: string } | { session: { difficulty: string } }>(
      `${API}/sessions/${sessionId}/roll-difficulty`,
      { method: "POST" },
    );
    if (r && typeof r === "object" && "session" in r) return r.session;
    return r as { difficulty: string };
  },

  confirmSession: (sessionId: string) =>
    request<SessionData>(`${API}/sessions/${sessionId}/confirm`, { method: "POST" }),

  pauseSession: (sessionId: string) =>
    request<SessionData>(`${API}/sessions/${sessionId}/pause`, { method: "POST" }),

  resumeSession: (sessionId: string) =>
    request<SessionData>(`${API}/sessions/${sessionId}/resume`, { method: "POST" }),

  completeSession: (sessionId: string) =>
    request(`${API}/sessions/${sessionId}/complete`, { method: "POST" }),

  dropSession: (sessionId: string) =>
    request(`${API}/sessions/${sessionId}/drop`, { method: "POST" }),

  submitSessionReview: (sessionId: string, rating: number, review: string) =>
    request<{ session: SessionData }>(`${API}/sessions/${sessionId}/review`, {
      method: "POST",
      body: JSON.stringify({ rating, review }),
    }),

  acknowledgeSession: () =>
    request(`${API}/sessions/x/acknowledge`, { method: "POST" }),

  spinCasino: (sessionId: string) =>
    request<CasinoSpinResult>(`${API}/sessions/${sessionId}/casino/spin`, {
      method: "POST",
    }),

  addCasinoBonusSpins: (sessionId: string, bonusSpins: number) =>
    request<{ casino: SessionData["casino"]; session: SessionData }>(
      `${API}/sessions/${sessionId}/casino/bonus-spins`,
      {
        method: "POST",
        body: JSON.stringify({ bonusSpins }),
      },
    ),

  getRecipes: () => request<CraftRecipeData[]>(`${API}/craft/recipes`),

  getItemCatalog: () => request<CatalogItemData[]>(`${API}/items`),

  getArcadeMe: () => request<ArcadeWallet>(`${API}/arcade/me`),
  getArcadeLeaderboard: () => request<ArcadeLeaderboards>(`${API}/arcade/leaderboard`),
  arcadeSpin: (bet: number) =>
    request<ArcadeSpinResult>(`${API}/arcade/spin`, {
      method: "POST",
      body: JSON.stringify({ bet }),
    }),

  craft: (recipeId: string) =>
    request(`${API}/craft/${recipeId}`, { method: "POST" }),

  admin: {
    stats: () => request<Record<string, number>>(`${API}/admin/stats`),
    getPool: async () => {
      const r = await request<
        | { pool: { catalogGame: { title: string; mainStoryHours: number | null } }[] }
        | { catalogGame: { title: string; mainStoryHours: number | null } }[]
      >(`${API}/admin/game-pool`);
      if (r && typeof r === "object" && "pool" in r) return r.pool;
      return r as { catalogGame: { title: string; mainStoryHours: number | null } }[];
    },
    addToPool: (rawgId: number, weight?: number) =>
      request(`${API}/admin/game-pool`, {
        method: "POST",
        body: JSON.stringify({ rawgId, weight }),
      }),
    syncHltb: () => request(`${API}/admin/games/sync-hltb`, { method: "POST" }),
    listParticipants: () => request<{ id: string; user: { twitchLogin: string | null; name: string | null } }[]>(`${API}/participants`),
  },
};

export function connectLive(onEvent: (event: { type: string; data?: unknown }) => void) {
  const es = new EventSource(`${API}/live`);
  es.onmessage = (e) => {
    try {
      onEvent(JSON.parse(e.data));
    } catch {
      /* ignore */
    }
  };
  return () => es.close();
}
