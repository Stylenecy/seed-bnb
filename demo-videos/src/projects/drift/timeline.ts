import { makeBeat, TRACKS } from "../../kit";
import type { EnergyPoint, Track } from "../../kit";

/**
 * drift — "Cermin background" (125 BPM, beat 0 at 0.0 s, bar = 1.92 s = 57.6 f).
 * cermin + claudelance start the file at bar 4 (intro tail → bar-8 drop). DRIFT
 * starts at file bar 24, deep in the plateau, so frame 0 is already full band.
 * The plateau phrases in 8s with a soft dip bar before each phrase (15, 31, 39,
 * 55), so slides/title beats sit on 31 and 39 and the hard cuts on 32 and 40.
 *
 * Music edit: file bar 24 → 56, then a downbeat splice to file bar 68 (the
 * last phrase of the track's own outro) which dies to silence at file bar 72.
 * Video bar k ≥ 56 plays file bar k + 12; the grid stays one 125 BPM lattice.
 *
 *   S1 hook     bars 24 → 28  comic: a bot goes long into a macro storm → -25% → "REKT!" (bar 27)
 *   S2 logo     bars 28 → 31  logo slam + "macro-regime-aware trading agent" + NOW ON BNB CHAIN
 *   S3 how      bars 31 → 36  slide on the dip bar 31 (title), 4 steps on 32 (DROP) · 33 · 34 · 35
 *   S4 product  bars 36 → 40  REAL web cockpit: landing → markets → research → MacroGuard banner (39 dip)
 *   S5 guard    bars 40 → 46  DROP: the live testnet smoke flow on a code-drawn guard console
 *                              40 RiskOff veto · 41 −5% ok · 42 −25% HALTED · 43 resume · 44 Neutral · 45 NotAgent
 *   S6 engine   bars 46 → 49  the Python engine auto-restores the regime + records a decision
 *   S7 proof    bars 49 → 53  contract + 8 txs, BscScan-style
 *   S8 stats    bars 53 → 56  stat wall
 *   S9 outro    bars 56 → 60  SPLICE → the track's outro tail: logo + tagline + badge, fade to silence
 */
export const TRACK: Track = TRACKS.cermin;

export const MUSIC_START_BAR = 24;
export const SPLICE_BAR = 56;
export const SPLICE_TO_BAR = 68;

/** Per-bar RMS of the file (scripts/energy.py cermin-baground.mp3 125 0). */
const FILE_E: Record<number, number> = {
  24: 0.95, 25: 0.98, 26: 0.94, 27: 0.94, 28: 0.99, 29: 0.98, 30: 0.95, 31: 0.89, 32: 0.98, 33: 0.97, 34: 0.94,
  35: 0.94, 36: 0.95, 37: 0.99, 38: 0.94, 39: 0.89, 40: 0.99, 41: 0.98, 42: 0.94, 43: 0.94, 44: 0.96, 45: 0.99,
  46: 0.94, 47: 0.95, 48: 0.98, 49: 0.98, 50: 0.95, 51: 0.95, 52: 0.95, 53: 0.98, 54: 0.94, 55: 0.89,
  68: 0.89, 69: 0.78, 70: 0.84, 71: 0.66, 72: 0.02,
};
const BAR_S = (4 * 60) / TRACK.bpm;
const fileBar = (k: number) => (k >= SPLICE_BAR ? k + (SPLICE_TO_BAR - SPLICE_BAR) : k);
const ENERGY: EnergyPoint[] = Array.from({ length: 60 - MUSIC_START_BAR + 1 }, (_, i) => MUSIC_START_BAR + i).flatMap((k) => {
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
  hook: 24,
  logo: 28,
  how: 31,
  product: 36,
  guard: 40,
  engine: 46,
  proof: 49,
  stats: 53,
  outro: 56,
  end: 60,
} as const;

export const TOTAL = G.bar(BAR.end);

/** File-time (s) of a track bar — for the music splice. */
export const fileTimeS = (fileBarIdx: number) => fileBarIdx * BAR_S;
