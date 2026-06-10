"use client";

import Link from "next/link";
import { Play, Swords } from "lucide-react";
import type { AppTabSlug } from "@/lib/landing/app-tabs";
import type { HomePageData } from "@/lib/landing/home-data.types";
import { McItemSlot } from "../mc-item-slot";
import { OsPanelFrame } from "../os-panel-frame";
import { OsSectionTitle } from "../os-section-title";
import { Progress } from "@/components/ui/progress";
import { MC_ASSETS } from "@/lib/landing/assets";
import { getBossTexture } from "@/lib/bosses/boss-assets";
import { formatNumber } from "@/lib/utils";

interface OverviewPanelProps {
  isAuthenticated: boolean;
  homeData: HomePageData;
  onTabChange: (tab: AppTabSlug) => void;
}

const quickLinks: { tab: AppTabSlug; label: string; texture: string }[] = [
  { tab: "boss", label: "Боссы", texture: MC_ASSETS.items.witherSkull },
  { tab: "inventory", label: "Инвентарь", texture: MC_ASSETS.items.shulkerBox },
  { tab: "achievements", label: "Достижения", texture: MC_ASSETS.items.enderPearl },
];

const statTextures: Record<string, string> = {
  grass: MC_ASSETS.blocks.grassTop,
  wither: MC_ASSETS.items.witherSkull,
  users: MC_ASSETS.items.experienceBottle,
  hammer: MC_ASSETS.items.ironPickaxe,
};

export function OverviewPanel({ isAuthenticated, homeData, onTabChange }: OverviewPanelProps) {
  const { season, stats, featuredBoss } = homeData;

  return (
    <OsPanelFrame>
      <div className="text-center sm:text-left">
        <h2 className="font-display text-2xl tracking-wider text-[#e8d5b0] sm:text-3xl">
          <span className="text-primary">MINE</span>
          <span className="text-hypixel-gold">SEASON</span>
        </h2>
        <p className="mt-2 max-w-xl text-sm text-[#7a6a52]">
          Стримерский игровой ивент. Играй, крафти, бей боссов и поднимайся в рейтинге силы.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => onTabChange("profile")}
              className="mc-os-btn inline-flex items-center gap-2 px-5 py-2 text-xs"
            >
              <Play className="h-3.5 w-3.5" />
              Мой профиль
            </button>
          ) : (
            <Link
              href="/login"
              className="mc-os-btn inline-flex items-center gap-2 px-5 py-2 text-xs"
            >
              <Play className="h-3.5 w-3.5" />
              Начать
            </Link>
          )}
          <button
            type="button"
            onClick={() => onTabChange("boss")}
            className="mc-os-btn inline-flex items-center gap-2 px-5 py-2 text-xs"
          >
            <Swords className="h-3.5 w-3.5" />
            К боссу
          </button>
          <Link
            href="/completions"
            className="mc-os-btn inline-flex items-center gap-2 px-5 py-2 text-xs"
          >
            Каталог игр
          </Link>
        </div>
      </div>

      <div className="mc-stat-grid" style={{ marginTop: "1.5rem" }}>
        {stats.map((stat) => (
          <div key={stat.label} className="mc-stat-card">
            <McItemSlot
              src={statTextures[stat.icon] ?? MC_ASSETS.blocks.stone}
              alt={stat.label}
              size="sm"
              enchanted
            />
            <div className="min-w-0">
              <p className="font-display text-[9px] uppercase text-[#7a6a52]">{stat.label}</p>
              <p className="font-display text-sm text-primary">
                {typeof stat.value === "number" ? formatNumber(stat.value) : stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <OsSectionTitle>Быстрый доступ</OsSectionTitle>
      <div className="mc-quick-grid">
        {quickLinks.map((link) => (
          <button
            key={link.tab}
            type="button"
            onClick={() => onTabChange(link.tab)}
            className="mc-quick-btn"
          >
            <McItemSlot src={link.texture} alt={link.label} size="sm" />
            <span className="text-xs font-medium text-[#e8d5b0]">{link.label}</span>
          </button>
        ))}
      </div>

      {featuredBoss ? (
        <>
          <OsSectionTitle className="mt-6">Мировой босс</OsSectionTitle>
          <div className="mt-2 flex flex-col gap-3 rounded border border-boss/30 bg-boss/5 p-4 sm:flex-row sm:items-center">
            <McItemSlot
              src={getBossTexture(featuredBoss.slug)}
              alt={featuredBoss.name}
              size="md"
              enchanted
              className="mx-auto sm:mx-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg text-[#e8d5b0]">{featuredBoss.name}</p>
              <p className="text-xs text-[#7a6a52]">{featuredBoss.subtitle}</p>
              <Progress
                value={featuredBoss.hpPercent}
                className="mt-2 h-2 bg-mc-redstone/20"
                indicatorClassName="bg-gradient-to-r from-mc-redstone via-boss to-hypixel-gold"
              />
              <p className="mt-1 text-xs text-boss">
                {formatNumber(featuredBoss.currentHp)} / {formatNumber(featuredBoss.maxHp)} HP ·{" "}
                {featuredBoss.hpPercent}%
              </p>
            </div>
            <button
              type="button"
              onClick={() => onTabChange("boss")}
              className="mc-os-btn shrink-0 px-4 py-2 text-xs"
            >
              Атаковать
            </button>
          </div>
        </>
      ) : (
        <p className="mt-6 text-center text-sm text-[#7a6a52]">Боссы сезона скоро появятся</p>
      )}

      {season && (
        <button
          type="button"
          onClick={() => onTabChange("season")}
          className="mt-4 w-full rounded border border-primary/20 bg-primary/5 p-3 text-center transition-colors hover:border-primary/40 sm:text-left"
        >
          <p className="text-xs text-[#7a6a52]">Прогресс сезона</p>
          <p className="font-display text-xl text-primary">{season.progress}%</p>
          <p className="text-xs text-[#7a6a52]">осталось {season.daysRemaining} дней</p>
        </button>
      )}
    </OsPanelFrame>
  );
}
