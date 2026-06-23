import type { SessionStatus } from "@prisma/client";
import { badRequest, notFound } from "@/lib/api/errors";
import prisma from "@/lib/db/prisma";
import { logActivity } from "@/lib/activity/activity.service";
import { getActiveEvent } from "@/lib/event/event.service";

const DELETABLE_STATUSES: SessionStatus[] = ["COMPLETED", "DROPPED"];

export async function adminDeleteFinishedSession(params: {
  participantId: string;
  sessionId: string;
  actorUserId: string;
}) {
  const session = await prisma.gameSession.findFirst({
    where: { id: params.sessionId, participantId: params.participantId },
    include: {
      catalogGame: { select: { title: true } },
      bossDamages: { include: { boss: true } },
    },
  });
  if (!session) throw notFound("GameSession");
  if (!DELETABLE_STATUSES.includes(session.status)) {
    throw badRequest("Можно удалять только завершённые или дропнутые игры");
  }

  const event = await getActiveEvent();

  const result = await prisma.$transaction(async (tx) => {
    const participant = await tx.participant.findUnique({
      where: { id: params.participantId },
    });
    if (!participant) throw notFound("Participant");

    let pointsDelta = 0;
    if (session.status === "COMPLETED" && session.finalScore) {
      pointsDelta -= session.finalScore;
    } else if (session.status === "DROPPED" && session.dropPenalty) {
      pointsDelta += session.dropPenalty;
    }

    const nextPoints = Math.max(0, participant.totalPoints + pointsDelta);

    const participantData: {
      totalPoints: number;
      currentSessionId?: null;
      currentGameTitle?: null;
      gameProgressPct?: number;
      status?: "IDLE";
    } = { totalPoints: nextPoints };

    if (participant.currentSessionId === session.id) {
      participantData.currentSessionId = null;
      participantData.currentGameTitle = null;
      participantData.gameProgressPct = 0;
      participantData.status = "IDLE";
    }

    for (const damage of session.bossDamages) {
      await tx.boss.update({
        where: { id: damage.bossId },
        data: {
          currentHp: Math.min(damage.boss.maxHp, damage.boss.currentHp + damage.damage),
          ...(damage.boss.status === "DEFEATED" ? { status: "ACTIVE" as const } : {}),
        },
      });
    }

    await tx.participant.update({
      where: { id: params.participantId },
      data: participantData,
    });

    await tx.gameSession.delete({ where: { id: session.id } });

    return { pointsDelta, gameTitle: session.catalogGame.title };
  });

  await logActivity({
    eventId: event.id,
    type: "POINTS_ADJUSTED",
    actorId: params.actorUserId,
    payload: {
      participantId: params.participantId,
      sessionId: params.sessionId,
      gameTitle: result.gameTitle,
      pointsDelta: result.pointsDelta,
      reason: "admin_delete_session",
    },
  });

  const participant = await prisma.participant.findUnique({
    where: { id: params.participantId },
    select: { totalPoints: true },
  });

  return {
    sessionId: params.sessionId,
    gameTitle: result.gameTitle,
    pointsDelta: result.pointsDelta,
    totalPoints: participant?.totalPoints ?? 0,
  };
}
