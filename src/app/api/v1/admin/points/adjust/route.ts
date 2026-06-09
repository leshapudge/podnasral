import { jsonError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/guards";
import prisma from "@/lib/db/prisma";
import { logActivity } from "@/lib/activity/activity.service";
import { getActiveEvent } from "@/lib/event/event.service";

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const event = await getActiveEvent();
    const body = (await req.json()) as { participantId: string; delta: number; reason?: string };

    const participant = await prisma.participant.update({
      where: { id: body.participantId },
      data: { totalPoints: { increment: body.delta } },
    });

    await logActivity({
      eventId: event.id,
      type: "POINTS_ADJUSTED",
      actorId: session.user.id,
      payload: { participantId: body.participantId, delta: body.delta, reason: body.reason },
    });

    return Response.json({ participant });
  } catch (e) {
    return jsonError(e);
  }
}
