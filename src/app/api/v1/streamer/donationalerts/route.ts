import { jsonError } from "@/lib/api/errors";
import { requireStreamer } from "@/lib/auth/guards";
import {
  ensureParticipantWebhookKey,
  rotateParticipantWebhookKey,
} from "@/lib/donations/donationalerts-connection.service";

function detectOrigin(req: Request) {
  const configured = process.env.APP_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  if (!host) return "";
  return `${proto}://${host}`;
}

function buildPayload(req: Request, webhookKey: string) {
  const path = `/api/integrations/donationalerts/${webhookKey}`;
  const origin = detectOrigin(req);
  return {
    webhookKey,
    webhookPath: path,
    webhookUrl: origin ? `${origin}${path}` : path,
  };
}

export async function GET(req: Request) {
  try {
    const { participant } = await requireStreamer();
    const webhookKey = await ensureParticipantWebhookKey(participant.id);
    return Response.json(buildPayload(req, webhookKey));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { participant } = await requireStreamer();
    const webhookKey = await rotateParticipantWebhookKey(participant.id);
    return Response.json(buildPayload(req, webhookKey));
  } catch (error) {
    return jsonError(error);
  }
}
