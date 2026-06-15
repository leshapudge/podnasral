"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Coins,
  Eye,
  EyeOff,
  Gamepad2,
  Hammer,
  Package,
  Pause,
  Play,
  RefreshCw,
  Skull,
  Sparkles,
  Swords,
  Trophy,
  Link2,
} from "lucide-react";
import { McPageShell } from "@/components/landing/mc-page-shell";
import { McAvatar } from "@/components/landing/os/mc-avatar";
import { McItemSlot } from "@/components/landing/os/mc-item-slot";
import { OsSectionTitle } from "@/components/landing/os/os-section-title";
import { ViewerArcadePanel } from "@/components/landing/os/panels/viewer-arcade-panel";
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
  type CraftRecipeData,
  type MeData,
} from "@/lib/api/client";
import { cn } from "@/lib/utils";

type StreamerTab = "game" | "inventory" | "craft" | "kazik";

const MAX_MODIFIERS_PER_AUCTION = 2;

const STATUS_LABELS: Record<string, string> = {
  IDLE: "Между играми",
  AUCTIONING: "Аукцион",
  AWAITING_DIFFICULTY: "Выбор сложности",
  PLAYING: "В игре",
  PAUSED: "Пауза",
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
  const [showDonationWebhook, setShowDonationWebhook] = useState(false);
  const [recipes, setRecipes] = useState<CraftRecipeData[]>([]);
  const refreshSeq = useRef(0);

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
  const donationWebhookUrl = useMemo(() => {
    if (!me?.donationAlerts?.webhookPath) return null;
    if (typeof window === "undefined") return me.donationAlerts.webhookPath;
    return `${window.location.origin}${me.donationAlerts.webhookPath}`;
  }, [me?.donationAlerts?.webhookPath]);
  const donationWebhookPreview = useMemo(() => {
    if (!donationWebhookUrl) return null;
    const tail = donationWebhookUrl.slice(-12);
    return `Скрыто ••••••••••••${tail}`;
  }, [donationWebhookUrl]);

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

  async function copyDonationWebhook() {
    if (!donationWebhookUrl) return;
    try {
      await navigator.clipboard.writeText(donationWebhookUrl);
      setInfo("Webhook URL скопирован");
    } catch {
      setInfo("Не удалось скопировать URL");
    }
  }

  async function rotateDonationWebhook() {
    await runAction(async () => {
      const next = await api.streamer.rotateDonationAlertsWebhook();
      setMe((prev) =>
        prev
          ? {
              ...prev,
              donationAlerts: { webhookPath: next.webhookPath },
            }
          : prev,
      );
      setShowDonationWebhook(false);
      setInfo("Сгенерирован новый webhook URL");
    });
  }

  function openDonationAuctionPage(currentAuctionId: string) {
    if (!me?.participant) return;
    const aukUrl = `/auk?participantId=${encodeURIComponent(me.participant.id)}&auctionId=${encodeURIComponent(currentAuctionId)}`;
    const popup = window.open(aukUrl, "_blank", "noopener,noreferrer");
    if (!popup) {
      setInfo(`Аук запущен. Открой вручную: ${aukUrl}`);
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

  const tabs: { id: StreamerTab; label: string; icon: typeof Gamepad2 }[] = [
    { id: "game", label: "Игра", icon: Gamepad2 },
    { id: "inventory", label: "Инвентарь", icon: Package },
    { id: "craft", label: "Верстак", icon: Hammer },
    { id: "kazik", label: "Казик", icon: Coins },
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
              <Link
                href="/?tab=kazik"
                className="mc-os-btn hidden px-3 py-1.5 text-[10px] uppercase sm:inline-flex"
                title="Открыть казик на главной"
              >
                Казик OS
              </Link>
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

        {donationWebhookUrl && (
          <section className="rounded-lg border border-[#1a1208] bg-[#14100c]/80 p-4">
            <OsSectionTitle className="mb-2">DonationAlerts</OsSectionTitle>
            <p className="mb-2 text-xs text-[#7a6a52]">
              Вставь этот URL в вебхук своего DonationAlerts. Донаты из него пойдут в твой аук.
            </p>
            <div className="rounded border border-[#2a2118] bg-[#0d0a08]/80 px-3 py-2 text-xs text-[#d6c3a1] break-all">
              {showDonationWebhook ? donationWebhookUrl : donationWebhookPreview}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="mc-os-btn inline-flex items-center gap-2 px-3 py-2 text-[10px]"
                onClick={() => setShowDonationWebhook((v) => !v)}
              >
                {showDonationWebhook ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    Скрыть URL
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    Показать URL
                  </>
                )}
              </button>
              <button
                type="button"
                className="mc-os-btn inline-flex items-center gap-2 px-3 py-2 text-[10px]"
                onClick={() => void copyDonationWebhook()}
              >
                <Link2 className="h-3.5 w-3.5" />
                Копировать URL
              </button>
              <button
                type="button"
                className="mc-os-btn inline-flex items-center gap-2 px-3 py-2 text-[10px]"
                disabled={loading}
                onClick={() => void rotateDonationWebhook()}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Сменить webhook ключ
              </button>
            </div>
          </section>
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
                  Запустите аукцион, чтобы выбрать следующую игру. Модификаторы из инвентаря
                  усилят забег.
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

            {auctionId && auctionPhase !== "RUNNING" && (
              <section className="rounded-lg border border-[#1a1208] bg-[#14100c]/80 p-5">
                <OsSectionTitle>Подготовка аукциона</OsSectionTitle>
                <p className="mb-3 text-xs text-[#7a6a52]">
                  Выберите до {MAX_MODIFIERS_PER_AUCTION} модификаторов до старта, затем запустите
                  донатный аукцион
                </p>
                <ActiveModifiersStrip
                  modifiers={prepModifiers}
                  maxCount={MAX_MODIFIERS_PER_AUCTION}
                  className="mb-4"
                  hint="Списываются при старте аукциона"
                />
                <div className="mb-4 flex flex-wrap gap-2">
                  {optionalModifiers
                    .filter((m) => !selectedModifiers.includes(m.id))
                    .map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className="flex items-center gap-2 rounded border border-[#2a2118] bg-[#1a1208]/60 px-3 py-2 text-left transition hover:border-primary/40 disabled:opacity-40"
                        disabled={
                          loading || selectedModifiers.length >= MAX_MODIFIERS_PER_AUCTION
                        }
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
                      await api.startAuction(auctionId);
                      setAuctionPhase("RUNNING");
                      openDonationAuctionPage(auctionId);
                    })
                  }
                >
                  Запустить донатный аук!
                </button>
              </section>
            )}

            {auctionId && auctionPhase === "RUNNING" && (
              <section className="rounded-lg border border-primary/30 bg-primary/5 p-5">
                <OsSectionTitle>Донатный аукцион запущен</OsSectionTitle>
                <p className="mb-4 text-sm text-[#a89070]">
                  Игра теперь выбирается по донатам. Открой страницу аукциона и после окончания
                  донатов заверши выбор победителя.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="mc-os-btn px-4 py-2 text-xs"
                    onClick={() => openDonationAuctionPage(auctionId)}
                  >
                    Открыть сайт аука
                  </button>
                  <button
                    type="button"
                    className="mc-os-btn px-4 py-2 text-xs"
                    disabled={loading}
                    onClick={() =>
                      runAction(async () => {
                        const result = await api.resolveAuctionFromDonations(auctionId);
                        setAuctionTimeline((result.timeline as typeof auctionTimeline) ?? []);
                        setAuctionId(null);
                        setAuctionPhase(null);
                      })
                    }
                  >
                    Завершить по донатам
                  </button>
                </div>
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

                  {status === "COMPLETED" && session?.needsReview && (
                    <GameReviewForm
                      gameTitle={session.game.title}
                      finalScore={session.finalScore}
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

                  {status === "DROPPED" && (
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

        {tab === "kazik" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <OsSectionTitle className="mb-3 justify-center">Игра на монеты</OsSectionTitle>
            <p className="mb-4 text-center text-xs text-[#7a6a52]">
              Липовый казик как у зрителей — не связан с наградами за забег
            </p>
            <ViewerArcadePanel isAuthenticated embedded />
          </motion.div>
        )}
      </div>
    </McPageShell>
  );
}
