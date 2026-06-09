import { jsonError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/guards";
import { syncAllPoolHltb, syncGameHltb } from "@/lib/catalog/catalog.service";
import { getActiveEvent } from "@/lib/event/event.service";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = (await req.json().catch(() => ({}))) as { catalogGameId?: string };

    if (body.catalogGameId) {
      const game = await syncGameHltb(body.catalogGameId);
      return Response.json({ game });
    }

    const event = await getActiveEvent();
    const results = await syncAllPoolHltb(event.id);
    return Response.json({ synced: results.length, games: results });
  } catch (e) {
    return jsonError(e);
  }
}
