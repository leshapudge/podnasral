import { handleApiError, success } from "@/lib/api/response";
import { getWorldMapData } from "@/lib/world-map/world-map.service";

export async function GET() {
  try {
    const data = await getWorldMapData();
    return success(data);
  } catch (error) {
    return handleApiError(error);
  }
}
