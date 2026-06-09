"use client";

import Link from "next/link";
import { Crown, Shield, Zap } from "lucide-react";
import { McAvatar } from "./mc-avatar";
import { Progress } from "@/components/ui/progress";
import { classLabels } from "@/lib/profile/mock-data";
import type { ProfileSummary } from "@/lib/profile/profile-data.service";
import { formatNumber } from "@/lib/utils";

interface OsProfileHeaderProps {
  nickname?: string | null;
  avatar?: string | null;
  isAuthenticated: boolean;
  summary: ProfileSummary | null;
}

export function OsProfileHeader({
  nickname,
  avatar,
  isAuthenticated,
  summary,
}: OsProfileHeaderProps) {
  const displayName = nickname ?? "Игрок";

  if (!isAuthenticated) {
    return (
      <div className="rounded border border-[#1a1208] bg-[#1a1208]/60 p-6 text-center">
        <p className="font-display text-lg text-[#e8d5b0]">Войдите, чтобы открыть профиль</p>
        <p className="mt-2 text-sm text-[#7a6a52]">
          Twitch или Discord — сохраним прогресс, инвентарь и достижения
        </p>
        <Link href="/login" className="mc-os-btn mt-4 inline-block px-6 py-2 text-xs">
          Войти
        </Link>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded border border-[#1a1208] bg-[#1a1208]/60 p-6 text-center">
        <p className="text-sm text-[#7a6a52]">Загрузка профиля...</p>
      </div>
    );
  }

  const classInfo = classLabels[summary.playerClass];
  const xpPercent = Math.round((summary.experience / summary.experienceToNext) * 100);

  return (
    <div className="rounded border border-primary/20 bg-[#1a1208]/80 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {avatar ? (
          <div className="mc-slot mx-auto h-16 w-16 shrink-0 overflow-hidden sm:mx-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatar} alt={displayName} className="h-full w-full object-cover" />
          </div>
        ) : (
          <McAvatar nickname={displayName} size={48} className="mx-auto sm:mx-0" />
        )}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h2 className="font-display text-xl text-[#e8d5b0]">{displayName}</h2>
            {summary.rating <= 3 && summary.power > 0 && (
              <span className="inline-flex items-center gap-1 rounded border border-hypixel-gold/40 bg-hypixel-gold/10 px-2 py-0.5 text-[10px] text-hypixel-gold">
                <Crown className="h-3 w-3" />
                TOP {summary.rating}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[#7a6a52]">
            {classInfo.name} · {summary.guild} · {summary.seasonName}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center sm:text-right">
          <div>
            <p className="font-display text-lg text-hypixel-gold">{formatNumber(summary.power)}</p>
            <p className="text-[9px] uppercase text-[#5c4a32]">PWR</p>
          </div>
          <div>
            <p className="font-display text-lg text-primary">{summary.level}</p>
            <p className="text-[9px] uppercase text-[#5c4a32]">LVL</p>
          </div>
          <div>
            <p className="font-display text-lg text-mc-diamond">#{summary.rating}</p>
            <p className="text-[9px] uppercase text-[#5c4a32]">Ранг</p>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-[10px] text-[#7a6a52]">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-hypixel-gold" />
            Уровень {summary.level}
          </span>
          <span>
            {formatNumber(summary.experience)} / {formatNumber(summary.experienceToNext)} XP
          </span>
        </div>
        <Progress value={xpPercent} className="h-2 bg-[#0d0a08]" indicatorClassName="bg-primary" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded border border-[#1a1208] px-2 py-1 text-[10px] text-[#a89070]">
          <Shield className="h-3 w-3" />
          {summary.guild}
        </span>
        <span className="rounded border border-[#1a1208] px-2 py-1 text-[10px] text-[#a89070]">
          Класс: {classInfo.name}
        </span>
        <Link
          href="/completions"
          className="rounded border border-primary/30 px-2 py-1 text-[10px] text-primary hover:bg-primary/10"
        >
          Каталог прохождений →
        </Link>
      </div>
    </div>
  );
}
