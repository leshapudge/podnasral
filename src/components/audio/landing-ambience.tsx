"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAudioOptional } from "./audio-provider";
import { biomeToAmbientSound, resolveSeasonBiome } from "@/lib/audio";
import { seasonData } from "@/lib/landing/mock-data";

export function LandingAmbience() {
  const audio = useAudioOptional();
  const pathname = usePathname();

  useEffect(() => {
    if (!audio) return;

    if (pathname !== "/") {
      audio.stopAmbient("season-landing");
      return;
    }

    if (!audio.settings.enabled || !audio.settings.ambienceEnabled) {
      audio.stopAmbient("season-landing");
      return;
    }

    const biome = resolveSeasonBiome({
      slug: seasonData.slug,
      name: seasonData.name,
    });
    const soundId = biomeToAmbientSound(biome);
    void audio.playSeasonalAmbience(soundId, "season-landing");

    return () => audio.stopAmbient("season-landing");
  }, [pathname, audio, audio?.settings.enabled, audio?.settings.ambienceEnabled]);

  return null;
}
