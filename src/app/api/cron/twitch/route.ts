import { syncTwitchLiveStatus } from "@/lib/twitch/twitch.service";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updates = await syncTwitchLiveStatus();
  return Response.json({ ok: true, updates });
}
