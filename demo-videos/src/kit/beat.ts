/**
 * beat.ts — the single timing source for a video.
 *
 * `makeBeat({ bpm, offsetS, fps })` returns a BeatGrid. Every scene boundary,
 * cut, transition, text pop, counter tick, SFX and camera-move start in a
 * project should be a `bar(k)` / `beat(k)` / `half(k)` expression (± a named
 * small lead-in) — never a hand-picked frame number.
 *
 * Frames are COMPOSITION frames (not scene-local). Inside a scene, convert
 * with `bar(k) - start` where `start` is the scene's sequence start (see
 * SceneTimeline).
 *
 * `musicStartS` lets a project start the track mid-file (music-time =
 * musicStartS + frame / fps); bar/beat indices are always TRACK indices, so
 * `bar(8)` is the 8th bar of the song no matter where the video starts it.
 */

export type EnergyPoint = { t: number; e: number };

export type BeatConfig = {
  bpm: number;
  /** Seconds into the audio file where beat 0 (a downbeat) sits. */
  offsetS: number;
  fps?: number;
  /** Beats per bar (default 4). */
  beatsPerBar?: number;
  /** Music-time (s) that plays at comp frame 0 (default 0). */
  musicStartS?: number;
  /** Normalised 0..1 energy envelope keyed by MUSIC-time seconds. */
  energy?: EnergyPoint[];
};

export type BeatGrid = {
  fps: number;
  bpm: number;
  beatsPerBar: number;
  offsetS: number;
  musicStartS: number;
  /** Seconds per beat / bar. */
  beatS: number;
  barS: number;
  /** Frames per beat / bar (fractional). */
  beatF: number;
  barF: number;
  /** Comp frame of track bar k (rounded). Fractional k is allowed. */
  bar: (k: number) => number;
  /** Comp frame of track beat k (rounded). Fractional k is allowed. */
  beat: (k: number) => number;
  /** Comp frame of beat `b` (0-based, may be fractional) inside bar `k`. */
  at: (k: number, b?: number) => number;
  /** Beat frames in [fromBar, toBar) — handy for per-beat punches. */
  beatsIn: (fromBar: number, toBar: number, every?: number) => number[];
  /** Rounded frame length of `n` beats (for transitions / fades). */
  beats: (n: number) => number;
  /** Music-time (s) playing at comp frame f. */
  musicTimeAt: (f: number) => number;
  /** Comp frame at which a music-time (s) plays. */
  frameAtMusic: (t: number) => number;
  /** Interpolated 0..1 track energy at comp frame f. */
  energyAt: (f: number) => number;
  /** Fractional beat index at comp frame f. */
  beatFloatAt: (f: number) => number;
  /** Integer beat index at comp frame f. */
  beatIndexAt: (f: number) => number;
  /** 0..1 phase inside the current beat (0 = on the beat). */
  beatPhase: (f: number) => number;
  /** True when f sits inside a bar's first beat. */
  isDownbeatAt: (f: number) => boolean;
};

export const makeBeat = (cfg: BeatConfig): BeatGrid => {
  const fps = cfg.fps ?? 30;
  const beatsPerBar = cfg.beatsPerBar ?? 4;
  const musicStartS = cfg.musicStartS ?? 0;
  const beatS = 60 / cfg.bpm;
  const barS = beatS * beatsPerBar;
  const energy = cfg.energy ?? [{ t: 0, e: 0.8 }];

  const tToF = (t: number): number => Math.round((t - musicStartS) * fps);
  const beat = (k: number): number => tToF(cfg.offsetS + k * beatS);
  const bar = (k: number): number => tToF(cfg.offsetS + k * barS);
  const musicTimeAt = (f: number): number => musicStartS + f / fps;
  const beatFloatAt = (f: number): number => (musicTimeAt(f) - cfg.offsetS) / beatS;
  const beatIndexAt = (f: number): number => Math.floor(beatFloatAt(f));

  const energyAt = (f: number): number => {
    const t = musicTimeAt(f);
    const first = energy[0]!;
    if (t <= first.t) return first.e;
    for (let i = 1; i < energy.length; i++) {
      const b = energy[i]!;
      if (t <= b.t) {
        const a = energy[i - 1]!;
        const span = b.t - a.t;
        return span <= 0 ? b.e : a.e + ((b.e - a.e) * (t - a.t)) / span;
      }
    }
    return energy[energy.length - 1]!.e;
  };

  return {
    fps,
    bpm: cfg.bpm,
    beatsPerBar,
    offsetS: cfg.offsetS,
    musicStartS,
    beatS,
    barS,
    beatF: beatS * fps,
    barF: barS * fps,
    bar,
    beat,
    at: (k, b = 0) => beat(k * beatsPerBar + b),
    beatsIn: (fromBar, toBar, every = 1) => {
      const out: number[] = [];
      for (let b = fromBar * beatsPerBar; b < toBar * beatsPerBar; b += every) out.push(beat(b));
      return out;
    },
    beats: (n) => Math.round(n * beatS * fps),
    musicTimeAt,
    frameAtMusic: tToF,
    energyAt,
    beatFloatAt,
    beatIndexAt,
    beatPhase: (f) => {
      const x = beatFloatAt(f);
      return x - Math.floor(x);
    },
    isDownbeatAt: (f) => ((beatIndexAt(f) % beatsPerBar) + beatsPerBar) % beatsPerBar === 0,
  };
};

/** Max of exponentially-decaying impulses fired at each frame in `hits`. */
export const punch = (f: number, hits: readonly number[], amt = 1, decay = 4): number => {
  let e = 0;
  for (const h of hits) {
    if (f >= h) {
      const v = amt * Math.exp(-(f - h) / decay);
      if (v > e) e = v;
    }
  }
  return e;
};
