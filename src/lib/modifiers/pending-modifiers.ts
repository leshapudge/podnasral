import prisma from "@/lib/db/prisma";
import { describeItemEffects, type ItemEffects } from "@/lib/inventory/item-effects";
import { resolveItemIcon } from "@/lib/inventory/item-assets";
import { toJson } from "@/lib/utils/json";

export function parsePendingModifierIds(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((id): id is string => typeof id === "string" && id.length > 0);
}

export async function queuePendingModifier(participantId: string, inventoryItemId: string) {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { pendingModifierItemIds: true },
  });
  if (!participant) return;

  const current = parsePendingModifierIds(participant.pendingModifierItemIds);
  if (current.includes(inventoryItemId)) return;

  await prisma.participant.update({
    where: { id: participantId },
    data: { pendingModifierItemIds: toJson([...current, inventoryItemId]) },
  });
}

export async function removePendingModifierIds(participantId: string, removeIds: string[]) {
  if (removeIds.length === 0) return;
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { pendingModifierItemIds: true },
  });
  if (!participant) return;

  const remove = new Set(removeIds);
  const next = parsePendingModifierIds(participant.pendingModifierItemIds).filter(
    (id) => !remove.has(id),
  );

  await prisma.participant.update({
    where: { id: participantId },
    data: { pendingModifierItemIds: toJson(next) },
  });
}

export async function getPendingModifiersPreview(participantId: string) {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { pendingModifierItemIds: true },
  });
  if (!participant) return [];

  const ids = parsePendingModifierIds(participant.pendingModifierItemIds);
  if (ids.length === 0) return [];

  const items = await prisma.inventoryItem.findMany({
    where: { id: { in: ids }, participantId },
    include: { itemDefinition: true },
  });
  const byId = new Map(items.map((i) => [i.id, i]));

  return ids
    .map((id) => byId.get(id))
    .filter((item): item is NonNullable<typeof item> => !!item)
    .map((item) => ({
      id: item.id,
      slug: item.itemDefinition.slug,
      name: item.itemDefinition.name,
      iconUrl: resolveItemIcon(item.itemDefinition.slug, item.itemDefinition.iconUrl),
      effects: describeItemEffects(item.itemDefinition.effectsJson as ItemEffects),
    }));
}
