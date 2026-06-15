import { DonationRequestSource, DonationRequestStatus } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import { searchRawgGames } from "@/lib/catalog/rawg.service";
import { addGameToPool, importGameFromRawg } from "@/lib/catalog/catalog.service";
import { getActiveEvent, getActiveEventOrNull } from "@/lib/event/event.service";
import { notFound } from "@/lib/api/errors";
import { toJson } from "@/lib/utils/json";

const GAME_QUERY_RE = /(?:^|\n)\s*(?:game|игра)\s*[:\-]\s*(.+)$/im;
const RAWG_ID_RE = /(?:rawg(?:\s*id)?|rawg_id)\s*[:#=\-]?\s*(\d{2,9})/i;

export type DonationRequestInput = {
  source: DonationRequestSource;
  donorName: string;
  amount: number;
  currency?: string | null;
  message?: string | null;
  gameQuery?: string | null;
  rawgId?: number | null;
  externalId?: string | null;
  meta?: Record<string, unknown>;
};

type DonationProcessContext = {
  eventId: string;
  participantId: string | null;
};

const donationRequestInclude = {
  catalogGame: true,
  participant: {
    select: {
      id: true,
      user: { select: { twitchLogin: true, name: true } },
    },
  },
} as const;

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeCurrency(value: string | null | undefined): string {
  const normalized = (value ?? "RUB").trim().toUpperCase();
  return normalized.length > 0 ? normalized.slice(0, 8) : "RUB";
}

function parseRawgIdFromMessage(message: string | null | undefined): number | null {
  if (!message) return null;
  const match = message.match(RAWG_ID_RE);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseGameQueryFromMessage(message: string | null | undefined): string | null {
  if (!message) return null;
  const match = message.match(GAME_QUERY_RE);
  if (match) {
    const query = match[1]?.trim();
    return query ? query.slice(0, 200) : null;
  }

  const compact = message.replace(/\s+/g, " ").trim();
  if (!compact || compact.length > 80) return null;
  if (/https?:\/\//i.test(compact)) return null;
  return compact.slice(0, 200);
}

async function resolveRawgIdByQuery(query: string): Promise<number | null> {
  const results = await searchRawgGames(query, 1);
  if (!results.length) return null;
  return results[0]?.id ?? null;
}

async function attachGameToPool(
  eventId: string,
  rawgId: number | null,
  gameQuery: string | null,
) {
  const resolvedRawgId = rawgId ?? (gameQuery ? await resolveRawgIdByQuery(gameQuery) : null);
  if (!resolvedRawgId) {
    return { status: "FAILED" as DonationRequestStatus, rawgId: null, catalogGameId: null, errorMessage: "Game not found in RAWG" };
  }

  const game = await importGameFromRawg(resolvedRawgId);
  await addGameToPool(eventId, game.id, 100);
  return {
    status: "ADDED" as DonationRequestStatus,
    rawgId: resolvedRawgId,
    catalogGameId: game.id,
    errorMessage: null,
  };
}

async function processDonationWithContext(
  context: DonationProcessContext,
  input: DonationRequestInput,
) {
  const externalId = toNonEmptyString(input.externalId ?? null);
  if (externalId) {
    const duplicate = await prisma.donationRequest.findFirst({
      where: {
        source: input.source,
        participantId: context.participantId,
        externalId,
      },
      include: donationRequestInclude,
    });
    if (duplicate) return duplicate;
  }

  const donorName = toNonEmptyString(input.donorName) ?? "Anonymous";
  const amount = toFiniteNumber(input.amount) ?? 0;
  const message = toNonEmptyString(input.message ?? null);
  const gameQuery = toNonEmptyString(input.gameQuery ?? null) ?? parseGameQueryFromMessage(message);
  let rawgId = input.rawgId ?? parseRawgIdFromMessage(message);
  let status: DonationRequestStatus = "RECEIVED";
  let catalogGameId: string | null = null;
  let errorMessage: string | null = null;

  try {
    if (rawgId || gameQuery) {
      const attached = await attachGameToPool(context.eventId, rawgId, gameQuery);
      status = attached.status;
      rawgId = attached.rawgId;
      catalogGameId = attached.catalogGameId;
      errorMessage = attached.errorMessage;
    }
  } catch (error) {
    status = "FAILED";
    errorMessage = error instanceof Error ? error.message.slice(0, 240) : "Failed to process donation";
  }

  return prisma.donationRequest.create({
    data: {
      eventId: context.eventId,
      participantId: context.participantId,
      source: input.source,
      status,
      donorName,
      amount,
      currency: sanitizeCurrency(input.currency),
      message,
      gameQuery,
      rawgId,
      catalogGameId,
      externalId,
      errorMessage,
      meta: toJson(input.meta ?? {}),
    },
    include: donationRequestInclude,
  });
}

export async function processDonationForEvent(eventId: string, input: DonationRequestInput) {
  return processDonationWithContext(
    {
      eventId,
      participantId: null,
    },
    input,
  );
}

export async function processDonationForActiveEvent(input: DonationRequestInput) {
  const event = await getActiveEvent();
  return processDonationWithContext(
    {
      eventId: event.id,
      participantId: null,
    },
    input,
  );
}

export async function processDonationForParticipant(
  participantId: string,
  input: DonationRequestInput,
) {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { id: true, eventId: true },
  });
  if (!participant) throw notFound("Participant");

  return processDonationWithContext(
    {
      eventId: participant.eventId,
      participantId: participant.id,
    },
    input,
  );
}

export async function listActiveDonationRequests(limit = 80, participantId?: string) {
  const event = await getActiveEventOrNull();
  if (!event) return { event: null, requests: [] };

  const requests = await prisma.donationRequest.findMany({
    where: {
      eventId: event.id,
      ...(participantId ? { participantId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      participant: {
        select: {
          id: true,
          user: { select: { twitchLogin: true, name: true } },
        },
      },
      catalogGame: {
        select: {
          id: true,
          title: true,
          mainStoryHours: true,
          coverImage: true,
        },
      },
    },
  });

  return { event, requests };
}

export function parseDonationAlertsPayload(body: unknown): DonationRequestInput[] {
  const root = asObject(body);
  const rawItems = Array.isArray(root?.data)
    ? root.data
    : Array.isArray(body)
      ? body
      : body
        ? [body]
        : [];

  const inputs: DonationRequestInput[] = [];
  for (const item of rawItems) {
    const row = asObject(item);
    if (!row) continue;
    const name = toNonEmptyString(row.name)?.toLowerCase() ?? "donation";
    if (name !== "donation" && name !== "donations") continue;

    const donorName =
      toNonEmptyString(row.username) ??
      toNonEmptyString(row.sender) ??
      toNonEmptyString(row.recipient_name) ??
      "Anonymous";
    const amount = toFiniteNumber(row.amount) ?? 0;
    const message = toNonEmptyString(row.message);
    const currency = toNonEmptyString(row.currency) ?? "RUB";
    const externalId = toNonEmptyString(
      typeof row.id === "string" || typeof row.id === "number" ? String(row.id) : null,
    );
    const rawgId = toFiniteNumber(row.rawgId);
    const gameQuery =
      toNonEmptyString(row.gameQuery) ??
      toNonEmptyString(row.game) ??
      toNonEmptyString(row.gameTitle);

    inputs.push({
      source: "DONATIONALERTS",
      donorName,
      amount,
      currency,
      message,
      gameQuery,
      rawgId: rawgId != null ? Math.floor(rawgId) : null,
      externalId,
      meta: row,
    });
  }

  return inputs;
}
