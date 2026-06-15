import { jsonError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/guards";
import prisma from "@/lib/db/prisma";
import { getActiveEvent } from "@/lib/event/event.service";

export async function GET() {
  try {
    await requireAdmin();
    const event = await getActiveEvent();
    const participants = await prisma.participant.findMany({
      where: { eventId: event.id },
      select: {
        id: true,
        totalPoints: true,
        status: true,
        isLive: true,
        currentGameTitle: true,
        user: {
          select: {
            twitchLogin: true,
            name: true,
          },
        },
      },
      orderBy: { displayOrder: "asc" },
    });
    return Response.json(
      participants.map((participant) => ({
        ...participant,
        isLive: participant.isLive && participant.status !== "PAUSED",
      })),
    );
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const event = await getActiveEvent();
    const body = (await req.json()) as {
      userId: string;
      displayOrder?: number;
    };

    const participant = await prisma.participant.create({
      data: {
        eventId: event.id,
        userId: body.userId,
        displayOrder: body.displayOrder ?? 0,
      },
    });

    await prisma.user.update({
      where: { id: body.userId },
      data: { role: "STREAMER" },
    });

    return Response.json({ participant }, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
