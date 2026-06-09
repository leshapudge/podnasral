"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { McItemSlot } from "@/components/landing/os/mc-item-slot";
import { useSecrets } from "./secret-context";

export function SecretToasts() {
  const { toasts, dismissToast } = useSecrets();

  return (
    <div className="fixed right-4 top-20 z-[110] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="glass-panel flex max-w-xs items-start gap-3 rounded-lg border border-primary/30 px-4 py-3 shadow-xl"
          >
            {toast.texture ? (
              <McItemSlot src={toast.texture} alt="" size="sm" enchanted />
            ) : toast.icon ? (
              <span className="text-2xl">{toast.icon}</span>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {toast.title}
              </p>
              {toast.body && <p className="text-sm font-medium">{toast.body}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
