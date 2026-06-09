import { bossesCrud } from "@/lib/api/entities";

export const GET = bossesCrud.getById;
export const PATCH = bossesCrud.update;
export const DELETE = bossesCrud.remove;
