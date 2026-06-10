import {
  pickSlotSymbol,
  resolveSlotWin,
  SLOT_BET,
  symbolById,
  type SlotSymbol,
} from "./slot-symbols";

/** Базис 10_000 = 100.00% — как RTP-таблица в настоящих слотах. */
const BASIS = 10_000;

type OutcomeKind = "triple" | "pair" | "miss";

interface WeightedOutcome {
  kind: OutcomeKind;
  symbolId?: string;
  weight: number;
}

/** Таблица исходов спина (сервер). Сумма весов = 10_000 (100%). */
const SPIN_OUTCOMES: WeightedOutcome[] = [
  { kind: "triple", symbolId: "diamond", weight: 70 },
  { kind: "triple", symbolId: "nether_star", weight: 30 },
  { kind: "triple", symbolId: "emerald", weight: 70 },
  { kind: "triple", symbolId: "gold", weight: 140 },
  { kind: "triple", symbolId: "iron", weight: 220 },
  { kind: "triple", symbolId: "coal", weight: 290 },
  { kind: "triple", symbolId: "rotten_flesh", weight: 380 },

  { kind: "pair", symbolId: "diamond", weight: 90 },
  { kind: "pair", symbolId: "nether_star", weight: 110 },
  { kind: "pair", symbolId: "emerald", weight: 210 },
  { kind: "pair", symbolId: "gold", weight: 340 },
  { kind: "pair", symbolId: "iron", weight: 490 },
  { kind: "pair", symbolId: "coal", weight: 640 },
  { kind: "pair", symbolId: "rotten_flesh", weight: 920 },

  { kind: "miss", weight: 6000 },
];

const OUTCOME_TOTAL = SPIN_OUTCOMES.reduce((s, o) => s + o.weight, 0);

function pickOutcome(rand: () => number): WeightedOutcome {
  let r = rand() * OUTCOME_TOTAL;
  for (const o of SPIN_OUTCOMES) {
    r -= o.weight;
    if (r <= 0) return o;
  }
  return SPIN_OUTCOMES[SPIN_OUTCOMES.length - 1];
}

function pickOtherSymbol(rand: () => number, excludeId: string): SlotSymbol {
  for (let i = 0; i < 32; i++) {
    const s = pickSlotSymbol(rand);
    if (s.id !== excludeId) return s;
  }
  return symbolById("rotten_flesh");
}

function buildTriple(symbolId: string): SlotSymbol[] {
  const s = symbolById(symbolId);
  return [s, s, s];
}

function buildPair(symbolId: string, rand: () => number): SlotSymbol[] {
  const sym = symbolById(symbolId);
  const other = pickOtherSymbol(rand, symbolId);
  const layout = Math.floor(rand() * 3);
  if (layout === 0) return [sym, sym, other];
  if (layout === 1) return [sym, other, sym];
  return [other, sym, sym];
}

function buildMiss(rand: () => number): SlotSymbol[] {
  for (let i = 0; i < 64; i++) {
    const reels = [pickSlotSymbol(rand), pickSlotSymbol(rand), pickSlotSymbol(rand)];
    if (resolveSlotWin(reels, SLOT_BET).payout === 0) return reels;
  }
  return [symbolById("rotten_flesh"), symbolById("coal"), symbolById("iron")];
}

/** Серверный спин: сначала исход, потом символы на линии. */
export function rollSlotReels(rand: () => number): SlotSymbol[] {
  const outcome = pickOutcome(rand);
  if (outcome.kind === "triple" && outcome.symbolId) {
    return buildTriple(outcome.symbolId);
  }
  if (outcome.kind === "pair" && outcome.symbolId) {
    return buildPair(outcome.symbolId, rand);
  }
  return buildMiss(rand);
}

export interface OutcomeOddsLine {
  label: string;
  symbolId?: string;
  kind: OutcomeKind;
  percent: number;
}

/** Примерные шансы для UI «Правила». */
export function getOutcomeOdds(): OutcomeOddsLine[] {
  const lines: OutcomeOddsLine[] = SPIN_OUTCOMES.filter((o) => o.kind !== "miss").map(
    (o) => ({
      label:
        o.kind === "triple"
          ? `3× ${symbolById(o.symbolId!).label}`
          : `2× ${symbolById(o.symbolId!).label}`,
      symbolId: o.symbolId,
      kind: o.kind,
      percent: (o.weight / OUTCOME_TOTAL) * 100,
    }),
  );

  const miss = SPIN_OUTCOMES.find((o) => o.kind === "miss");
  if (miss) {
    lines.push({
      label: "Без выигрыша",
      kind: "miss",
      percent: (miss.weight / OUTCOME_TOTAL) * 100,
    });
  }

  return lines;
}

export { BASIS as SLOT_ODDS_BASIS };
