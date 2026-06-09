/**
 * Каталог предметов MINESEASON.
 * Основа — эффекты NASSAL (api-game.nassal.pro/api/public/effect/list).
 */
import {
  NASSAL_MATERIALS,
  NASSAL_MODIFIER_ITEMS,
  NASSAL_RECIPES,
} from "./nassal-effect-seeds";

export type { CatalogItemSeed, CatalogRecipeSeed } from "./item-catalog-types";

export const BALANCE_ITEM_CATALOG = [...NASSAL_MATERIALS, ...NASSAL_MODIFIER_ITEMS];

export const BALANCE_RECIPES = NASSAL_RECIPES;
