import type { GameSession } from "@prisma/client";
import { describeItemEffects, type ItemEffects } from "@/lib/inventory/item-effects";
import { getItemTexture, resolveItemIcon } from "@/lib/inventory/item-assets";

export interface ActiveModifier {
  slug: string;
  name: string;
  iconUrl: string;
  effects: string[];
}

export interface LootSlotReel {
  id: string;
  label: string;
  texture: string;
}

export function parseModifiersSnapshot(json: unknown): ActiveModifier[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((e): e is Record<string, unknown> => !!e && typeof e === "object")
    .map((e) => ({
      slug: String(e.slug ?? ""),
      name: String(e.name ?? e.slug ?? "Модификатор"),
      iconUrl: String(e.iconUrl ?? ""),
      effects: Array.isArray(e.effects)
        ? e.effects.map(String)
        : describeItemEffects((e.effectsJson ?? {}) as ItemEffects),
    }))
    .filter((m) => m.slug.length > 0);
}

export function buildModifiersSnapshot(
  uses: {
    inventoryItem: {
      itemDefinition: {
        slug: string;
        name: string;
        iconUrl: string | null;
        effectsJson: unknown;
      };
    };
  }[],
): ActiveModifier[] {
  return uses.map((u) => {
    const def = u.inventoryItem.itemDefinition;
    const effects = (def.effectsJson ?? {}) as ItemEffects;
    return {
      slug: def.slug,
      name: def.name,
      iconUrl: resolveItemIcon(def.slug, def.iconUrl),
      effects: describeItemEffects(effects),
    };
  });
}

export function getActiveModifiers(session: Pick<GameSession, "modifiersSnapshotJson">): ActiveModifier[] {
  return parseModifiersSnapshot(session.modifiersSnapshotJson);
}

export function buildLootSlotReels(drop: { slug: string; name: string; iconUrl?: string | null }): LootSlotReel[] {
  const texture = getItemTexture(drop.slug);
  const sym: LootSlotReel = { id: drop.slug, label: drop.name, texture };
  return [sym, sym, sym];
}
