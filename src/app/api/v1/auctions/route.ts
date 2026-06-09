import { jsonError } from "@/lib/api/errors";
import { requireStreamer } from "@/lib/auth/guards";
import { createAuction } from "@/lib/auction/auction.service";

export async function POST() {
  try {
    const { participant } = await requireStreamer();
    const auction = await createAuction(participant.id);
    return Response.json({ auction }, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
