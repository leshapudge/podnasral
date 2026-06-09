/** Раскладка ингредиентов на сетке 3×3 (слоты 0–8, как в Minecraft). */
export interface RecipeGridCell {
  slug: string;
  slot: number;
}

export const RECIPE_GRID_LAYOUTS: Record<string, RecipeGridCell[]> = {
  nether_star_recipe: [
    { slug: "iron_shard", slot: 0 },
    { slug: "gold_dust", slot: 1 },
    { slug: "iron_shard", slot: 2 },
    { slug: "emerald_splinter", slot: 4 },
    { slug: "iron_shard", slot: 6 },
    { slug: "gold_dust", slot: 7 },
    { slug: "iron_shard", slot: 8 },
  ],
  shield_totem_recipe: [
    { slug: "iron_shard", slot: 3 },
    { slug: "gold_dust", slot: 4 },
    { slug: "iron_shard", slot: 5 },
    { slug: "iron_shard", slot: 1 },
  ],
  underdog_charm_recipe: [
    { slug: "iron_shard", slot: 0 },
    { slug: "emerald_splinter", slot: 4 },
    { slug: "iron_shard", slot: 8 },
  ],
  lucky_lens_recipe: [
    { slug: "gold_dust", slot: 0 },
    { slug: "emerald_splinter", slot: 4 },
    { slug: "gold_dust", slot: 8 },
  ],
  reroll_crystal_recipe: [
    { slug: "iron_shard", slot: 0 },
    { slug: "gold_dust", slot: 1 },
    { slug: "iron_shard", slot: 2 },
    { slug: "emerald_splinter", slot: 4 },
    { slug: "gold_dust", slot: 7 },
  ],
};

/** Авто-раскладка для рецептов без фиксированной формы. */
export function autoPlaceIngredients(
  ingredients: { slug: string; quantity: number }[],
): RecipeGridCell[] {
  const cells: RecipeGridCell[] = [];
  let slot = 0;

  for (const ing of ingredients) {
    for (let q = 0; q < ing.quantity && slot < 9; q++) {
      cells.push({ slug: ing.slug, slot });
      slot += 1;
    }
  }

  return cells;
}

export function buildRecipeGrid(
  recipeSlug: string,
  ingredients: { slug: string; quantity: number }[],
): (string | null)[] {
  const grid: (string | null)[] = Array(9).fill(null);
  const layout =
    RECIPE_GRID_LAYOUTS[recipeSlug] ?? autoPlaceIngredients(ingredients);

  for (const cell of layout) {
    if (cell.slot >= 0 && cell.slot < 9) {
      grid[cell.slot] = cell.slug;
    }
  }

  return grid;
}
