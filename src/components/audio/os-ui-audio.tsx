"use client";

import { useEffect } from "react";
import { useAudioOptional } from "./audio-provider";

const CLICK_SELECTOR = [
  "button:not([disabled])",
  '[role="button"]:not([disabled])',
  '[role="tab"]:not([disabled])',
  '[role="menuitem"]',
  "a.mc-os-btn",
  ".mc-os-tab-btn",
  ".mc-os-profile-btn",
  ".mc-os-grass-block-btn",
  ".mc-os-start-menu-item",
  ".mc-os-window-btn",
].join(", ");

function isSilentTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return true;
  return Boolean(target.closest("[data-silent]"));
}

function resolveClickTarget(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null;
  if (target.closest("input, textarea, select, label")) return null;
  return target.closest(CLICK_SELECTOR);
}

/**
 * Глобальные звуки UI для всех кнопок OS (mc-os-btn, табы, меню и т.д.)
 */
export function OsUiAudio() {
  const audio = useAudioOptional();

  useEffect(() => {
    if (!audio) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (isSilentTarget(e.target)) return;
      const el = resolveClickTarget(e.target);
      if (!el) return;
      void audio.unlock().then(() => audio.emit("ui:click"));
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [audio]);

  return null;
}
