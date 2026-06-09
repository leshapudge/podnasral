export type BiomeId = "forest" | "snow" | "desert" | "jungle" | "nether" | "end";

export type MarkerKind = "player" | "boss" | "dungeon" | "event";

export interface BiomeDefinition {
  id: BiomeId;
  name: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  borderColor: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface MapMarker {
  id: string;
  kind: MarkerKind;
  biomeId: BiomeId;
  label: string;
  subtitle?: string;
  icon: string;
  position: { x: number; y: number };
  href?: string;
  status?: string;
  meta?: Record<string, string | number>;
}

export interface BiomePath {
  id: string;
  from: BiomeId;
  to: BiomeId;
}

export interface WorldMapData {
  season: { id: string; name: string } | null;
  biomes: BiomeDefinition[];
  markers: MapMarker[];
  paths: BiomePath[];
  stats: {
    players: number;
    bosses: number;
    dungeons: number;
    events: number;
  };
}
