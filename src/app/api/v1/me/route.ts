import { jsonError } from "@/lib/api/errors";
import { resolveItemIcon } from "@/lib/inventory/item-assets";
import { requireAuth } from "@/lib/auth/guards";
import prisma from "@/lib/db/prisma";
import { ensureEventParticipant } from "@/lib/participants/ensure-event-participant";
import { getTwitchIdentity } from "@/lib/auth/twitch-identity";
import { syncTwitchUserProfile } from "@/lib/auth/sync-twitch-user";
import { getInventory } from "@/lib/craft/craft.service";
import { getPendingModifiersPreview } from "@/lib/modifiers/pending-modifiers";
import { formatSessionPublic, getSession } from "@/lib/sessions/session.service";
import { ensureParticipantWebhookKey } from "@/lib/donations/donationalerts-connection.service";

export async function GET() {
  try {
    const session = await requireAuth();
    await syncTwitchUserProfile(session.user.id);
    const { twitchId, twitchLogin } = await getTwitchIdentity(session.user.id);
    await ensureEventParticipant(session.user.id, twitchId, twitchLogin);
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        participant: {
          include: {
            currentSession: { include: { catalogGame: true } },
          },
        },
      },
    });

    if (!user) {
      return Response.json({ error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 });
    }

    const inventory = user.participant
      ? await getInventory(user.participant.id)
      : [];

    const currentSession = user.participant?.currentSession
      ? formatSessionPublic(await getSession(user.participant.currentSession.id))
      : null;

    const pendingModifiers = user.participant
      ? await getPendingModifiersPreview(user.participant.id)
      : [];

    const activeAuction = user.participant
      ? await prisma.auctionRun.findFirst({
          where: {
            participantId: user.participant.id,
            status: { in: ["PREPARING", "RUNNING"] },
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            resolvedGame: {
              select: {
                id: true,
                title: true,
                mainStoryHours: true,
              },
            },
            modifierUses: { select: { inventoryItemId: true } },
          },
        })
      : null;

    const donationAlerts = user.participant
      ? {
          webhookPath: `/api/integrations/donationalerts/${await ensureParticipantWebhookKey(user.participant.id)}`,
        }
      : null;

    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
        role: user.role,
        twitchLogin: user.twitchLogin,
      },
      participant: user.participant
        ? {
            id: user.participant.id,
            totalPoints: user.participant.totalPoints,
            status: user.participant.status,
            isLive: user.participant.isLive,
          }
        : null,
      inventory: inventory.map((i) => ({
        id: i.id,
        slug: i.itemDefinition.slug,
        name: i.itemDefinition.name,
        rarity: i.itemDefinition.rarity,
        kind: i.itemDefinition.kind,
        quantity: i.quantity,
        effects: i.itemDefinition.effectsJson,
        iconUrl: resolveItemIcon(i.itemDefinition.slug, i.itemDefinition.iconUrl),
      })),
      currentSession,
      pendingModifiers,
      activeAuction: activeAuction
        ? {
            id: activeAuction.id,
            status: activeAuction.status,
            autoAppliedModifierIds: activeAuction.modifierUses.map((u) => u.inventoryItemId),
            resolvedGame: activeAuction.resolvedGame,
          }
        : null,
      donationAlerts,
    });
  } catch (e) {
    return jsonError(e);
  }
}
