import { jsonError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/guards";
import prisma from "@/lib/db/prisma";
import { addGameToPool, importGameFromRawg } from "@/lib/catalog/catalog.service";
import { getActiveEvent } from "@/lib/event/event.service";

export async function GET() {
  try {
    await requireAdmin();
    const event = await getActiveEvent();
    const pool = await prisma.eventGamePool.findMany({
      where: { eventId: event.id },
      include: { catalogGame: true },
    });
    return Response.json({ pool });
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const event = await getActiveEvent();
    const body = (await req.json()) as { rawgId: number; weight?: number };

    const game = await importGameFromRawg(body.rawgId);
    const entry = await addGameToPool(event.id, game.id, body.weight ?? 100);
    return Response.json({ entry, game }, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
