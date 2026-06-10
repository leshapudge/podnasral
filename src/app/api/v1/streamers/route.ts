import { jsonError } from "@/lib/api/errors";
import { getActiveEventOrNull } from "@/lib/event/event.service";
import { getStreamersRoster } from "@/lib/participants/participant.service";

export async function GET() {
  try {
    const event = await getActiveEventOrNull();
    if (!event) return Response.json({ streamers: [] });
    const streamers = await getStreamersRoster(event.id);
    return Response.json({ streamers });
  } catch (e) {
    return jsonError(e);
  }
}
