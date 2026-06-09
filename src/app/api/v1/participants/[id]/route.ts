import { participantsCrud } from "@/lib/api/entities";
import { getParticipantPublicDetail } from "@/lib/participants/participant.service";
import { handleApiError, success } from "@/lib/api/response";

export const GET = async (
  _req: Request,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await context.params;
    const detail = await getParticipantPublicDetail(id);
    if (!detail) {
      return Response.json(
        { success: false, error: { code: "NOT_FOUND", message: "Not found" } },
        { status: 404 },
      );
    }

    return success(detail);
  } catch (error) {
    return handleApiError(error);
  }
};

export const PATCH = participantsCrud.update;
export const DELETE = participantsCrud.remove;
