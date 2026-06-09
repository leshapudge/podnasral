import { craftIngredientsCrud } from "@/lib/api/entities";

export const GET = craftIngredientsCrud.getById;
export const PATCH = craftIngredientsCrud.update;
export const DELETE = craftIngredientsCrud.remove;
