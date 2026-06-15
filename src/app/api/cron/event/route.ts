import {
  activateEventIfStarted,
  finalizeEventIfEnded,
  getActiveEventOrNull,
} from "@/lib/event/event.service";
import { syncAllPoolHltb } from "@/lib/catalog/catalog.service";

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return Response.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activated = await activateEventIfStarted();
  const finalized = await finalizeEventIfEnded();
  const event = await getActiveEventOrNull();
  let hltbSynced = 0;
  if (event) {
    const results = await syncAllPoolHltb(event.id);
    hltbSynced = results.length;
  }

  return Response.json({ ok: true, activated: !!activated, finalized: !!finalized, hltbSynced });
}
