import { NextRequest } from "next/server";
import { gameSearchQuerySchema } from "@/lib/validators/game";
import { searchRawgGamesCached } from "@/lib/catalog/rawg.service";
import { handleApiError, success } from "@/lib/api/response";
import { fromZodError } from "@/lib/api/errors";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const parsed = gameSearchQuerySchema.safeParse({ q });
    if (!parsed.success) throw fromZodError(parsed.error);

    const results = await searchRawgGamesCached(parsed.data.q);

    const items = results.map((game) => ({
      rawgId: game.id,
      title: game.name,
      slug: game.slug,
      coverImage: game.background_image ?? null,
      releaseDate: game.released ?? null,
      genres: game.genres?.map((g) => g.name) ?? [],
      rating: game.rating ?? null,
      metacritic: game.metacritic ?? null,
    }));

    return success(items);
  } catch (error) {
    return handleApiError(error);
  }
}
