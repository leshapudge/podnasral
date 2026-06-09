import prisma from "@/lib/db/prisma";
import { getActiveEventOrNull } from "@/lib/event/event.service";
import { liveBroadcaster } from "@/lib/live/broadcaster";

export async function syncTwitchLiveStatus() {
  const event = await getActiveEventOrNull();
  if (!event) return [];

  const participants = await prisma.participant.findMany({
    where: { eventId: event.id },
    include: { user: { select: { twitchLogin: true } } },
  });

  const logins = participants
    .map((p) => p.user.twitchLogin)
    .filter((l): l is string => Boolean(l));

  if (logins.length === 0) return [];

  const clientId = process.env.TWITCH_CLIENT_ID ?? process.env.AUTH_TWITCH_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET ?? process.env.AUTH_TWITCH_SECRET;

  if (!clientId || !clientSecret) {
    console.warn("[twitch] Missing credentials, skipping live sync");
    return [];
  }

  const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!tokenRes.ok) return [];
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const params = new URLSearchParams();
  for (const login of logins) params.append("user_login", login);

  const streamRes = await fetch(`https://api.twitch.tv/helix/streams?${params}`, {
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${access_token}`,
    },
  });

  if (!streamRes.ok) return [];

  const { data } = (await streamRes.json()) as {
    data: { user_login: string }[];
  };

  const liveLogins = new Set(data.map((s) => s.user_login.toLowerCase()));
  const updates = [];

  for (const p of participants) {
    const isLive = p.user.twitchLogin
      ? liveLogins.has(p.user.twitchLogin.toLowerCase())
      : false;

    if (p.isLive !== isLive) {
      await prisma.participant.update({
        where: { id: p.id },
        data: { isLive, lastLiveAt: isLive ? new Date() : p.lastLiveAt },
      });
      updates.push({ participantId: p.id, isLive });
      liveBroadcaster.publish({
        type: "leaderboard.patch",
        data: { participantId: p.id, isLive },
      });
    }
  }

  return updates;
}
