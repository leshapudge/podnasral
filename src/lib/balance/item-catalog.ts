/**
 * Каталог предметов PODNASRAL — Minecraft-лор сезона.
 */
import { MC_MATERIALS, MC_MODIFIER_ITEMS, MC_RECIPES } from "./mc-item-seeds";

export type { CatalogItemSeed, CatalogRecipeSeed } from "./item-catalog-types";

export const BALANCE_ITEM_CATALOG = [...MC_MATERIALS, ...MC_MODIFIER_ITEMS];

export const BALANCE_RECIPES = MC_RECIPES;
