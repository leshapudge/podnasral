"use client";

import { cn } from "@/lib/utils";

interface OsWindowControlsProps {
  onClose?: () => void;
  className?: string;
}

export function OsWindowControls({ onClose, className }: OsWindowControlsProps) {
  return (
    <div className={cn("flex shrink-0 gap-1", className)}>
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className="mc-os-window-btn h-2.5 w-2.5 rounded-sm transition-transform hover:scale-110 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
        style={{ background: "rgba(255,85,85,0.85)" }}
      />
      <span
        aria-hidden
        className="h-2.5 w-2.5 rounded-sm"
        style={{ background: "rgba(255,170,0,0.85)" }}
      />
      <span
        aria-hidden
        className="h-2.5 w-2.5 rounded-sm"
        style={{ background: "rgba(85,197,122,0.85)" }}
      />
    </div>
  );
}
