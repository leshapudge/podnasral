import { catalogGamesCrud } from "@/lib/api/entities";

export const GET = catalogGamesCrud.getById;
export const PATCH = catalogGamesCrud.update;
export const DELETE = catalogGamesCrud.remove;
