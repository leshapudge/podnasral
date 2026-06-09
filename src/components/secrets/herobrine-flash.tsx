"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudioOptional } from "@/components/audio/audio-provider";
import { useSecrets } from "./secret-context";
import { shouldSpawnHerobrine } from "@/lib/secrets/event.system";

export function HerobrineFlash() {
  const { showHerobrine, setShowHerobrine, recordHerobrineSeen } = useSecrets();
  const audio = useAudioOptional();

  useEffect(() => {
    const trySpawn = () => {
      if (shouldSpawnHerobrine()) {
        setShowHerobrine(true);
        audio?.emit("easter:herobrine");
        setTimeout(() => {
          setShowHerobrine(false);
          recordHerobrineSeen();
        }, 500);
      }
    };

    trySpawn();
    const id = setInterval(trySpawn, 30_000);
    return () => clearInterval(id);
  }, [setShowHerobrine, recordHerobrineSeen, audio]);

  return (
    <AnimatePresence>
      {showHerobrine && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.05 }}
          className="pointer-events-none fixed inset-0 z-[150] flex items-center justify-center bg-black/60"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-center"
          >
            <div className="text-9xl drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]">👤</div>
            <p className="mt-4 font-display text-xl tracking-widest text-white/90">
              HEROBRINE
            </p>
            <p className="text-xs text-white/50">white eyes in the darkness</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
