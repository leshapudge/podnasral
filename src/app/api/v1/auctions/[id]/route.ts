import { jsonError } from "@/lib/api/errors";
import { getAuction, getAuctionTimeline } from "@/lib/auction/auction.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auction = await getAuction(id);
    const timeline = getAuctionTimeline(auction);
    return Response.json({ auction, timeline });
  } catch (e) {
    return jsonError(e);
  }
}
