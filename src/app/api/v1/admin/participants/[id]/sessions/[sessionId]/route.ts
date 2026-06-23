import { jsonError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/guards";
import { adminDeleteFinishedSession } from "@/lib/admin/delete-session.service";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string; sessionId: string }> },
) {
  try {
    const session = await requireAdmin();
    const { id: participantId, sessionId } = await context.params;

    const result = await adminDeleteFinishedSession({
      participantId,
      sessionId,
      actorUserId: session.user.id,
    });

    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
