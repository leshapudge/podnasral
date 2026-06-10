import prisma from "@/lib/db/prisma";
import { logActivity } from "@/lib/activity/activity.service";

/**
 * После прохождения: шанс украсть материал у лидера таблицы.
 */
export async function tryRatSteal(params: {
  thiefParticipantId: string;
  eventId: string;
  actorUserId?: string;
}): Promise<{ stolen: boolean; itemName?: string; victimNickname?: string }> {
  const leader = await prisma.participant.findFirst({
    where: {
      eventId: params.eventId,
      id: { not: params.thiefParticipantId },
    },
    orderBy: { totalPoints: "desc" },
    include: {
      user: { select: { twitchLogin: true, name: true } },
      inventoryItems: {
        where: { itemDefinition: { kind: "MATERIAL" }, quantity: { gt: 0 } },
        include: { itemDefinition: true },
        take: 20,
      },
    },
  });

  if (!leader || leader.inventoryItems.length === 0) {
    return { stolen: false };
  }

  const armor = await prisma.inventoryItem.findFirst({
    where: {
      participantId: leader.id,
      itemDefinition: { slug: "body_armor" },
      quantity: { gt: 0 },
    },
  });
  if (armor) {
    return { stolen: false };
  }

  const pick =
    leader.inventoryItems[Math.floor(Math.random() * leader.inventoryItems.length)];
  if (!pick) return { stolen: false };

  await prisma.$transaction(async (tx) => {
    if (pick.quantity <= 1) {
      await tx.inventoryItem.delete({ where: { id: pick.id } });
    } else {
      await tx.inventoryItem.update({
        where: { id: pick.id },
        data: { quantity: { decrement: 1 } },
      });
    }

    const existing = await tx.inventoryItem.findFirst({
      where: {
        participantId: params.thiefParticipantId,
        itemDefinitionId: pick.itemDefinitionId,
        instanceId: null,
      },
    });

    if (existing) {
      await tx.inventoryItem.update({
        where: { id: existing.id },
        data: { quantity: { increment: 1 } },
      });
    } else {
      await tx.inventoryItem.create({
        data: {
          participantId: params.thiefParticipantId,
          itemDefinitionId: pick.itemDefinitionId,
          quantity: 1,
        },
      });
    }
  });

  const victimNickname = leader.user.twitchLogin ?? leader.user.name ?? "?";

  await logActivity({
    eventId: params.eventId,
    type: "LOOT",
    actorId: params.actorUserId,
    payload: {
      ratSteal: true,
      item: pick.itemDefinition.name,
      from: victimNickname,
    },
  });

  return {
    stolen: true,
    itemName: pick.itemDefinition.name,
    victimNickname,
  };
}
