"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type NodeTypes,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { BiomeNode } from "./nodes/biome-node";
import { MarkerNode } from "./nodes/marker-node";
import { MapLegend } from "./map-legend";
import { MarkerDetail } from "./marker-detail";
import { buildFlowEdges, buildFlowNodes, DEFAULT_FILTERS } from "./flow-utils";
import type { MapMarker, MarkerKind, WorldMapData } from "@/lib/world-map/types";

const nodeTypes: NodeTypes = {
  biome: BiomeNode,
  marker: MarkerNode,
};

interface WorldMapCanvasProps {
  data: WorldMapData;
}

export function WorldMapCanvas({ data }: WorldMapCanvasProps) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedMarker = useMemo(
    () => data.markers.find((m) => m.id === selectedId) ?? null,
    [data.markers, selectedId],
  );

  const counts = useMemo(
    () => ({
      player: data.markers.filter((m) => m.kind === "player").length,
      boss: data.markers.filter((m) => m.kind === "boss").length,
      dungeon: data.markers.filter((m) => m.kind === "dungeon").length,
      event: data.markers.filter((m) => m.kind === "event").length,
    }),
    [data.markers],
  );

  const nodes = useMemo(
    () => buildFlowNodes(data, filters, selectedId),
    [data, filters, selectedId],
  );

  const edges = useMemo(() => buildFlowEdges(data), [data]);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    if (node.type === "marker") {
      setSelectedId(node.id);
    }
  }, []);

  const toggleFilter = useCallback((kind: MarkerKind) => {
    setFilters((prev) => ({ ...prev, [kind]: !prev[kind] }));
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="relative h-[min(72vh,720px)] overflow-hidden rounded-2xl border border-white/10 bg-[#050810] shadow-2xl">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.35}
          maxZoom={1.5}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          proOptions={{ hideAttribution: true }}
          className="world-map-flow"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="rgba(85, 197, 122, 0.12)"
          />
          <Controls
            showInteractive={false}
            className="!rounded-lg !border-white/10 !bg-card/90 !shadow-lg [&>button]:!border-white/10 [&>button]:!bg-secondary [&>button]:!text-foreground [&>button:hover]:!bg-primary/20"
          />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === "biome") return "#55c57a44";
              const kind = (node.data as unknown as MapMarker).kind;
              if (kind === "boss") return "#ff6b35";
              if (kind === "player") return "#55c57a";
              if (kind === "dungeon") return "#ffaa00";
              return "#4eeaff";
            }}
            maskColor="rgba(7, 11, 18, 0.85)"
            className="!rounded-lg !border !border-white/10 !bg-card/80"
          />
        </ReactFlow>

        <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-white/10 bg-card/80 px-3 py-2 backdrop-blur-md">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {data.season?.name ?? "Карта мира"}
          </p>
          <p className="font-display text-sm font-bold text-primary">
            {data.stats.players + data.stats.bosses + data.stats.dungeons + data.stats.events} объектов
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <MapLegend filters={filters} counts={counts} onToggle={toggleFilter} />
        <MarkerDetail marker={selectedMarker} onClose={() => setSelectedId(null)} />
      </div>
    </div>
  );
}
