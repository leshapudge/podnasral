"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import type { AppTabSlug } from "@/lib/landing/app-tabs";
import type { HomePageData } from "@/lib/landing/home-data.types";
import { McItemSlot } from "../mc-item-slot";
import { OsPanelFrame } from "../os-panel-frame";
import { OsSectionTitle } from "../os-section-title";
import { MC_ASSETS } from "@/lib/landing/assets";
import { formatNumber } from "@/lib/utils";

interface OverviewPanelProps {
  isAuthenticated: boolean;
  homeData: HomePageData;
  onTabChange: (tab: AppTabSlug) => void;
}

const quickLinks: { tab: AppTabSlug; label: string; texture: string }[] = [
  { tab: "overview", label: "Стримеры", texture: MC_ASSETS.items.experienceBottle },
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
  const { season, stats } = homeData;

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
    </OsPanelFrame>
  );
}
