"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Gamepad2,
  Hammer,
  Package,
  Pause,
  Play,
  Skull,
  Sparkles,
  Swords,
  Trophy,
} from "lucide-react";
import { McPageShell } from "@/components/landing/mc-page-shell";
import { McAvatar } from "@/components/landing/os/mc-avatar";
import { McItemSlot } from "@/components/landing/os/mc-item-slot";
import { OsSectionTitle } from "@/components/landing/os/os-section-title";
import { MinecraftInventory } from "@/components/inventory/minecraft-inventory";
import { ActiveModifiersStrip } from "@/components/casino/active-modifiers-strip";
import { StreamerCasinoModal } from "@/components/casino/streamer-casino-modal";
import { GameReviewForm } from "@/components/streamer/game-review-form";
import { MinecraftCraftingTable } from "@/components/craft/minecraft-crafting-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { inventoryGridFromMe } from "@/lib/inventory/grid.adapter";
import { resolveItemIcon } from "@/lib/inventory/item-assets";
import { describeItemEffects } from "@/lib/inventory/item-effects";
import { resolveGameCover } from "@/lib/landing/game-covers";
import {
  api,
  ApiClientError,
  type AuctionGameSearchData,
  type CraftRecipeData,
  type MeData,
} from "@/lib/api/client";
import { cn } from "@/lib/utils";

type StreamerTab = "game" | "inventory" | "craft";
type AuctionSearchGame = AuctionGameSearchData["games"][number];

const STATUS_LABELS: Record<string, string> = {
  IDLE: "Между играми",
  AUCTIONING: "Аукцион",
  AWAITING_DIFFICULTY: "Выбор сложности",
  PLAYING: "В игре",
  PAUSED: "Оффлайн",
  COMPLETED: "Игра пройдена",
  DROPPED: "Дроп",
  CASINO: "Слот наград",
};

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function formatGenreLabel(genre: string) {
  return genre
    .split("-")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function inventoryCounts(me: MeData): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of me.inventory) {
    counts[item.slug] = (counts[item.slug] ?? 0) + item.quantity;
  }
  return counts;
}

