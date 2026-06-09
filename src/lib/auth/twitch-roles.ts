import type { UserRole } from "@prisma/client";
import { EVENT_STREAMERS } from "@/lib/event/event-roster";

function parseList(env?: string) {
  return (env ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function findRosterMember(twitchId?: string | null, twitchLogin?: string | null) {
  const login = twitchLogin?.toLowerCase();
  const id = twitchId?.toLowerCase();
  return EVENT_STREAMERS.find(
    (s) =>
      s.twitchId.toLowerCase() === id ||
      (login && s.twitchLogin.toLowerCase() === login),
  );
}

export function resolveTwitchRole(
  twitchId?: string | null,
  twitchLogin?: string | null,
): UserRole {
  const roster = findRosterMember(twitchId, twitchLogin);
  if (roster?.role === "ADMIN") return "ADMIN";

  const adminIds = parseList(process.env.ADMIN_TWITCH_IDS);
  const adminLogins = parseList(process.env.ADMIN_TWITCH_LOGINS);
  const streamerLogins = parseList(process.env.STREAMER_TWITCH_LOGINS);

  if (twitchId && adminIds.includes(twitchId.toLowerCase())) return "ADMIN";
  if (twitchLogin && adminLogins.includes(twitchLogin.toLowerCase())) return "ADMIN";
  if (roster) return "STREAMER";
  if (twitchLogin && streamerLogins.includes(twitchLogin.toLowerCase())) return "STREAMER";
  if (twitchId && EVENT_STREAMERS.some((s) => s.twitchId.toLowerCase() === twitchId.toLowerCase())) {
    return "STREAMER";
  }
  return "VIEWER";
}
