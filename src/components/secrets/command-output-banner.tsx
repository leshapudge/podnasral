"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSecrets } from "./secret-context";

export function CommandOutputBanner() {
  const { commandOutput, setCommandOutput } = useSecrets();

  return (
    <AnimatePresence>
      {commandOutput && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed left-1/2 top-24 z-[105] max-w-md -translate-x-1/2"
        >
          <button
            type="button"
            onClick={() => setCommandOutput(null)}
            className="glass-panel whitespace-pre-wrap rounded-lg border border-primary/30 px-4 py-3 text-left font-mono text-sm shadow-xl"
          >
            {commandOutput}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
