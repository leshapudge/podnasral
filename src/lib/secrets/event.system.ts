/**
 * Legacy secret sound helpers — delegates to the global Audio Engine.
 */

import { audioManager } from "@/lib/audio/audio-manager";
import { emitAudioEvent } from "@/lib/audio/audio-events";

type NightSound = "cave" | "footsteps" | "enderman";

const NIGHT_SOUND_MAP: Record<NightSound, Parameters<typeof audioManager.playSound>[0]> = {
  cave: "ambient.night.cave",
  footsteps: "ambient.night.footsteps",
  enderman: "ambient.night.enderman",
};

export async function playPickupSound() {
  await audioManager.playSound("artifact.epic");
}

export async function playCreeperHiss() {
  await audioManager.playSound("easter.creeperHiss");
}

export async function playExplosionSound() {
  emitAudioEvent("easter:creeper");
}

export async function playNightSound(type: NightSound) {
  await audioManager.playSound(NIGHT_SOUND_MAP[type]);
}

export function shouldTriggerNightEvent(): NightSound | null {
  const hour = new Date().getHours();
  if (hour < 0 || hour >= 6) return null;
  if (Math.random() > 0.01) return null;
  const sounds: NightSound[] = ["cave", "footsteps", "enderman"];
  return sounds[Math.floor(Math.random() * sounds.length)];
}

export function shouldSpawnHerobrine(): boolean {
  return Math.random() < 0.001;
}
