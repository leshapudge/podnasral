import { jsonError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/auth/guards";
import { spinArcade } from "@/lib/arcade/arcade.service";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = (await req.json()) as { bet?: number };
    const bet = Number(body.bet);
    const result = await spinArcade(session.user.id, bet);
    return Response.json(result);
  } catch (e) {
    return jsonError(e);
  }
}
