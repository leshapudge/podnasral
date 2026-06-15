"use client";

import { useEffect, useMemo, useState } from "react";
import { McPageShell } from "@/components/landing/mc-page-shell";
import {
  api,
  type AuctionSelectionOptionsData,
  type DonationFeedData,
} from "@/lib/api/client";

function formatGenreLabel(genre: string) {
  return genre
    .split("-")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AuctionDonationsPage() {
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [auctionId, setAuctionId] = useState<string | null>(null);
  const [queryLoaded, setQueryLoaded] = useState(false);
  const [feed, setFeed] = useState<DonationFeedData>({ event: null, requests: [] });
  const [feedError, setFeedError] = useState<string | null>(null);
  const [selection, setSelection] = useState<AuctionSelectionOptionsData | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [selectionInfo, setSelectionInfo] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setParticipantId(params.get("participantId"));
    setAuctionId(params.get("auctionId"));
    setQueryLoaded(true);
  }, []);

  async function load() {
    try {
      const next = await api.getDonationRequests(120, participantId ?? undefined);
      setFeed(next);
      setUpdatedAt(new Date().toLocaleTimeString());
      setFeedError(null);
    } catch (e) {
      setFeedError(e instanceof Error ? e.message : "Не удалось загрузить донаты");
    }
  }

  async function loadSelection(currentAuctionId: string) {
    try {
      const next = await api.getAuctionSelectionOptions(currentAuctionId);
      setSelection(next);
      setSelectedGenre((prev) => {
        if (next.forcedGenres.length > 0 && next.genreRestrictionApplied) {
          return next.forcedGenres[0] ?? null;
        }
        if (!next.canSelectGenre) return null;
        if (prev && next.availableGenres.includes(prev)) return prev;
        return next.availableGenres[0] ?? null;
      });
      setSelectedGameId((prev) => {
        if (prev && next.games.some((game) => game.catalogGameId === prev)) return prev;
        if (
          next.selectedCatalogGameId &&
          next.games.some((game) => game.catalogGameId === next.selectedCatalogGameId)
        ) {
          return next.selectedCatalogGameId;
        }
        return next.games[0]?.catalogGameId ?? null;
      });
      setSelectionError(null);
    } catch (e) {
      setSelection(null);
      setSelectedGenre(null);
      setSelectionError(e instanceof Error ? e.message : "Не удалось загрузить список игр");
    }
  }

  useEffect(() => {
    if (!queryLoaded) return;
    void load();
    if (auctionId) {
      void loadSelection(auctionId);
    } else {
      setSelection(null);
      setSelectedGameId(null);
      setSelectedGenre(null);
    }
    const timer = setInterval(() => {
      void load();
      if (auctionId) {
        void loadSelection(auctionId);
      }
    }, 10_000);
    return () => clearInterval(timer);
  }, [auctionId, participantId, queryLoaded]);

  const filteredGames = useMemo(() => {
    if (!selection) return [];
    if (!selectedGenre) return selection.games;
    return selection.games.filter((game) => game.genres.includes(selectedGenre));
  }, [selection, selectedGenre]);
  const selectedGame = useMemo(
    () => filteredGames.find((game) => game.catalogGameId === selectedGameId) ?? null,
    [filteredGames, selectedGameId],
  );

  useEffect(() => {
    if (!selection) return;
    if (filteredGames.length === 0) {
      setSelectedGameId(null);
      return;
    }
    if (!selectedGameId || !filteredGames.some((game) => game.catalogGameId === selectedGameId)) {
      setSelectedGameId(filteredGames[0].catalogGameId);
    }
  }, [filteredGames, selectedGameId, selection]);

  async function resolveAuction() {
    if (!auctionId || !selectedGameId) return;
    setResolving(true);
    setSelectionError(null);
    try {
      await api.resolveAuctionFromDonations(auctionId, selectedGameId, selectedGenre);
      await loadSelection(auctionId);
      setSelectionInfo("Аукцион завершен. Игра отправлена стримеру для старта забега.");
    } catch (e) {
      setSelectionError(e instanceof Error ? e.message : "Не удалось завершить аукцион");
    } finally {
      setResolving(false);
    }
  }

  return (
    <McPageShell title="Аук-донаты" closeHref="/">
      <section className="rounded border border-[#1a1208] bg-[#1a1208]/60 p-6">
        {feed.event ? (
          <div className="text-sm text-[#d6c3a1]">
            Событие: <span className="font-semibold text-[#e8d5b0]">{feed.event.name}</span> ({feed.event.status})
          </div>
        ) : (
          <div className="text-sm text-[#a89070]">Активное событие не найдено</div>
        )}
        {updatedAt ? <div className="mt-1 text-xs text-[#7a6a52]">Обновлено: {updatedAt}</div> : null}
        {auctionId ? <div className="mt-1 text-xs text-[#7a6a52]">Аукцион: {auctionId}</div> : null}
        {feedError ? <div className="mt-2 text-sm text-[#df8b73]">{feedError}</div> : null}
      </section>

      {auctionId ? (
        <section className="rounded border border-[#1a1208] bg-[#1a1208]/60 p-6">
          <h2 className="mb-2 font-display text-sm uppercase tracking-widest text-[#a89070]">
            Завершение аукциона
          </h2>
          <p className="mb-4 text-xs text-[#7a6a52]">
            Выбери игру вручную. После этого стример сможет выбрать модификаторы и начать забег.
          </p>
          {selectionInfo ? <div className="mb-3 text-sm text-[#a8d49d]">{selectionInfo}</div> : null}
          {selectionError ? <div className="mb-3 text-sm text-[#df8b73]">{selectionError}</div> : null}
          {selection ? (
            <>
              <div className="mb-3 text-xs text-[#a89070]">
                Статус аукциона:{" "}
                <span className="font-semibold text-[#e8d5b0]">{selection.status}</span>
              </div>
              {selection.forcedGenres.length > 0 ? (
                <div className="mb-3 rounded border border-mc-redstone/40 bg-mc-redstone/10 px-3 py-2 text-xs text-[#f0b4a4]">
                  Дебафф на аукцион: только жанры{" "}
                  <span className="font-semibold">
                    {selection.forcedGenres.map(formatGenreLabel).join(", ")}
                  </span>
                </div>
              ) : null}
              {selection.forcedGenres.length > 0 && !selection.genreRestrictionApplied ? (
                <p className="mb-3 text-xs text-[#df8b73]">
                  Жанровый дебафф временно не применён: в пуле нет подходящих игр.
                </p>
              ) : null}
              {selection.canSelectGenre ? (
                <div className="mb-3">
                  <label className="mb-1 block text-xs text-[#a89070]">
                    Жанровый эксперт: выбери жанр перед завершением аукциона
                  </label>
                  <select
                    className="w-full rounded border border-[#2a1d10] bg-[#140f0a] px-3 py-2 text-sm text-[#e8d5b0]"
                    value={selectedGenre ?? ""}
                    onChange={(event) => setSelectedGenre(event.target.value || null)}
                    disabled={selection.status !== "RUNNING" || selection.availableGenres.length === 0}
                  >
                    <option value="">Без фильтра</option>
                    {selection.availableGenres.map((genre) => (
                      <option key={genre} value={genre}>
                        {formatGenreLabel(genre)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              {!selection.genreDataReady &&
              (selection.canSelectGenre || selection.forcedGenres.length > 0) ? (
                <p className="mb-3 text-xs text-[#df8b73]">
                  Не удалось загрузить жанры из RAWG, поэтому жанровые ограничения временно
                  отключены.
                </p>
              ) : null}
              <ul className="mb-4 space-y-2">
                {filteredGames.map((game) => {
                  const active = game.catalogGameId === selectedGameId;
                  return (
                    <li key={game.catalogGameId}>
                      <button
                        type="button"
                        className={`w-full rounded border px-3 py-2 text-left text-sm transition ${
                          active
                            ? "border-primary/60 bg-primary/10 text-[#f6e8cb]"
                            : "border-[#2a1d10] bg-[#140f0a] text-[#d6c3a1] hover:border-primary/40"
                        }`}
                        onClick={() => setSelectedGameId(game.catalogGameId)}
                      >
                        <div className="font-semibold">{game.title}</div>
                        <div className="text-xs text-[#a89070]">
                          HLTB: {game.mainStoryHours}ч · База очков: {game.projectedBaseScore}
                        </div>
                        {game.genres.length > 0 ? (
                          <div className="mt-1 text-[11px] text-[#8d7a62]">
                            Жанры: {game.genres.map(formatGenreLabel).join(", ")}
                          </div>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {filteredGames.length === 0 ? (
                <p className="mb-3 text-sm text-[#df8b73]">
                  Для выбранного жанра нет доступных игр. Выбери другой жанр.
                </p>
              ) : null}
              <button
                type="button"
                className="mc-os-btn px-5 py-2 text-xs"
                disabled={
                  !selectedGame ||
                  resolving ||
                  selection.status !== "RUNNING" ||
                  (selection.canSelectGenre && selection.genreDataReady && !selectedGenre)
                }
                onClick={() => void resolveAuction()}
              >
                {resolving ? "Сохраняем..." : "Завершить аукцион с выбранной игрой"}
              </button>
              {selection.status !== "RUNNING" ? (
                <p className="mt-2 text-xs text-[#7a6a52]">
                  Этот аукцион уже завершен. Вернись в панель стримера и запускай игру.
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-[#7a6a52]">Загружаем список игр...</p>
          )}
        </section>
      ) : null}

      <section className="rounded border border-[#1a1208] bg-[#1a1208]/60 p-6">
        <h2 className="mb-4 font-display text-sm uppercase tracking-widest text-[#a89070]">
          Последние донаты ({feed.requests.length})
        </h2>
        <ul className="space-y-2">
          {feed.requests.map((r) => (
            <li key={r.id} className="rounded border border-[#2a1d10] px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-[#e8d5b0]">{r.donorName}</span>{" "}
                  <span className="text-[#9e8a6b]">
                    {r.amount} {r.currency}
                  </span>
                  {r.participant ? (
                    <span className="ml-2 text-[#7a6a52]">
                      для {r.participant.twitchLogin ?? r.participant.name ?? r.participant.id}
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-[#7a6a52]">{r.status}</span>
              </div>
              {r.catalogGame ? (
                <div className="text-[#d6c3a1]">
                  Игра добавлена: <span className="font-semibold">{r.catalogGame.title}</span>
                </div>
              ) : r.gameQuery ? (
                <div className="text-[#d6c3a1]">Запрос игры: {r.gameQuery}</div>
              ) : null}
              {r.message ? <div className="text-[#a89070]">{r.message}</div> : null}
              {r.errorMessage ? <div className="text-[#df8b73]">{r.errorMessage}</div> : null}
            </li>
          ))}
        </ul>
      </section>
    </McPageShell>
  );
}
