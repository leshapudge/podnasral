import type { ResourceSoundType } from "./types";

/** Resolve inventory / reward templateId to resource pickup sound */
export function resolveResourceSound(input: {
  type?: ResourceSoundType;
  templateId?: string;
  name?: string;
  rarity?: string;
}): ResourceSoundType {
  if (input.type) return input.type;

  const id = (input.templateId ?? input.name ?? "").toLowerCase();

  if (id.includes("emerald")) return "emerald";
  if (id.includes("diamond") || id.includes("netherite")) return "diamond";
  if (id.includes("gold")) return "gold";
  if (id.includes("iron")) return "iron";
  if (id.includes("wood") || id.includes("oak") || id.includes("log") || id.includes("plank")) {
    return "wood";
  }
  if (
    id.includes("stone") ||
    id.includes("cobble") ||
    id.includes("coal") ||
    id.includes("redstone")
  ) {
    return "stone";
  }

  if (input.rarity === "LEGENDARY" || input.rarity === "EPIC") return "diamond";
  if (input.rarity === "RARE" || input.rarity === "UNCOMMON") return "iron";
  return "stone";
}

export function resourceSoundId(type: ResourceSoundType) {
  return `resource.${type}` as const;
}
