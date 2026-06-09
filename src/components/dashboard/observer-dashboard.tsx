"use client";

import { useCallback, useEffect, useState } from "react";
import { StreamerCard, type StreamerCardData } from "./streamer-card";
import { BossPanel, type BossData } from "./boss-panel";
import { FeedPanel, type FeedItem } from "./feed-panel";
import { useLive } from "@/hooks/use-live";
import { api, type EventData } from "@/lib/api/client";

export function ObserverDashboard() {
  const [event, setEvent] = useState<EventData | null>(null);
  const [leaderboard, setLeaderboard] = useState<StreamerCardData[]>([]);
  const [boss, setBoss] = useState<BossData | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);

  const refresh = useCallback(async () => {
    try {
      const [eventData, lbData, bossData, feedData] = await Promise.all([
        api.getEvent(),
        api.getLeaderboard(),
        api.getBoss(),
        api.getFeed(30),
      ]);

      setEvent(eventData);
      setLeaderboard(lbData ?? []);
      setBoss(bossData);
      setFeed(feedData?.items ?? []);
    } catch (e) {
      console.error("[dashboard]", e);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  useLive((data) => {
    if (["leaderboard.patch", "boss.hp", "feed.item"].includes(data.type)) {
      refresh();
    }
  });

  return (
    <div className="min-h-screen">
      <header className="border-b-4 border-[#222] bg-[#2d2d2d] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              ⛏ {event?.name ?? "MINESEASON"}
            </h1>
            {event && (
              <p className="text-sm text-gray-400">
                День {event.totalDays - event.daysRemaining} / {event.totalDays}
                {" · "}
                {event.daysRemaining} дн. осталось
              </p>
            )}
          </div>
          <nav className="flex gap-3">
            <a href="/login" className="mc-btn text-sm">
              Войти
            </a>
            <a href="/streamer" className="mc-btn mc-btn-primary text-sm">
              Панель стримера
            </a>
            <a href="/admin" className="mc-btn text-sm">
              Админ
            </a>
          </nav>
        </div>
        {event && (
          <div className="max-w-7xl mx-auto mt-3 h-2 bg-[#1a1a1a]">
            <div
              className="h-full bg-[var(--mc-gold)]"
              style={{ width: `${event.progress}%` }}
            />
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <h2 className="text-lg font-bold mb-4">Участники</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {leaderboard.map((s) => (
              <StreamerCard key={s.id} streamer={s} />
            ))}
            {leaderboard.length === 0 && (
              <p className="text-gray-500 col-span-full">Нет участников — запустите npm run db:seed</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <BossPanel boss={boss} />
          <FeedPanel items={feed} />
        </div>
      </main>
    </div>
  );
}
