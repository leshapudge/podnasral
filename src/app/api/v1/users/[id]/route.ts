import { usersCrud } from "@/lib/api/entities";

export const GET = usersCrud.getById;
export const PATCH = usersCrud.update;
export const DELETE = usersCrud.remove;
