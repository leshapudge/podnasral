"use client";

import { useEffect, useState } from "react";
import { McPageShell } from "@/components/landing/mc-page-shell";
import { api, type DonationRequestData, type GameSearchResult } from "@/lib/api/client";

export default function AdminPage() {
  const [pool, setPool] = useState<{ catalogGame: { title: string; mainStoryHours: number | null } }[]>([]);
  const [participants, setParticipants] = useState<
    { id: string; user: { twitchLogin: string | null; name: string | null } }[]
  >([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [donations, setDonations] = useState<DonationRequestData[]>([]);
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

  async function load() {
    try {
      const [poolData, partData, statsData, donationsData] = await Promise.all([
        api.admin.getPool(),
        api.admin.listParticipants(),
        api.admin.stats(),
        api.getDonationRequests(40),
      ]);
      setPool(poolData as typeof pool);
      setParticipants(partData);
      setSelectedParticipantId((prev) =>
        prev && partData.some((p) => p.id === prev) ? prev : (partData[0]?.id ?? ""),
      );
      setStats(statsData);
      setDonations(donationsData.requests);
      setMessage("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Нужен вход как ADMIN");
    }
  }

  useEffect(() => {
    load();
  }, []);

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
          Участники ({participants.length})
        </h2>
        <ul className="text-sm space-y-1">
          {participants.map((p) => (
            <li key={p.id}>{p.user.twitchLogin ?? p.user.name ?? p.id}</li>
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
