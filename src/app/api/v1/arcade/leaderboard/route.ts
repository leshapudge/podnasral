import { jsonError } from "@/lib/api/errors";
import { getArcadeLeaderboards } from "@/lib/arcade/arcade.service";

export async function GET() {
  try {
    const boards = await getArcadeLeaderboards(10);
    return Response.json(boards);
  } catch (e) {
    return jsonError(e);
  }
}
