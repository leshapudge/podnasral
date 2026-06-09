import { jsonError } from "@/lib/api/errors";
import { listItemCatalog } from "@/lib/items/item-catalog.service";

export async function GET() {
  try {
    const items = await listItemCatalog();
    return Response.json({ items });
  } catch (e) {
    return jsonError(e);
  }
}
