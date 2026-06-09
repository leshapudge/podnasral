import prisma from "@/lib/db/prisma";

export async function listItemCatalog() {
  const [items, recipes] = await Promise.all([
    prisma.itemDefinition.findMany({
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
    effects: item.effectsJson as Record<string, number>,
    iconUrl: item.iconUrl,
    recipes: craftedFrom.get(item.slug) ?? [],
  }));
}
