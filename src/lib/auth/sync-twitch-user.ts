import prisma from "@/lib/db/prisma";
import { EVENT_STREAMERS } from "@/lib/event/event-roster";
import { resolveTwitchRole } from "@/lib/auth/twitch-roles";

/**
 * Заполняет twitchId/twitchLogin/role у OAuth-пользователя, если адаптер их не проставил.
 */
export async function syncTwitchUserProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const account = await prisma.account.findFirst({
    where: { userId, provider: "twitch" },
  });
  if (!account) return;

  const twitchId = account.providerAccountId;
  const roster = EVENT_STREAMERS.find((s) => s.twitchId === twitchId);
  const accountLogin = user.name?.toLowerCase() ?? null;
  const twitchLogin = user.twitchLogin ?? roster?.twitchLogin ?? accountLogin;

  const role = resolveTwitchRole(twitchId, twitchLogin);
  const resolvedRole =
    role === "ADMIN" || user.role === "ADMIN" ? "ADMIN" : role;

  if (
    user.twitchId === twitchId &&
    user.twitchLogin === twitchLogin &&
    user.role === resolvedRole
  ) {
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      twitchId,
      twitchLogin,
      role: resolvedRole,
    },
  });
}
