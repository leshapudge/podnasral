"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Circle, Clock, Gamepad2, ListChecks, Sparkles, Star, Timer, Trophy } from "lucide-react";
import { McAvatar } from "../mc-avatar";
import { McItemSlot } from "../mc-item-slot";
import { ItemDetailPopup } from "../item-detail-popup";
import { TwitchStreamButton } from "../twitch-stream-button";
import { OsEventBanner } from "../os-event-banner";
import { OsPanelFrame } from "../os-panel-frame";
import { OsSectionTitle } from "../os-section-title";
import type { HomeSeasonData } from "@/lib/landing/home-data.types";
import { Progress } from "@/components/ui/progress";
import {
  api,
  type StreamerRosterEntry,
  type ParticipantDetail,
  type ParticipantInventoryItem,
} from "@/lib/api/client";
import { resolveGameCover } from "@/lib/landing/game-covers";
import { summarizeItemEffects } from "@/lib/inventory/item-effects";
import { resolveItemIcon } from "@/lib/inventory/item-assets";
import { rarityConfig } from "@/lib/inventory/rarity";
import { formatDurationMs, formatHltbHours } from "@/lib/utils/time";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { StarRatingDisplay } from "@/components/streamer/star-rating";

const STATUS_LABELS: Record<string, string> = {
  IDLE: "Между играми",
  AUCTIONING: "Аукцион",
  AWAITING_DIFFICULTY: "Выбор сложности",
  PLAYING: "В игре",
  PAUSED: "Пауза",
  COMPLETED: "После игры",
  DROPPED: "Дроп",
  CASINO: "Казино",
};

function sortStreamers(list: StreamerRosterEntry[]) {
  return [...list].sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
    return a.displayOrder - b.displayOrder;
  });
}

function getStreamerStatusText(
  streamer: StreamerRosterEntry,
  eventUpcoming: boolean,
) {
  if (!streamer.registered) return "Ожидает входа";
  if (eventUpcoming) return "Ждёт старт";
  return STATUS_LABELS[streamer.status] ?? streamer.status;
}

function getStatusTextClass(
  streamer: StreamerRosterEntry,
  eventUpcoming: boolean,
) {
  if (!streamer.registered || eventUpcoming) {
    return "text-[#a89070]";
  }

  switch (streamer.status) {
    case "PLAYING":
    case "PAUSED":
    case "AWAITING_DIFFICULTY":
      return "text-primary";
    case "AUCTIONING":
      return "text-hypixel-gold";
    case "COMPLETED":
      return "text-[#9bd9ff]";
    case "DROPPED":
      return "text-mc-redstone";
    case "CASINO":
      return "text-mc-diamond";
    default:
      return "text-[#a89070]";
  }
}

function isGameStatus(status: string) {
  return status === "PLAYING" || status === "PAUSED" || status === "AWAITING_DIFFICULTY";
}

interface StreamersHubPanelProps {
  season?: HomeSeasonData | null;
}

type DetailTab = "profile" | "completed";

