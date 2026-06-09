import prisma from "@/lib/db/prisma";
import { notFound } from "@/lib/api/errors";
import { parseEventConfig } from "./config";
import { getDaysUntilStart, isEventUpcoming } from "./event-timing";

export async function getActiveEvent() {
  const event = await prisma.event.findFirst({
    where: { status: { in: ["ACTIVE", "UPCOMING"] } },
    orderBy: { startsAt: "asc" },
    include: { boss: true },
  });
  if (!event) throw notFound("Event");
  return event;
}

export async function getActiveEventOrNull() {
  return prisma.event.findFirst({
    where: { status: { in: ["ACTIVE", "UPCOMING"] } },
    orderBy: { startsAt: "asc" },
    include: { boss: true },
  });
}

export function getEventProgress(event: { startsAt: Date; endsAt: Date; status: string }) {
  const now = Date.now();
  const start = event.startsAt.getTime();
  const end = event.endsAt.getTime();
  const totalMs = end - start;
  const elapsed = Math.max(0, Math.min(now - start, totalMs));
  const progress = totalMs > 0 ? elapsed / totalMs : 0;
  const daysRemaining = Math.max(0, Math.ceil((end - now) / (24 * 60 * 60 * 1000)));
  const totalDays = Math.ceil(totalMs / (24 * 60 * 60 * 1000));

  const daysUntilStart = isEventUpcoming(event.status, event.startsAt)
    ? getDaysUntilStart(event.startsAt)
    : 0;

  return {
    progress: event.status === "UPCOMING" ? 0 : Math.round(progress * 100),
    daysRemaining: event.status === "UPCOMING" ? totalDays : daysRemaining,
    daysUntilStart,
    totalDays,
    phase: event.status,
  };
}

export async function getEventPublicData() {
  const event = await getActiveEventOrNull();
  if (!event) {
    return null;
  }

  const config = parseEventConfig(event.config);
  const timing = getEventProgress(event);

  return {
    id: event.id,
    name: event.name,
    status: event.status,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    ...timing,
    config: {
      pointsPerHour: config.pointsPerHour,
    },
  };
}

export async function activateEventIfStarted() {
  const event = await getActiveEventOrNull();
  if (!event || event.status !== "UPCOMING") return null;
  if (new Date() < event.startsAt) return null;

  return prisma.event.update({
    where: { id: event.id },
    data: { status: "ACTIVE" },
  });
}

export async function finalizeEventIfEnded() {
  const event = await getActiveEventOrNull();
  if (!event || event.status !== "ACTIVE") return null;
  if (new Date() < event.endsAt) return null;

  return prisma.event.update({
    where: { id: event.id },
    data: { status: "ENDED" },
  });
}
