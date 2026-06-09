import { jsonError } from "@/lib/api/errors";
import { requireStreamer } from "@/lib/auth/guards";
import { applyModifier } from "@/lib/auction/auction.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { participant } = await requireStreamer();
    const { id } = await params;
    const body = (await req.json()) as { inventoryItemId: string };
    const auction = await applyModifier(id, participant.id, body.inventoryItemId);
    return Response.json({ auction });
  } catch (e) {
    return jsonError(e);
  }
}
