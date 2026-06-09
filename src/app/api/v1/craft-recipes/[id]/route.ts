import { craftRecipesCrud } from "@/lib/api/entities";

export const GET = craftRecipesCrud.getById;
export const PATCH = craftRecipesCrud.update;
export const DELETE = craftRecipesCrud.remove;
