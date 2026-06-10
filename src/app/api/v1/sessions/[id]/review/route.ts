import { jsonError } from "@/lib/api/errors";
import { requireStreamer } from "@/lib/auth/guards";
import { formatSessionPublic, getSession } from "@/lib/sessions/session.service";
import { submitGameReview } from "@/lib/sessions/review.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { participant } = await requireStreamer();
    const { id } = await params;
    const body = (await req.json()) as { rating?: number; review?: string };

    if (typeof body.rating !== "number" || typeof body.review !== "string") {
      return Response.json(
        { error: { code: "BAD_REQUEST", message: "rating and review required" } },
        { status: 400 },
      );
    }

    await submitGameReview(id, participant.id, body.rating, body.review);
    const session = formatSessionPublic(await getSession(id, participant.id));

    return Response.json({ session });
  } catch (e) {
    return jsonError(e);
  }
}
