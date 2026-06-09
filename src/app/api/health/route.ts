import { success } from "@/lib/api/response";

export async function GET() {
  return success({
    status: "ok",
    service: "mineseason-api",
    version: "2.0",
    timestamp: new Date().toISOString(),
  });
}
