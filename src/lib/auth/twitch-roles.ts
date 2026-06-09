import type { UserRole } from "@prisma/client";

function parseList(env?: string) {
  return (env ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function resolveTwitchRole(
  twitchId?: string | null,
  twitchLogin?: string | null,
): UserRole {
  const adminIds = parseList(process.env.ADMIN_TWITCH_IDS);
  const adminLogins = parseList(process.env.ADMIN_TWITCH_LOGINS);
  const streamerLogins = parseList(process.env.STREAMER_TWITCH_LOGINS);

  if (twitchId && adminIds.includes(twitchId.toLowerCase())) return "ADMIN";
  if (twitchLogin && adminLogins.includes(twitchLogin.toLowerCase())) return "ADMIN";
  if (twitchLogin && streamerLogins.includes(twitchLogin.toLowerCase())) return "STREAMER";
  return "VIEWER";
}
