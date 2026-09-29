/**
 * tracks.ts — the music library (files live in public/music/).
 *
 * Each preset carries the measured tempo map + a per-bar energy envelope
 * (RMS per bar, normalised, from `python3 scripts/energy.py <file> <bpm> <offset>`),
 * plus the structural landmarks (drops / breaks, as TRACK bar indices) so a
 * project can plan its scene boundaries against the song.
 *
 *   const grid = makeBeat(beatConfig(TRACKS.bringItOn));
 */
import type { BeatConfig, EnergyPoint } from "./beat";

export type Track = {
  /** File under public/ (pass through staticFile). */
  file: string;
  title: string;
  bpm: number;
  /** First downbeat in the file (s). */
  offsetS: number;
  durationS: number;
  /** Per-bar energy (value at each bar start). Expanded to a step envelope. */
  barEnergy: EnergyPoint[];
  /** Bars where a section hits hard (use for hard cuts + flashes). */
  drops: number[];
  /** Low-energy "breath" bars (use for soft slides / title cards). */
  breaks: number[];
  /** Last musically useful bar start (video should end on/after this). */
  endBar: number;
  notes: string;
};

/** Turn per-bar values into a step envelope (hold each bar, snap at the next). */
const steps = (pts: EnergyPoint[], barS: number): EnergyPoint[] =>
  pts.flatMap((p) => [p, { t: p.t + barS - 0.06, e: p.e }]);

const BIO_BAR_S = (4 * 60) / 128.01;

export const TRACKS = {
  /** "Bring It On (Airstream)" — punchy 4-bar phrases: 3 bars up + 1 break bar. */
  bringItOn: {
    file: "music/bring-it-on.mp3",
    title: "Bring It On (Airstream)",
    bpm: 128.01,
    offsetS: 0.209,
    durationS: 78.75,
    barEnergy: steps(
      [
        { t: 0.21, e: 0.63 }, { t: 2.08, e: 0.62 }, { t: 3.96, e: 0.6 }, { t: 5.83, e: 0.32 },
        { t: 7.71, e: 0.84 }, { t: 9.58, e: 0.97 }, { t: 11.46, e: 0.91 }, { t: 13.33, e: 0.45 },
        { t: 15.21, e: 0.74 }, { t: 17.08, e: 0.74 }, { t: 18.96, e: 0.72 }, { t: 20.83, e: 0.57 },
        { t: 22.71, e: 0.92 }, { t: 24.58, e: 0.96 }, { t: 26.46, e: 0.88 }, { t: 28.33, e: 0.43 },
        { t: 30.21, e: 0.84 }, { t: 32.08, e: 0.94 }, { t: 33.96, e: 0.89 }, { t: 35.83, e: 0.42 },
        { t: 37.71, e: 0.72 }, { t: 39.58, e: 0.72 }, { t: 41.46, e: 0.71 }, { t: 43.33, e: 0.49 },
        { t: 45.21, e: 0.84 }, { t: 47.08, e: 0.94 }, { t: 48.96, e: 0.95 }, { t: 50.83, e: 0.4 },
        { t: 52.7, e: 0.77 }, { t: 54.58, e: 0.76 }, { t: 56.45, e: 0.78 }, { t: 58.33, e: 0.6 },
        { t: 60.2, e: 0.97 }, { t: 62.08, e: 1.0 }, { t: 63.95, e: 0.94 }, { t: 65.83, e: 0.47 },
        { t: 67.7, e: 0.84 }, { t: 69.58, e: 0.83 }, { t: 71.45, e: 0.46 }, { t: 73.33, e: 0.43 },
        { t: 75.2, e: 0 },
      ],
      BIO_BAR_S,
    ),
    drops: [4, 8, 12, 16, 20, 24, 28, 32, 36],
    breaks: [3, 7, 11, 15, 19, 23, 27, 31, 35, 38, 39],
    endBar: 40,
    notes:
      "bar = 1.8748s = 56.24f @30fps. Every 4th bar (3,7,11,…) is a break; drops on 4,8,…,36. " +
      "Bars 38–39 are the outro tail; audio is ~silent from bar 40 (75.2s).",
  },

  /** Hitslab marketing bed — steady, mid-tempo, no hard breaks. */
  hitslab: {
    file: "music/hitslab-marketing.mp3",
    title: "Hitslab — Marketing Ads",
    bpm: 82.65,
    offsetS: 0.464,
    durationS: 65.83,
    barEnergy: steps(
      [
        { t: 0.46, e: 0.72 }, { t: 3.37, e: 0.84 }, { t: 6.27, e: 0.67 }, { t: 9.18, e: 0.83 },
        { t: 12.08, e: 0.7 }, { t: 14.98, e: 0.84 }, { t: 17.89, e: 0.82 }, { t: 20.79, e: 0.73 },
        { t: 23.69, e: 0.81 }, { t: 26.6, e: 0.82 }, { t: 29.5, e: 0.79 }, { t: 32.41, e: 0.89 },
        { t: 35.31, e: 0.9 }, { t: 38.21, e: 0.95 }, { t: 41.12, e: 0.94 }, { t: 44.02, e: 0.93 },
        { t: 46.92, e: 0.91 }, { t: 49.83, e: 0.98 }, { t: 52.73, e: 0.85 }, { t: 55.64, e: 1.0 },
        { t: 58.54, e: 0.91 }, { t: 61.44, e: 0.7 }, { t: 64.35, e: 0.41 },
      ],
      (4 * 60) / 82.65,
    ),
    drops: [11, 13, 17, 19],
    breaks: [2, 4, 21],
    endBar: 22,
    notes: "bar = 2.904s = 87.1f. Steady; lifts from bar 11 (32.4s). Ends ~65.8s — fade the last bar.",
  },

  /** Cermin background — steady high-energy 125 BPM bed, 142s long. */
  cermin: {
    file: "music/cermin-baground.mp3",
    title: "Cermin background",
    bpm: 125,
    offsetS: 0,
    durationS: 142.13,
    barEnergy: steps(
      [
        { t: 0, e: 0.86 }, { t: 1.92, e: 0.7 }, { t: 3.84, e: 0.83 }, { t: 5.76, e: 0.73 },
        { t: 7.68, e: 0.89 }, { t: 9.6, e: 0.78 }, { t: 11.52, e: 0.84 }, { t: 13.44, e: 0.73 },
        { t: 15.36, e: 0.97 }, { t: 122.88, e: 0.84 }, { t: 124.8, e: 0.7 }, { t: 126.72, e: 0.83 },
        { t: 128.64, e: 0.73 }, { t: 130.56, e: 0.89 }, { t: 132.48, e: 0.78 }, { t: 134.4, e: 0.84 },
        { t: 136.32, e: 0.66 }, { t: 138.24, e: 0.02 },
      ],
      1.92,
    ),
    drops: [8, 64],
    breaks: [],
    endBar: 72,
    notes:
      "bar = 1.92s = 57.6f. Intro bars 0–7 (mid), full-energy plateau bars 8–63, outro 64–71, silent from 72 (138.2s). " +
      "For a 60–90s cut start mid-file with musicStartS (e.g. bar 32) and fade out on a downbeat.",
  },
} satisfies Record<string, Track>;

export type TrackId = keyof typeof TRACKS;

/** BeatConfig for a track (optionally starting the file at `musicStartS`). */
export const beatConfig = (t: Track, opts: { fps?: number; musicStartS?: number } = {}): BeatConfig => ({
  bpm: t.bpm,
  offsetS: t.offsetS,
  fps: opts.fps ?? 30,
  musicStartS: opts.musicStartS ?? 0,
  energy: t.barEnergy,
});
