import { itemsCrud } from "@/lib/api/entities";

export const GET = itemsCrud.getById;
export const PATCH = itemsCrud.update;
export const DELETE = itemsCrud.remove;
