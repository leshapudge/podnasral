import { jsonError } from "@/lib/api/errors";
import { requireStreamer } from "@/lib/auth/guards";
import { dropGameSession } from "@/lib/sessions/session.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { participant } = await requireStreamer();
    const { id } = await params;
    const result = await dropGameSession(id, participant.id);
    return Response.json(result);
  } catch (e) {
    return jsonError(e);
  }
}
