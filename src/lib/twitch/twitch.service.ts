import prisma from "@/lib/db/prisma";
import { authorizedParticipantsWhere } from "@/lib/participants/authorized-streamer";
import { getActiveEventOrNull } from "@/lib/event/event.service";
import { liveBroadcaster } from "@/lib/live/broadcaster";

type TwitchLiveSyncOptions = {
  eventId?: string;
  force?: boolean;
  minIntervalMs?: number;
};

const DEFAULT_SYNC_INTERVAL_MS = 45_000;
const TWITCH_STREAMS_BATCH_LIMIT = 100;

let lastSyncAtMs = 0;
let inFlightSync: Promise<{ participantId: string; isLive: boolean }[]> | null = null;
let warnedMissingCredentials = false;

function getTwitchCredentials() {
  const clientId = process.env.TWITCH_CLIENT_ID ?? process.env.AUTH_TWITCH_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET ?? process.env.AUTH_TWITCH_SECRET;
  return { clientId, clientSecret };
}

async function resolveTargetEventId(eventId?: string): Promise<string | null> {
  if (eventId) return eventId;
  const event = await getActiveEventOrNull();
  return event?.id ?? null;
}

async function fetchTwitchAccessToken(clientId: string, clientSecret: string): Promise<string | null> {
  const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });
  if (!tokenRes.ok) return null;

  const data = (await tokenRes.json()) as { access_token?: string };
  return data.access_token ?? null;
}

async function fetchLiveLogins(
  logins: string[],
  clientId: string,
  accessToken: string,
): Promise<Set<string> | null> {
  const liveLogins = new Set<string>();

  for (let i = 0; i < logins.length; i += TWITCH_STREAMS_BATCH_LIMIT) {
    const batch = logins.slice(i, i + TWITCH_STREAMS_BATCH_LIMIT);
    const params = new URLSearchParams();
    for (const login of batch) params.append("user_login", login);

    const streamRes = await fetch(`https://api.twitch.tv/helix/streams?${params.toString()}`, {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!streamRes.ok) return null;

    const data = (await streamRes.json()) as {
      data?: Array<{ user_login?: string | null }>;
    };
    for (const stream of data.data ?? []) {
      const login = stream.user_login?.toLowerCase();
      if (login) liveLogins.add(login);
    }
  }

  return liveLogins;
}

export async function syncTwitchLiveStatus(
  options: TwitchLiveSyncOptions = {},
) {
  const minIntervalMs = options.minIntervalMs ?? DEFAULT_SYNC_INTERVAL_MS;
  const nowMs = Date.now();

  if (!options.force && nowMs - lastSyncAtMs < minIntervalMs) {
    return [];
  }
  if (inFlightSync) return inFlightSync;

  inFlightSync = (async () => {
    const targetEventId = await resolveTargetEventId(options.eventId);
    if (!targetEventId) {
      lastSyncAtMs = Date.now();
      return [];
    }

    const participants = await prisma.participant.findMany({
      where: authorizedParticipantsWhere(targetEventId),
      include: { user: { select: { twitchLogin: true } } },
    });

    const logins = Array.from(
      new Set(
        participants
          .map((p) => p.user.twitchLogin?.trim().toLowerCase())
          .filter((login): login is string => Boolean(login)),
      ),
    );

    if (logins.length === 0) {
      lastSyncAtMs = Date.now();
      return [];
    }

    const { clientId, clientSecret } = getTwitchCredentials();
    if (!clientId || !clientSecret) {
      if (!warnedMissingCredentials) {
        console.warn("[twitch] Missing credentials, skipping live sync");
        warnedMissingCredentials = true;
      }
      lastSyncAtMs = Date.now();
      return [];
    }
    warnedMissingCredentials = false;

    const accessToken = await fetchTwitchAccessToken(clientId, clientSecret);
    if (!accessToken) {
      lastSyncAtMs = Date.now();
      return [];
    }

    const liveLogins = await fetchLiveLogins(logins, clientId, accessToken);
    if (!liveLogins) {
      lastSyncAtMs = Date.now();
      return [];
    }

    const updates: { participantId: string; isLive: boolean }[] = [];
    for (const participant of participants) {
      const login = participant.user.twitchLogin?.toLowerCase();
      const isLive = login ? liveLogins.has(login) : false;
      if (participant.isLive === isLive) continue;

      await prisma.participant.update({
        where: { id: participant.id },
        data: { isLive, lastLiveAt: isLive ? new Date() : participant.lastLiveAt },
      });
      updates.push({ participantId: participant.id, isLive });
      liveBroadcaster.publish({
        type: "leaderboard.patch",
        data: { participantId: participant.id, isLive },
      });
    }

    lastSyncAtMs = Date.now();
    return updates;
  })().finally(() => {
    inFlightSync = null;
  });

  return inFlightSync;
}
