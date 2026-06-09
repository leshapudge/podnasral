import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().cuid(),
});

export const jsonSchema = z.record(z.unknown()).optional();
