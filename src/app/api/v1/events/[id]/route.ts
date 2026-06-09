import { eventsCrud } from "@/lib/api/entities";

export const GET = eventsCrud.getById;
export const PATCH = eventsCrud.update;
export const DELETE = eventsCrud.remove;