export function StreamersHubPanel({ season = null }: StreamersHubPanelProps) {
  const eventUpcoming = season?.isUpcoming ?? false;
  const [streamers, setStreamers] = useState<StreamerRosterEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ParticipantDetail | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("profile");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [popupItem, setPopupItem] = useState<ParticipantInventoryItem | null>(null);
  const [popupAnchor, setPopupAnchor] = useState<DOMRect | null>(null);

  const openItemPopup = (item: ParticipantInventoryItem, el: HTMLElement) => {
    setPopupItem(item);
    setPopupAnchor(el.getBoundingClientRect());
  };

  const closeItemPopup = () => {
    setPopupItem(null);
    setPopupAnchor(null);
  };

  const sorted = useMemo(() => sortStreamers(streamers), [streamers]);

  const refreshList = useCallback(async () => {
    try {
      const list = await api.getStreamersRoster();
      setStreamers(list ?? []);
    } catch {
      /* keep cached */
    }
  }, []);

  useEffect(() => {
    refreshList();
    const interval = setInterval(refreshList, 15000);
    return () => clearInterval(interval);
  }, [refreshList]);

  useEffect(() => {
    setDetailTab("profile");
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId && sorted.length > 0) {
      setSelectedId(sorted[0].id);
    }
  }, [sorted, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    if (selectedId.startsWith("roster:")) {
      setDetail(null);
      setLoadingDetail(false);
      return;
    }

    let cancelled = false;
    setLoadingDetail(true);

    api
      .getParticipant(selectedId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const selectedListItem = sorted.find((s) => s.id === selectedId);
  const modifiers = detail?.inventory.filter((i) => i.kind === "MODIFIER") ?? [];
  const otherItems = detail?.inventory.filter((i) => i.kind !== "MODIFIER") ?? [];
  return (
    <OsPanelFrame className="!overflow-hidden !p-0">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Список стримеров */}
        <aside className="flex w-full min-h-0 max-h-[38vh] shrink-0 flex-col overflow-hidden border-b border-[#1a1208] lg:max-h-none lg:w-72 lg:flex-none lg:border-b-0 lg:border-r">
          <div className="border-b border-[#1a1208] px-4 py-3">
            <h2 className="font-display text-xs uppercase tracking-widest text-[#a89070]">
              Участники
            </h2>
            <p className="mt-1 text-[10px] text-[#5c4a32]">
              {sorted.filter((s) => s.isLive).length} в эфире · {sorted.length} всего
            </p>
          </div>
          <ul className="os-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            {sorted.map((s) => {
              const active = s.id === selectedId;
              const statusText = getStreamerStatusText(s, eventUpcoming);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    className={cn(
                      "mb-1 flex w-full items-start gap-2 rounded border px-2 py-2 text-left transition-colors",
                      active
                        ? "border-primary/50 bg-primary/10"
                        : s.isLive
                          ? "border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10"
                          : "border-transparent bg-[#1a1208]/30 hover:border-[#1a1208] hover:bg-[#1a1208]/60",
                    )}
                  >
                    <div className="relative shrink-0">
                      <McAvatar
                        nickname={s.nickname}
                        twitchLogin={s.twitchLogin}
                        src={s.avatar}
                        size={32}
                      />
                      {s.isLive && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#14100c] bg-primary"
                          title="В эфире"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#e8d5b0]">{s.nickname}</p>
                      <p className={cn("mt-1 text-[11px]", getStatusTextClass(s, eventUpcoming))}>
                        {statusText}
                      </p>
                      {!eventUpcoming && isGameStatus(s.status) && s.currentGame && (
                        <>
                          <p className="mt-0.5 truncate text-[11px] text-[#d6c3a1]">
                            {s.currentGame.title}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-[#7a6a52]">
                            {s.currentGame.difficulty ? (
                              <span>{s.currentGame.difficulty}</span>
                            ) : null}
                            {s.currentGame.progressPct != null ? (
                              <span>{Math.round(s.currentGame.progressPct)}%</span>
                            ) : null}
                            {s.currentGame.playTimeMs != null && s.currentGame.playTimeMs > 0 ? (
                              <span>{formatDurationMs(s.currentGame.playTimeMs)}</span>
                            ) : null}
                            {s.currentGame.hltbHours != null ? (
                              <span>HLTB {formatHltbHours(s.currentGame.hltbHours)}</span>
                            ) : null}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-[10px] text-hypixel-gold">
                        {s.registered ? `#${s.rank}` : `#${s.displayOrder}`}
                      </p>
                      <p
                        className={cn(
                          "text-[10px] font-semibold",
                          s.isLive ? "text-primary" : "text-[#8f7f67]",
                        )}
                      >
                        {formatNumber(s.totalPoints)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
            {sorted.length === 0 && (
              <p className="p-4 text-center text-sm text-[#7a6a52]">Нет участников</p>
            )}
          </ul>
        </aside>

        {/* Детали стримера */}
        <div className="os-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          <OsEventBanner season={season} className="mb-4" />

          {!selectedListItem && (
            <p className="text-center text-sm text-[#7a6a52]">Выберите стримера</p>
          )}

          {selectedListItem && !selectedListItem.registered && (
            <div className="relative space-y-5">
              {selectedListItem.twitchLogin && (
                <TwitchStreamButton
                  login={selectedListItem.twitchLogin}
                  isLive={selectedListItem.isLive}
                  variant="icon"
                  className="absolute right-0 top-0 h-7 w-7"
                />
              )}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start pr-9">
                <McAvatar
                  nickname={selectedListItem.nickname}
                  twitchLogin={selectedListItem.twitchLogin}
                  src={selectedListItem.avatar}
                  size={64}
                  className="mx-auto sm:mx-0"
                />
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <h3 className="font-display text-xl text-[#e8d5b0]">{selectedListItem.nickname}</h3>
                  <p className="mt-2 text-sm text-[#7a6a52]">
                    Стример ещё не входил на сайт через Twitch. После первого входа здесь появятся
                    очки, инвентарь и текущая игра.
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedListItem && selectedListItem.registered && loadingDetail && !detail && (
            <p className="text-center text-sm text-[#7a6a52]">Загрузка...</p>
          )}

          {selectedListItem && selectedListItem.registered && detail && (
            <div className="relative space-y-5">
              {detail.twitchLogin && (
                <TwitchStreamButton
                  login={detail.twitchLogin}
                  isLive={detail.isLive}
                  variant="icon"
                  className="absolute right-0 top-0 h-7 w-7"
                />
              )}
              {/* Профиль + голова MC */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start pr-9">
                <div className="mx-auto shrink-0 sm:mx-0">
                  <McAvatar
                    nickname={detail.nickname}
                    twitchLogin={detail.twitchLogin}
                    src={detail.avatar}
                    size={64}
                  />
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h3 className="font-display text-xl text-[#e8d5b0]">{detail.nickname}</h3>
                    {detail.isLive && (
                      <span className="inline-flex items-center gap-1 rounded border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] uppercase text-primary">
                        <Circle className="h-2 w-2 fill-current" />
                        В эфире
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-hypixel-gold">
                    {formatNumber(detail.totalPoints)} очков · #{selectedListItem.rank}
                  </p>
                  <p className="mt-1 text-xs text-[#7a6a52]">
                    {STATUS_LABELS[detail.status] ?? detail.status}
                  </p>
                  <div className="mt-3 flex flex-wrap justify-center gap-3 sm:justify-start">
                    <div className="mc-stat-card">
                      <Trophy className="h-4 w-4 text-hypixel-gold" />
                      <div>
                        <p className="text-[10px] text-[#7a6a52]">Пройдено</p>
                        <p className="font-display text-sm text-[#e8d5b0]">
                          {detail.stats.gamesCompleted}
                        </p>
                      </div>
                    </div>
                    <div className="mc-stat-card">
                      <Gamepad2 className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-[10px] text-[#7a6a52]">Игр</p>
                        <p className="font-display text-sm text-[#e8d5b0]">
                          {detail.stats.gamesPlayed}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <nav className="flex gap-1 rounded border border-[#1a1208] bg-[#0d0a08]/80 p-1">
                <button
                  type="button"
                  onClick={() => setDetailTab("profile")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded px-3 py-2 text-[10px] uppercase tracking-wide transition-colors",
                    detailTab === "profile"
                      ? "bg-primary/20 text-[#e8d5b0] ring-1 ring-primary/40"
                      : "text-[#7a6a52] hover:bg-[#1a1208]/80",
                  )}
                >
                  <Gamepad2 className="h-3.5 w-3.5" />
                  Профиль
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab("completed")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded px-3 py-2 text-[10px] uppercase tracking-wide transition-colors",
                    detailTab === "completed"
                      ? "bg-primary/20 text-[#e8d5b0] ring-1 ring-primary/40"
                      : "text-[#7a6a52] hover:bg-[#1a1208]/80",
                  )}
                >
                  <ListChecks className="h-3.5 w-3.5" />
                  Пройденные
                  {detail.completedGames.length > 0 && (
                    <span className="rounded bg-hypixel-gold/20 px-1.5 font-display text-[9px] text-hypixel-gold">
                      {detail.completedGames.length}
                    </span>
                  )}
                </button>
              </nav>

              {detailTab === "completed" && (
                <section className="rounded border border-[#1a1208] bg-[#1a1208]/50 p-4">
                  <OsSectionTitle className="!mt-0">Пройденные игры</OsSectionTitle>
                  {detail.completedGames.length === 0 ? (
                    <p className="mt-3 text-sm text-[#7a6a52]">
                      Пока нет игр с отзывом — после прохождения стример ставит оценку и пишет
                      впечатления.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {detail.completedGames.map((game) => (
                        <li
                          key={game.id}
                          className="rounded border border-[#1a1208] bg-[#0d0a08]/60 p-3 sm:p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                            <div className="game-cover-frame relative aspect-[460/215] w-full max-w-[160px] shrink-0 overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={resolveGameCover(game.title, game.cover)}
                                alt={game.title}
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <p className="font-display text-base text-[#e8d5b0]">
                                  {game.title}
                                </p>
                                <StarRatingDisplay rating={game.rating} size="md" />
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                {game.finalScore != null && (
                                  <span className="inline-flex items-center gap-1.5 rounded border border-hypixel-gold/30 bg-hypixel-gold/10 px-2.5 py-1">
                                    <Trophy className="h-3.5 w-3.5 text-hypixel-gold" />
                                    <span className="font-display text-sm text-hypixel-gold">
                                      +{formatNumber(game.finalScore)} очков
                                    </span>
                                  </span>
                                )}
                                {game.difficulty && (
                                  <span className="rounded border border-[#2a2118] bg-[#1a1208]/60 px-2 py-1 text-[10px] uppercase text-[#7a6a52]">
                                    {game.difficulty}
                                  </span>
                                )}
                                {game.playTimeMs != null && game.playTimeMs > 0 && (
                                  <span className="inline-flex items-center gap-1.5 rounded border border-primary/30 bg-primary/10 px-2.5 py-1">
                                    <Timer className="h-3.5 w-3.5 text-primary" />
                                    <span className="font-display text-sm text-primary">
                                      {formatDurationMs(game.playTimeMs)}
                                    </span>
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 text-sm leading-relaxed text-[#a89070]">
                                «{game.review}»
                              </p>
                              {game.completedAt && (
                                <p className="mt-2 text-[10px] text-[#5c4a32]">
                                  {new Date(game.completedAt).toLocaleDateString("ru-RU", {
                                    day: "numeric",
                                    month: "long",
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {detailTab === "profile" && (
                <>
              {/* Текущая игра */}
              <section className="rounded border border-[#1a1208] bg-[#1a1208]/50 p-4">
                <OsSectionTitle className="!mt-0">Сейчас играет</OsSectionTitle>
                {eventUpcoming ? (
                  <div className="mt-3 rounded border border-[#1a1208] bg-[#0d0a08]/60 px-4 py-6 text-center">
                    <p className="font-display text-sm text-[#e8d5b0]">Ивент ещё не начался</p>
                    <p className="mt-2 text-xs text-[#7a6a52]">
                      {season
                        ? `Старт ${season.startDateLong} — здесь появится текущая игра после аукциона`
                        : "Здесь появится текущая игра после старта ивента"}
                    </p>
                  </div>
                ) : detail.currentGame ? (
                  <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="game-cover-frame relative aspect-[460/215] w-full max-w-[200px] shrink-0 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveGameCover(
                          detail.currentGame.title,
                          detail.currentGame.coverImage,
                        )}
                        alt={detail.currentGame.title}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg text-[#e8d5b0]">
                        {detail.currentGame.title}
                      </p>
                      {detail.currentGame.difficulty && (
                        <p className="text-xs text-[#7a6a52]">
                          Сложность: {detail.currentGame.difficulty}
                        </p>
                      )}
                      {(detail.currentGame.hltbHours != null ||
                        (detail.currentGame.playTimeMs ?? 0) > 0 ||
                        detail.currentGame.projectedPoints != null) && (
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {detail.currentGame.hltbHours != null && (
                            <div className="mc-stat-card !gap-2 !p-2.5">
                              <Clock className="h-4 w-4 shrink-0 text-mc-diamond" />
                              <div className="min-w-0">
                                <p className="text-[10px] text-[#7a6a52]">HLTB</p>
                                <p className="font-display text-sm text-[#e8d5b0]">
                                  {formatHltbHours(detail.currentGame.hltbHours)}
                                </p>
                              </div>
                            </div>
                          )}
                          {(detail.currentGame.playTimeMs ?? 0) > 0 && (
                            <div className="mc-stat-card !gap-2 !p-2.5">
                              <Timer className="h-4 w-4 shrink-0 text-primary" />
                              <div className="min-w-0">
                                <p className="text-[10px] text-[#7a6a52]">Играет</p>
                                <p className="font-display text-sm text-[#e8d5b0]">
                                  {formatDurationMs(detail.currentGame.playTimeMs!)}
                                </p>
                              </div>
                            </div>
                          )}
                          {detail.currentGame.projectedPoints != null && (
                            <div className="mc-stat-card !gap-2 !p-2.5">
                              <Star className="h-4 w-4 shrink-0 text-hypixel-gold" />
                              <div className="min-w-0">
                                <p className="text-[10px] text-[#7a6a52]">Награда</p>
                                <p className="font-display text-sm text-hypixel-gold">
                                  ~{formatNumber(detail.currentGame.projectedPoints)} очк.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {detail.currentGame.progressPct != null && (
                        <div className="mt-3">
                          <div className="mb-1 flex justify-between text-[10px] text-[#7a6a52]">
                            <span>Прогресс</span>
                            <span>{Math.round(detail.currentGame.progressPct)}%</span>
                          </div>
                          <Progress
                            value={detail.currentGame.progressPct}
                            className="h-3 bg-[#0d0a08]"
                            indicatorClassName="bg-gradient-to-r from-primary to-hypixel-gold"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[#7a6a52]">Сейчас не в игре</p>
                )}
              </section>

              {/* Активные модификаторы */}
              <section className="rounded border border-[#1a1208] bg-[#1a1208]/50 p-4">
                <OsSectionTitle className="!mt-0">
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-mc-diamond" />
                    Активные модификаторы
                  </span>
                </OsSectionTitle>
                {modifiers.length === 0 ? (
                  <p className="mt-2 text-sm text-[#7a6a52]">Нет модификаторов в инвентаре</p>
                ) : (
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {modifiers.map((item) => {
                      const rarity = rarityConfig[item.rarity as keyof typeof rarityConfig];
                      const texture = resolveItemIcon(item.slug, item.iconUrl);
                      const summary = summarizeItemEffects(item.effects);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={cn(
                            "flex items-start gap-3 rounded border p-3 text-left transition-colors",
                            item.active
                              ? "border-primary/30 bg-[#1a1208]/60 hover:border-primary/50"
                              : "border-[#1a1208] bg-[#1a1208]/30 opacity-80 hover:opacity-100",
                          )}
                          onMouseEnter={(e) => openItemPopup(item, e.currentTarget)}
                          onClick={(e) => openItemPopup(item, e.currentTarget)}
                        >
                          <div className="relative shrink-0">
                            <McItemSlot
                              slug={item.slug}
                              src={texture}
                              alt={item.name}
                              size="md"
                              active={item.active}
                              enchanted={
                                item.active &&
                                (item.rarity === "EPIC" ||
                                  item.rarity === "LEGENDARY" ||
                                  item.rarity === "RARE")
                              }
                            />
                            {item.quantity > 1 && (
                              <span className="absolute bottom-0 right-0 font-display text-[10px] text-white drop-shadow">
                                ×{item.quantity}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn("text-sm font-bold leading-tight", rarity?.text)}>
                              {item.name}
                            </p>
                            <p className="mt-1 text-xs leading-snug text-primary">{summary}</p>
                            <p className="mt-1 text-[10px] text-[#7a6a52]">
                              {item.active ? "Нажми для подробностей" : "Сейчас недоступен"}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Остальной инвентарь */}
              {otherItems.length > 0 && (
                <section className="rounded border border-[#1a1208] bg-[#1a1208]/40 p-4">
                  <OsSectionTitle className="!mt-0">Инвентарь</OsSectionTitle>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {otherItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="rounded border border-transparent p-1 transition-colors hover:border-[#373737]"
                        onMouseEnter={(e) => openItemPopup(item, e.currentTarget)}
                        onClick={(e) => openItemPopup(item, e.currentTarget)}
                        title={item.name}
                      >
                        <McItemSlot
                          slug={item.slug}
                          src={resolveItemIcon(item.slug, item.iconUrl)}
                          alt={item.name}
                          size="sm"
                          active
                        />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* История */}
              {detail.history.length > 0 && (
                <section>
                  <OsSectionTitle>История игр</OsSectionTitle>
                  <ul className="mt-2 space-y-1">
                    {detail.history.slice(0, 5).map((h) => (
                      <li
                        key={h.id}
                        className="flex items-center gap-3 rounded border border-[#1a1208] bg-[#1a1208]/30 px-3 py-2 text-sm"
                      >
                        {h.cover && (
                          <Image
                            src={h.cover}
                            alt=""
                            width={32}
                            height={32}
                            className="mc-pixel-image h-8 w-8 object-cover"
                          />
                        )}
                        <span className="min-w-0 flex-1 truncate text-[#e8d5b0]">{h.game}</span>
                        {h.finalScore != null && (
                          <span className="text-hypixel-gold">+{h.finalScore}</span>
                        )}
                        {h.dropPenalty != null && (
                          <span className="text-mc-redstone">-{h.dropPenalty}</span>
                        )}
                        {h.playTimeMs != null && h.playTimeMs > 0 && (
                          <span className="text-[10px] text-[#a89070]">
                            {formatDurationMs(h.playTimeMs)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {popupItem && (
        <ItemDetailPopup
          item={popupItem}
          anchorRect={popupAnchor}
          visible
          onClose={closeItemPopup}
        />
      )}
    </OsPanelFrame>
  );
}
