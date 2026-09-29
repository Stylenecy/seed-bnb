import { makeBeat, TRACKS } from "../../kit";
import type { EnergyPoint, Track } from "../../kit";

/**
 * musashi — "Cermin background" (125 BPM, beat 0 at 0.0 s, bar = 1.92 s = 57.6 f).
 * cermin + claudelance start the file at bar 4, drift at 24. MUSASHI starts it
 * at file bar 36 (mid-phrase), so the hook rides 3 bars into the bar-39 dip
 * ("TOO LATE.") and the logo SLASH lands on the bar-40 phrase downbeat.
 * Dip bars (39, 55) carry the soft slides; phrase starts (40, 48, 56) the hits.
 *
 * Music edit: file bar 36 → 64, then a downbeat splice to file bar 68 (the
 * last phrase of the track's outro) which dies to silence at file bar 72.
 * Video bar k ≥ 64 plays file bar k + 4; the grid stays one 125 BPM lattice.
 *
 *   S1 hook     bars 36 → 40  comic: a thousand tokens, ape on vibes → RUG (38) → dip 39 "TOO LATE."
 *   S2 logo     bars 40 → 43  DROP: katana SLASH! → logo + MUSASHI 武蔵 + NOW ON BNB CHAIN
 *   S3 how      bars 43 → 48  slide; title (43), 7 gates (44) · specialists + debate (45) · STRIKE (46) · reputation (47)
 *   S4 product  bars 48 → 52  zoom: REAL frontend — landing · pipeline · live reputation · strike ledger
 *   S5 gates    bars 52 → 55  cut: read-only LIVE BSC checks — CAKE cut at gate 1 (52), ARIA passes (53), duel (54)
 *   S6 strike   bars 55 → 58  slide on the dip: mint agent 0 (55) → logStrike SLASH! (56) → recordOutcome +2500 (57)
 *   S7 proof    bars 58 → 60  cut: contracts (58) · smoke txs (59)
 *   S8 stack    bars 60 → 62  whip: Go daemon + frontend serving the live testnet data
 *   S9 stats    bars 62 → 64  cut: stat wall + honest note
 *   S10 outro   bars 64 → 68  SPLICE → outro tail: logo + tagline + badge, fade to silence
 */
export const TRACK: Track = TRACKS.cermin;

export const MUSIC_START_BAR = 36;
export const SPLICE_BAR = 64;
export const SPLICE_TO_BAR = 68;

/** Per-bar RMS of the file (scripts/energy.py cermin-baground.mp3 125 0). */
const FILE_E: Record<number, number> = {
  36: 0.95, 37: 0.99, 38: 0.94, 39: 0.89, 40: 0.99, 41: 0.98, 42: 0.94, 43: 0.94, 44: 0.96, 45: 0.99, 46: 0.94,
  47: 0.95, 48: 0.98, 49: 0.98, 50: 0.95, 51: 0.95, 52: 0.95, 53: 0.98, 54: 0.94, 55: 0.89, 56: 0.98, 57: 0.98,
  58: 0.94, 59: 0.94, 60: 0.95, 61: 0.99, 62: 0.94, 63: 0.95, 68: 0.89, 69: 0.78, 70: 0.84, 71: 0.66, 72: 0.02,
};
const BAR_S = (4 * 60) / TRACK.bpm;
const fileBar = (k: number) => (k >= SPLICE_BAR ? k + (SPLICE_TO_BAR - SPLICE_BAR) : k);
const ENERGY: EnergyPoint[] = Array.from({ length: 68 - MUSIC_START_BAR + 1 }, (_, i) => MUSIC_START_BAR + i).flatMap((k) => {
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
  hook: 36,
  logo: 40,
  how: 43,
  product: 48,
  gates: 52,
  strike: 55,
  proof: 58,
  stack: 60,
  stats: 62,
  outro: 64,
  end: 68,
} as const;

export const TOTAL = G.bar(BAR.end);

/** File-time (s) of a track bar — for the music splice. */
export const fileTimeS = (fileBarIdx: number) => fileBarIdx * BAR_S;
