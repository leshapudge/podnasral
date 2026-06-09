import { jsonError } from "@/lib/api/errors";
import { requireStreamer } from "@/lib/auth/guards";
import { craftItem } from "@/lib/craft/craft.service";
import { getActiveEvent } from "@/lib/event/event.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ recipeId: string }> },
) {
  try {
    const { participant } = await requireStreamer();
    const event = await getActiveEvent();
    const { recipeId } = await params;
    const item = await craftItem(recipeId, participant.id, event.id);
    return Response.json({ item });
  } catch (e) {
    return jsonError(e);
  }
}
