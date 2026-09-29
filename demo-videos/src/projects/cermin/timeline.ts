import { makeBeat, TRACKS } from "../../kit";
import type { EnergyPoint, Track } from "../../kit";

/**
 * cermin — the project's own bed, "Cermin background" (125 BPM, beat 0 at
 * 0.0 s, 1 bar = 1.92 s = 57.6 f). Bars below are TRACK bars.
 *
 * The music edit (all on downbeats, all phrase starts):
 *   file 0:07.68 (bar 4) → 1:16.80 (bar 40)   intro tail + drop on bar 8 + plateau
 *   then jumps to file 2:02.88 (bar 64)        the track's own outro (bars 64–71)
 * so video bar k ≥ 40 plays file bar k + 24, and the video ends at video bar
 * 48 = file bar 72, where the song itself goes silent. The grid stays one
 * continuous 125 BPM lattice, so bar(k) works across the splice.
 *
 *   S1 hook     bars  4 → 8   comic problem strip (intro; bar 7 = soft bar "OUCH.")
 *   S2 logo     bars  8 → 11  DROP (file bar 8): logo slam + "Now on BNB Chain"
 *   S3 how      bars 11 → 16  4 comic steps on 12–15 (VO "Lock BNB once…", "Dip? It defends.")
 *   S4 product  bars 16 → 24  phrase start: REAL app — landing → connect → 5-step onboarding
 *   S5 flow     bars 24 → 35  phrase start: REAL dashboard, live BSC-testnet vault
 *                             open 24 · skim 26–27 · dip 28 · defend 29 · safe 30
 *                             activity 31 · permissionless 32 · withdraw 33 · close 34
 *   S6 proof    bars 35 → 40  contracts (35–36) · txs (37–38) · oracle (39, soft bar)
 *   S7 stats    bars 40 → 43  MUSIC SPLICE → outro: stat wall, one per bar
 *   S8 outro    bars 43 → 48  logo + tagline + BNB badge, fade to silence
 */
export const TRACK: Track = TRACKS.cermin;

/** Where the video starts in the file (track bar 4). */
export const MUSIC_START_BAR = 4;
/** Video bar where the music jumps, and the file bar it jumps to. */
export const SPLICE_BAR = 40;
export const SPLICE_TO_BAR = 64;

/** Per-bar RMS of the file (scripts/energy.py cermin-baground.mp3 125 0). */
const FILE_E: Record<number, number> = {
  4: 0.89, 5: 0.78, 6: 0.84, 7: 0.73, 8: 0.97, 9: 0.97, 10: 0.94, 11: 0.94, 12: 0.95, 13: 0.99, 14: 0.94, 15: 0.89,
  16: 0.98, 17: 0.98, 18: 0.95, 19: 0.94, 20: 0.95, 21: 0.98, 22: 0.94, 23: 0.94, 24: 0.99, 25: 0.98, 26: 0.95,
  27: 0.94, 28: 0.95, 29: 1.0, 30: 0.94, 31: 0.89, 32: 0.98, 33: 0.97, 34: 0.94, 35: 0.94, 36: 0.95, 37: 0.99,
  38: 0.94, 39: 0.89, 64: 0.84, 65: 0.7, 66: 0.83, 67: 0.73, 68: 0.89, 69: 0.78, 70: 0.84, 71: 0.66, 72: 0.02,
};
const BAR_S = (4 * 60) / TRACK.bpm;
const fileBar = (k: number) => (k >= SPLICE_BAR ? k + (SPLICE_TO_BAR - SPLICE_BAR) : k);
/** Energy envelope in VIDEO music-time (continuous grid), step per bar. */
const ENERGY: EnergyPoint[] = Array.from({ length: 48 - MUSIC_START_BAR + 1 }, (_, i) => MUSIC_START_BAR + i).flatMap((k) => {
  const e = FILE_E[fileBar(k)] ?? 0.9;
  return [
    { t: k * BAR_S, e },
    { t: (k + 1) * BAR_S - 0.06, e },
  ];
});

export const G = makeBeat({
  bpm: TRACK.bpm,
  offsetS: TRACK.offsetS,
  fps: 30,
  musicStartS: MUSIC_START_BAR * BAR_S,
  energy: ENERGY,
});

export const BAR = {
  hook: 4,
  logo: 8,
  how: 11,
  product: 16,
  flow: 24,
  proof: 35,
  stats: 40,
  outro: 43,
  end: 48,
} as const;

export const TOTAL = G.bar(BAR.end);

/** File-time (s) of a track bar — for the music splice. */
export const fileTimeS = (fileBarIdx: number) => fileBarIdx * BAR_S;
