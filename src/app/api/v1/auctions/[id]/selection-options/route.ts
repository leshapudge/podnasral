import { jsonError } from "@/lib/api/errors";
import { requireStreamer } from "@/lib/auth/guards";
import { getAuctionSelectionOptions } from "@/lib/auction/auction.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { participant } = await requireStreamer();
    const { id } = await params;
    const result = await getAuctionSelectionOptions(id, participant.id);
    return Response.json(result);
  } catch (e) {
    return jsonError(e);
  }
}
