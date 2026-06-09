import prisma from "@/lib/db/prisma";
import { badRequest, notFound } from "@/lib/api/errors";
import { logActivity } from "@/lib/activity/activity.service";

export async function listRecipes() {
  return prisma.craftRecipe.findMany({
    include: {
      resultItem: true,
      ingredients: { include: { itemDefinition: true } },
    },
  });
}

export async function craftItem(recipeId: string, participantId: string, eventId: string) {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
  });
  if (!participant) throw notFound("Participant");
  if (participant.status !== "IDLE") {
    throw badRequest("Craft only available between games");
  }

  const recipe = await prisma.craftRecipe.findUnique({
    where: { id: recipeId },
    include: {
      resultItem: true,
      ingredients: { include: { itemDefinition: true } },
    },
  });
  if (!recipe) throw notFound("Recipe");

  const inventory = await prisma.inventoryItem.findMany({
    where: { participantId },
    include: { itemDefinition: true },
  });

  for (const ing of recipe.ingredients) {
    const owned = inventory
      .filter((i) => i.itemDefinitionId === ing.itemDefinitionId)
      .reduce((s, i) => s + i.quantity, 0);
    if (owned < ing.quantity) {
      throw badRequest(`Not enough ${ing.itemDefinition.name}`);
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const ing of recipe.ingredients) {
      let remaining = ing.quantity;
      const items = await tx.inventoryItem.findMany({
        where: { participantId, itemDefinitionId: ing.itemDefinitionId },
        orderBy: { quantity: "asc" },
      });
      for (const item of items) {
        if (remaining <= 0) break;
        if (item.quantity <= remaining) {
          remaining -= item.quantity;
          await tx.inventoryItem.delete({ where: { id: item.id } });
        } else {
          await tx.inventoryItem.update({
            where: { id: item.id },
            data: { quantity: item.quantity - remaining },
          });
          remaining = 0;
        }
      }
    }

    await tx.inventoryItem.create({
      data: {
        participantId,
        itemDefinitionId: recipe.resultItemId,
        quantity: recipe.resultQty,
        instanceId: recipe.resultItem.kind === "MODIFIER" ? crypto.randomUUID() : null,
      },
    });
  });

  const user = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { userId: true },
  });

  await logActivity({
    eventId,
    type: "CRAFT",
    actorId: user?.userId,
    payload: { recipe: recipe.name, result: recipe.resultItem.name },
  });

  return recipe.resultItem;
}

export async function getInventory(participantId: string) {
  return prisma.inventoryItem.findMany({
    where: { participantId },
    include: { itemDefinition: true },
    orderBy: { itemDefinition: { rarity: "desc" } },
  });
}
