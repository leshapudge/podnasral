import prisma from "@/lib/db/prisma";
import { EVENT_STREAMERS } from "@/lib/event/event-roster";

function parseList(env?: string) {
  return (env ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isWhitelistedStreamer(
  twitchId?: string | null,
  twitchLogin?: string | null,
): boolean {
  const envLogins = parseList(process.env.STREAMER_TWITCH_LOGINS);
  const login = twitchLogin?.toLowerCase();
  const id = twitchId?.toLowerCase();

  if (login && envLogins.includes(login)) return true;
  if (login && EVENT_STREAMERS.some((s) => s.twitchLogin.toLowerCase() === login)) return true;
  if (id && EVENT_STREAMERS.some((s) => s.twitchId.toLowerCase() === id)) return true;
  return false;
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

/**
 * Привязывает участника ивента к текущему OAuth-пользователю.
 * Seed создаёт User+Participant без Account; после Twitch-логина participant остаётся на старом userId.
 */
export async function ensureEventParticipant(
  userId: string,
  twitchId?: string | null,
  twitchLogin?: string | null,
) {
  if (!isWhitelistedStreamer(twitchId, twitchLogin)) return null;

  const existing = await prisma.participant.findUnique({ where: { userId } });
  if (existing) return existing;

  const event = await prisma.event.findFirst({ orderBy: { startsAt: "desc" } });
  if (!event) return null;

  const orphanParticipant = await prisma.participant.findFirst({
    where: {
      NOT: { userId },
      user: {
        OR: [
          ...(twitchId ? [{ twitchId }] : []),
          ...(twitchLogin ? [{ twitchLogin }] : []),
        ],
      },
    },
    include: { user: { include: { accounts: true } } },
  });

  if (orphanParticipant) {
    const orphanUser = orphanParticipant.user;
    return prisma.$transaction(async (tx) => {
      const moved = await tx.participant.update({
        where: { id: orphanParticipant.id },
        data: { userId },
      });

      if (orphanUser.accounts.length === 0 && orphanUser.id !== userId) {
        await tx.user.update({
          where: { id: orphanUser.id },
          data: { twitchId: null },
        });
        await tx.user.delete({ where: { id: orphanUser.id } });
      }

      return moved;
    });
  }

  const rosterMember = findRosterMember(twitchId, twitchLogin);
  if (!rosterMember) return null;

  return prisma.participant.create({
    data: {
      eventId: event.id,
      userId,
      displayOrder: rosterMember.displayOrder,
      totalPoints: 0,
      status: "IDLE",
    },
  });
}
