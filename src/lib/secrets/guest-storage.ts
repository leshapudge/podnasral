import type { GuestSecretState } from "./types";

import { EVENT_BRAND_LOWER } from "@/lib/event/event-brand";

const STORAGE_KEY = `${EVENT_BRAND_LOWER}-secrets-v1`;

export const DEFAULT_GUEST_STATE: GuestSecretState = {
  achievements: [],
  artifacts: [],
  visitedPages: [],
  logoClicks: 0,
  activeMs: 0,
  lastActiveAt: Date.now(),
  cornerHit: false,
  commandsRun: [],
};

export function loadGuestState(): GuestSecretState {
  if (typeof window === "undefined") return { ...DEFAULT_GUEST_STATE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_GUEST_STATE };
    return { ...DEFAULT_GUEST_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_GUEST_STATE };
  }
}

export function saveGuestState(state: GuestSecretState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function patchGuestState(patch: Partial<GuestSecretState>): GuestSecretState {
  const next = { ...loadGuestState(), ...patch };
  saveGuestState(next);
  return next;
}
