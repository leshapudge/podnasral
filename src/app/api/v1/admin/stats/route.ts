import { auth } from "@/lib/auth/auth";
import { getAdminStats } from "@/lib/admin/stats.service";
import { handleApiError, success } from "@/lib/api/response";
import { unauthorized, forbidden } from "@/lib/api/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) throw unauthorized();
    if (session.user.role !== "ADMIN") throw forbidden();

    const stats = await getAdminStats();
    return success(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
