import { loadAudioSettings, saveAudioSettings } from "./settings";
import { SOUND_REGISTRY } from "./sound-registry";
import { createLoopingNoiseBuffer, playProceduralSound } from "./procedural-sounds";
import type { AudioSettings, SoundId } from "./types";

type AmbientHandle = {
  id: string;
  source: AudioBufferSourceNode | OscillatorNode;
  gain: GainNode;
  proceduralTimer?: ReturnType<typeof setInterval>;
};

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private settings: AudioSettings | null = null;

  private getSettingsState(): AudioSettings {
    if (!this.settings) this.settings = loadAudioSettings();
    return this.settings;
  }
  private bufferCache = new Map<string, AudioBuffer>();
  private loadingPromises = new Map<string, Promise<AudioBuffer | null>>();
  private failedPaths = new Set<string>();
  private ambients = new Map<string, AmbientHandle>();
  private muted = false;
  private settingsListeners = new Set<(s: AudioSettings) => void>();

  getSettings(): AudioSettings {
    return { ...this.getSettingsState() };
  }

  subscribeSettings(listener: (s: AudioSettings) => void) {
    this.settingsListeners.add(listener);
    return () => this.settingsListeners.delete(listener);
  }

  private notifySettings() {
    for (const l of this.settingsListeners) l(this.getSettings());
  }

  updateSettings(patch: Partial<AudioSettings>) {
    const current = this.getSettingsState();
    this.settings = {
      ...current,
      ...patch,
      volume: patch.volume !== undefined ? Math.min(100, Math.max(0, patch.volume)) : current.volume,
    };
    saveAudioSettings(this.settings);
    this.applyMasterVolume();
    this.notifySettings();

    const settings = this.getSettingsState();
    if (!settings.enabled || !settings.ambienceEnabled) {
      this.stopAmbient();
    }
  }

  private applyMasterVolume() {
    if (!this.masterGain || !this.ctx) return;
    const settings = this.getSettingsState();
    const v = this.muted || !settings.enabled ? 0 : settings.volume / 100;
    this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  async ensureContext() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.applyMasterVolume();
    }
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
    return this.ctx;
  }

  private shouldPlayCategory(category: string) {
    const settings = this.getSettingsState();
    if (!settings.enabled || this.muted) return false;
    if (category === "ambient" && !settings.ambienceEnabled) return false;
    if (category === "eastereggs" && !settings.easterEggsEnabled) return false;
    return true;
  }

  private async loadBuffer(path: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(path)) return this.bufferCache.get(path)!;
    if (this.failedPaths.has(path)) return null;
    if (this.loadingPromises.has(path)) return this.loadingPromises.get(path)!;

    const promise = (async () => {
      try {
        const res = await fetch(path, { cache: "force-cache" });
        if (!res.ok) {
          this.failedPaths.add(path);
          return null;
        }
        const ctx = await this.ensureContext();
        if (!ctx) return null;
        const data = await res.arrayBuffer();
        const buffer = await ctx.decodeAudioData(data.slice(0));
        this.bufferCache.set(path, buffer);
        return buffer;
      } catch {
        this.failedPaths.add(path);
        return null;
      } finally {
        this.loadingPromises.delete(path);
      }
    })();

    this.loadingPromises.set(path, promise);
    return promise;
  }

  private playBuffer(
    buffer: AudioBuffer,
    volume: number,
    loop = false,
  ): AudioBufferSourceNode | null {
    if (!this.ctx || !this.masterGain) return null;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(this.masterGain);
    source.start();
    return source;
  }

  async playSound(soundId: SoundId, options?: { volume?: number }) {
    const def = SOUND_REGISTRY[soundId];
    if (!def || !this.shouldPlayCategory(def.category)) return;

    const ctx = await this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const vol = (options?.volume ?? def.volume) * (this.getSettingsState().volume / 100);

    const buffer = await this.loadBuffer(def.path);
    if (buffer) {
      this.playBuffer(buffer, vol, false);
      return;
    }

    playProceduralSound(def.fallback, ctx, this.masterGain, vol);
  }

  stopSound(_soundId?: SoundId) {
    /* One-shots are fire-and-forget; ambient uses stopAmbient */
  }

  async playAmbient(soundId: SoundId, key?: string) {
    const ambientKey = key ?? soundId;
    const def = SOUND_REGISTRY[soundId];
    if (!def || def.category !== "ambient") return;
    if (!this.shouldPlayCategory("ambient")) return;

    this.stopAmbient(ambientKey);

    const ctx = await this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const vol = def.volume * (this.getSettingsState().volume / 100);
    const buffer = await this.loadBuffer(def.path);

    if (buffer && def.loop) {
      const source = this.playBuffer(buffer, vol, true);
      if (!source) return;
      const gain = ctx.createGain();
      gain.gain.value = vol;
      const handle: AmbientHandle = { id: ambientKey, source, gain };
      this.ambients.set(ambientKey, handle);
      return;
    }

    if (buffer) {
      const source = this.playBuffer(buffer, vol, false);
      if (source) {
        this.ambients.set(ambientKey, {
          id: ambientKey,
          source,
          gain: ctx.createGain(),
        });
      }
      return;
    }

    // Procedural loop: re-trigger soft ambient every N seconds
    const playOnce = () => playProceduralSound(def.fallback, ctx, this.masterGain!, vol);
    playOnce();
    const proceduralTimer = setInterval(playOnce, def.loop ? 8000 : 12000);
    const osc = ctx.createOscillator();
    osc.frequency.value = 0;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    this.ambients.set(ambientKey, { id: ambientKey, source: osc, gain, proceduralTimer });
  }

  stopAmbient(key?: string) {
    const keys = key ? [key] : [...this.ambients.keys()];
    for (const k of keys) {
      const handle = this.ambients.get(k);
      if (!handle) continue;
      try {
        handle.source.stop();
      } catch {
        /* already stopped */
      }
      if (handle.proceduralTimer) clearInterval(handle.proceduralTimer);
      this.ambients.delete(k);
    }
  }

  setVolume(volume: number) {
    this.updateSettings({ volume });
  }

  mute() {
    this.muted = true;
    this.applyMasterVolume();
  }

  unmute() {
    this.muted = false;
    this.applyMasterVolume();
  }

  isMuted() {
    return this.muted;
  }

  /** Warm up audio context on first user gesture */
  async unlock() {
    await this.ensureContext();
  }

  /** Seasonal landing loop using soft noise bed */
  async playSeasonalLoop(soundId: SoundId, key?: string) {
    const loopKey = key ?? "season-landing";
    if (!this.shouldPlayCategory("ambient")) return;
    this.stopAmbient(loopKey);

    const def = SOUND_REGISTRY[soundId];
    if (!def) return;

    const ctx = await this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const vol = def.volume * 0.35 * (this.getSettingsState().volume / 100);
    const fileBuffer = await this.loadBuffer(def.path);

    if (fileBuffer) {
      const source = this.playBuffer(fileBuffer, vol, true);
      if (source) {
        this.ambients.set(loopKey, { id: loopKey, source, gain: ctx.createGain() });
      }
      return;
    }

    const noise = createLoopingNoiseBuffer(ctx, 6);
    const source = ctx.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value =
      soundId.includes("nether") ? 400 : soundId.includes("end") ? 800 : soundId.includes("snow") ? 1200 : 600;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();

    const proceduralTimer = setInterval(() => {
      playProceduralSound(def.fallback, ctx, this.masterGain!, vol * 0.5);
    }, 12000);

    this.ambients.set(loopKey, { id: loopKey, source, gain, proceduralTimer });
  }
}

export const audioManager = new AudioManager();
