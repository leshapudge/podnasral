import { jsonError } from "@/lib/api/errors";
import { requireStreamer } from "@/lib/auth/guards";
import { spinCasinoWheel } from "@/lib/casino/casino.service";
import { formatSessionPublic, getSession } from "@/lib/sessions/session.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { participant } = await requireStreamer();
    const { id } = await params;
    const result = await spinCasinoWheel(id, participant.id);
    const session = formatSessionPublic(await getSession(id, participant.id));
    return Response.json({ ...result, session });
  } catch (e) {
    return jsonError(e);
  }
}
