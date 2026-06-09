import { z } from "zod";
import { paginationQuerySchema } from "@/lib/api/pagination";

const rarity = z.enum(["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"]);
const itemKind = z.enum(["MODIFIER", "MATERIAL", "CRAFTABLE"]);
const eventStatus = z.enum(["UPCOMING", "ACTIVE", "ENDED"]);
const userRole = z.enum(["VIEWER", "STREAMER", "ADMIN"]);
const bossStatus = z.enum(["ACTIVE", "DEFEATED"]);
const participantStatus = z.enum([
  "IDLE",
  "AUCTIONING",
  "AWAITING_DIFFICULTY",
  "PLAYING",
  "PAUSED",
  "COMPLETED",
  "DROPPED",
  "CASINO",
]);

const json = z.record(z.unknown()).optional();

export const userListQuerySchema = paginationQuerySchema.extend({
  role: userRole.optional(),
  search: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional().nullable(),
  image: z.string().url().optional().nullable(),
  role: userRole.optional(),
  twitchLogin: z.string().optional().nullable(),
});

export const createUserSchema = updateUserSchema.extend({
  email: z.string().email().optional().nullable(),
  twitchId: z.string().optional().nullable(),
});

export const eventListQuerySchema = paginationQuerySchema.extend({
  status: eventStatus.optional(),
});

export const createEventSchema = z.object({
  name: z.string().min(1).max(200),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  status: eventStatus.optional(),
  config: json,
});

export const updateEventSchema = createEventSchema.partial();

export const participantListQuerySchema = paginationQuerySchema.extend({
  eventId: z.string().cuid().optional(),
  status: participantStatus.optional(),
});

export const createParticipantSchema = z.object({
  eventId: z.string().cuid(),
  userId: z.string().cuid(),
  displayOrder: z.number().int().min(0).optional(),
});

export const updateParticipantSchema = z.object({
  displayOrder: z.number().int().min(0).optional(),
  totalPoints: z.number().int().optional(),
  status: participantStatus.optional(),
});

export const catalogGameListQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
});

export const createCatalogGameSchema = z.object({
  rawgId: z.number().int().positive(),
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(200),
  coverImage: z.string().url().optional().nullable(),
  mainStoryHours: z.number().positive().optional().nullable(),
  mainExtraHours: z.number().positive().optional().nullable(),
  completionistHours: z.number().positive().optional().nullable(),
  hltbId: z.number().int().positive().optional().nullable(),
});

export const updateCatalogGameSchema = createCatalogGameSchema.partial().omit({ rawgId: true });

export const itemListQuerySchema = paginationQuerySchema.extend({
  rarity: rarity.optional(),
  kind: itemKind.optional(),
  search: z.string().optional(),
});

export const createItemSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  rarity: rarity.optional(),
  kind: itemKind.optional(),
  effectsJson: json,
  iconUrl: z.string().url().optional().nullable(),
});

export const updateItemSchema = createItemSchema.partial();

export const craftRecipeListQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
});

export const createCraftRecipeSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/),
  name: z.string().min(1).max(200),
  resultItemId: z.string().cuid(),
  resultQty: z.number().int().min(1).optional(),
});

export const updateCraftRecipeSchema = createCraftRecipeSchema.partial();

export const craftIngredientListQuerySchema = paginationQuerySchema.extend({
  recipeId: z.string().cuid().optional(),
});

export const createCraftIngredientSchema = z.object({
  recipeId: z.string().cuid(),
  itemDefinitionId: z.string().cuid(),
  quantity: z.number().int().min(1),
});

export const updateCraftIngredientSchema = createCraftIngredientSchema.partial().omit({ recipeId: true });

export const bossListQuerySchema = paginationQuerySchema.extend({
  eventId: z.string().cuid().optional(),
  status: bossStatus.optional(),
});

export const createBossSchema = z.object({
  eventId: z.string().cuid(),
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  maxHp: z.number().int().positive(),
  currentHp: z.number().int().min(0).optional(),
  status: bossStatus.optional(),
});

export const updateBossSchema = createBossSchema.partial().omit({ eventId: true });

export const gameSessionListQuerySchema = paginationQuerySchema.extend({
  participantId: z.string().cuid().optional(),
  status: z.enum(["AWAITING_DIFFICULTY", "PLAYING", "PAUSED", "COMPLETED", "DROPPED"]).optional(),
});

export const activityLogListQuerySchema = paginationQuerySchema.extend({
  eventId: z.string().cuid().optional(),
  type: z.string().optional(),
});
