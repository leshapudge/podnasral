import { BALANCE_ITEM_CATALOG } from "@/lib/balance/item-catalog";

/** Локальные PNG — без CDN, не ломаются в браузере. Синхронизация: npm run icons:sync */
export function localItemIcon(slug: string): string {
  return `/assets/mc/items/${slug}.png`;
}

export const ITEM_ICON_UNKNOWN = localItemIcon("_unknown");

/** Все slug'и с локальными иконками (совпадает с scripts/sync-item-icons.mjs). */
const CATALOG_SLUGS = [
  ...BALANCE_ITEM_CATALOG.map((i) => i.slug),
  "material_bag",
  "emerald_charm",
  "shield_totem",
  "nether_star",
] as const;

export type ItemTextureSlug = (typeof CATALOG_SLUGS)[number];

const ITEM_TEXTURE_SLUGS = new Set<string>(CATALOG_SLUGS);

export const ITEM_TEXTURES: Record<string, string> = Object.fromEntries(
  CATALOG_SLUGS.map((slug) => [slug, localItemIcon(slug)]),
);

export function isCatalogItemSlug(slug: string): boolean {
  return ITEM_TEXTURE_SLUGS.has(slug);
}

export function getItemTexture(slug: string): string {
  if (slug.startsWith("slot_")) return localItemIcon(slug);
  return ITEM_TEXTURES[slug] ?? ITEM_ICON_UNKNOWN;
}

/** Всегда локальный путь по slug — iconUrl из БД не используем. */
export function resolveItemIcon(slug: string, _iconUrl?: string | null): string {
  return getItemTexture(slug);
}

/** Только локальные запасные варианты — без «бумаги». */
export function getItemIconFallbackChain(slug: string): string[] {
  const chain: string[] = [];
  const primary = getItemTexture(slug);
  chain.push(primary);
  if (primary !== ITEM_ICON_UNKNOWN) chain.push(ITEM_ICON_UNKNOWN);
  return chain;
}

export const MODIFIER_ITEM_SLUGS = BALANCE_ITEM_CATALOG.filter((i) => i.kind === "MODIFIER").map(
  (i) => i.slug,
);

if (process.env.NODE_ENV !== "production") {
  for (const { slug } of BALANCE_ITEM_CATALOG) {
    if (!ITEM_TEXTURE_SLUGS.has(slug)) {
      console.warn(`[item-assets] нет локальной иконки для slug: ${slug}`);
    }
  }
}
