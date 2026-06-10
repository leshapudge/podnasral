import { localItemIcon } from "@/lib/inventory/item-assets";

export const SLOT_BET = 100;

/** Любая пара одинаковых — ×2 ставки. */
export const SLOT_PAIR_MULT = 2;

/** Тройка гнили — штраф монет (дополнительно к ставке). */
export const SLOT_ROTTEN_TRIPLE_PENALTY = 8000;

/** Тройка с множителем ≥ этого — «крутая» награда (звук опыта). */
export const SLOT_BIG_WIN_TRIPLE_MULT = 20;

export type SlotTier =
  | "junk"
  | "mini"
  | "minor"
  | "major"
  | "mega"
  | "super"
  | "jackpot";

export interface SlotSymbol {
  id: string;
  label: string;
  texture: string;
  weight: number;
  tier: SlotTier;
  /** Тройка — множитель ставки (0 = без выигрыша). */
  tripleMult: number;
}

const slotIcon = (id: string) => localItemIcon(`slot_${id}`);

export const SLOT_SYMBOLS: SlotSymbol[] = [
  {
    id: "rotten_flesh",
    label: "Гниль",
    texture: slotIcon("rotten_flesh"),
    weight: 24,
    tier: "junk",
    tripleMult: 0,
  },
  {
    id: "coal",
    label: "Уголь",
    texture: slotIcon("coal"),
    weight: 18,
    tier: "mini",
    tripleMult: 3,
  },
  {
    id: "iron",
    label: "Железо",
    texture: slotIcon("iron"),
    weight: 16,
    tier: "minor",
    tripleMult: 5,
  },
  {
    id: "gold",
    label: "Золото",
    texture: slotIcon("gold"),
    weight: 12,
    tier: "major",
    tripleMult: 10,
  },
  {
    id: "emerald",
    label: "Изумруд",
    texture: slotIcon("emerald"),
    weight: 8,
    tier: "mega",
    tripleMult: 20,
  },
  {
    id: "nether_star",
    label: "Звезда Незера",
    texture: slotIcon("nether_star"),
    weight: 3,
    tier: "super",
    tripleMult: 50,
  },
  {
    id: "diamond",
    label: "Алмаз",
    texture: slotIcon("diamond"),
    weight: 5,
    tier: "jackpot",
    tripleMult: 80,
  },
];

export const SLOT_TIER_LABEL: Record<SlotTier, string> = {
  junk: "—",
  mini: "Мини",
  minor: "Малый",
  major: "Средний",
  mega: "Большой",
  super: "Супер",
  jackpot: "ДЖЕКПОТ",
};

const TOTAL_WEIGHT = SLOT_SYMBOLS.reduce((s, x) => s + x.weight, 0);

export interface PaytableLine {
  symbol: SlotSymbol;
  tierLabel: string;
  tripleMult: number;
  triplePayout: number;
}

export interface SlotWinResult {
  payout: number;
  kind: "none" | "pair" | "triple";
  symbolId: string | null;
  symbolLabel: string | null;
  multiplier: number;
  tierLabel: string | null;
  winTitle: string | null;
}

export function pickSlotSymbol(rand: () => number): SlotSymbol {
  let r = rand() * TOTAL_WEIGHT;
  for (const sym of SLOT_SYMBOLS) {
    r -= sym.weight;
    if (r <= 0) return sym;
  }
  return SLOT_SYMBOLS[SLOT_SYMBOLS.length - 1];
}

export function isEnchantedSlotSymbol(id: string): boolean {
  return id === "diamond";
}

export function triplePayout(bet: number, mult: number): number {
  return Math.round(bet * mult);
}

export function pairPayout(bet: number): number {
  return bet * SLOT_PAIR_MULT;
}

/** Таблица выплат для ставки (как на боковой панели слота). */
export function getPaytableLines(bet: number = SLOT_BET): PaytableLine[] {
  return SLOT_SYMBOLS.filter((s) => s.tripleMult > 0)
    .slice()
    .sort((a, b) => b.tripleMult - a.tripleMult)
    .map((symbol) => ({
      symbol,
      tierLabel: SLOT_TIER_LABEL[symbol.tier],
      tripleMult: symbol.tripleMult,
      triplePayout: triplePayout(bet, symbol.tripleMult),
    }));
}

export function resolveSlotWin(reels: SlotSymbol[], bet: number): SlotWinResult {
  const counts = new Map<string, number>();
  for (const r of reels) counts.set(r.id, (counts.get(r.id) ?? 0) + 1);

  if ((counts.get("rotten_flesh") ?? 0) === 3) {
    return {
      payout: -SLOT_ROTTEN_TRIPLE_PENALTY,
      kind: "triple",
      symbolId: "rotten_flesh",
      symbolLabel: "Гниль",
      multiplier: 0,
      tierLabel: "Проклятие",
      winTitle: "ПРОКЛЯТИЕ",
    };
  }

  for (const sym of SLOT_SYMBOLS) {
    if ((counts.get(sym.id) ?? 0) === 3 && sym.tripleMult > 0) {
      return {
        payout: triplePayout(bet, sym.tripleMult),
        kind: "triple",
        symbolId: sym.id,
        symbolLabel: sym.label,
        multiplier: sym.tripleMult,
        tierLabel: SLOT_TIER_LABEL[sym.tier],
        winTitle: SLOT_TIER_LABEL[sym.tier],
      };
    }
  }

  for (const sym of SLOT_SYMBOLS) {
    if ((counts.get(sym.id) ?? 0) >= 2) {
      return {
        payout: pairPayout(bet),
        kind: "pair",
        symbolId: sym.id,
        symbolLabel: sym.label,
        multiplier: SLOT_PAIR_MULT,
        tierLabel: "Пара",
        winTitle: "Пара",
      };
    }
  }

  return {
    payout: 0,
    kind: "none",
    symbolId: null,
    symbolLabel: null,
    multiplier: 0,
    tierLabel: null,
    winTitle: null,
  };
}

/** @deprecated use resolveSlotWin */
export function calcSlotPayout(reels: SlotSymbol[], bet: number): number {
  return resolveSlotWin(reels, bet).payout;
}

export function symbolById(id: string): SlotSymbol {
  return SLOT_SYMBOLS.find((s) => s.id === id) ?? SLOT_SYMBOLS[0];
}

export function formatWinMessage(win: SlotWinResult): string {
  if (win.payout < 0) return `−${Math.abs(win.payout)} · ${win.winTitle ?? "штраф"}`;
  if (win.payout <= 0) return `−${SLOT_BET}`;
  if (win.kind === "triple" && win.winTitle) {
    return `+${win.payout} · ${win.winTitle}`;
  }
  if (win.kind === "pair") return `+${win.payout} · пара`;
  return `+${win.payout}`;
}

export function isRottenTriple(reels: { id: string }[]): boolean {
  return reels.length === 3 && reels.every((r) => r.id === "rotten_flesh");
}

export function isBigSlotWin(matchKind: SlotWinResult["kind"], payout: number, symbolId: string | null) {
  if (matchKind !== "triple" || payout <= 0 || !symbolId) return false;
  return symbolById(symbolId).tripleMult >= SLOT_BIG_WIN_TRIPLE_MULT;
}
