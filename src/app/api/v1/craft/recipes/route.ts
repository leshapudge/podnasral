import { jsonError } from "@/lib/api/errors";
import { listRecipes } from "@/lib/craft/craft.service";

export async function GET() {
  try {
    const recipes = await listRecipes();
    return Response.json({
      recipes: recipes.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        resultQty: r.resultQty,
        resultItem: {
          slug: r.resultItem.slug,
          name: r.resultItem.name,
          rarity: r.resultItem.rarity,
          kind: r.resultItem.kind,
        },
        ingredients: r.ingredients.map((i) => ({
          quantity: i.quantity,
          itemDefinition: {
            slug: i.itemDefinition.slug,
            name: i.itemDefinition.name,
            rarity: i.itemDefinition.rarity,
          },
        })),
      })),
    });
  } catch (e) {
    return jsonError(e);
  }
}
