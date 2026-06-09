import type { Edge, Node } from "@xyflow/react";
import type { MarkerKind, WorldMapData } from "@/lib/world-map/types";

export function buildFlowNodes(
  data: WorldMapData,
  filters: Record<MarkerKind, boolean>,
  selectedId: string | null,
): Node[] {
  const nodes: Node[] = [];

  for (const biome of data.biomes) {
    nodes.push({
      id: `biome-${biome.id}`,
      type: "biome",
      position: biome.position,
      data: biome as unknown as Record<string, unknown>,
      draggable: false,
      selectable: false,
      style: { width: biome.size.width, height: biome.size.height },
      zIndex: 0,
    });
  }

  for (const marker of data.markers) {
    if (!filters[marker.kind]) continue;

    nodes.push({
      id: marker.id,
      type: "marker",
      parentId: `biome-${marker.biomeId}`,
      position: marker.position,
      data: { ...marker, selected: marker.id === selectedId } as Record<string, unknown>,
      draggable: false,
      zIndex: 10,
    });
  }

  return nodes;
}

export function buildFlowEdges(data: WorldMapData): Edge[] {
  return data.paths.map((path) => ({
    id: path.id,
    source: `biome-${path.from}`,
    target: `biome-${path.to}`,
    type: "smoothstep",
    animated: true,
    style: { stroke: "rgba(85, 197, 122, 0.35)", strokeWidth: 2 },
    zIndex: 1,
  }));
}

export const DEFAULT_FILTERS: Record<MarkerKind, boolean> = {
  player: true,
  boss: true,
  dungeon: true,
  event: true,
};
