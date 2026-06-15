import prisma from "@/lib/db/prisma";
import { BALANCE_RECIPES } from "./item-catalog";
import { ensureBalanceItemDefinitions } from "./item-definitions-sync";

const SYNC_TTL_MS = 10 * 60 * 1000;

let lastSyncedAt = 0;
let syncInFlight: Promise<void> | null = null;

async function syncAllBalanceRecipes() {
  await ensureBalanceItemDefinitions();

  const recipeSlugs = BALANCE_RECIPES.map((recipe) => recipe.slug);
  const requiredItemSlugs = new Set<string>();

  for (const recipe of BALANCE_RECIPES) {
    requiredItemSlugs.add(recipe.resultSlug);
    for (const ingredient of recipe.ingredients) {
      requiredItemSlugs.add(ingredient.slug);
    }
  }

  const defs = await prisma.itemDefinition.findMany({
    where: { slug: { in: [...requiredItemSlugs] } },
    select: { id: true, slug: true },
  });
  const defBySlug = new Map(defs.map((def) => [def.slug, def]));

  for (const recipe of BALANCE_RECIPES) {
    const result = defBySlug.get(recipe.resultSlug);
    if (!result) continue;

    const ingredients = recipe.ingredients
      .map((ingredient) => {
        const def = defBySlug.get(ingredient.slug);
        if (!def) return null;
        return { itemDefinitionId: def.id, quantity: ingredient.quantity };
      })
      .filter((ingredient): ingredient is { itemDefinitionId: string; quantity: number } => !!ingredient);

    if (ingredients.length !== recipe.ingredients.length) continue;

    await prisma.craftRecipe.upsert({
      where: { slug: recipe.slug },
      create: {
        slug: recipe.slug,
        name: recipe.name,
        resultItemId: result.id,
        resultQty: 1,
        ingredients: { create: ingredients },
      },
      update: {
        name: recipe.name,
        resultItemId: result.id,
        resultQty: 1,
        ingredients: {
          deleteMany: {},
          create: ingredients,
        },
      },
    });
  }

  await prisma.craftRecipe.deleteMany({
    where: { slug: { notIn: recipeSlugs } },
  });
}

export async function ensureBalanceCraftRecipes() {
  const now = Date.now();
  if (now - lastSyncedAt < SYNC_TTL_MS) return;

  if (!syncInFlight) {
    syncInFlight = syncAllBalanceRecipes()
      .then(() => {
        lastSyncedAt = Date.now();
      })
      .finally(() => {
        syncInFlight = null;
      });
  }

  await syncInFlight;
}
