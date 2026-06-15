export interface CatalogItemSeed {
  slug: string;
  name: string;
  description: string;
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";
  kind: "MODIFIER" | "MATERIAL" | "CRAFTABLE";
  effectsJson: Record<string, number | boolean | string | string[]>;
}

export interface CatalogRecipeSeed {
  slug: string;
  name: string;
  resultSlug: string;
  ingredients: { slug: string; quantity: number }[];
}
