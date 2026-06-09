import prisma from "@/lib/db/prisma";
import type { UserRole } from "@prisma/client";

/**
 * После Twitch OAuth пользователь из адаптера может отличаться от seed-записи с тем же twitchId.
 * Переносим participant и удаляем дубликат без Account.
 */
export async function reconcileOAuthUser(
  oauthUserId: string,
  twitchId: string,
  twitchLogin: string | null,
  role: UserRole,
) {
  const duplicate = await prisma.user.findFirst({
    where: {
      OR: [
        { twitchId },
        ...(twitchLogin ? [{ twitchLogin }] : []),
      ],
      NOT: { id: oauthUserId },
    },
    include: { participant: true, accounts: true },
  });

  const resolvedRole: UserRole =
    role === "ADMIN" || duplicate?.role === "ADMIN" ? "ADMIN" : role;

  if (!duplicate) {
    await prisma.user.update({
      where: { id: oauthUserId },
      data: {
        twitchId,
        twitchLogin: twitchLogin ?? undefined,
        role: resolvedRole,
      },
    });
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (duplicate.participant) {
      await tx.participant.update({
        where: { id: duplicate.participant.id },
        data: { userId: oauthUserId },
      });
    }

    await tx.user.update({
      where: { id: oauthUserId },
      data: {
        twitchId,
        twitchLogin: twitchLogin ?? duplicate.twitchLogin,
        role: resolvedRole,
        name: duplicate.name ?? undefined,
        image: duplicate.image ?? undefined,
      },
    });

    if (duplicate.accounts.length === 0) {
      await tx.user.update({
        where: { id: duplicate.id },
        data: { twitchId: null },
      });
      await tx.user.delete({ where: { id: duplicate.id } });
    }
  });
}
