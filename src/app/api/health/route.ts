import { authConfigIssues, isAuthConfigured } from "@/lib/auth/env";
import { EVENT_BRAND_LOWER } from "@/lib/event/event-brand";
import { success } from "@/lib/api/response";

export async function GET() {
  return success({
    status: "ok",
    service: `${EVENT_BRAND_LOWER}-api`,
    version: "2.0",
    timestamp: new Date().toISOString(),
    auth: {
      configured: isAuthConfigured(),
      missing: authConfigIssues(),
    },
  });
}
