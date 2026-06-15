import { BALANCE_ITEM_CATALOG } from "@/lib/balance/item-catalog";
import { ensureBalanceItemDefinitions } from "@/lib/balance/item-definitions-sync";
import { ensureBalanceCraftRecipes } from "@/lib/balance/recipes-sync";
import prisma from "@/lib/db/prisma";
import { resolveItemIcon } from "@/lib/inventory/item-assets";

const CATALOG_SLUGS = BALANCE_ITEM_CATALOG.map((i) => i.slug);

export async function listItemCatalog() {
  await ensureBalanceItemDefinitions();
  await ensureBalanceCraftRecipes();

  const [items, recipes] = await Promise.all([
    prisma.itemDefinition.findMany({
      where: { slug: { in: CATALOG_SLUGS } },
      orderBy: [{ rarity: "desc" }, { name: "asc" }],
    }),
    prisma.craftRecipe.findMany({
      include: {
        resultItem: { select: { slug: true } },
        ingredients: {
          include: { itemDefinition: { select: { slug: true, name: true } } },
        },
      },
    }),
  ]);

  const craftedFrom = new Map<string, { recipeName: string; ingredients: string[] }[]>();

  for (const recipe of recipes) {
    const slug = recipe.resultItem.slug;
    const entry = {
      recipeName: recipe.name,
      ingredients: recipe.ingredients.map(
        (i) => `${i.quantity}× ${i.itemDefinition.name}`,
      ),
    };
    const list = craftedFrom.get(slug) ?? [];
    list.push(entry);
    craftedFrom.set(slug, list);
  }

  return items.map((item) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: item.description,
    rarity: item.rarity,
    kind: item.kind,
    effects: item.effectsJson as Record<string, number | boolean | string | string[]>,
    iconUrl: resolveItemIcon(item.slug, item.iconUrl),
    recipes: craftedFrom.get(item.slug) ?? [],
  }));
}
