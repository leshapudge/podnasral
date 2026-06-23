import { NextRequest } from "next/server";
import { fromZodError, jsonError } from "@/lib/api/errors";
import { requireStreamer } from "@/lib/auth/guards";
import { searchAuctionGames } from "@/lib/auction/auction.service";
import { gameSearchQuerySchema } from "@/lib/validators/game";

export const maxDuration = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { participant } = await requireStreamer();
    const { id } = await params;
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const parsed = gameSearchQuerySchema.safeParse({ q });
    if (!parsed.success) throw fromZodError(parsed.error);

    const result = await searchAuctionGames(id, participant.id, parsed.data.q);
    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
