import { PrismaClient } from "@prisma/client";
import {
  BALANCE_ITEM_CATALOG,
  BALANCE_RECIPES,
} from "../src/lib/balance/item-catalog";
import { getItemTexture } from "../src/lib/inventory/item-assets";
import { syncBossHpForEvent } from "../src/lib/boss/boss.service";
import {
  EVENT_DURATION_DAYS,
  EVENT_START_ISO,
  EVENT_STREAMERS,
} from "../src/lib/event/event-roster";
import { defaultEventConfigJson } from "../src/lib/event/config";
import { EVENT_SEED_NAME } from "../src/lib/event/event-brand";

const prisma = new PrismaClient();

async function main() {
  const startsAt = new Date(EVENT_START_ISO);
  const endsAt = new Date(startsAt.getTime() + EVENT_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const status = Date.now() >= startsAt.getTime() ? "ACTIVE" : "UPCOMING";

  const event = await prisma.event.upsert({
    where: { id: "seed-event-1" },
    create: {
      id: "seed-event-1",
      name: EVENT_SEED_NAME,
      startsAt,
      endsAt,
      status,
      config: defaultEventConfigJson(),
    },
    update: {
      name: EVENT_SEED_NAME,
      startsAt,
      endsAt,
      status,
      config: defaultEventConfigJson(),
    },
  });

  for (const item of BALANCE_ITEM_CATALOG) {
    await prisma.itemDefinition.upsert({
      where: { slug: item.slug },
      create: {
        slug: item.slug,
        name: item.name,
        description: item.description,
        rarity: item.rarity,
        kind: item.kind,
        effectsJson: item.effectsJson,
        iconUrl: getItemTexture(item.slug),
      },
      update: {
        name: item.name,
        description: item.description,
        rarity: item.rarity,
        kind: item.kind,
        effectsJson: item.effectsJson,
        iconUrl: getItemTexture(item.slug),
      },
    });
  }

  const itemBySlug = new Map(
    (
      await prisma.itemDefinition.findMany({
        where: { slug: { in: BALANCE_ITEM_CATALOG.map((i) => i.slug) } },
      })
    ).map((i) => [i.slug, i]),
  );

  async function upsertRecipe(
    slug: string,
    name: string,
    resultId: string,
    ings: { itemDefinitionId: string; quantity: number }[],
  ) {
    await prisma.craftRecipe.upsert({
      where: { slug },
      create: {
        slug,
        name,
        resultItemId: resultId,
        resultQty: 1,
        ingredients: { create: ings },
      },
      update: {
        name,
        resultItemId: resultId,
        ingredients: {
          deleteMany: {},
          create: ings,
        },
      },
    });
  }

  for (const recipe of BALANCE_RECIPES) {
    const result = itemBySlug.get(recipe.resultSlug);
    if (!result) continue;

    const ings = recipe.ingredients
      .map((ing) => {
        const def = itemBySlug.get(ing.slug);
        if (!def) return null;
        return { itemDefinitionId: def.id, quantity: ing.quantity };
      })
      .filter(Boolean) as { itemDefinitionId: string; quantity: number }[];

    if (ings.length !== recipe.ingredients.length) continue;
    await upsertRecipe(recipe.slug, recipe.name, result.id, ings);
  }

  const games = [
    { rawgId: 3498, title: "Grand Theft Auto V", slug: "grand-theft-auto-v", mainStoryHours: 32 },
    { rawgId: 3328, title: "The Witcher 3: Wild Hunt", slug: "the-witcher-3-wild-hunt", mainStoryHours: 52 },
    { rawgId: 4200, title: "Portal 2", slug: "portal-2", mainStoryHours: 8.5 },
    { rawgId: 5286, title: "Tomb Raider", slug: "tomb-raider", mainStoryHours: 11 },
    { rawgId: 13537, title: "Half-Life 2", slug: "half-life-2", mainStoryHours: 12 },
    { rawgId: 1942, title: "Far Cry 3", slug: "far-cry-3", mainStoryHours: 15 },
    { rawgId: 58175, title: "Hollow Knight", slug: "hollow-knight", mainStoryHours: 27 },
    { rawgId: 29177, title: "Celeste", slug: "celeste", mainStoryHours: 8.5 },
    { rawgId: 17822, title: "The Elder Scrolls V: Skyrim", slug: "the-elder-scrolls-v-skyrim", mainStoryHours: 34 },
    { rawgId: 39, title: "Terraria", slug: "terraria", mainStoryHours: 85 },
  ];

  for (const g of games) {
    const game = await prisma.catalogGame.upsert({
      where: { rawgId: g.rawgId },
      create: {
        rawgId: g.rawgId,
        title: g.title,
        slug: g.slug,
        mainStoryHours: g.mainStoryHours,
        hltbSyncedAt: new Date(),
      },
      update: { mainStoryHours: g.mainStoryHours },
    });

    await prisma.eventGamePool.upsert({
      where: { eventId_catalogGameId: { eventId: event.id, catalogGameId: game.id } },
      create: { eventId: event.id, catalogGameId: game.id },
      update: { isEnabled: true },
    });
  }

  const rosterLogins = new Set(EVENT_STREAMERS.map((s) => s.twitchLogin));
  const rosterTwitchIds = EVENT_STREAMERS.map((s) => s.twitchId);

  // Стримеры попадают в БД только после входа через Twitch — seed не создаёт User/Participant.

  const unauthParticipants = await prisma.participant.findMany({
    where: {
      user: { NOT: { accounts: { some: { provider: "twitch" } } } },
    },
    select: { id: true },
  });
  for (const p of unauthParticipants) {
    await prisma.inventoryItem.deleteMany({ where: { participantId: p.id } });
    await prisma.participant.delete({ where: { id: p.id } });
  }

  // Удаляем seed-заглушки, demo и KarmikKoala — только без OAuth
  const staleUsers = await prisma.user.findMany({
    where: {
      accounts: { none: { provider: "twitch" } },
      OR: [
        { twitchId: { startsWith: "demo-" } },
        { twitchLogin: { equals: "karmikkoala", mode: "insensitive" } },
        { name: { equals: "KarmikKoala", mode: "insensitive" } },
        { twitchId: { in: rosterTwitchIds } },
        {
          twitchLogin: { notIn: [...rosterLogins] },
          role: { in: ["STREAMER", "ADMIN"] },
        },
        {
          twitchLogin: { in: [...rosterLogins] },
          role: { in: ["STREAMER", "ADMIN"] },
        },
      ],
    },
    include: { participant: true },
  });

  for (const u of staleUsers) {
    if (u.participant) {
      await prisma.inventoryItem.deleteMany({ where: { participantId: u.participant.id } });
      await prisma.participant.delete({ where: { id: u.participant.id } });
    }
    await prisma.account.deleteMany({ where: { userId: u.id } });
    await prisma.session.deleteMany({ where: { userId: u.id } });
    await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
  }

  await prisma.activityLog.deleteMany({ where: { eventId: event.id } });

  const balanceConfig = defaultEventConfigJson();
  await syncBossHpForEvent(event.id, balanceConfig);

  await prisma.user.updateMany({
    where: { accounts: { none: { provider: "twitch" } } },
    data: { arcadeCoins: 0, arcadeDiamonds: 0, arcadeNetWorth: 0 },
  });

  const arcadeUsers = await prisma.user.findMany({
    where: { accounts: { some: { provider: "twitch" } } },
    select: { id: true, arcadeCoins: true, arcadeDiamonds: true, arcadeNetWorth: true },
  });
  for (const u of arcadeUsers) {
    const net = u.arcadeCoins + u.arcadeDiamonds * 50;
    if (u.arcadeNetWorth !== net) {
      await prisma.user.update({
        where: { id: u.id },
        data: { arcadeNetWorth: net },
      });
    }
  }

  const catalogSlugs = BALANCE_ITEM_CATALOG.map((i) => i.slug);
  await prisma.itemDefinition.deleteMany({
    where: { slug: { notIn: catalogSlugs } },
  });

  console.log(
    `Seed complete: ${event.name} (${status}) — starts ${startsAt.toISOString()} — ${EVENT_STREAMERS.length} streamers`,
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
