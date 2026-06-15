import { z } from "zod";
import { badRequest, fromZodError, jsonError, notFound } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/guards";
import prisma from "@/lib/db/prisma";
import { removePendingModifierIds } from "@/lib/modifiers/pending-modifiers";

const adjustInventorySchema = z
  .object({
    delta: z
      .coerce
      .number()
      .int()
      .refine((value) => value !== 0, "delta must not be 0")
      .refine((value) => Math.abs(value) <= 10_000, "absolute delta must be <= 10000"),
    reason: z.string().trim().max(240).optional(),
    itemDefinitionId: z.string().cuid().optional(),
    itemSlug: z.string().trim().min(1).max(120).optional(),
  })
  .refine((value) => value.itemDefinitionId || value.itemSlug, {
    message: "itemDefinitionId or itemSlug is required",
    path: ["itemDefinitionId"],
  });

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id: participantId } = await context.params;

    const parsed = adjustInventorySchema.safeParse(await req.json());
    if (!parsed.success) throw fromZodError(parsed.error);

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      select: { id: true },
    });
    if (!participant) throw notFound("Participant");

    const itemDefinition = parsed.data.itemDefinitionId
      ? await prisma.itemDefinition.findUnique({
          where: { id: parsed.data.itemDefinitionId },
          select: { id: true, slug: true, name: true, kind: true },
        })
      : await prisma.itemDefinition.findUnique({
          where: { slug: parsed.data.itemSlug },
          select: { id: true, slug: true, name: true, kind: true },
        });
    if (!itemDefinition) throw notFound("ItemDefinition");

    const removedInventoryItemIds: string[] = [];

    await prisma.$transaction(async (tx) => {
      if (parsed.data.delta > 0) {
        if (itemDefinition.kind === "MODIFIER") {
          for (let idx = 0; idx < parsed.data.delta; idx += 1) {
            await tx.inventoryItem.create({
              data: {
                participantId,
                itemDefinitionId: itemDefinition.id,
                quantity: 1,
                instanceId: crypto.randomUUID(),
              },
            });
          }
          return;
        }

        const stack = await tx.inventoryItem.findFirst({
          where: {
            participantId,
            itemDefinitionId: itemDefinition.id,
            modifierConsumptions: { none: {} },
          },
          orderBy: { quantity: "desc" },
          select: { id: true },
        });

        if (stack) {
          await tx.inventoryItem.update({
            where: { id: stack.id },
            data: { quantity: { increment: parsed.data.delta } },
          });
        } else {
          await tx.inventoryItem.create({
            data: {
              participantId,
              itemDefinitionId: itemDefinition.id,
              quantity: parsed.data.delta,
              instanceId: null,
            },
          });
        }
        return;
      }

      let remaining = Math.abs(parsed.data.delta);
      const removable = await tx.inventoryItem.findMany({
        where: {
          participantId,
          itemDefinitionId: itemDefinition.id,
          modifierConsumptions: { none: {} },
        },
        orderBy: [{ quantity: "asc" }, { id: "asc" }],
        select: { id: true, quantity: true },
      });

      const available = removable.reduce((sum, item) => sum + item.quantity, 0);
      if (available < remaining) {
        throw badRequest(`Недостаточно предметов: доступно ${available}, запрошено ${remaining}`);
      }

      for (const item of removable) {
        if (remaining <= 0) break;

        if (item.quantity <= remaining) {
          remaining -= item.quantity;
          removedInventoryItemIds.push(item.id);
          await tx.inventoryItem.delete({ where: { id: item.id } });
        } else {
          await tx.inventoryItem.update({
            where: { id: item.id },
            data: { quantity: item.quantity - remaining },
          });
          remaining = 0;
        }
      }
    });

    if (removedInventoryItemIds.length > 0) {
      await removePendingModifierIds(participantId, removedInventoryItemIds);
    }

    const quantityAgg = await prisma.inventoryItem.aggregate({
      where: {
        participantId,
        itemDefinitionId: itemDefinition.id,
      },
      _sum: { quantity: true },
    });

    return Response.json({
      participantId,
      delta: parsed.data.delta,
      item: itemDefinition,
      totalQuantity: quantityAgg._sum.quantity ?? 0,
    });
  } catch (error) {
    return jsonError(error);
  }
}
