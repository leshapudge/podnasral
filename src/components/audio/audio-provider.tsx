"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  audioManager,
  emitAudioEvent,
  registerDefaultAudioHandlers,
  type AudioSettings,
  type SoundId,
} from "@/lib/audio";
import type { AudioEventName } from "@/lib/audio/types";

interface AudioContextValue {
  settings: AudioSettings;
  updateSettings: (patch: Partial<AudioSettings>) => void;
  playSound: (id: SoundId, options?: { volume?: number }) => Promise<void>;
  stopSound: (id?: SoundId) => void;
  playAmbient: (id: SoundId, key?: string) => Promise<void>;
  playSeasonalAmbience: (id: SoundId, key?: string) => Promise<void>;
  stopAmbient: (key?: string) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
  isMuted: boolean;
  emit: (event: AudioEventName, payload?: Record<string, unknown>) => void;
  unlock: () => Promise<void>;
}

const AudioCtx = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AudioSettings>(() => audioManager.getSettings());
  const [isMuted, setIsMuted] = useState(() => audioManager.isMuted());

  useEffect(() => {
    const unregister = registerDefaultAudioHandlers();
    const unsub = audioManager.subscribeSettings(setSettings);
    return () => {
      unregister();
      unsub();
    };
  }, []);

  useEffect(() => {
    const unlock = () => {
      void audioManager.unlock();
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<AudioSettings>) => {
    audioManager.updateSettings(patch);
    setIsMuted(audioManager.isMuted());
  }, []);

  const value = useMemo<AudioContextValue>(
    () => ({
      settings,
      updateSettings,
      playSound: (id, options) => audioManager.playSound(id, options),
      stopSound: (id) => audioManager.stopSound(id),
      playAmbient: (id, key) => audioManager.playAmbient(id, key),
      playSeasonalAmbience: (id, key) => audioManager.playSeasonalLoop(id, key),
      stopAmbient: (key) => audioManager.stopAmbient(key),
      setVolume: (v) => audioManager.setVolume(v),
      mute: () => {
        audioManager.mute();
        setIsMuted(true);
      },
      unmute: () => {
        audioManager.unmute();
        setIsMuted(false);
      },
      isMuted,
      emit: emitAudioEvent,
      unlock: () => audioManager.unlock(),
    }),
    [settings, updateSettings, isMuted],
  );

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}

export function useAudioContext() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudioContext must be used within AudioProvider");
  return ctx;
}

export function useAudioOptional() {
  return useContext(AudioCtx);
}
