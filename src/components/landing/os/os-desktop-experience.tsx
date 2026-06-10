"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { EVENT_BRAND } from "@/lib/event/event-brand";
import { OsBootGrassBlock } from "./os-boot-grass-block";
import { OsDesktopTaskbar } from "./os-desktop-taskbar";
import { cn } from "@/lib/utils";

interface OsDesktopExperienceProps {
  ready: boolean;
  isAuthenticated?: boolean;
  children: (props: { onWindowClose: () => void }) => React.ReactNode;
}

function OsDesktopExperienceInner({
  ready,
  isAuthenticated = false,
  children,
}: OsDesktopExperienceProps) {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const wantsOpen = Boolean(tabFromUrl && tabFromUrl !== "overview");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (ready && wantsOpen) setOpen(true);
  }, [ready, wantsOpen]);

  const handleOpen = useCallback(() => {
    if (!ready) return;
    setOpen(true);
  }, [ready]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const showDesktop = !open || !ready;
  const showWindow = open && ready;

  return (
    <div className="mc-os-desktop">
      <div className="mc-os-desktop-grid" aria-hidden />

      <AnimatePresence mode="wait">
        {showDesktop && (
          <motion.div
            key="desktop"
            className="mc-os-desktop-ui"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="mc-os-desktop-center">
              <button
                type="button"
                disabled={!ready}
                onClick={handleOpen}
                className={cn(
                  "mc-os-grass-block-btn",
                  ready ? "cursor-pointer" : "cursor-wait",
                )}
                aria-label={ready ? `Открыть ${EVENT_BRAND}` : "Загрузка"}
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <OsBootGrassBlock size={140} />
                </motion.div>
              </button>
              <p className={cn("mc-os-boot-hint", ready && "mc-os-boot-hint--pulse")}>
                {ready ? "Нажмите чтобы продолжить" : `Загрузка ${EVENT_BRAND}...`}
              </p>
              {ready && (
                <p className="text-center text-xs text-[#2d5a27]/90">
                  Ивент начнётся 25 июня 2026
                </p>
              )}
            </div>

            <OsDesktopTaskbar
              ready={ready}
              isAuthenticated={isAuthenticated}
              onOpenApp={handleOpen}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWindow && (
          <motion.div
            key="window"
            className="mc-os-desktop-window"
            initial={{ opacity: 0, scale: 0.2, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.18, y: 48 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            {children({ onWindowClose: handleClose })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DesktopBootFallback() {
  return (
    <div className="mc-os-desktop">
      <div className="mc-os-desktop-grid" aria-hidden />
      <div className="mc-os-desktop-ui">
        <div className="mc-os-desktop-center">
          <OsBootGrassBlock size={140} />
          <p className="mc-os-boot-hint">Загрузка {EVENT_BRAND}...</p>
        </div>
        <OsDesktopTaskbar ready={false} onOpenApp={() => {}} />
      </div>
    </div>
  );
}

export function OsDesktopExperience(props: OsDesktopExperienceProps) {
  return (
    <Suspense fallback={<DesktopBootFallback />}>
      <OsDesktopExperienceInner {...props} />
    </Suspense>
  );
}
