import { jsonError } from "@/lib/api/errors";
import { getEventPublicData } from "@/lib/event/event.service";

export async function GET() {
  try {
    const event = await getEventPublicData();
    return Response.json({ event });
  } catch (e) {
    return jsonError(e);
  }
}
