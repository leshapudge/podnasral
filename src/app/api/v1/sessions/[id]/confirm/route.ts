import { jsonError } from "@/lib/api/errors";
import { requireStreamer } from "@/lib/auth/guards";
import { confirmSession, formatSessionPublic, getSession } from "@/lib/sessions/session.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { participant } = await requireStreamer();
    const { id } = await params;
    await confirmSession(id, participant.id);
    const session = await getSession(id, participant.id);
    return Response.json({ session: formatSessionPublic(session) });
  } catch (e) {
    return jsonError(e);
  }
}
