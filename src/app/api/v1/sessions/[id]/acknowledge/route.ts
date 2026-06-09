import { jsonError } from "@/lib/api/errors";
import { requireStreamer } from "@/lib/auth/guards";
import { acknowledgeSession } from "@/lib/sessions/session.service";

export async function POST() {
  try {
    const { participant } = await requireStreamer();
    const updated = await acknowledgeSession(participant.id);
    return Response.json({ participant: updated });
  } catch (e) {
    return jsonError(e);
  }
}
