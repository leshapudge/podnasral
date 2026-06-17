import prisma from "@/lib/db/prisma";
import { badRequest, conflict } from "@/lib/api/errors";
import { getActiveEvent } from "@/lib/event/event.service";
import { getCompetitionContext } from "@/lib/balance/catch-up";
import { calculateCasinoSpins } from "@/lib/casino/spin-count";
import type { ModifierEffects } from "@/lib/scoring/score-calculator";
import { getSession } from "./session.service";

export async function submitGameReview(
  sessionId: string,
  participantId: string,
  rating: number,
  review: string,
) {
  const session = await getSession(sessionId, participantId);

  if (session.status !== "COMPLETED" && session.status !== "DROPPED") {
    throw conflict("Review only for completed or dropped games");
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

  const event = await getActiveEvent();
  const competition = await getCompetitionContext(session.participantId, event.id);
  const modifiers = (session.modifiersJson as ModifierEffects[]) ?? [];
  const isDrop = session.status === "DROPPED";
  const spins = calculateCasinoSpins({
    modifiers,
    hltbMainHours: session.hltbMainHours,
    competition,
    isDrop,
  });

  const updated = await prisma.$transaction(async (tx) => {
    const claimed = await tx.gameSession.updateMany({
      where: {
        id: sessionId,
        participantId,
        status: session.status,
        playerRating: null,
      },
      data: {
        playerRating: score,
        playerReview: text,
        casinoSpinsTotal: spins,
        casinoSpinsUsed: 0,
        casinoManualBonusApplied: false,
      },
    });
    if (claimed.count !== 1) throw conflict("Review already submitted");

    const sessionAfter = await tx.gameSession.findUniqueOrThrow({
      where: { id: sessionId },
    });
    await tx.participant.update({
      where: { id: participantId },
      data: { status: "CASINO" },
    });
    return sessionAfter;
  });

  return { session: updated, casinoSpins: spins };
}
