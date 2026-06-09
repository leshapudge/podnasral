import { jsonError } from "@/lib/api/errors";
import { getActiveEventOrNull } from "@/lib/event/event.service";
import { getLeaderboard } from "@/lib/participants/participant.service";

export async function GET() {
  try {
    const event = await getActiveEventOrNull();
    if (!event) return Response.json({ leaderboard: [] });
    const leaderboard = await getLeaderboard(event.id);
    return Response.json({ leaderboard });
  } catch (e) {
    return jsonError(e);
  }
}
