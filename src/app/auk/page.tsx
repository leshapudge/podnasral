"use client";

import { useEffect, useState } from "react";
import { McPageShell } from "@/components/landing/mc-page-shell";
import { api, type DonationFeedData } from "@/lib/api/client";

export default function AuctionDonationsPage() {
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [auctionId, setAuctionId] = useState<string | null>(null);
  const [queryLoaded, setQueryLoaded] = useState(false);
  const [feed, setFeed] = useState<DonationFeedData>({ event: null, requests: [] });
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить донаты");
    }
  }

  useEffect(() => {
    if (!queryLoaded) return;
    void load();
    const timer = setInterval(() => {
      void load();
    }, 10_000);
    return () => clearInterval(timer);
  }, [participantId, queryLoaded]);

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
        {error ? <div className="mt-2 text-sm text-[#df8b73]">{error}</div> : null}
      </section>

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
