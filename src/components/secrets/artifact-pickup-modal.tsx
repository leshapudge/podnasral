"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { McItemSlot } from "@/components/landing/os/mc-item-slot";
import { useAudioOptional } from "@/components/audio/audio-provider";
import { getArtifactTexture } from "@/lib/secrets/artifact-assets";
import { useSecrets } from "./secret-context";

export function ArtifactPickupModal() {
  const { pendingArtifact, setPendingArtifact } = useSecrets();
  const audio = useAudioOptional();

  useEffect(() => {
    if (!pendingArtifact) return;
    audio?.emit("artifact:found", { rarity: "EPIC" });
    const t = setTimeout(() => setPendingArtifact(null), 4500);
    return () => clearTimeout(t);
  }, [pendingArtifact, audio, setPendingArtifact]);

  return (
    <AnimatePresence>
      {pendingArtifact && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed bottom-8 left-1/2 z-[120] -translate-x-1/2"
        >
          <div
            role="status"
            aria-live="polite"
            className="glass-panel flex items-center gap-4 rounded-xl border border-hypixel-gold/40 px-6 py-4 shadow-2xl"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ repeat: 2, duration: 0.3 }}
            >
              <McItemSlot
                src={getArtifactTexture(pendingArtifact.slug)}
                alt={pendingArtifact.name}
                size="md"
                enchanted
              />
            </motion.div>
            <div className="text-left">
              <p className="text-xs uppercase tracking-widest text-hypixel-gold">
                Артефакт найден!
              </p>
              <p className="font-display font-bold">{pendingArtifact.name}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
