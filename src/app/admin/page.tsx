"use client";

import { useEffect, useState } from "react";
import { McPageShell } from "@/components/landing/mc-page-shell";
import { api, type GameSearchResult } from "@/lib/api/client";

export default function AdminPage() {
  const [pool, setPool] = useState<{ catalogGame: { title: string; mainStoryHours: number | null } }[]>([]);
  const [participants, setParticipants] = useState<
    { id: string; user: { twitchLogin: string | null; name: string | null } }[]
  >([]);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GameSearchResult[]>([]);
  const [rawgId, setRawgId] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const [poolData, partData, statsData] = await Promise.all([
        api.admin.getPool(),
        api.admin.listParticipants(),
        api.admin.stats(),
      ]);
      setPool(poolData as typeof pool);
      setParticipants(partData);
      setStats(statsData);
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
              <button type="button" className="mc-os-btn px-2 py-1 text-[10px]" onClick={() => addGame(g.rawgId, g.title)}>
                + В пул
              </button>
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
    </McPageShell>
  );
}