export function StreamerPanel() {
  const [me, setMe] = useState<MeData | null>(null);
  const [tab, setTab] = useState<StreamerTab>("game");
  const [auctionId, setAuctionId] = useState<string | null>(null);
  const [auctionPhase, setAuctionPhase] = useState<"PREPARING" | "RUNNING" | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [auctionTimeline, setAuctionTimeline] = useState<
    { step: number; eliminatedGameId?: string; winnerGameId?: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [auctionSearchQuery, setAuctionSearchQuery] = useState("");
  const [auctionSearch, setAuctionSearch] = useState<AuctionGameSearchData | null>(null);
  const [auctionSearching, setAuctionSearching] = useState(false);
  const [selectedAuctionGameId, setSelectedAuctionGameId] = useState<string | null>(null);
  const [selectedAuctionGenre, setSelectedAuctionGenre] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<CraftRecipeData[]>([]);
  const refreshSeq = useRef(0);
  const auctionSearchSeq = useRef(0);
  const skipNextAuctionSearchRef = useRef(false);

  const refresh = useCallback(async () => {
    const seq = ++refreshSeq.current;
    try {
      const data = await api.getMe();
      if (seq !== refreshSeq.current) return;
      setMe(data);
      setError(null);
      if (data.activeAuction) {
        setAuctionId(data.activeAuction.id);
        setAuctionPhase(data.activeAuction.status);
        setSelectedModifiers(data.activeAuction.autoAppliedModifierIds);
      } else {
        setAuctionId(null);
        setAuctionPhase(null);
        if (data.participant?.status !== "AUCTIONING") {
          setSelectedModifiers([]);
        }
      }
    } catch (e) {
      if (seq !== refreshSeq.current) return;
      if (e instanceof ApiClientError && e.status === 401) {
        window.location.href = "/login";
        return;
      }
      setError(e instanceof Error ? e.message : "Ошибка загрузки панели");
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    api.getRecipes().then(setRecipes).catch(() => setRecipes([]));
  }, []);

  const counts = useMemo(() => (me ? inventoryCounts(me) : {}), [me]);
  const inventoryGrid = useMemo(() => (me ? inventoryGridFromMe(me) : null), [me]);

  const prepModifiers = useMemo(() => {
    if (!me) return [];
    return selectedModifiers
      .map((id) => me.inventory.find((i) => i.id === id))
      .filter(Boolean)
      .map((m) => ({
        slug: m!.slug,
        name: m!.name,
        iconUrl: resolveItemIcon(m!.slug, m!.iconUrl),
        effects: describeItemEffects(m!.effects),
      }));
  }, [me, selectedModifiers]);

  const auctionSearchFilteredGames = useMemo(() => {
    if (!auctionSearch) return [] as AuctionSearchGame[];
    if (!selectedAuctionGenre) return auctionSearch.games;
    return auctionSearch.games.filter((game) => game.genres.includes(selectedAuctionGenre));
  }, [auctionSearch, selectedAuctionGenre]);

  const selectedAuctionGame = useMemo(
    () =>
      auctionSearchFilteredGames.find((game) => game.catalogGameId === selectedAuctionGameId) ??
      null,
    [auctionSearchFilteredGames, selectedAuctionGameId],
  );

  const showAuctionSuggestions = useMemo(() => {
    if (selectedAuctionGame) return false;
    if (auctionSearching) return false;
    if (!auctionSearch) return false;
    if (auctionSearchQuery.trim().length < 2) return false;
    return auctionSearchFilteredGames.length > 0;
  }, [
    auctionSearch,
    auctionSearchFilteredGames.length,
    auctionSearchQuery,
    auctionSearching,
    selectedAuctionGame,
  ]);

  useEffect(() => {
    if (!auctionId || auctionPhase !== "RUNNING") {
      setAuctionSearch(null);
      setAuctionSearchQuery("");
      setSelectedAuctionGameId(null);
      setSelectedAuctionGenre(null);
      setAuctionSearching(false);
    }
  }, [auctionId, auctionPhase]);

  useEffect(() => {
    if (!auctionId || auctionPhase !== "RUNNING") return;
    if (skipNextAuctionSearchRef.current) {
      skipNextAuctionSearchRef.current = false;
      return;
    }
    const q = auctionSearchQuery.trim();
    if (q.length < 2) {
      setAuctionSearch(null);
      setAuctionSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      void runAuctionGameSearch(auctionId, q);
    }, 250);

    return () => clearTimeout(timer);
  }, [auctionId, auctionPhase, auctionSearchQuery]);

  async function runAction(fn: () => Promise<unknown>) {
    setLoading(true);
    setError(null);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function runAuctionGameSearch(currentAuctionId: string, query = auctionSearchQuery) {
    const q = query.trim();
    if (q.length < 2) {
      setAuctionSearch(null);
      setAuctionSearching(false);
      return;
    }

    const seq = ++auctionSearchSeq.current;
    setAuctionSearching(true);
    setError(null);
    setInfo(null);
    try {
      const next = await api.searchAuctionGames(currentAuctionId, q);
      if (seq !== auctionSearchSeq.current) return;
      setAuctionSearch(next);
      setSelectedAuctionGenre((prev) => {
        if (next.forcedGenres.length > 0 && next.genreRestrictionApplied) {
          return next.forcedGenres[0] ?? null;
        }
        if (!next.canSelectGenre) return null;
        if (prev && next.availableGenres.includes(prev)) return prev;
        return next.availableGenres[0] ?? null;
      });
      setSelectedAuctionGameId((prev) => {
        if (prev && next.games.some((game) => game.catalogGameId === prev)) return prev;
        return next.games[0]?.catalogGameId ?? null;
      });
      if (next.games.length === 0) {
        setInfo("По этому запросу ничего не найдено. Попробуй другое название.");
      }
    } catch (e) {
      if (seq !== auctionSearchSeq.current) return;
      setAuctionSearch(null);
      setSelectedAuctionGameId(null);
      setSelectedAuctionGenre(null);
      setError(e instanceof Error ? e.message : "Не удалось выполнить поиск");
    } finally {
      if (seq !== auctionSearchSeq.current) return;
      setAuctionSearching(false);
    }
  }

  if (!me) {
    return (
      <McPageShell title="Панель стримера">
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="animate-pulse font-display text-sm uppercase tracking-widest text-[#7a6a52]">
            Загрузка кабинета…
          </p>
        </div>
      </McPageShell>
    );
  }

  if (!me.participant) {
    return (
      <McPageShell title="Панель стримера">
        <div className="mx-auto max-w-md rounded-lg border-2 border-[#1a1208] bg-[#14100c]/90 p-8 text-center shadow-lg">
          <Skull className="mx-auto mb-3 h-8 w-8 text-[#7a6a52]" />
          <p className="font-display text-[#e8d5b0]">Нет доступа к панели стримера</p>
          <p className="mt-2 text-sm text-[#7a6a52]">
            Войдите через Twitch аккаунт из списка участников
            {me.user.twitchLogin ? ` (${me.user.twitchLogin})` : ""}.
          </p>
          <button
            type="button"
            className="mc-os-btn mt-5 px-5 py-2 text-xs"
            onClick={() => void refresh()}
          >
            Обновить
          </button>
        </div>
      </McPageShell>
    );
  }

  const session = me.currentSession;
  const status = me.participant.status;
  const modifiers = me.inventory.filter((i) => i.kind === "MODIFIER");
  const pendingModifierIds = new Set(me.pendingModifiers?.map((m) => m.id) ?? []);
  const optionalModifiers = modifiers.filter((m) => !pendingModifierIds.has(m.id));
  const craftEnabled = status === "IDLE";
  const resolvedAuctionGame =
    me.activeAuction && me.activeAuction.id === auctionId ? me.activeAuction.resolvedGame : null;

  const tabs: { id: StreamerTab; label: string; icon: typeof Gamepad2 }[] = [
    { id: "game", label: "Игра", icon: Gamepad2 },
    { id: "inventory", label: "Инвентарь", icon: Package },
    { id: "craft", label: "Верстак", icon: Hammer },
  ];

  return (
    <McPageShell title="Панель стримера">
      <div className="space-y-5 pb-6">
        {/* Шапка стримера */}
        <header
          className="overflow-hidden rounded-lg border-2 border-[#1a1208]"
          style={{
            background: "linear-gradient(135deg, #1a1208 0%, #2a2118 50%, #14100c 100%)",
            boxShadow: "0 4px 0 #0d0a08, 0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <div className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
            <McAvatar
              nickname={me.user.twitchLogin ?? me.user.name ?? "?"}
              twitchLogin={me.user.twitchLogin}
              src={me.user.image}
              size={56}
              className="ring-2 ring-[#3d3024]"
            />
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-xl uppercase tracking-wide text-[#e8d5b0]">
                {me.user.twitchLogin ?? me.user.name}
              </h1>
              <p className="mt-0.5 text-sm text-[#7a6a52]">
                {STATUS_LABELS[status] ?? status}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded border border-hypixel-gold/30 bg-hypixel-gold/10 px-4 py-2 text-center">
                <Trophy className="mx-auto mb-0.5 h-4 w-4 text-hypixel-gold" />
                <p className="font-display text-lg font-bold text-hypixel-gold">
                  {me.participant.totalPoints}
                </p>
                <p className="text-[9px] uppercase tracking-wider text-[#7a6a52]">очков</p>
              </div>
              <StatusBadge status={status} />
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded border border-mc-redstone/50 bg-mc-redstone/10 px-4 py-3 text-sm text-mc-redstone">
            {error}
          </div>
        )}
        {info && (
          <div className="rounded border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            {info}
          </div>
        )}

        {/* Табы */}
        <nav className="flex gap-1 rounded-lg border border-[#1a1208] bg-[#0d0a08]/80 p-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "mc-os-tab-btn flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-[11px] uppercase tracking-wide transition-colors",
                tab === id
                  ? "bg-primary/20 text-[#e8d5b0] ring-1 ring-primary/40"
                  : "text-[#7a6a52] hover:bg-[#1a1208]/80 hover:text-[#a89070]",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </nav>

        {/* Вкладка: Игра */}
        {tab === "game" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {status === "IDLE" && !auctionId && !session && (
              <section className="rounded-lg border border-[#1a1208] bg-[#14100c]/80 p-5">
                <OsSectionTitle>Аукцион игр</OsSectionTitle>
                <p className="mb-4 text-sm text-[#7a6a52]">
                  Запусти аукцион, проведи его на внешней площадке, затем выбери игру и стартуй
                  забег.
                </p>
                {me.pendingModifiers.length > 0 && (
                  <div className="mb-4">
                    <ActiveModifiersStrip
                      modifiers={me.pendingModifiers}
                      hint="Повесятся на следующий забег автоматически"
                    />
                  </div>
                )}
                <button
                  type="button"
                  className="mc-os-btn inline-flex items-center gap-2 px-6 py-2.5 text-xs"
                  disabled={loading}
                  onClick={() =>
                    runAction(async () => {
                      const auction = await api.createAuction();
                      setAuctionId(auction.id);
                      setAuctionPhase("PREPARING");
                      setSelectedModifiers(auction.autoAppliedModifierIds);
                    })
                  }
                >
                  <Swords className="h-4 w-4" />
                  Начать аукцион
                </button>
              </section>
            )}

            {auctionId && auctionPhase === "PREPARING" && !resolvedAuctionGame && (
              <section className="rounded-lg border border-[#1a1208] bg-[#14100c]/80 p-5">
                <OsSectionTitle>Старт аукциона</OsSectionTitle>
                <p className="mb-4 text-sm text-[#7a6a52]">
                  Выбери модификаторы (по желанию), запусти аукцион на внешней площадке, потом
                  вернись сюда и найди игру через поиск.
                </p>
                <ActiveModifiersStrip
                  modifiers={prepModifiers}
                  className="mb-4"
                  hint="Списываются при старте игры"
                />
                <div className="mb-4 flex flex-wrap gap-2">
                  {optionalModifiers
                    .filter((m) => !selectedModifiers.includes(m.id))
                    .map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className="flex items-center gap-2 rounded border border-[#2a2118] bg-[#1a1208]/60 px-3 py-2 text-left transition hover:border-primary/40 disabled:opacity-40"
                        disabled={loading}
                        onClick={() =>
                          runAction(async () => {
                            await api.applyModifier(auctionId, m.id);
                            setSelectedModifiers((s) => [...s, m.id]);
                          })
                        }
                      >
                        <McItemSlot
                          slug={m.slug}
                          src={resolveItemIcon(m.slug, m.iconUrl)}
                          alt={m.name}
                          size="sm"
                        />
                        <span className={`text-xs rarity-${m.rarity.toLowerCase()}`}>{m.name}</span>
                      </button>
                    ))}
                  {optionalModifiers.length === 0 && me.pendingModifiers.length === 0 && (
                    <p className="text-xs text-[#7a6a52]">Нет модификаторов — можно без них</p>
                  )}
                </div>
                <button
                  type="button"
                  className="mc-os-btn px-6 py-2 text-xs"
                  disabled={loading}
                  onClick={() =>
                    runAction(async () => {
                      await api.startAuction(auctionId);
                      setAuctionPhase("RUNNING");
                      setAuctionSearch(null);
                      setSelectedAuctionGameId(null);
                      setSelectedAuctionGenre(null);
                      setInfo("Аукцион запущен. Проведи его на внешнем сайте и выбери игру ниже.");
                    })
                  }
                >
                  Запустить аукцион
                </button>
              </section>
            )}

            {auctionId && auctionPhase === "RUNNING" && (
              <section className="rounded-lg border border-primary/30 bg-primary/5 p-5">
                <OsSectionTitle>Аукцион запущен</OsSectionTitle>
                <p className="mb-4 text-sm text-[#a89070]">
                  Проведи аукцион на внешней площадке, затем найди игру через поиск и сразу запусти
                  забег.
                </p>
                <div className="mb-4 flex flex-wrap gap-2">
                  <div className="relative min-w-[220px] flex-1">
                    <input
                      type="search"
                      value={auctionSearchQuery}
                      onChange={(event) => {
                        setAuctionSearchQuery(event.target.value);
                        setSelectedAuctionGameId(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        event.preventDefault();
                        if (showAuctionSuggestions && auctionSearchFilteredGames.length > 0) {
                          const first = auctionSearchFilteredGames[0];
                          skipNextAuctionSearchRef.current = true;
                          setSelectedAuctionGameId(first.catalogGameId);
                          setAuctionSearchQuery(first.title);
                          return;
                        }
                        void runAuctionGameSearch(auctionId);
                      }}
                      placeholder="Начни вводить название игры…"
                      className="w-full rounded border border-[#2a1d10] bg-[#140f0a] px-3 py-2 text-sm text-[#e8d5b0] outline-none ring-primary/50 focus:ring-2"
                    />
                    {showAuctionSuggestions ? (
                      <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded border border-[#2a1d10] bg-[#120d08] shadow-lg">
                        {auctionSearchFilteredGames.map((game) => (
                          <li key={game.catalogGameId}>
                            <button
                              type="button"
                              className="w-full border-b border-[#2a1d10] px-3 py-2 text-left text-sm text-[#d6c3a1] transition last:border-b-0 hover:bg-[#1a1208] hover:text-[#f6e8cb]"
                              onClick={() => {
                                skipNextAuctionSearchRef.current = true;
                                setSelectedAuctionGameId(game.catalogGameId);
                                setAuctionSearchQuery(game.title);
                              }}
                            >
                              <span className="block truncate">{game.title}</span>
                              <span className="block text-[11px] text-[#8d7a62]">
                                {game.mainStoryHours}ч · {game.projectedBaseScore} очков
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {auctionSearching ? (
                      <p className="mt-1 text-xs text-[#a89070]">Ищем подсказки…</p>
                    ) : null}
                    {!auctionSearching &&
                    auctionSearchQuery.trim().length >= 2 &&
                    auctionSearch &&
                    auctionSearchFilteredGames.length === 0 ? (
                      <p className="mt-1 text-xs text-[#df8b73]">
                        Ничего не найдено по этому запросу.
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="mc-os-btn px-4 py-2 text-xs"
                    disabled={loading || auctionSearching}
                    onClick={() => void refresh()}
                  >
                    Обновить статус
                  </button>
                </div>

                {auctionSearch ? (
                  <>
                    {auctionSearch.forcedGenres.length > 0 ? (
                      <div className="mb-3 rounded border border-mc-redstone/40 bg-mc-redstone/10 px-3 py-2 text-xs text-[#f0b4a4]">
                        Дебафф на аукцион: только жанры{" "}
                        <span className="font-semibold">
                          {auctionSearch.forcedGenres.map(formatGenreLabel).join(", ")}
                        </span>
                      </div>
                    ) : null}
                    {auctionSearch.forcedGenres.length > 0 &&
                    !auctionSearch.genreRestrictionApplied ? (
                      <p className="mb-3 text-xs text-[#df8b73]">
                        Жанровый дебафф временно не применен: RAWG не вернул подходящие жанры.
                      </p>
                    ) : null}
                    {auctionSearch.canSelectGenre ? (
                      <div className="mb-3">
                        <label className="mb-1 block text-xs text-[#a89070]">
                          Жанровый эксперт: выбери жанр
                        </label>
                        <select
                          className="w-full rounded border border-[#2a1d10] bg-[#140f0a] px-3 py-2 text-sm text-[#e8d5b0]"
                          value={selectedAuctionGenre ?? ""}
                          onChange={(event) => setSelectedAuctionGenre(event.target.value || null)}
                          disabled={auctionSearch.availableGenres.length === 0}
                        >
                          <option value="">Без фильтра</option>
                          {auctionSearch.availableGenres.map((genre) => (
                            <option key={genre} value={genre}>
                              {formatGenreLabel(genre)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    {!auctionSearch.genreDataReady &&
                    (auctionSearch.canSelectGenre || auctionSearch.forcedGenres.length > 0) ? (
                      <p className="mb-3 text-xs text-[#df8b73]">
                        Не удалось подтянуть жанры из RAWG, жанровые ограничения временно
                        отключены.
                      </p>
                    ) : null}
                    {auctionSearch.missingHltbCount > 0 ? (
                      <p className="mb-3 text-xs text-[#8d7a62]">
                        Ещё {auctionSearch.missingHltbCount} результат(ов) RAWG скрыто — у них нет
                        часов прохождения.
                      </p>
                    ) : null}
                    {selectedAuctionGame ? (
                      <div className="mb-4 rounded border border-[#2a1d10] bg-[#120d08] p-3">
                        <div className="flex items-start gap-3">
                          <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded border border-[#2a1d10] bg-[#0d0a08]">
                            <Image
                              src={resolveGameCover(
                                selectedAuctionGame.title,
                                selectedAuctionGame.coverImage,
                              )}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-display text-base text-[#f6e8cb]">
                              {selectedAuctionGame.title}
                            </p>
                            <p className="text-xs text-[#a89070]">
                              HLTB: {selectedAuctionGame.mainStoryHours}ч · Очки:{" "}
                              {selectedAuctionGame.projectedBaseScore}
                            </p>
                            <p className="mt-1 text-[11px] text-[#8d7a62]">
                              Формула: {selectedAuctionGame.mainStoryHours} ×{" "}
                              {auctionSearch.pointsPerHour} ={" "}
                              {selectedAuctionGame.projectedBaseScore} очков
                            </p>
                            <p className="mt-1 text-[11px] text-[#8d7a62]">
                              Main+Extra: {selectedAuctionGame.mainExtraHours ?? "—"}ч · 100%:{" "}
                              {selectedAuctionGame.completionistHours ?? "—"}ч
                              {selectedAuctionGame.metacritic != null
                                ? ` · MC ${Math.round(selectedAuctionGame.metacritic)}`
                                : ""}
                            </p>
                            {selectedAuctionGame.genres.length > 0 ? (
                              <p className="mt-1 text-[11px] text-[#8d7a62]">
                                Жанры:{" "}
                                {selectedAuctionGame.genres.map(formatGenreLabel).join(", ")}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="mc-os-btn mt-3 px-3 py-1.5 text-[10px]"
                          onClick={() => setSelectedAuctionGameId(null)}
                        >
                          Выбрать другую игру
                        </button>
                      </div>
                    ) : (
                      <p className="mb-3 text-xs text-[#7a6a52]">
                        Пока выбери игру из всплывающих подсказок по названию.
                      </p>
                    )}
                    <button
                      type="button"
                      className="mc-os-btn px-5 py-2 text-xs"
                      disabled={
                        loading ||
                        auctionSearching ||
                        !selectedAuctionGame ||
                        (auctionSearch.canSelectGenre &&
                          auctionSearch.genreDataReady &&
                          !selectedAuctionGenre)
                      }
                      onClick={() =>
                        runAction(async () => {
                          if (!selectedAuctionGame) return;
                          const result = await api.resolveAuctionFromDonations(
                            auctionId,
                            selectedAuctionGame.catalogGameId,
                            selectedAuctionGenre,
                          );
                          setAuctionTimeline((result.timeline as typeof auctionTimeline) ?? []);
                        })
                      }
                    >
                      Завершить аукцион и начать игру
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-[#7a6a52]">
                    Введи название игры, чтобы появились всплывающие подсказки из RAWG + данные по
                    времени.
                  </p>
                )}
              </section>
            )}

            {auctionId && auctionPhase === "PREPARING" && resolvedAuctionGame && (
              <section className="rounded-lg border border-[#1a1208] bg-[#14100c]/80 p-5">
                <OsSectionTitle>Игра выбрана: {resolvedAuctionGame.title}</OsSectionTitle>
                <p className="mb-2 text-xs text-[#7a6a52]">
                  HLTB: {resolvedAuctionGame.mainStoryHours ?? "—"} ч
                </p>
                <p className="mb-3 text-xs text-[#7a6a52]">
                  Теперь можешь выбрать любые модификаторы и начать игру.
                </p>
                <ActiveModifiersStrip
                  modifiers={prepModifiers}
                  className="mb-4"
                  hint="Списываются при старте игры"
                />
                <div className="mb-4 flex flex-wrap gap-2">
                  {optionalModifiers
                    .filter((m) => !selectedModifiers.includes(m.id))
                    .map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className="flex items-center gap-2 rounded border border-[#2a2118] bg-[#1a1208]/60 px-3 py-2 text-left transition hover:border-primary/40 disabled:opacity-40"
                        disabled={loading}
                        onClick={() =>
                          runAction(async () => {
                            await api.applyModifier(auctionId, m.id);
                            setSelectedModifiers((s) => [...s, m.id]);
                          })
                        }
                      >
                        <McItemSlot
                          slug={m.slug}
                          src={resolveItemIcon(m.slug, m.iconUrl)}
                          alt={m.name}
                          size="sm"
                        />
                        <span className={`text-xs rarity-${m.rarity.toLowerCase()}`}>
                          {m.name}
                        </span>
                      </button>
                    ))}
                  {optionalModifiers.length === 0 && me.pendingModifiers.length === 0 && (
                    <p className="text-xs text-[#7a6a52]">Нет модификаторов — можно без них</p>
                  )}
                </div>
                <button
                  type="button"
                  className="mc-os-btn px-6 py-2 text-xs"
                  disabled={loading}
                  onClick={() =>
                    runAction(async () => {
                      const result = await api.startAuction(auctionId);
                      setAuctionTimeline((result.timeline as typeof auctionTimeline) ?? []);
                    })
                  }
                >
                  Начать игру
                </button>
              </section>
            )}

            {auctionTimeline.length > 0 && (
              <div className="rounded border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-[#a89070]">
                Аукцион завершён · {auctionTimeline.length} шагов
              </div>
            )}

            {session && (
              <section className="overflow-hidden rounded-lg border-2 border-[#1a1208] bg-[#14100c]/90">
                <div className="relative h-28 overflow-hidden sm:h-36">
                  <Image
                    src={resolveGameCover(session.game.title, session.game.coverImage)}
                    alt=""
                    fill
                    className="object-cover opacity-60"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14100c] via-[#14100c]/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h2 className="font-display text-lg text-[#e8d5b0]">{session.game.title}</h2>
                    <p className="text-xs text-[#7a6a52]">
                      HLTB {session.hltbMainHours}ч
                      {session.difficulty ? ` · ${session.difficulty}` : ""}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 p-4 sm:p-5">
                  {session.activeModifiers.length > 0 && (
                    <ActiveModifiersStrip modifiers={session.activeModifiers} compact />
                  )}

                  {session.status === "AWAITING_DIFFICULTY" && (
                    <div className="space-y-3">
                      {!session.difficulty ? (
                        <button
                          type="button"
                          className="mc-os-btn px-6 py-2.5 text-xs"
                          disabled={loading}
                          onClick={() => runAction(() => api.rollDifficulty(session.id))}
                        >
                          <Sparkles className="mr-2 inline h-4 w-4" />
                          Бросить сложность
                        </button>
                      ) : (
                        <>
                          <p className="font-display text-2xl text-hypixel-gold">
                            {session.difficulty}
                          </p>
                          <button
                            type="button"
                            className="mc-os-btn px-6 py-2.5 text-xs"
                            disabled={loading}
                            onClick={() => runAction(() => api.confirmSession(session.id))}
                          >
                            Подтвердить и начать
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {(session.status === "PLAYING" || session.status === "PAUSED") && (
                    <div className="space-y-4">
                      <div className="mc-timer text-center font-display text-4xl tabular-nums text-primary sm:text-5xl">
                        {formatTime(session.activePlayMs)}
                      </div>
                      <div className="h-4 overflow-hidden rounded border border-[#1a1208] bg-[#0d0a08]">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary/80 to-primary"
                          initial={false}
                          animate={{ width: `${session.progressPct}%` }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                      <p className="text-center text-[10px] text-[#7a6a52]">
                        Прогресс по HLTB · {Math.round(session.progressPct)}%
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {session.status === "PLAYING" ? (
                          <button
                            type="button"
                            className="mc-os-btn inline-flex items-center gap-1.5 px-4 py-2 text-xs"
                            disabled={loading}
                            onClick={() => runAction(() => api.pauseSession(session.id))}
                          >
                            <Pause className="h-3.5 w-3.5" />
                            Пауза
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="mc-os-btn inline-flex items-center gap-1.5 px-4 py-2 text-xs"
                            disabled={loading}
                            onClick={() => runAction(() => api.resumeSession(session.id))}
                          >
                            <Play className="h-3.5 w-3.5" />
                            Продолжить
                          </button>
                        )}
                        {session.status === "PLAYING" && (
                          <>
                            <button
                              type="button"
                              className="mc-os-btn px-4 py-2 text-xs"
                              disabled={loading}
                              onClick={() => runAction(() => api.completeSession(session.id))}
                            >
                              Игра пройдена
                            </button>
                            <button
                              type="button"
                              className="mc-os-btn border-mc-redstone/50 px-4 py-2 text-xs text-mc-redstone"
                              disabled={loading}
                              onClick={() => runAction(() => api.dropSession(session.id))}
                            >
                              Дропнуть
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {(status === "COMPLETED" || status === "DROPPED") && session?.needsReview && (
                    <GameReviewForm
                      gameTitle={session.game.title}
                      mode={status === "DROPPED" ? "dropped" : "completed"}
                      finalScore={session.finalScore}
                      dropPenalty={session.dropPenalty}
                      loading={loading}
                      onSubmit={(rating, review) =>
                        runAction(() => api.submitSessionReview(session.id, rating, review))
                      }
                    />
                  )}

                  {status === "CASINO" && (
                    <StreamerCasinoModal
                      session={session}
                      loading={loading}
                      showScore={{
                        points: session.finalScore,
                        penalty: session.dropPenalty,
                      }}
                      onSpinComplete={async () => {
                        await refresh();
                      }}
                      onAcknowledge={() => runAction(() => api.acknowledgeSession())}
                    />
                  )}

                  {status === "DROPPED" && !session?.needsReview && (
                    <div className="space-y-4 text-center">
                      {session.dropPenalty != null && session.dropPenalty > 0 && (
                        <p className="font-display text-xl text-mc-redstone">
                          −{session.dropPenalty} штраф
                        </p>
                      )}
                      <p className="text-sm text-[#7a6a52]">Дроп — открывается казино наград</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </motion.div>
        )}

        {/* Вкладка: Инвентарь */}
        {tab === "inventory" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <OsSectionTitle>Рюкзак сезона</OsSectionTitle>
            <p className="mb-4 text-center text-xs text-[#7a6a52]">
              Модификаторы для аукциона · материалы для верстака
            </p>
            <MinecraftInventory initialGrid={inventoryGrid} persist={false} />
          </motion.div>
        )}

        {/* Вкладка: Верстак */}
        {tab === "craft" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {!craftEnabled && (
              <div className="mb-4 rounded border border-[#3d3024] bg-[#1a1208]/60 px-4 py-3 text-center text-xs text-[#a89070]">
                Верстак доступен между играми — завершите или подтвердите текущую сессию
              </div>
            )}
            <MinecraftCraftingTable
              recipes={recipes}
              inventory={counts}
              disabled={!craftEnabled}
              loading={loading}
              onCraft={async (recipeId) => {
                await runAction(() => api.craft(recipeId));
              }}
            />
          </motion.div>
        )}
      </div>
    </McPageShell>
  );
}
