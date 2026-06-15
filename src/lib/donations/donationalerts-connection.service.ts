import { randomBytes } from "node:crypto";
import prisma from "@/lib/db/prisma";
import { notFound } from "@/lib/api/errors";

function newWebhookKey() {
  return randomBytes(24).toString("base64url");
}

export async function ensureParticipantWebhookKey(participantId: string) {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { donationAlertsWebhookKey: true },
  });
  if (!participant) throw notFound("Participant");
  if (participant.donationAlertsWebhookKey) return participant.donationAlertsWebhookKey;

  return rotateParticipantWebhookKey(participantId);
}

export async function rotateParticipantWebhookKey(participantId: string) {
  await prisma.participant.findUniqueOrThrow({ where: { id: participantId }, select: { id: true } });

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = newWebhookKey();
    try {
      const updated = await prisma.participant.update({
        where: { id: participantId },
        data: { donationAlertsWebhookKey: candidate },
        select: { donationAlertsWebhookKey: true },
      });
      if (updated.donationAlertsWebhookKey) return updated.donationAlertsWebhookKey;
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: string }).code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Failed to generate unique webhook key");
}

export async function findParticipantByWebhookKey(webhookKey: string) {
  return prisma.participant.findUnique({
    where: { donationAlertsWebhookKey: webhookKey },
    select: {
      id: true,
      eventId: true,
      user: { select: { twitchLogin: true, name: true } },
    },
  });
}
