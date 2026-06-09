import type { ActivityLogType, Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import { liveBroadcaster } from "@/lib/live/broadcaster";

export async function logActivity(params: {
  eventId: string;
  type: ActivityLogType;
  actorId?: string;
  payload: Prisma.InputJsonValue;
}) {
  const entry = await prisma.activityLog.create({
    data: {
      eventId: params.eventId,
      type: params.type,
      actorId: params.actorId,
      payload: params.payload,
    },
    include: {
      actor: { select: { name: true, twitchLogin: true, image: true } },
    },
  });

  liveBroadcaster.publish({
    type: "feed.item",
    data: {
      id: entry.id,
      type: entry.type,
      actor: entry.actor?.twitchLogin ?? entry.actor?.name ?? "System",
      payload: entry.payload,
      createdAt: entry.createdAt.toISOString(),
    },
  });

  return entry;
}

export async function getFeed(eventId: string, limit = 30, cursor?: string) {
  const items = await prisma.activityLog.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      actor: { select: { name: true, twitchLogin: true, image: true } },
    },
  });

  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;

  return {
    items: data.map((item) => ({
      id: item.id,
      type: item.type,
      actor: item.actor?.twitchLogin ?? item.actor?.name ?? "System",
      actorImage: item.actor?.image,
      payload: item.payload,
      createdAt: item.createdAt.toISOString(),
    })),
    nextCursor: hasMore ? data[data.length - 1]?.id : null,
  };
}
