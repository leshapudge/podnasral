import { badRequest, jsonError } from "@/lib/api/errors";
import { requireStreamer } from "@/lib/auth/guards";
import { resolveAuctionFromDonations } from "@/lib/auction/auction.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { participant } = await requireStreamer();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const catalogGameId =
      body && typeof body === "object" && typeof (body as { catalogGameId?: unknown }).catalogGameId === "string"
        ? (body as { catalogGameId: string }).catalogGameId
        : null;
    if (!catalogGameId) throw badRequest("catalogGameId is required");
    const selectedGenre =
      body && typeof body === "object" && typeof (body as { selectedGenre?: unknown }).selectedGenre === "string"
        ? (body as { selectedGenre: string }).selectedGenre
        : null;

    const result = await resolveAuctionFromDonations(
      id,
      participant.id,
      catalogGameId,
      selectedGenre,
    );
    return Response.json(result);
  } catch (e) {
    return jsonError(e);
  }
}
