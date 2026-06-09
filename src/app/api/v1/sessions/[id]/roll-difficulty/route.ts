import { jsonError } from "@/lib/api/errors";
import { requireStreamer } from "@/lib/auth/guards";
import { rollSessionDifficulty } from "@/lib/sessions/session.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { participant } = await requireStreamer();
    const { id } = await params;
    const session = await rollSessionDifficulty(id, participant.id);
    return Response.json({ session });
  } catch (e) {
    return jsonError(e);
  }
}
