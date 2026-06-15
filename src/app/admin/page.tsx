"use client";

import { useEffect, useMemo, useState } from "react";
import { McPageShell } from "@/components/landing/mc-page-shell";
import {
  api,
  type AdminParticipantData,
  type CatalogItemData,
  type DonationRequestData,
  type GameSearchResult,
  type ParticipantDetail,
} from "@/lib/api/client";

const STATUS_LABELS: Record<string, string> = {
  IDLE: "Между играми",
  IN_AUCTION: "Аукцион",
  PLAYING: "В игре",
  PAUSED: "Оффлайн",
};

function participantLabel(participant: AdminParticipantData) {
  return participant.user.twitchLogin ?? participant.user.name ?? participant.id;
}

export default function AdminPage() {
  const [pool, setPool] = useState<{ catalogGame: { title: string; mainStoryHours: number | null } }[]>([]);
  const [participants, setParticipants] = useState<AdminParticipantData[]>([]);
  const [participantDetail, setParticipantDetail] = useState<ParticipantDetail | null>(null);
  const [itemCatalog, setItemCatalog] = useState<CatalogItemData[]>([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [donations, setDonations] = useState<DonationRequestData[]>([]);
  const [pointsAmount, setPointsAmount] = useState("100");
  const [pointsReason, setPointsReason] = useState("");
  const [itemAmount, setItemAmount] = useState("1");
  const [itemReason, setItemReason] = useState("");
  const [loadingParticipantDetail, setLoadingParticipantDetail] = useState(false);
  const [savingPoints, setSavingPoints] = useState(false);
  const [savingInventory, setSavingInventory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GameSearchResult[]>([]);
  const [rawgId, setRawgId] = useState("");
  const [pseudoDonor, setPseudoDonor] = useState("Admin");
  const [pseudoAmount, setPseudoAmount] = useState("100");
  const [pseudoCurrency, setPseudoCurrency] = useState("RUB");
  const [pseudoMessage, setPseudoMessage] = useState("");
  const [pseudoGameQuery, setPseudoGameQuery] = useState("");
  const [pseudoRawgId, setPseudoRawgId] = useState("");
  const [message, setMessage] = useState("");

  const groupedInventory = useMemo(() => {
    const grouped = new Map<
      string,
      {
        slug: string;
        name: string;
        kind: string;
        rarity: string;
        quantity: number;
      }
    >();

    for (const item of participantDetail?.inventory ?? []) {
      const current = grouped.get(item.slug);
      if (current) {
        current.quantity += item.quantity;
        continue;
      }
      grouped.set(item.slug, {
        slug: item.slug,
        name: item.name,
        kind: item.kind,
        rarity: item.rarity,
        quantity: item.quantity,
      });
    }

    return [...grouped.values()].sort((a, b) => {
      if (b.quantity !== a.quantity) return b.quantity - a.quantity;
      return a.name.localeCompare(b.name, "ru");
    });
  }, [participantDetail]);

  const selectedCatalogItem = useMemo(
    () => itemCatalog.find((item) => item.id === selectedItemId) ?? null,
    [itemCatalog, selectedItemId],
  );

  async function load() {
    try {
      const [poolData, partData, statsData, donationsData, itemCatalogData] = await Promise.all([
        api.admin.getPool(),
        api.admin.listParticipants(),
        api.admin.stats(),
        api.getDonationRequests(40),
        api.getItemCatalog(),
      ]);
      setPool(poolData as typeof pool);
      setParticipants(partData);
      setSelectedParticipantId((prev) =>
        prev && partData.some((p) => p.id === prev) ? prev : (partData[0]?.id ?? ""),
      );
      setStats(statsData);
      setDonations(donationsData.requests);
      setItemCatalog(itemCatalogData);
      setSelectedItemId((prev) =>
        prev && itemCatalogData.some((item) => item.id === prev) ? prev : (itemCatalogData[0]?.id ?? ""),
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Нужен вход как ADMIN");
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadParticipant() {
      if (!selectedParticipantId) {
        setParticipantDetail(null);
        return;
      }
      setLoadingParticipantDetail(true);
      try {
        const detail = await api.getParticipant(selectedParticipantId);
        if (!cancelled) setParticipantDetail(detail);
      } catch (e) {
        if (!cancelled) {
          setParticipantDetail(null);
          setMessage(e instanceof Error ? e.message : "Не удалось загрузить данные участника");
        }
      } finally {
        if (!cancelled) setLoadingParticipantDetail(false);
      }
    }

    void loadParticipant();
    return () => {
      cancelled = true;
    };
  }, [selectedParticipantId]);

  async function refreshParticipantDetail() {
    if (!selectedParticipantId) {
      setParticipantDetail(null);
      return;
    }
    setLoadingParticipantDetail(true);
    try {
      setParticipantDetail(await api.getParticipant(selectedParticipantId));
    } finally {
      setLoadingParticipantDetail(false);
    }
  }

  async function searchGames() {
    if (searchQuery.length < 2) return;
    try {
      setSearchResults(await api.searchGames(searchQuery));
    } catch {
      setSearchResults([]);
      setMessage("RAWG поиск не удался — проверьте RAWG_API_KEY");
    }
  }

  async function addGame(rawgIdNum: number, title?: string) {
    try {
      await api.admin.addToPool(rawgIdNum);
      setMessage(`Добавлено: ${title ?? rawgIdNum}`);
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
    }
  }

  async function adjustPoints(direction: "ADD" | "REMOVE") {
    const amount = Number(pointsAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Некорректное количество очков");
      return;
    }
    if (!selectedParticipantId) {
      setMessage("Сначала выбери участника");
      return;
    }

    const delta = direction === "ADD" ? amount : -amount;
    setSavingPoints(true);
    try {
      const result = await api.admin.adjustPoints({
        participantId: selectedParticipantId,
        delta,
        reason: pointsReason.trim() || undefined,
      });
      setMessage(
        `${direction === "ADD" ? "Добавлено" : "Списано"} ${amount} очков. Теперь: ${result.totalPoints}`,
      );
      await Promise.all([load(), refreshParticipantDetail()]);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Не удалось изменить очки");
    } finally {
      setSavingPoints(false);
    }
  }

  async function adjustInventory(delta: number, itemDefinitionId?: string, itemSlug?: string) {
    const amount = Math.abs(delta);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Некорректное количество предметов");
      return;
    }
    if (!selectedParticipantId) {
      setMessage("Сначала выбери участника");
      return;
    }
    if (!itemDefinitionId && !itemSlug) {
      setMessage("Выбери предмет");
      return;
    }

    setSavingInventory(true);
    try {
      const result = await api.admin.adjustInventory(selectedParticipantId, {
        delta,
        reason: itemReason.trim() || undefined,
        itemDefinitionId,
        itemSlug,
      });
      setMessage(
        `${delta > 0 ? "Выдано" : "Списано"} ${amount} "${result.item.name}". Остаток: ${result.totalQuantity}`,
      );
      await refreshParticipantDetail();
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Не удалось изменить инвентарь");
    } finally {
      setSavingInventory(false);
    }
  }

  async function grantSelectedItem() {
    const amount = Number(itemAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Некорректное количество предметов");
      return;
    }
    if (!selectedCatalogItem) {
      setMessage("Выбери предмет из каталога");
      return;
    }
    await adjustInventory(amount, selectedCatalogItem.id);
  }

  async function takeSelectedItem() {
    const amount = Number(itemAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Некорректное количество предметов");
      return;
    }
    if (!selectedCatalogItem) {
      setMessage("Выбери предмет из каталога");
      return;
    }
    await adjustInventory(-amount, selectedCatalogItem.id);
  }

  async function createPseudoDonation() {
    const amount = Number(pseudoAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      setMessage("Некорректная сумма доната");
      return;
    }
    if (!selectedParticipantId) {
      setMessage("Выбери стримера для псевдо-доната");
      return;
    }

    try {
      await api.admin.createPseudoDonation({
        participantId: selectedParticipantId,
        donorName: pseudoDonor.trim() || "Admin",
        amount,
        currency: pseudoCurrency.trim() || "RUB",
        message: pseudoMessage.trim() || undefined,
        gameQuery: pseudoGameQuery.trim() || undefined,
        rawgId: pseudoRawgId ? Number(pseudoRawgId) : undefined,
      });
      setMessage("Псевдо-донат отправлен");
      setPseudoMessage("");
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Не удалось отправить псевдо-донат");
    }
  }

  return (
    <McPageShell title="Админ-панель">
      {message && (
        <div className="rounded border border-[#1a1208] bg-[#1a1208]/60 p-3 text-sm text-[#e8d5b0]">
          {message}
        </div>
      )}

      {stats && (
        <section className="rounded border border-[#1a1208] bg-[#1a1208]/60 p-6">
          <h2 className="mb-4 font-display text-sm uppercase tracking-widest text-[#a89070]">
            Статистика
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {Object.entries(stats).map(([k, v]) => (
              <div key={k} className="mc-stat-card">
                <div className="text-xs text-[#7a6a52]">{k}</div>
                <div className="font-display text-lg text-hypixel-gold">{v}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded border border-[#1a1208] bg-[#1a1208]/60 p-6">
        <h2 className="mb-4 font-display text-sm uppercase tracking-widest text-[#a89070]">
          Менеджмент участников
        </h2>
        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {participants.map((participant) => {
              const isActive = participant.id === selectedParticipantId;
              const streamerStatus = STATUS_LABELS[participant.status] ?? participant.status;
              const gameTitle = participant.currentGameTitle?.trim();
              return (
                <button
                  key={participant.id}
                  type="button"
                  onClick={() => setSelectedParticipantId(participant.id)}
                  className={`w-full rounded border px-3 py-2 text-left transition ${
                    isActive
                      ? "border-hypixel-gold bg-[#2f2412]/80 text-hypixel-gold"
                      : "border-[#2a1d10] bg-[#120d07]/70 text-[#e8d5b0] hover:border-[#6a5637]"
                  }`}
                >
                  <div className="text-sm font-semibold">{participantLabel(participant)}</div>
                  <div className="text-[11px] text-[#c7b18f]">
                    {participant.totalPoints} очков
                    {" • "}
                    {streamerStatus}
                    {gameTitle ? ` • ${gameTitle}` : ""}
                  </div>
                </button>
              );
            })}
            {participants.length === 0 ? (
              <div className="rounded border border-dashed border-[#3a2a16] p-3 text-xs text-[#a89070]">
                Участники не найдены.
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            {selectedParticipantId && participantDetail ? (
              <>
                <div className="rounded border border-[#2a1d10] bg-[#120d07]/80 p-4">
                  <div className="text-sm text-[#a89070]">Выбранный участник</div>
                  <div className="font-display text-lg text-hypixel-gold">
                    {participantDetail.twitchLogin ?? participantDetail.nickname}
                  </div>
                  <div className="mt-1 text-xs text-[#c7b18f]">
                    Статус: {STATUS_LABELS[participantDetail.status] ?? participantDetail.status}
                    {" • "}
                    Очки: {participantDetail.totalPoints}
                  </div>
                  {participantDetail.currentGame?.title ? (
                    <div className="text-xs text-[#9e8a6b]">
                      Текущая игра: {participantDetail.currentGame.title}
                    </div>
                  ) : null}
                </div>

                <div className="rounded border border-[#2a1d10] bg-[#120d07]/80 p-4">
                  <h3 className="mb-3 text-xs uppercase tracking-wider text-[#a89070]">Очки</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="number"
                      min={1}
                      value={pointsAmount}
                      onChange={(e) => setPointsAmount(e.target.value)}
                      placeholder="Количество"
                      className="border border-[#1a1208] bg-[#0d0a08] px-3 py-2 text-[#e8d5b0]"
                    />
                    <input
                      type="text"
                      value={pointsReason}
                      onChange={(e) => setPointsReason(e.target.value)}
                      placeholder="Причина (необязательно)"
                      className="border border-[#1a1208] bg-[#0d0a08] px-3 py-2 text-[#e8d5b0]"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="mc-os-btn px-4 py-2 text-xs"
                      onClick={() => adjustPoints("ADD")}
                      disabled={savingPoints}
                    >
                      + Добавить очки
                    </button>
                    <button
                      type="button"
                      className="mc-os-btn px-4 py-2 text-xs"
                      onClick={() => adjustPoints("REMOVE")}
                      disabled={savingPoints}
                    >
                      - Списать очки
                    </button>
                  </div>
                </div>

                <div className="rounded border border-[#2a1d10] bg-[#120d07]/80 p-4">
                  <h3 className="mb-3 text-xs uppercase tracking-wider text-[#a89070]">Предметы</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="sm:col-span-2 border border-[#1a1208] bg-[#0d0a08] px-3 py-2 text-[#e8d5b0]"
                    >
                      {itemCatalog.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.rarity} / {item.kind})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={itemAmount}
                      onChange={(e) => setItemAmount(e.target.value)}
                      placeholder="Количество"
                      className="border border-[#1a1208] bg-[#0d0a08] px-3 py-2 text-[#e8d5b0]"
                    />
                    <input
                      type="text"
                      value={itemReason}
                      onChange={(e) => setItemReason(e.target.value)}
                      placeholder="Причина (необязательно)"
                      className="border border-[#1a1208] bg-[#0d0a08] px-3 py-2 text-[#e8d5b0]"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="mc-os-btn px-4 py-2 text-xs"
                      onClick={grantSelectedItem}
                      disabled={savingInventory || !selectedCatalogItem}
                    >
                      Выдать предмет
                    </button>
                    <button
                      type="button"
                      className="mc-os-btn px-4 py-2 text-xs"
                      onClick={takeSelectedItem}
                      disabled={savingInventory || !selectedCatalogItem}
                    >
                      Забрать предмет
                    </button>
                  </div>
                </div>

                <div className="rounded border border-[#2a1d10] bg-[#120d07]/80 p-4">
                  <h3 className="mb-3 text-xs uppercase tracking-wider text-[#a89070]">
                    Инвентарь участника ({groupedInventory.length})
                  </h3>
                  <ul className="max-h-64 space-y-2 overflow-y-auto pr-1 text-sm">
                    {groupedInventory.map((item) => (
                      <li
                        key={item.slug}
                        className="rounded border border-[#2a1d10] px-3 py-2 text-[#d6c3a1]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold">{item.name}</div>
                            <div className="text-xs text-[#9e8a6b]">
                              {item.slug} • {item.rarity} • {item.kind}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-[#a89070]">Количество</div>
                            <div className="font-display text-lg text-hypixel-gold">{item.quantity}</div>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            className="mc-os-btn px-3 py-1 text-[10px]"
                            disabled={savingInventory}
                            onClick={() => adjustInventory(-1, undefined, item.slug)}
                          >
                            Забрать 1
                          </button>
                          <button
                            type="button"
                            className="mc-os-btn px-3 py-1 text-[10px]"
                            disabled={savingInventory}
                            onClick={() => adjustInventory(-item.quantity, undefined, item.slug)}
                          >
                            Забрать все
                          </button>
                        </div>
                      </li>
                    ))}
                    {groupedInventory.length === 0 ? (
                      <li className="rounded border border-dashed border-[#3a2a16] p-3 text-xs text-[#a89070]">
                        Инвентарь пуст.
                      </li>
                    ) : null}
                  </ul>
                </div>
              </>
            ) : (
              <div className="rounded border border-dashed border-[#3a2a16] p-4 text-sm text-[#a89070]">
                {loadingParticipantDetail ? "Загружаем данные участника..." : "Выбери участника слева."}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded border border-[#1a1208] bg-[#1a1208]/60 p-6">
        <h2 className="mb-4 font-display text-sm uppercase tracking-widest text-[#a89070]">
          Поиск игр (RAWG)
        </h2>
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Название игры..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchGames()}
            className="flex-1 border border-[#1a1208] bg-[#0d0a08] px-3 py-2 text-[#e8d5b0]"
          />
          <button type="button" className="mc-os-btn px-4 py-2 text-xs" onClick={searchGames}>
            Поиск
          </button>
        </div>
        <ul className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {searchResults.map((g) => (
            <li key={g.rawgId} className="flex justify-between text-sm gap-2">
              <span>{g.title}</span>
              <div className="flex gap-2">
                <button type="button" className="mc-os-btn px-2 py-1 text-[10px]" onClick={() => addGame(g.rawgId, g.title)}>
                  + В пул
                </button>
                <button
                  type="button"
                  className="mc-os-btn px-2 py-1 text-[10px]"
                  onClick={() => {
                    setPseudoRawgId(String(g.rawgId));
                    setPseudoGameQuery(g.title);
                  }}
                >
                  В псевдо-донат
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="RAWG ID"
            value={rawgId}
            onChange={(e) => setRawgId(e.target.value)}
            className="flex-1 border border-[#1a1208] bg-[#0d0a08] px-3 py-2 text-[#e8d5b0]"
          />
          <button type="button" className="mc-os-btn px-3 py-2 text-xs" onClick={() => rawgId && addGame(Number(rawgId))}>
            Добавить
          </button>
          <button type="button" className="mc-os-btn px-3 py-2 text-xs" onClick={() => api.admin.syncHltb().then(() => load())}>
            HLTB
          </button>
        </div>
      </section>

      <section className="rounded border border-[#1a1208] bg-[#1a1208]/60 p-6">
        <h2 className="mb-4 font-display text-sm uppercase tracking-widest text-[#a89070]">
          Псевдо-донат
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={selectedParticipantId}
            onChange={(e) => setSelectedParticipantId(e.target.value)}
            className="sm:col-span-2 border border-[#1a1208] bg-[#0d0a08] px-3 py-2 text-[#e8d5b0]"
          >
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.user.twitchLogin ?? p.user.name ?? p.id}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Донатер"
            value={pseudoDonor}
            onChange={(e) => setPseudoDonor(e.target.value)}
            className="border border-[#1a1208] bg-[#0d0a08] px-3 py-2 text-[#e8d5b0]"
          />
          <input
            type="number"
            placeholder="Сумма"
            value={pseudoAmount}
            onChange={(e) => setPseudoAmount(e.target.value)}
            className="border border-[#1a1208] bg-[#0d0a08] px-3 py-2 text-[#e8d5b0]"
          />
          <input
            type="text"
            placeholder="Валюта (RUB)"
            value={pseudoCurrency}
            onChange={(e) => setPseudoCurrency(e.target.value)}
            className="border border-[#1a1208] bg-[#0d0a08] px-3 py-2 text-[#e8d5b0]"
          />
          <input
            type="number"
            placeholder="RAWG ID (необязательно)"
            value={pseudoRawgId}
            onChange={(e) => setPseudoRawgId(e.target.value)}
            className="border border-[#1a1208] bg-[#0d0a08] px-3 py-2 text-[#e8d5b0]"
          />
          <input
            type="text"
            placeholder="Название игры (необязательно)"
            value={pseudoGameQuery}
            onChange={(e) => setPseudoGameQuery(e.target.value)}
            className="sm:col-span-2 border border-[#1a1208] bg-[#0d0a08] px-3 py-2 text-[#e8d5b0]"
          />
          <textarea
            placeholder='Сообщение доната (можно "game: название")'
            value={pseudoMessage}
            onChange={(e) => setPseudoMessage(e.target.value)}
            className="sm:col-span-2 min-h-20 border border-[#1a1208] bg-[#0d0a08] px-3 py-2 text-[#e8d5b0]"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <button type="button" className="mc-os-btn px-4 py-2 text-xs" onClick={createPseudoDonation}>
            Отправить псевдо-донат
          </button>
        </div>
      </section>

      <section className="rounded border border-[#1a1208] bg-[#1a1208]/60 p-6">
        <h2 className="mb-4 font-display text-sm uppercase tracking-widest text-[#a89070]">
          Пул ({pool.length})
        </h2>
        <ul className="text-sm space-y-1 max-h-60 overflow-y-auto">
          {pool.map((p, i) => (
            <li key={i}>
              {p.catalogGame.title}
              {p.catalogGame.mainStoryHours != null && ` (${p.catalogGame.mainStoryHours}ч)`}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded border border-[#1a1208] bg-[#1a1208]/60 p-6">
        <h2 className="mb-4 font-display text-sm uppercase tracking-widest text-[#a89070]">
          Донаты на аук ({donations.length})
        </h2>
        <ul className="text-sm space-y-2 max-h-72 overflow-y-auto">
          {donations.map((d) => (
            <li key={d.id} className="rounded border border-[#2a1d10] px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-[#e8d5b0]">{d.donorName}</span>{" "}
                  <span className="text-[#9e8a6b]">
                    {d.amount} {d.currency}
                  </span>
                  {d.participant ? (
                    <span className="ml-2 text-[#7a6a52]">
                      → {d.participant.twitchLogin ?? d.participant.name ?? d.participant.id}
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-[#7a6a52]">{d.status}</span>
              </div>
              {d.catalogGame ? (
                <div className="text-[#d6c3a1]">
                  Игра: <span className="font-semibold">{d.catalogGame.title}</span>
                </div>
              ) : d.gameQuery ? (
                <div className="text-[#d6c3a1]">Запрос: {d.gameQuery}</div>
              ) : null}
              {d.message ? <div className="text-[#a89070]">{d.message}</div> : null}
              {d.errorMessage ? <div className="text-[#df8b73]">{d.errorMessage}</div> : null}
            </li>
          ))}
        </ul>
      </section>
    </McPageShell>
  );
}
