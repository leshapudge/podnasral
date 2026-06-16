import { audioManager } from "./audio-manager";
import { audioEventBus } from "./event-bus";
import { resourceSoundId, resolveResourceSound } from "./resource-map";
import type { AudioEventName, SoundId } from "./types";

export { audioEventBus, emitAudioEvent } from "./event-bus";

const EVENT_SOUND_MAP: Partial<Record<AudioEventName, SoundId | ((p?: Record<string, unknown>) => SoundId)>> = {
  "ui:hover": "ui.hover",
  "ui:click": "ui.click",
  "page:open": "ui.pageOpen",
  "player:levelUp": "player.levelUp",
  "achievement:unlock": (p) => (p?.secret ? "achievement.secretUnlock" : "achievement.unlock"),
  "achievement:secretUnlock": "achievement.secretUnlock",
  "artifact:found": "artifact.epic",
  "craft:complete": "craft.bench",
  "chest:open": "chest.open",
  "boss:victory": "boss.victory",
  "boss:attack": "boss.attack",
  "drop:legendary": "drop.legendary",
  "easter:creeper": "easter.creeperExplosion",
  "easter:enderman": "easter.enderman",
  "easter:secretPage": "easter.secretPage",
  "arcade:slotTick": "arcade.slotTick",
  "arcade:slotReelStop": "arcade.slotStop",
  "arcade:slotWin": "arcade.slotWin",
};

export function registerDefaultAudioHandlers() {
  const off: (() => void)[] = [];

  for (const [event, mapping] of Object.entries(EVENT_SOUND_MAP) as [
    AudioEventName,
    SoundId | ((p?: Record<string, unknown>) => SoundId),
  ][]) {
    off.push(
      audioEventBus.on(event, (payload) => {
        const soundId = typeof mapping === "function" ? mapping(payload) : mapping;
        void audioManager.playSound(soundId);
      }),
    );
  }

  off.push(
    audioEventBus.on("resource:collect", (payload) => {
      const type = resolveResourceSound({
        type: payload?.type as never,
        templateId: payload?.templateId as string,
        name: payload?.name as string,
        rarity: payload?.rarity as string,
      });
      void audioManager.playSound(resourceSoundId(type));
      if (payload?.rarity === "LEGENDARY") {
        void audioManager.playSound("drop.legendary");
      }
    }),
  );

  return () => off.forEach((fn) => fn());
}

