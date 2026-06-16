import type { ProceduralSoundId } from "./types";

type PlayCtx = {
  ctx: AudioContext;
  destination: AudioNode;
  volume: number;
};

function tone(
  { ctx, destination, volume }: PlayCtx,
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  attack = 0.01,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(destination);
  osc.start();
  osc.stop(ctx.currentTime + duration + 0.05);
}

function noiseBurst({ ctx, destination, volume }: PlayCtx, duration: number, decay = 1) {
  const len = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay;
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  src.connect(gain);
  gain.connect(destination);
  src.start();
}

function arpeggio(
  { ctx, destination, volume }: PlayCtx,
  freqs: number[],
  step = 0.07,
  type: OscillatorType = "square",
) {
  freqs.forEach((f, i) => {
    const t = ctx.currentTime + i * step;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = f;
    gain.gain.setValueAtTime(volume * 0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + step * 1.2);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(t);
    osc.stop(t + step * 1.5);
  });
}

const generators: Record<ProceduralSoundId, (p: PlayCtx) => void> = {
  uiClickLight: (p) => tone(p, 1200, 0.06, "sine", 0.005),
  uiClickConfirm: (p) => {
    tone(p, 520, 0.08, "triangle");
    tone({ ...p, volume: p.volume * 0.7 }, 780, 0.1, "triangle");
  },
  pageOpen: (p) => tone(p, 440, 0.15, "sine", 0.02),
  resourceWood: (p) => {
    tone(p, 180, 0.12, "triangle");
    tone({ ...p, volume: p.volume * 0.5 }, 120, 0.1, "sawtooth");
  },
  resourceStone: (p) => {
    noiseBurst(p, 0.08, 2);
    tone(p, 220, 0.06, "square");
  },
  resourceIron: (p) => arpeggio(p, [600, 800], 0.05, "triangle"),
  resourceGold: (p) => arpeggio(p, [880, 1100, 1320], 0.06, "sine"),
  resourceDiamond: (p) => arpeggio(p, [1046, 1318, 1568], 0.05, "sine"),
  resourceEmerald: (p) => arpeggio(p, [659, 784, 988, 1174], 0.05, "triangle"),
  levelUp: (p) => arpeggio(p, [523, 659, 784, 1046], 0.09, "square"),
  achievementUnlock: (p) => {
    arpeggio(p, [392, 523, 659, 784, 1046], 0.1, "square");
    setTimeout(() => arpeggio(p, [523, 659, 784], 0.08, "sine"), 120);
  },
  artifactEpic: (p) => {
    arpeggio(p, [220, 277, 330, 440, 554], 0.12, "sine");
    tone({ ...p, volume: p.volume * 0.4 }, 110, 0.4, "sawtooth");
  },
  craftBench: (p) => {
    for (let i = 0; i < 3; i++) {
      tone({ ...p, volume: p.volume * 0.5 }, 300 + i * 40, 0.05, "square");
    }
    noiseBurst({ ...p, volume: p.volume * 0.3 }, 0.06);
  },
  chestOpen: (p) => {
    tone(p, 150, 0.2, "sawtooth", 0.02);
    noiseBurst({ ...p, volume: p.volume * 0.4 }, 0.15);
  },
  bossVictory: (p) => {
    arpeggio(p, [392, 494, 587, 784, 988, 1174], 0.14, "square");
    setTimeout(() => arpeggio(p, [523, 659, 784, 1046], 0.1, "sine"), 200);
  },
  legendaryDrop: (p) => {
    arpeggio(p, [330, 415, 494, 622, 740, 880], 0.11, "sine");
    tone({ ...p, volume: p.volume * 0.5 }, 55, 0.5, "triangle");
  },
  creeperHiss: (p) => {
    const osc = p.ctx.createOscillator();
    const gain = p.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, p.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, p.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(p.volume * 0.8, p.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, p.ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(p.destination);
    osc.start();
    osc.stop(p.ctx.currentTime + 0.5);
  },
  creeperExplosion: (p) => noiseBurst(p, 0.45, 1.2),
  endermanTeleport: (p) => {
    noiseBurst(p, 0.2, 3);
    tone(p, 180, 0.15, "square");
    tone({ ...p, volume: p.volume * 0.6 }, 90, 0.2, "triangle");
  },
  secretPageAncient: (p) => {
    tone({ ...p, volume: p.volume * 0.4 }, 55, 0.8, "triangle", 0.1);
    arpeggio({ ...p, volume: p.volume * 0.35 }, [110, 98, 87, 73], 0.2, "sine");
  },
  ambientWind: (p) => noiseBurst({ ...p, volume: p.volume * 0.15 }, 1.5, 0.5),
  ambientCave: (p) => tone({ ...p, volume: p.volume * 0.12 }, 55, 1.2, "triangle", 0.2),
  ambientFootsteps: (p) => {
    for (let i = 0; i < 4; i++) {
      tone({ ...p, volume: p.volume * 0.2 }, 80 + Math.random() * 40, 0.08, "square");
    }
  },
  ambientTorch: (p) => noiseBurst({ ...p, volume: p.volume * 0.08 }, 0.6, 0.3),
  ambientWater: (p) => {
    for (let i = 0; i < 3; i++) {
      tone({ ...p, volume: p.volume * 0.1 }, 400 + i * 30, 0.15, "sine");
    }
  },
  ambientWoodCreak: (p) => {
    tone({ ...p, volume: p.volume * 0.15 }, 90, 0.3, "sawtooth", 0.05);
    tone({ ...p, volume: p.volume * 0.1 }, 70, 0.25, "triangle");
  },
  ambientNightCave: (p) => tone({ ...p, volume: p.volume * 0.08 }, 48, 1.4, "triangle", 0.3),
  ambientNightFootsteps: (p) => generators.ambientFootsteps({ ...p, volume: p.volume * 0.7 }),
  ambientNightEnderman: (p) => generators.endermanTeleport({ ...p, volume: p.volume * 0.5 }),
  ambientForest: (p) => {
    noiseBurst({ ...p, volume: p.volume * 0.06 }, 2, 0.4);
    tone({ ...p, volume: p.volume * 0.04 }, 180, 2, "sine", 0.5);
  },
  ambientDesert: (p) => {
    noiseBurst({ ...p, volume: p.volume * 0.1 }, 1.8, 0.6);
    tone({ ...p, volume: p.volume * 0.05 }, 120, 1.5, "triangle", 0.3);
  },
  ambientSnow: (p) => {
    noiseBurst({ ...p, volume: p.volume * 0.07 }, 2.2, 0.8);
    tone({ ...p, volume: p.volume * 0.03 }, 600, 1.8, "sine", 0.4);
  },
  ambientNether: (p) => {
    tone({ ...p, volume: p.volume * 0.08 }, 45, 2, "sawtooth", 0.2);
    noiseBurst({ ...p, volume: p.volume * 0.06 }, 1.5, 0.5);
  },
  ambientEnd: (p) => {
    tone({ ...p, volume: p.volume * 0.06 }, 220, 2.5, "sine", 0.5);
    arpeggio({ ...p, volume: p.volume * 0.04 }, [110, 138, 165], 0.4, "triangle");
  },
  slotTick: (p) => {
    noiseBurst({ ...p, volume: p.volume * 0.1 }, 0.014, 2.5);
    tone({ ...p, volume: p.volume * 0.3 }, 380, 0.016, "square", 0);
    tone({ ...p, volume: p.volume * 0.18 }, 160, 0.022, "triangle", 0.001);
  },
  slotReelStop: (p) => {
    noiseBurst({ ...p, volume: p.volume * 0.24 }, 0.022, 2.2);
    tone({ ...p, volume: p.volume * 0.48 }, 220, 0.035, "triangle", 0.001);
    tone({ ...p, volume: p.volume * 0.32 }, 72, 0.065, "sine", 0.004);
  },
  slotLand: (p) => {
    tone({ ...p, volume: p.volume * 0.58 }, 520, 0.012, "square", 0);
    tone({ ...p, volume: p.volume * 0.4 }, 260, 0.016, "triangle", 0.001);
    noiseBurst({ ...p, volume: p.volume * 0.1 }, 0.008, 4);
  },
  slotWin: (p) => arpeggio({ ...p, volume: p.volume * 0.85 }, [523, 659, 784, 988], 0.1, "triangle"),
};

export function playProceduralSound(
  id: ProceduralSoundId,
  ctx: AudioContext,
  destination: AudioNode,
  volume: number,
) {
  const fn = generators[id];
  if (!fn) return;
  fn({ ctx, destination, volume });
}

/** Create looping brown-noise buffer for seasonal ambience */
export function createLoopingNoiseBuffer(ctx: AudioContext, seconds = 4) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    last = last * 0.98 + white * 0.02;
    data[i] = last * 0.5;
  }
  return buffer;
}
