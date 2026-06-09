"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAudioOptional } from "./audio-provider";
import { NIGHT_AMBIENT_SOUNDS, RANDOM_AMBIENT_SOUNDS } from "@/lib/audio";
import { SECRET_PAGES } from "@/lib/secrets/definitions";
import { OsUiAudio } from "./os-ui-audio";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function AudioEffects() {
  const audio = useAudioOptional();
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);

  // Page open sound + secret page atmosphere
  useEffect(() => {
    if (!audio || !pathname) return;
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;

    audio.emit("page:open", { pathname });

    if (SECRET_PAGES.includes(pathname as (typeof SECRET_PAGES)[number])) {
      if (audio.settings.easterEggsEnabled) {
        audio.emit("easter:secretPage");
      }
    }
  }, [pathname, audio]);

  // Random ambient events every 5–20 minutes (low chance)
  useEffect(() => {
    if (!audio) return;

    let timeout: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const delay = (5 + Math.random() * 15) * 60 * 1000;
      timeout = setTimeout(() => {
        if (audio.settings.enabled && audio.settings.ambienceEnabled && Math.random() < 0.12) {
          const sound = pickRandom(RANDOM_AMBIENT_SOUNDS);
          void audio.playSound(sound);
        }
        schedule();
      }, delay);
    };

    schedule();
    return () => clearTimeout(timeout);
  }, [audio, audio?.settings.ambienceEnabled, audio?.settings.enabled]);

  // Night mode atmosphere after midnight
  useEffect(() => {
    if (!audio) return;

    const tick = () => {
      const hour = new Date().getHours();
      if (hour < 0 || hour >= 6) return;
      if (!audio.settings.enabled || !audio.settings.ambienceEnabled) return;
      if (Math.random() > 0.008) return;

      const sound = pickRandom(NIGHT_AMBIENT_SOUNDS);
      void audio.playSound(sound);
    };

    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [audio, audio?.settings.ambienceEnabled, audio?.settings.enabled]);

  // Rare enderman easter egg (global, not only night)
  useEffect(() => {
    if (!audio) return;

    const tick = () => {
      if (!audio.settings.enabled || !audio.settings.easterEggsEnabled) return;
      if (Math.random() > 0.006) return;
      audio.emit("easter:enderman");
    };

    const id = setInterval(tick, 90_000);
    return () => clearInterval(id);
  }, [audio, audio?.settings.easterEggsEnabled, audio?.settings.enabled]);

  return <OsUiAudio />;
}
