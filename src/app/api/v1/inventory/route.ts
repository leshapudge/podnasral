import { jsonError } from "@/lib/api/errors";
import { requireStreamer } from "@/lib/auth/guards";
import { getInventory } from "@/lib/craft/craft.service";

export async function GET() {
  try {
    const { participant } = await requireStreamer();
    const inventory = await getInventory(participant.id);
    return Response.json({
      inventory: inventory.map((i) => ({
        id: i.id,
        name: i.itemDefinition.name,
        rarity: i.itemDefinition.rarity,
        kind: i.itemDefinition.kind,
        quantity: i.quantity,
        effects: i.itemDefinition.effectsJson,
      })),
    });
  } catch (e) {
    return jsonError(e);
  }
}
