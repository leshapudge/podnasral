import { authorizedStreamerUserFilter } from "@/lib/participants/authorized-streamer";
import prisma from "@/lib/db/prisma";
import { badRequest } from "@/lib/api/errors";
import {
  resolveSlotWin,
  SLOT_BET,
  type SlotSymbol,
} from "@/lib/arcade/slot-symbols";
import { rollSlotReels } from "@/lib/arcade/slot-outcomes";

export const DIAMOND_VALUE = 50;
export const START_COINS = 300;
export const START_DIAMONDS = 8;

export function calcNetWorth(coins: number, diamonds: number) {
  return coins + diamonds * DIAMOND_VALUE;
}

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export async function ensureArcadeWallet(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { accounts: { where: { provider: "twitch" }, take: 1 } },
  });
  if (!user) throw badRequest("User not found");

  if (user.accounts.length === 0) return user;

  if (user.arcadeCoins === 0 && user.arcadeDiamonds === 0 && user.arcadeNetWorth === 0) {
    const net = calcNetWorth(START_COINS, START_DIAMONDS);
    return prisma.user.update({
      where: { id: userId },
      data: {
        arcadeCoins: START_COINS,
        arcadeDiamonds: START_DIAMONDS,
        arcadeNetWorth: net,
      },
    });
  }

  const net = calcNetWorth(user.arcadeCoins, user.arcadeDiamonds);
  if (user.arcadeNetWorth !== net) {
    return prisma.user.update({
      where: { id: userId },
      data: { arcadeNetWorth: net },
    });
  }

  return user;
}

export async function getArcadeMe(userId: string) {
  const user = await ensureArcadeWallet(userId);
  return {
    coins: user.arcadeCoins,
    diamonds: user.arcadeDiamonds,
    netWorth: user.arcadeNetWorth,
  };
}

export async function spinArcade(userId: string, _bet?: number) {
  const stake = SLOT_BET;
  const user = await ensureArcadeWallet(userId);
  const rand = seededRandom(`${userId}-slot-${Date.now()}-${stake}`);

  const reels: SlotSymbol[] = rollSlotReels(rand);

  const win = resolveSlotWin(reels, stake);
  const payout = win.payout;
  const nextCoins = user.arcadeCoins - stake + payout;
  const delta = payout - stake;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      arcadeCoins: nextCoins,
      arcadeNetWorth: calcNetWorth(nextCoins, user.arcadeDiamonds),
    },
    select: {
      arcadeCoins: true,
      arcadeDiamonds: true,
      arcadeNetWorth: true,
      twitchLogin: true,
      name: true,
      image: true,
    },
  });

  return {
    won: payout > 0,
    delta,
    payout,
    bet: stake,
    matchKind: win.kind === "none" ? ("none" as const) : win.kind,
    winTitle: win.winTitle,
    symbolId: win.symbolId,
    symbolLabel: win.symbolLabel,
    multiplier: win.multiplier,
    reels: reels.map((r) => ({ id: r.id, label: r.label, texture: r.texture })),
    coins: updated.arcadeCoins,
    diamonds: updated.arcadeDiamonds,
    netWorth: updated.arcadeNetWorth,
    player: {
      twitchLogin: updated.twitchLogin,
      name: updated.name ?? updated.twitchLogin,
      image: updated.image,
    },
  };
}

export async function getArcadeLeaderboards(limit = 10) {
  const select = {
    id: true,
    twitchLogin: true,
    name: true,
    image: true,
    arcadeCoins: true,
    arcadeDiamonds: true,
    arcadeNetWorth: true,
  } as const;

  const [winnerUsers, loserUsers] = await Promise.all([
    prisma.user.findMany({
      where: {
        arcadeCoins: { gt: 0 },
        twitchLogin: { not: null },
        accounts: authorizedStreamerUserFilter.accounts,
      },
      orderBy: { arcadeCoins: "desc" },
      take: limit,
      select,
    }),
    prisma.user.findMany({
      where: {
        arcadeCoins: { lt: 0 },
        twitchLogin: { not: null },
        accounts: authorizedStreamerUserFilter.accounts,
      },
      orderBy: { arcadeCoins: "asc" },
      take: limit,
      select,
    }),
  ]);

  const mapRows = (users: typeof winnerUsers) =>
    users.map((u, i) => ({
      rank: i + 1,
      twitchLogin: u.twitchLogin,
      name: u.name ?? u.twitchLogin,
      image: u.image,
      coins: u.arcadeCoins,
      diamonds: u.arcadeDiamonds,
      netWorth: u.arcadeNetWorth,
    }));

  return {
    winners: mapRows(winnerUsers),
    losers: mapRows(loserUsers),
  };
}

/** @deprecated use getArcadeLeaderboards */
export async function getArcadeLeaderboard(limit = 25) {
  const { winners } = await getArcadeLeaderboards(limit);
  return winners;
}
