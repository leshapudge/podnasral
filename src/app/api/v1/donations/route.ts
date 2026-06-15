import { NextRequest } from "next/server";
import { fromZodError, jsonError } from "@/lib/api/errors";
import { listActiveDonationRequests } from "@/lib/donations/auction-donations.service";
import { z } from "zod";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  participantId: z.string().cuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const parsed = querySchema.safeParse({
      limit: req.nextUrl.searchParams.get("limit") ?? undefined,
      participantId: req.nextUrl.searchParams.get("participantId") ?? undefined,
    });
    if (!parsed.success) throw fromZodError(parsed.error);

    const { event, requests } = await listActiveDonationRequests(
      parsed.data.limit ?? 80,
      parsed.data.participantId,
    );
    return Response.json({
      event: event
        ? {
            id: event.id,
            name: event.name,
            status: event.status,
            startsAt: event.startsAt.toISOString(),
            endsAt: event.endsAt.toISOString(),
          }
        : null,
      requests: requests.map((r) => ({
        id: r.id,
        source: r.source,
        status: r.status,
        donorName: r.donorName,
        amount: Number(r.amount),
        currency: r.currency,
        message: r.message,
        gameQuery: r.gameQuery,
        rawgId: r.rawgId,
        errorMessage: r.errorMessage,
        createdAt: r.createdAt.toISOString(),
        participant: r.participant
          ? {
              id: r.participant.id,
              twitchLogin: r.participant.user.twitchLogin,
              name: r.participant.user.name,
            }
          : null,
        catalogGame: r.catalogGame
          ? {
              id: r.catalogGame.id,
              title: r.catalogGame.title,
              coverImage: r.catalogGame.coverImage,
              mainStoryHours: r.catalogGame.mainStoryHours,
            }
          : null,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
