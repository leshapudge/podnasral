"use client";

import { useAudioContext } from "@/components/audio/audio-provider";

export function useAudio() {
  return useAudioContext();
}
