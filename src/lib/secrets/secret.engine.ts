import { EXPLORER_PAGES } from "./definitions";
import type { GuestSecretState, SecretEventType } from "./types";

export type SecretEventHandler = (event: SecretEventType, payload?: Record<string, unknown>) => void;

const ONE_HOUR_MS = 60 * 60 * 1000;

export class SecretEngine {
  private handlers = new Set<SecretEventHandler>();

  subscribe(handler: SecretEventHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  emit(event: SecretEventType, payload?: Record<string, unknown>) {
    for (const handler of this.handlers) {
      handler(event, payload);
    }
  }

  /** Pure logic: which achievement slugs to unlock from state */
  evaluateUnlocks(state: GuestSecretState, pathname: string): string[] {
    const toUnlock: string[] = [];
    const has = (slug: string) => state.achievements.includes(slug);

    if (state.logoClicks >= 10 && !has("creeper-fan")) {
      toUnlock.push("creeper-fan");
    }

    const hour = new Date().getHours();
    if (hour === 3 && !has("night-owl")) {
      toUnlock.push("night-owl");
    }

    const visited = new Set([...state.visitedPages, pathname]);
    if (
      EXPLORER_PAGES.every((p) => visited.has(p)) &&
      !has("explorer")
    ) {
      toUnlock.push("explorer");
    }

    if (state.activeMs >= ONE_HOUR_MS && !has("afk")) {
      toUnlock.push("afk");
    }

    if (state.herobrineSeen && !has("herobrine-witness")) {
      toUnlock.push("herobrine-witness");
    }

    if (pathname === "/lost-chunk" && !has("chunk-explorer")) {
      toUnlock.push("chunk-explorer");
    }

    if (state.cornerHit && !has("corner-hit")) {
      toUnlock.push("corner-hit");
    }

    return toUnlock;
  }
}

export const secretEngine = new SecretEngine();
