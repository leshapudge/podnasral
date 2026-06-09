import prisma from "@/lib/db/prisma";

export async function getUserAuthProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      twitchId: true,
      twitchLogin: true,
      createdAt: true,
      participant: {
        select: {
          id: true,
          totalPoints: true,
          status: true,
          eventId: true,
        },
      },
      accounts: {
        select: { provider: true, providerAccountId: true },
      },
    },
  });
}
