import { badRequest, jsonError, unauthorized } from "@/lib/api/errors";
import {
  parseDonationAlertsPayload,
  processDonationForActiveEvent,
} from "@/lib/donations/auction-donations.service";

function getWebhookSecret(req: Request): string | null {
  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : null;
  const urlSecret = (() => {
    try {
      const url = new URL(req.url);
      return url.searchParams.get("secret") ?? url.searchParams.get("token");
    } catch {
      return null;
    }
  })();
  return (
    req.headers.get("x-donationalerts-secret") ??
    req.headers.get("x-da-secret") ??
    bearer ??
    urlSecret ??
    null
  );
}

export async function POST(req: Request) {
  try {
    const secret = process.env.DONATIONALERTS_WEBHOOK_SECRET;
    if (!secret) throw badRequest("DONATIONALERTS_WEBHOOK_SECRET is not configured");

    const providedSecret = getWebhookSecret(req);
    if (!providedSecret || providedSecret !== secret) {
      throw unauthorized("Invalid DonationAlerts webhook secret");
    }

    const body = (await req.json()) as unknown;
    const inputs = parseDonationAlertsPayload(body);
    if (inputs.length === 0) throw badRequest("No donations found in payload");

    const results = [];
    for (const input of inputs) {
      results.push(await processDonationForActiveEvent(input));
    }

    const summary = {
      total: results.length,
      added: results.filter((r) => r.status === "ADDED").length,
      received: results.filter((r) => r.status === "RECEIVED").length,
      failed: results.filter((r) => r.status === "FAILED").length,
    };

    return Response.json({ ok: true, summary });
  } catch (error) {
    return jsonError(error);
  }
}
