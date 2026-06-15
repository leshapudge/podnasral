import prisma from "@/lib/db/prisma";
import type { EventConfig } from "@/lib/event/config";

export interface CompetitionContext {
  rank: number;
  totalParticipants: number;
  pointsBehindLeader: number;
  gamesCompleted: number;
  gamesAheadOfMedian: number;
}

export async function getCompetitionContext(
  participantId: string,
  eventId: string,
): Promise<CompetitionContext> {
  const participants = await prisma.participant.findMany({
    where: { eventId },
    orderBy: [{ totalPoints: "desc" }, { displayOrder: "asc" }],
    select: {
      id: true,
      totalPoints: true,
      gameSessions: {
        where: { status: "COMPLETED" },
        select: { id: true },
      },
    },
  });

  const idx = participants.findIndex((p) => p.id === participantId);
  const safeIdx = idx >= 0 ? idx : participants.length - 1;
  const self = participants[safeIdx];
  const leader = participants[0];

  const completionCounts = participants.map((p) => p.gameSessions.length);
  const sorted = [...completionCounts].sort((a, b) => a - b);
  const median =
    sorted.length === 0
      ? 0
      : sorted.length % 2 === 1
        ? sorted[(sorted.length - 1) / 2]
        : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;

  return {
    rank: safeIdx + 1,
    totalParticipants: participants.length,
    pointsBehindLeader: leader ? Math.max(0, leader.totalPoints - self.totalPoints) : 0,
    gamesCompleted: self.gameSessions.length,
    gamesAheadOfMedian: self.gameSessions.length - median,
  };
}

/** Бонус аутсайдера: чем ниже место и больше отставание — тем выше множитель (с потолком). */
export function catchUpScoreMultiplier(
  ctx: CompetitionContext,
  config: EventConfig,
): number {
  if (!config.catchUp.enabled || ctx.totalParticipants <= 1) return 1;

  if (ctx.rank < config.catchUp.rankThreshold) return 1;

  const rankBonus =
    (ctx.rank - config.catchUp.rankThreshold + 1) * config.catchUp.rankStepBonus;
  const behindSteps = Math.floor(ctx.pointsBehindLeader / config.catchUp.pointsBehindStep);
  const behindBonus = behindSteps * config.catchUp.pointsBehindBonus;
  const gamesBehindMedian = Math.max(0, Math.ceil(-ctx.gamesAheadOfMedian));
  const gamesBonus = gamesBehindMedian * config.catchUp.gamesBehindMedianBonus;

  let total = 1 + rankBonus + behindBonus + gamesBonus;
  const half = Math.ceil(ctx.totalParticipants / 2);
  if (ctx.rank > half) {
    total = Math.max(total, config.catchUp.minimumForBottomHalf);
  }

  return Math.min(config.catchUp.maxMultiplier, total);
}

/** Лидер с большим отрывом по играм получает чуть меньше очков — анти-сноуболл. */
export function leaderSoftCapMultiplier(
  ctx: CompetitionContext,
  config: EventConfig,
): number {
  if (!config.leaderSoftCap.enabled) return 1;
  if (ctx.rank > config.leaderSoftCap.applyToTopRanks) return 1;
  if (ctx.gamesAheadOfMedian < config.leaderSoftCap.gamesAheadOfMedian) return 1;
  const overshoot = Math.max(
    1,
    Math.ceil(ctx.gamesAheadOfMedian - config.leaderSoftCap.gamesAheadOfMedian + 1),
  );
  const scaled = config.leaderSoftCap.scoreMultiplier ** overshoot;
  return Math.max(0.75, scaled);
}

export function bossDamageRankMultiplier(
  rank: number,
  config: EventConfig,
): number {
  const caps = config.boss.damageSoftCapByRank;
  const idx = Math.min(Math.max(rank - 1, 0), caps.length - 1);
  return caps[idx] ?? 1;
}
