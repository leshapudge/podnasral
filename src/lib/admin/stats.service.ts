import prisma from "@/lib/db/prisma";

export async function getAdminStats() {
  const [
    users,
    participants,
    catalogGames,
    gameSessions,
    bosses,
    itemDefinitions,
    craftRecipes,
    events,
    eventsActive,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.participant.count(),
    prisma.catalogGame.count(),
    prisma.gameSession.count(),
    prisma.boss.count(),
    prisma.itemDefinition.count(),
    prisma.craftRecipe.count(),
    prisma.event.count(),
    prisma.event.count({ where: { status: "ACTIVE" } }),
  ]);

  return {
    users,
    participants,
    catalogGames,
    gameSessions,
    bosses,
    itemDefinitions,
    craftRecipes,
    events,
    eventsActive,
  };
}

export type AdminStats = Awaited<ReturnType<typeof getAdminStats>>;
