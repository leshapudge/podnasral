import { jsonError } from "@/lib/api/errors";
import { requireStreamer } from "@/lib/auth/guards";
import { resolveAuctionFromDonations } from "@/lib/auction/auction.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { participant } = await requireStreamer();
    const { id } = await params;
    const result = await resolveAuctionFromDonations(id, participant.id);
    return Response.json(result);
  } catch (e) {
    return jsonError(e);
  }
}
