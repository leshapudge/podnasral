import prisma from "@/lib/db/prisma";
import { badRequest, conflict } from "@/lib/api/errors";
import { grantCasinoSpins } from "@/lib/casino/casino.service";
import { getSession } from "./session.service";

export async function submitGameReview(
  sessionId: string,
  participantId: string,
  rating: number,
  review: string,
) {
  const session = await getSession(sessionId, participantId);

  if (session.status !== "COMPLETED") {
    throw conflict("Review only for completed games");
  }
  if (session.playerRating != null) {
    throw conflict("Review already submitted");
  }

  const score = Math.round(rating);
  if (score < 1 || score > 10) {
    throw badRequest("Rating must be between 1 and 10");
  }

  const text = review.trim();
  if (text.length < 3) {
    throw badRequest("Review must be at least 3 characters");
  }
  if (text.length > 2000) {
    throw badRequest("Review is too long (max 2000 characters)");
  }

  await prisma.gameSession.update({
    where: { id: sessionId },
    data: {
      playerRating: score,
      playerReview: text,
    },
  });

  const updated = await prisma.gameSession.findUniqueOrThrow({
    where: { id: sessionId },
  });

  const casinoSpins = await grantCasinoSpins(updated);

  return { session: updated, casinoSpins };
}
