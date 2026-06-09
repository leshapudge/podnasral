import type { AudioEventName } from "./types";

type Handler = (payload?: Record<string, unknown>) => void;

class AudioEventBus {
  private handlers = new Map<AudioEventName, Set<Handler>>();

  on(event: AudioEventName, handler: Handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  emit(event: AudioEventName, payload?: Record<string, unknown>) {
    this.handlers.get(event)?.forEach((h) => h(payload));
  }
}

export const audioEventBus = new AudioEventBus();

/** Lightweight emit — safe to import from UI components */
export function emitAudioEvent(event: AudioEventName, payload?: Record<string, unknown>) {
  audioEventBus.emit(event, payload);
}
