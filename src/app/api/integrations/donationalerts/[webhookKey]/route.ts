import { badRequest, jsonError, notFound } from "@/lib/api/errors";
import {
  parseDonationAlertsPayload,
  processDonationForParticipant,
} from "@/lib/donations/auction-donations.service";
import { findParticipantByWebhookKey } from "@/lib/donations/donationalerts-connection.service";

type RouteContext = {
  params: Promise<{ webhookKey: string }>;
};

export async function POST(req: Request, ctx: RouteContext) {
  try {
    const { webhookKey } = await ctx.params;
    if (!webhookKey) throw badRequest("Missing webhook key");

    const participant = await findParticipantByWebhookKey(webhookKey);
    if (!participant) throw notFound("Donation webhook");

    const body = (await req.json()) as unknown;
    const inputs = parseDonationAlertsPayload(body);
    if (inputs.length === 0) throw badRequest("No donations found in payload");

    const results = [];
    for (const input of inputs) {
      results.push(await processDonationForParticipant(participant.id, input));
    }

    const summary = {
      total: results.length,
      added: results.filter((r) => r.status === "ADDED").length,
      received: results.filter((r) => r.status === "RECEIVED").length,
      failed: results.filter((r) => r.status === "FAILED").length,
    };

    return Response.json({
      ok: true,
      streamer: participant.user.twitchLogin ?? participant.user.name ?? participant.id,
      summary,
    });
  } catch (error) {
    return jsonError(error);
  }
}
