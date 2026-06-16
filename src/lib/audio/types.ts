export type SoundCategory =
  | "ui"
  | "resources"
  | "artifacts"
  | "achievements"
  | "bosses"
  | "ambient"
  | "eastereggs";

export type SeasonBiome = "forest" | "desert" | "snow" | "nether" | "end";

export type ResourceSoundType =
  | "wood"
  | "stone"
  | "iron"
  | "gold"
  | "diamond"
  | "emerald";

export type ProceduralSoundId =
  | "uiClickLight"
  | "uiClickConfirm"
  | "pageOpen"
  | "resourceWood"
  | "resourceStone"
  | "resourceIron"
  | "resourceGold"
  | "resourceDiamond"
  | "resourceEmerald"
  | "levelUp"
  | "achievementUnlock"
  | "artifactEpic"
  | "craftBench"
  | "chestOpen"
  | "bossVictory"
  | "legendaryDrop"
  | "creeperExplosion"
  | "creeperHiss"
  | "endermanTeleport"
  | "secretPageAncient"
  | "ambientWind"
  | "ambientCave"
  | "ambientFootsteps"
  | "ambientTorch"
  | "ambientWater"
  | "ambientWoodCreak"
  | "ambientNightCave"
  | "ambientNightFootsteps"
  | "ambientNightEnderman"
  | "ambientForest"
  | "ambientDesert"
  | "ambientSnow"
  | "ambientNether"
  | "ambientEnd"
  | "slotTick"
  | "slotReelStop"
  | "slotLand"
  | "slotWin";

export type SoundId =
  | "ui.hover"
  | "ui.click"
  | "ui.pageOpen"
  | "resource.wood"
  | "resource.stone"
  | "resource.iron"
  | "resource.gold"
  | "resource.diamond"
  | "resource.emerald"
  | "player.levelUp"
  | "achievement.unlock"
  | "achievement.secretUnlock"
  | "artifact.epic"
  | "craft.bench"
  | "chest.open"
  | "boss.victory"
  | "boss.attack"
  | "drop.legendary"
  | "easter.creeperExplosion"
  | "easter.creeperHiss"
  | "easter.enderman"
  | "easter.secretPage"
  | "ambient.wind"
  | "ambient.cave"
  | "ambient.footsteps"
  | "ambient.torch"
  | "ambient.water"
  | "ambient.woodCreak"
  | "ambient.night.cave"
  | "ambient.night.footsteps"
  | "ambient.night.enderman"
  | "ambient.season.forest"
  | "ambient.season.desert"
  | "ambient.season.snow"
  | "ambient.season.nether"
  | "ambient.season.end"
  | "arcade.slotTick"
  | "arcade.slotStop"
  | "arcade.slotLand"
  | "arcade.slotRotten"
  | "arcade.slotWin";

export interface SoundDefinition {
  id: SoundId;
  path: string;
  category: SoundCategory;
  volume: number;
  fallback: ProceduralSoundId;
  loop?: boolean;
}

export interface AudioSettings {
  enabled: boolean;
  volume: number;
  ambienceEnabled: boolean;
  easterEggsEnabled: boolean;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  enabled: true,
  volume: 70,
  ambienceEnabled: false,
  easterEggsEnabled: true,
};

export type AudioEventName =
  | "ui:hover"
  | "ui:click"
  | "page:open"
  | "resource:collect"
  | "player:levelUp"
  | "achievement:unlock"
  | "achievement:secretUnlock"
  | "artifact:found"
  | "craft:complete"
  | "chest:open"
  | "boss:victory"
  | "boss:attack"
  | "drop:legendary"
  | "easter:creeper"
  | "easter:enderman"
  | "easter:secretPage"
  | "arcade:slotTick"
  | "arcade:slotReelStop"
  | "arcade:slotWin";

export interface AudioEventPayload {
  "resource:collect": { type?: ResourceSoundType; templateId?: string; rarity?: string };
  "page:open": { pathname: string };
  "achievement:unlock": { secret?: boolean };
  "artifact:found": { rarity?: string };
  "drop:legendary": Record<string, never>;
}
