import prisma from "@/lib/db/prisma";
import { notFound } from "@/lib/api/errors";
import { parseEventConfig } from "./config";
import { getDaysUntilStart, isEventUpcoming } from "./event-timing";
import { EVENT_DURATION_DAYS, EVENT_START_ISO } from "./event-roster";

const SEED_EVENT_ID = "seed-event-1";
const DAY_MS = 24 * 60 * 60 * 1000;

function buildSeedSchedule() {
  const startsAt = new Date(EVENT_START_ISO);
  const endsAt = new Date(startsAt.getTime() + EVENT_DURATION_DAYS * DAY_MS);
  return { startsAt, endsAt };
}

async function normalizeSeedEventSchedule(event: {
  id: string;
  startsAt: Date;
  endsAt: Date;
  status: "UPCOMING" | "ACTIVE" | "ENDED";
}) {
  if (event.id !== SEED_EVENT_ID) return null;

  const { startsAt, endsAt } = buildSeedSchedule();
  const now = Date.now();
  const desiredStatus =
    now >= endsAt.getTime() ? "ENDED" : now >= startsAt.getTime() ? "ACTIVE" : "UPCOMING";

  const hasStartMismatch = event.startsAt.getTime() !== startsAt.getTime();
  const hasEndMismatch = event.endsAt.getTime() !== endsAt.getTime();
  const hasStatusMismatch = event.status !== desiredStatus;
  if (!hasStartMismatch && !hasEndMismatch && !hasStatusMismatch) return null;

  return prisma.event.update({
    where: { id: event.id },
    data: { startsAt, endsAt, status: desiredStatus },
    include: { boss: true },
  });
}

export async function getActiveEvent() {
  const event = await getActiveEventOrNull();
  if (!event) throw notFound("Event");
  return event;
}

export async function getActiveEventOrNull() {
  const event = await prisma.event.findFirst({
    where: { status: { in: ["ACTIVE", "UPCOMING"] } },
    orderBy: { startsAt: "asc" },
    include: { boss: true },
  });
  if (!event) return null;

  const normalized = await normalizeSeedEventSchedule({
    id: event.id,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    status: event.status,
  });
  return normalized ?? event;
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
