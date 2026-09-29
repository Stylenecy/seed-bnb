import { makeBeat, TRACKS } from "../../kit";
import type { EnergyPoint, Track } from "../../kit";

/**
 * bridgeagent — "Cermin background" (125 BPM, beat 0 at 0.0 s, bar = 1.92 s = 57.6 f).
 * cermin + claudelance start the file at bar 4, drift at 24, musashi + flowroll at
 * 36. BRIDGEAGENT starts it at file bar 12 — the second half of the first plateau
 * phrase — so frame 0 is already full band, the hook rides into the bar-15 dip
 * and the logo lands on the bar-16 phrase downbeat. Phrases turn over on 16, 24,
 * 32, 40 (hard cuts); dip bars 15, 31, 39 carry the soft beats.
 *
 * Music edit: file bar 12 → 44, then a downbeat splice to file bar 68 (the last
 * phrase of the track's own outro), which dies to silence at file bar 72.
 * Video bar k ≥ 44 plays file bar k + 24; the grid stays one 125 BPM lattice.
 *
 *   S1 hook     bars 12 → 16  comic: bots flex "+300%", no name, no receipts → 15 dip "TRUST ME, BRO."
 *   S2 logo     bars 16 → 19  PHRASE: BridgeAgent mark slam + tagline + NOW ON BNB CHAIN
 *   S3 how      bars 19 → 24  slide; title (19), register 20 · trade 21 · mirror 22 · verify 23
 *   S4 product  bars 24 → 28  PHRASE: REAL status page — hero · agent #1 · 2 trades · trade record
 *   S5 smoke    bars 28 → 32  whip: live runs — register #1 (28), trade #1 +150 (29), mirror path → trade #2 +75 (30), 31 dip "RECEIPTS."
 *   S6 bug      bars 32 → 34  PHRASE: the BSC-only extraData crash (32) → fixed (33)
 *   S7 proof    bars 34 → 38  slide: contracts (34) · 3 agent txs (35–36) · gas (37)
 *   S8 verify   bars 38 → 40  whip: the page's own cast call; 39 dip "DON'T TRUST. VERIFY."
 *   S9 stats    bars 40 → 44  PHRASE: stat wall + honest note (venue trading not exercised)
 *   S10 outro   bars 44 → 48  SPLICE → outro tail: mark + tagline + badge, fade to silence
 */
export const TRACK: Track = TRACKS.cermin;

export const MUSIC_START_BAR = 12;
export const SPLICE_BAR = 44;
export const SPLICE_TO_BAR = 68;

/** Per-bar RMS of the file (scripts/energy.py cermin-baground.mp3 125 0). */
const FILE_E: Record<number, number> = {
  12: 0.95, 13: 0.99, 14: 0.94, 15: 0.89, 16: 0.98, 17: 0.98, 18: 0.95, 19: 0.94, 20: 0.95, 21: 0.98, 22: 0.94,
  23: 0.94, 24: 0.99, 25: 0.98, 26: 0.95, 27: 0.94, 28: 0.95, 29: 1.0, 30: 0.94, 31: 0.89, 32: 0.98, 33: 0.97,
  34: 0.94, 35: 0.94, 36: 0.95, 37: 0.99, 38: 0.94, 39: 0.89, 40: 0.99, 41: 0.98, 42: 0.94, 43: 0.94,
  68: 0.89, 69: 0.78, 70: 0.84, 71: 0.66, 72: 0.02,
};
const BAR_S = (4 * 60) / TRACK.bpm;
const fileBar = (k: number) => (k >= SPLICE_BAR ? k + (SPLICE_TO_BAR - SPLICE_BAR) : k);
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
  hook: 12,
  logo: 16,
  how: 19,
  product: 24,
  smoke: 28,
  bug: 32,
  proof: 34,
  verify: 38,
  stats: 40,
  outro: 44,
  end: 48,
} as const;

export const TOTAL = G.bar(BAR.end);

/** File-time (s) of a track bar — for the music splice. */
export const fileTimeS = (fileBarIdx: number) => fileBarIdx * BAR_S;
