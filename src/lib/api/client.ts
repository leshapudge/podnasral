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
  if ("event" in o && !("requests" in o) && Object.keys(o).length === 1) return o.event as T;
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
  effects: Record<string, number | boolean | string | string[]>;
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
    playTimeMs: number | null;
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
    playTimeMs: number | null;
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
    effects: Record<string, number | boolean | string | string[]>;
    iconUrl?: string | null;
  }[];
  currentSession: SessionData | null;
  pendingModifiers: {
    id: string;
    slug: string;
    name: string;
    iconUrl: string;
    effects: string[];
  }[];
  activeAuction: {
    id: string;
    status: "PREPARING" | "RUNNING";
    autoAppliedModifierIds: string[];
    resolvedGame: {
      id: string;
      title: string;
      mainStoryHours: number | null;
    } | null;
  } | null;
  donationAlerts: {
    webhookPath: string;
  } | null;
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
  effects: Record<string, number | boolean | string | string[]>;
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
  player?: {
    twitchLogin: string | null;
    name: string | null;
    image: string | null;
  };
}

export interface GameSearchResult {
  rawgId: number;
  title: string;
  slug: string;
  coverImage: string | null;
}

export interface AuctionGameSearchData {
  auctionId: string;
  status: "PREPARING" | "RUNNING";
  canSelectGenre: boolean;
  forcedGenres: string[];
  genreRestrictionApplied: boolean;
  genreDataReady: boolean;
  availableGenres: string[];
  games: {
    catalogGameId: string;
    rawgId: number;
    title: string;
    coverImage: string | null;
    mainStoryHours: number | null;
    mainExtraHours: number | null;
    completionistHours: number | null;
    projectedBaseScore: number;
    genres: string[];
    releaseDate: string | null;
    rating: number | null;
    metacritic: number | null;
  }[];
}

export interface DonationRequestData {
  id: string;
  source: "DONATIONALERTS" | "ADMIN";
  status: "RECEIVED" | "ADDED" | "FAILED";
  donorName: string;
  amount: number;
  currency: string;
  message: string | null;
  gameQuery: string | null;
  rawgId: number | null;
  errorMessage: string | null;
  createdAt: string;
  participant: {
    id: string;
    twitchLogin: string | null;
    name: string | null;
  } | null;
  catalogGame: {
    id: string;
    title: string;
    coverImage: string | null;
    mainStoryHours: number | null;
  } | null;
}

export interface DonationFeedData {
  event: {
    id: string;
    name: string;
    status: string;
    startsAt: string;
    endsAt: string;
  } | null;
  requests: DonationRequestData[];
}

export interface AdminParticipantData {
  id: string;
  totalPoints: number;
  status: string;
  isLive: boolean;
  currentGameTitle: string | null;
  user: {
    twitchLogin: string | null;
    name: string | null;
  };
}

export interface AdminInventoryAdjustResult {
  participantId: string;
  delta: number;
  item: {
    id: string;
    slug: string;
    name: string;
    kind: string;
  };
  totalQuantity: number;
}

export interface AuctionSelectionOptionsData {
  auctionId: string;
  status: "PREPARING" | "RUNNING";
  selectedCatalogGameId: string | null;
  canSelectGenre: boolean;
  forcedGenres: string[];
  genreRestrictionApplied: boolean;
  genreDataReady: boolean;
  availableGenres: string[];
  games: {
    catalogGameId: string;
    title: string;
    coverImage: string | null;
    mainStoryHours: number;
    projectedBaseScore: number;
    genres: string[];
  }[];
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
  getDonationRequests: (limit = 80, participantId?: string) =>
    request<DonationFeedData>(
      `${API}/donations?limit=${limit}${participantId ? `&participantId=${encodeURIComponent(participantId)}` : ""}`,
    ),

  createAuction: async () => {
    const r = await request<
      | { id: string }
      | { auction: { id: string }; autoAppliedModifierIds?: string[] }
    >(`${API}/auctions`, {
      method: "POST",
    });
    if (r && typeof r === "object" && "auction" in r) {
      return {
        id: r.auction.id,
        autoAppliedModifierIds: r.autoAppliedModifierIds ?? [],
      };
    }
    return { id: (r as { id: string }).id, autoAppliedModifierIds: [] as string[] };
  },

  applyModifier: (auctionId: string, inventoryItemId: string) =>
    request(`${API}/auctions/${auctionId}/modifiers`, {
      method: "POST",
      body: JSON.stringify({ inventoryItemId }),
    }),

  startAuction: (auctionId: string) =>
    request<{ auction: { id: string; status: string }; session?: SessionData; timeline?: unknown[] }>(
      `${API}/auctions/${auctionId}/start`,
      {
      method: "POST",
      },
    ),
  searchAuctionGames: (auctionId: string, q: string) =>
    request<AuctionGameSearchData>(
      `${API}/auctions/${auctionId}/games/search?q=${encodeURIComponent(q)}`,
    ),
  getAuctionSelectionOptions: (auctionId: string) =>
    request<AuctionSelectionOptionsData>(`${API}/auctions/${auctionId}/selection-options`),
  resolveAuctionFromDonations: (
    auctionId: string,
    catalogGameId: string,
    selectedGenre?: string | null,
  ) =>
    request<{ auction: { id: string; status: string }; session?: SessionData; timeline?: unknown[] }>(
      `${API}/auctions/${auctionId}/resolve-donations`,
      {
        method: "POST",
        body: JSON.stringify({ catalogGameId, selectedGenre }),
      },
    ),

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
    listParticipants: () => request<AdminParticipantData[]>(`${API}/admin/participants`),
    adjustPoints: (payload: { participantId: string; delta: number; reason?: string }) =>
      request<{ id: string; totalPoints: number }>(`${API}/admin/points/adjust`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    adjustInventory: (participantId: string, payload: {
      delta: number;
      reason?: string;
      itemDefinitionId?: string;
      itemSlug?: string;
    }) =>
      request<AdminInventoryAdjustResult>(`${API}/admin/participants/${participantId}/items`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    createPseudoDonation: (payload: {
      participantId: string;
      donorName: string;
      amount: number;
      currency?: string;
      message?: string;
      gameQuery?: string;
      rawgId?: number;
    }) =>
      request<DonationRequestData>(`${API}/admin/donations/pseudo`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
  streamer: {
    getDonationAlertsWebhook: () =>
      request<{ webhookKey: string; webhookPath: string; webhookUrl: string }>(
        `${API}/streamer/donationalerts`,
      ),
    rotateDonationAlertsWebhook: () =>
      request<{ webhookKey: string; webhookPath: string; webhookUrl: string }>(
        `${API}/streamer/donationalerts`,
        { method: "POST" },
      ),
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
