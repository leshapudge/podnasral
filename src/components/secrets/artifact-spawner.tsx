"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { McItemSlot } from "@/components/landing/os/mc-item-slot";
import { getArtifactsForPage, getArtifactPosition } from "@/lib/secrets/artifact.engine";
import { getArtifactTexture } from "@/lib/secrets/artifact-assets";
import { useSecrets } from "./secret-context";

export function ArtifactSpawner() {
  const pathname = usePathname();
  const { state, collectArtifact } = useSecrets();
  const found = new Set(state.artifacts);
  const onPage = getArtifactsForPage(pathname, found);

  if (!onPage.length) return null;

  return (
    <>
      {onPage.map((artifact) => {
        const pos = getArtifactPosition(artifact.slug, pathname);
        return (
          <motion.button
            key={artifact.slug}
            type="button"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.85, scale: 1 }}
            whileHover={{ opacity: 1, scale: 1.15 }}
            className="fixed z-[90] cursor-pointer drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
            style={{ left: pos.left, top: pos.top }}
            title="?"
            onClick={() => void collectArtifact(artifact.slug)}
            aria-label="Hidden artifact"
          >
            <McItemSlot
              src={getArtifactTexture(artifact.slug)}
              alt={artifact.name}
              size="sm"
              enchanted
            />
          </motion.button>
        );
      })}
    </>
  );
}
