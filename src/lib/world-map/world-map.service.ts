import prisma from "@/lib/db/prisma";
import { WORLD_BIOMES, BIOME_PATHS } from "./biomes";
import { getDungeonMarkers } from "./dungeons";
import { getEventMarkers } from "./events";
import type { BiomeId, MapMarker, WorldMapData } from "./types";

const PLAYER_OFFSETS = [
  { x: 40, y: 40 },
  { x: 100, y: 50 },
  { x: 60, y: 100 },
  { x: 120, y: 90 },
  { x: 30, y: 150 },
  { x: 140, y: 40 },
];

const BIOME_ROTATION: BiomeId[] = ["forest", "snow", "desert", "jungle", "nether", "end"];

export async function getWorldMapData(): Promise<WorldMapData> {
  const event = await prisma.event.findFirst({
    where: { status: { in: ["ACTIVE", "UPCOMING"] } },
    orderBy: { startsAt: "desc" },
    include: {
      boss: true,
      participants: {
        include: { user: true },
        orderBy: { displayOrder: "asc" },
        take: 12,
      },
    },
  });

  const markers: MapMarker[] = [...getDungeonMarkers(), ...getEventMarkers()];

  if (event?.boss) {
    markers.push({
      id: `boss-${event.boss.slug}`,
      kind: "boss",
      biomeId: "end",
      label: event.boss.name,
      subtitle: `${event.boss.currentHp} / ${event.boss.maxHp} HP`,
      icon: "🐉",
      position: { x: 200, y: 80 },
      status: event.boss.status,
    });
  }

  event?.participants.forEach((p, i) => {
    const biome = BIOME_ROTATION[i % BIOME_ROTATION.length];
    const offset = PLAYER_OFFSETS[i % PLAYER_OFFSETS.length];
    markers.push({
      id: `player-${p.id}`,
      kind: "player",
      biomeId: biome,
      label: p.user.name ?? p.user.twitchLogin ?? "Стример",
      subtitle: p.isLive ? "🔴 LIVE" : `${p.totalPoints} очков`,
      icon: "⛏️",
      position: offset,
      href: "/?tab=overview",
      status: p.status,
    });
  });

  const stats = {
    players: markers.filter((m) => m.kind === "player").length,
    bosses: markers.filter((m) => m.kind === "boss").length,
    dungeons: markers.filter((m) => m.kind === "dungeon").length,
    events: markers.filter((m) => m.kind === "event").length,
  };

  return {
    season: event ? { id: event.id, name: event.name } : null,
    biomes: WORLD_BIOMES,
    markers,
    paths: BIOME_PATHS,
    stats,
  };
}
