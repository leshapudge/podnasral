import { jsonError } from "@/lib/api/errors";
import { getFeed } from "@/lib/activity/activity.service";
import { getActiveEventOrNull } from "@/lib/event/event.service";

export async function GET(req: Request) {
  try {
    const event = await getActiveEventOrNull();
    if (!event) return Response.json({ items: [], nextCursor: null });

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") ?? 30);
    const cursor = searchParams.get("cursor") ?? undefined;

    const feed = await getFeed(event.id, limit, cursor);
    return Response.json(feed);
  } catch (e) {
    return jsonError(e);
  }
}
