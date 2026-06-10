import { jsonError } from "@/lib/api/errors";
import { requireStreamer } from "@/lib/auth/guards";
import { addCasinoBonusSpins } from "@/lib/casino/casino.service";
import { formatSessionPublic, getSession } from "@/lib/sessions/session.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { participant } = await requireStreamer();
    const { id } = await params;
    const body = (await req.json()) as { bonusSpins?: number };
    const bonusSpins = Number(body.bonusSpins);
    const casino = await addCasinoBonusSpins(id, participant.id, bonusSpins);
    const session = formatSessionPublic(await getSession(id, participant.id));
    return Response.json({ casino, session });
  } catch (e) {
    return jsonError(e);
  }
}
