import { z } from "zod";

export const gameSearchQuerySchema = z.object({
  q: z.string().min(2).max(100),
});

export const importGameSchema = z.object({
  rawgId: z.number().int().positive(),
  weight: z.number().int().min(1).max(1000).optional(),
});
