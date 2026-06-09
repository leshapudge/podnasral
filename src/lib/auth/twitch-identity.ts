import prisma from "@/lib/db/prisma";

export async function getTwitchIdentity(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { twitchId: null, twitchLogin: null };

  if (user.twitchId) {
    return { twitchId: user.twitchId, twitchLogin: user.twitchLogin };
  }

  const account = await prisma.account.findFirst({
    where: { userId, provider: "twitch" },
  });

  return {
    twitchId: account?.providerAccountId ?? null,
    twitchLogin: user.twitchLogin,
  };
}
