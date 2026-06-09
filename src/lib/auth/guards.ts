import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import { forbidden, unauthorized } from "@/lib/api/errors";
import { ensureEventParticipant } from "@/lib/participants/ensure-event-participant";
import { getTwitchIdentity } from "@/lib/auth/twitch-identity";
import { syncTwitchUserProfile } from "@/lib/auth/sync-twitch-user";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw unauthorized();
  return session;
}

export async function requireStreamer() {
  const session = await requireAuth();
  await syncTwitchUserProfile(session.user.id);
  const { twitchId, twitchLogin } = await getTwitchIdentity(session.user.id);
  await ensureEventParticipant(session.user.id, twitchId, twitchLogin);
  const participant = await prisma.participant.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });

  if (!participant) throw forbidden("Not a whitelisted streamer");

  return { session, participant };
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") throw forbidden("Admin access required");
  return session;
}
