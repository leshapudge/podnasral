import prisma from "@/lib/db/prisma";
import { createCrudHandlers } from "./crud-factory";
import {
  userListQuerySchema,
  createUserSchema,
  updateUserSchema,
  eventListQuerySchema,
  createEventSchema,
  updateEventSchema,
  participantListQuerySchema,
  createParticipantSchema,
  updateParticipantSchema,
  catalogGameListQuerySchema,
  createCatalogGameSchema,
  updateCatalogGameSchema,
  itemListQuerySchema,
  createItemSchema,
  updateItemSchema,
  craftRecipeListQuerySchema,
  createCraftRecipeSchema,
  updateCraftRecipeSchema,
  craftIngredientListQuerySchema,
  createCraftIngredientSchema,
  updateCraftIngredientSchema,
  bossListQuerySchema,
  createBossSchema,
  updateBossSchema,
  gameSessionListQuerySchema,
  activityLogListQuerySchema,
} from "@/lib/validators/entities";
import { paginationMeta } from "./pagination";
import { withApiHandler, success } from "./handler";

export const usersCrud = createCrudHandlers({
  resource: "users",
  entityLabel: "User",
  delegate: prisma.user,
  listQuerySchema: userListQuerySchema,
  createSchema: createUserSchema,
  updateSchema: updateUserSchema,
  filterFields: ["role", "search"],
  searchField: "name",
  include: { participant: true },
});

export const eventsCrud = createCrudHandlers({
  resource: "events",
  entityLabel: "Event",
  delegate: prisma.event,
  listQuerySchema: eventListQuerySchema,
  createSchema: createEventSchema,
  updateSchema: updateEventSchema,
  filterFields: ["status"],
  include: { boss: true },
});

export const participantsCrud = createCrudHandlers({
  resource: "participants",
  entityLabel: "Participant",
  delegate: prisma.participant,
  listQuerySchema: participantListQuerySchema,
  createSchema: createParticipantSchema,
  updateSchema: updateParticipantSchema,
  filterFields: ["eventId", "status"],
  include: {
    user: { select: { id: true, name: true, twitchLogin: true, image: true, role: true } },
  },
  beforeCreate: async (data) => {
    await prisma.user.update({
      where: { id: data.userId },
      data: { role: "STREAMER" },
    });
    return data;
  },
});

export const catalogGamesCrud = createCrudHandlers({
  resource: "catalog-games",
  entityLabel: "CatalogGame",
  delegate: prisma.catalogGame,
  listQuerySchema: catalogGameListQuerySchema,
  createSchema: createCatalogGameSchema,
  updateSchema: updateCatalogGameSchema,
  filterFields: ["search"],
  searchField: "title",
});

export const itemsCrud = createCrudHandlers({
  resource: "items",
  entityLabel: "ItemDefinition",
  delegate: prisma.itemDefinition,
  listQuerySchema: itemListQuerySchema,
  createSchema: createItemSchema,
  updateSchema: updateItemSchema,
  filterFields: ["rarity", "kind", "search"],
  searchField: "name",
});

export const craftRecipesCrud = createCrudHandlers({
  resource: "craft-recipes",
  entityLabel: "CraftRecipe",
  delegate: prisma.craftRecipe,
  listQuerySchema: craftRecipeListQuerySchema,
  createSchema: createCraftRecipeSchema,
  updateSchema: updateCraftRecipeSchema,
  filterFields: ["search"],
  searchField: "name",
  include: {
    resultItem: true,
    ingredients: { include: { itemDefinition: true } },
  },
});

export const craftIngredientsCrud = createCrudHandlers({
  resource: "craft-ingredients",
  entityLabel: "CraftIngredient",
  delegate: prisma.craftIngredient,
  listQuerySchema: craftIngredientListQuerySchema,
  createSchema: createCraftIngredientSchema,
  updateSchema: updateCraftIngredientSchema,
  filterFields: ["recipeId"],
  include: { itemDefinition: true, recipe: true },
});

export const bossesCrud = createCrudHandlers({
  resource: "bosses",
  entityLabel: "Boss",
  delegate: prisma.boss,
  listQuerySchema: bossListQuerySchema,
  createSchema: createBossSchema,
  updateSchema: updateBossSchema,
  filterFields: ["eventId", "status"],
  beforeCreate: async (data) => ({
    ...data,
    currentHp: data.currentHp ?? data.maxHp,
  }),
});

export const gameSessionsList = withApiHandler("game-sessions", "GET", async ({ req }) => {
  const query = gameSessionListQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  const { page, limit, sortBy, sortOrder, ...filters } = query;

  const where = {
    ...(filters.participantId ? { participantId: filters.participantId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const orderBy = sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" as const };
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.gameSession.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: { catalogGame: true, participant: { include: { user: true } } },
    }),
    prisma.gameSession.count({ where }),
  ]);

  const safeItems = items.map((s) => ({
    ...s,
    activePlayMs: Number(s.activePlayMs),
  }));

  return success(safeItems, paginationMeta(page, limit, total));
});

export const activityLogsList = withApiHandler("activity-logs", "GET", async ({ req }) => {
  const query = activityLogListQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  const { page, limit, sortBy, sortOrder, ...filters } = query;

  const where = {
    ...(filters.eventId ? { eventId: filters.eventId } : {}),
    ...(filters.type ? { type: filters.type as never } : {}),
  };

  const orderBy = sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" as const };
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: { actor: { select: { name: true, twitchLogin: true } } },
    }),
    prisma.activityLog.count({ where }),
  ]);

  return success(items, paginationMeta(page, limit, total));
});
