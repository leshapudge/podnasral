import { jsonError } from "@/lib/api/errors";
import { getBossPublic } from "@/lib/boss/boss.service";

export async function GET() {
  try {
    const boss = await getBossPublic();
    return Response.json({ boss });
  } catch (e) {
    return jsonError(e);
  }
}
