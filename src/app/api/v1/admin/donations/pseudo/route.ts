import { z } from "zod";
import { fromZodError, jsonError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/guards";
import { processDonationForParticipant } from "@/lib/donations/auction-donations.service";

const pseudoDonationSchema = z.object({
  participantId: z.string().cuid(),
  donorName: z.string().min(1).max(80),
  amount: z.coerce.number().finite().min(0).max(1_000_000),
  currency: z.string().min(1).max(8).optional(),
  message: z.string().max(5000).optional(),
  gameQuery: z.string().min(2).max(200).optional(),
  rawgId: z.coerce.number().int().positive().optional(),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const parsed = pseudoDonationSchema.safeParse(await req.json());
    if (!parsed.success) throw fromZodError(parsed.error);

    const request = await processDonationForParticipant(parsed.data.participantId, {
      source: "ADMIN",
      donorName: parsed.data.donorName,
      amount: parsed.data.amount,
      currency: parsed.data.currency ?? "RUB",
      message: parsed.data.message ?? null,
      gameQuery: parsed.data.gameQuery ?? null,
      rawgId: parsed.data.rawgId ?? null,
      externalId: null,
      meta: { kind: "pseudo" },
    });

    return Response.json({
      id: request.id,
      status: request.status,
      donorName: request.donorName,
      amount: Number(request.amount),
      currency: request.currency,
      message: request.message,
      gameQuery: request.gameQuery,
      rawgId: request.rawgId,
      participant: request.participant
        ? {
            id: request.participant.id,
            twitchLogin: request.participant.user.twitchLogin,
            name: request.participant.user.name,
          }
        : null,
      catalogGame: request.catalogGame
        ? {
            id: request.catalogGame.id,
            title: request.catalogGame.title,
            coverImage: request.catalogGame.coverImage,
            mainStoryHours: request.catalogGame.mainStoryHours,
          }
        : null,
      errorMessage: request.errorMessage,
      source: request.source,
      createdAt: request.createdAt.toISOString(),
    });
  } catch (error) {
    return jsonError(error);
  }
}
