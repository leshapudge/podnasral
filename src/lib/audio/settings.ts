import { DEFAULT_AUDIO_SETTINGS, type AudioSettings } from "./types";

const STORAGE_KEY = "mineseason-audio-v1";

export function loadAudioSettings(): AudioSettings {
  if (typeof window === "undefined") return DEFAULT_AUDIO_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AUDIO_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AudioSettings>;
    return {
      enabled: parsed.enabled ?? DEFAULT_AUDIO_SETTINGS.enabled,
      volume: clamp(parsed.volume ?? DEFAULT_AUDIO_SETTINGS.volume, 0, 100),
      ambienceEnabled: parsed.ambienceEnabled ?? DEFAULT_AUDIO_SETTINGS.ambienceEnabled,
      easterEggsEnabled: parsed.easterEggsEnabled ?? DEFAULT_AUDIO_SETTINGS.easterEggsEnabled,
    };
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

export function saveAudioSettings(settings: AudioSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
