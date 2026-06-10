import { jsonError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/guards";
import { getArcadeMe } from "@/lib/arcade/arcade.service";

export async function GET() {
  try {
    const session = await requireAuth();
    const me = await getArcadeMe(session.user.id);
    return Response.json(me);
  } catch (e) {
    return jsonError(e);
  }
}
