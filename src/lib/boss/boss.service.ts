import prisma from "@/lib/db/prisma";
import { notFound } from "@/lib/api/errors";
import { getActiveEvent, getActiveEventOrNull } from "@/lib/event/event.service";
import { liveBroadcaster } from "@/lib/live/broadcaster";
import { logActivity } from "@/lib/activity/activity.service";
import type { EventConfig } from "@/lib/event/config";
import { bossDamageRankMultiplier } from "@/lib/balance/catch-up";
import { calculateBossDamage } from "@/lib/scoring/score-calculator";

export async function getBossPublic() {
  const event = await getActiveEventOrNull();
  if (!event) return null;
  const boss = await prisma.boss.findUnique({
    where: { eventId: event.id },
    include: {
      damages: {
        orderBy: { damage: "desc" },
        take: 10,
        include: {
          participant: { include: { user: { select: { twitchLogin: true, name: true } } } },
        },
      },
    },
  });

  if (!boss) return null;

  const totalDamage = boss.damages.reduce((s, d) => s + d.damage, 0);

  return {
    slug: boss.slug,
    name: boss.name,
    currentHp: boss.currentHp,
    maxHp: boss.maxHp,
    hpPercent: boss.maxHp > 0 ? Math.round((boss.currentHp / boss.maxHp) * 100) : 0,
    status: boss.status,
    topDamagers: boss.damages.map((d) => ({
      nickname: d.participant.user.twitchLogin ?? d.participant.user.name ?? "?",
      damage: d.damage,
      percent: totalDamage > 0 ? Math.round((d.damage / totalDamage) * 100) : 0,
    })),
  };
}

export async function dealBossDamage(params: {
  eventId: string;
  participantId: string;
  gameSessionId: string;
  finalScore: number;
  config: EventConfig;
  rank?: number;
  bossItemMult?: number;
  actorUserId?: string;
}) {
  const boss = await prisma.boss.findUnique({ where: { eventId: params.eventId } });
  if (!boss || boss.status !== "ACTIVE") return null;

  const rankMult = bossDamageRankMultiplier(params.rank ?? 1, params.config);
  const damage = calculateBossDamage(
    params.finalScore,
    params.config,
    rankMult,
    params.bossItemMult ?? 1,
  );

  const result = await prisma.$transaction(async (tx) => {
    const entry = await tx.bossDamage.create({
      data: {
        bossId: boss.id,
        participantId: params.participantId,
        gameSessionId: params.gameSessionId,
        damage,
      },
    });

    const updatedBoss = await tx.boss.update({
      where: { id: boss.id },
      data: { currentHp: Math.max(0, boss.currentHp - damage) },
    });

    return { entry, boss: updatedBoss };
  });

  liveBroadcaster.publish({
    type: "boss.hp",
    data: {
      currentHp: result.boss.currentHp,
      maxHp: result.boss.maxHp,
      status: result.boss.status,
    },
  });

  await logActivity({
    eventId: params.eventId,
    type: "BOSS_HIT",
    actorId: params.actorUserId,
    payload: { damage, bossHp: result.boss.currentHp, rankMult },
  });

  if (result.boss.currentHp <= 0) {
    await defeatBoss(boss.id, params.eventId);
  }

  return result;
}

async function defeatBoss(bossId: string, eventId: string) {
  await prisma.boss.update({
    where: { id: bossId },
    data: { status: "DEFEATED", currentHp: 0 },
  });

  const bonusSlugs = [
    "good_flat_8",
    "anabolics",
    "parachute",
    "free_spins",
    "number_9_extra",
    "reroll_fetishist",
  ];
  const bonusItems = await prisma.itemDefinition.findMany({
    where: { slug: { in: bonusSlugs } },
  });

  const participants = await prisma.participant.findMany({
    where: { eventId },
    orderBy: [{ totalPoints: "asc" }],
  });

  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i];
    const item = bonusItems[i % bonusItems.length];
    if (!item) continue;

    await prisma.inventoryItem.create({
      data: {
        participantId: participant.id,
        itemDefinitionId: item.id,
        quantity: 1,
        instanceId: crypto.randomUUID(),
      },
    });
  }

  await logActivity({
    eventId,
    type: "BOSS_DEFEATED",
    payload: { bossId, rewardedParticipants: participants.length },
  });

  liveBroadcaster.publish({
    type: "boss.hp",
    data: { currentHp: 0, maxHp: 0, status: "DEFEATED" },
  });
}

/** Масштабирует HP босса под число участников ивента. */
export async function syncBossHpForEvent(eventId: string, config: EventConfig) {
  const count = await prisma.participant.count({ where: { eventId } });
  const maxHp = Math.max(50_000, count * config.boss.hpPerParticipant);

  await prisma.boss.upsert({
    where: { eventId },
    create: {
      eventId,
      slug: "ender_dragon",
      name: "Ender Dragon",
      maxHp,
      currentHp: maxHp,
      status: "ACTIVE",
    },
    update: { maxHp, currentHp: maxHp, status: "ACTIVE" },
  });
}
