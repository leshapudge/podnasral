import type { Rarity } from "./types";

export const rarityConfig: Record<
  Rarity,
  {
    label: string;
    border: string;
    bg: string;
    text: string;
    glow: string;
    tooltipBorder: string;
  }
> = {
  COMMON: {
    label: "Обычный",
    border: "border-mc-stone/60",
    bg: "bg-mc-stone/15",
    text: "text-mc-stone",
    glow: "shadow-mc-stone/20",
    tooltipBorder: "border-mc-stone/50",
  },
  UNCOMMON: {
    label: "Необычный",
    border: "border-primary/60",
    bg: "bg-primary/15",
    text: "text-primary",
    glow: "shadow-primary/25",
    tooltipBorder: "border-primary/50",
  },
  RARE: {
    label: "Редкий",
    border: "border-mc-diamond/60",
    bg: "bg-mc-diamond/15",
    text: "text-mc-diamond",
    glow: "shadow-mc-diamond/30",
    tooltipBorder: "border-mc-diamond/50",
  },
  EPIC: {
    label: "Эпический",
    border: "border-purple-500/60",
    bg: "bg-purple-500/15",
    text: "text-purple-400",
    glow: "shadow-purple-500/30",
    tooltipBorder: "border-purple-500/50",
  },
  LEGENDARY: {
    label: "Легендарный",
    border: "border-hypixel-gold/70",
    bg: "bg-hypixel-gold/15",
    text: "text-hypixel-gold-light",
    glow: "shadow-hypixel-gold/40",
    tooltipBorder: "border-hypixel-gold/60",
  },
};

export const kindLabels = {
  RESOURCE: "Ресурс",
  ITEM: "Предмет",
  ARTIFACT: "Артефакт",
} as const;
