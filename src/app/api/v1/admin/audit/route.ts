import { jsonError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/guards";
import prisma from "@/lib/db/prisma";
import { getActiveEvent } from "@/lib/event/event.service";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const event = await getActiveEvent();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    const [activityLogs, timerEvents] = await Promise.all([
      prisma.activityLog.findMany({
        where: { eventId: event.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      sessionId
        ? prisma.timerEvent.findMany({
            where: { gameSessionId: sessionId },
            orderBy: { occurredAt: "asc" },
          })
        : [],
    ]);

    return Response.json({
      activityLogs,
      timerEvents: timerEvents.map((t) => ({
        ...t,
        activePlayMs: Number(t.activePlayMs),
      })),
    });
  } catch (e) {
    return jsonError(e);
  }
}
