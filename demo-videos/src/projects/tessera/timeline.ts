import { makeBeat, TRACKS } from "../../kit";
import type { EnergyPoint, Track } from "../../kit";

/**
 * tessera — "Cermin background" (125 BPM, beat 0 at 0.0 s, bar = 1.92 s = 57.6 f).
 * Other cermin cuts start the file at bars 4, 12, 24, 36; TESSERA starts at file
 * bar 16 — the first bar of the full-energy plateau (bar 15 is the intro's last
 * dip), so frame 0 lands on the band kicking in. Plateau phrases are 8 bars with a
 * soft dip bar before each (31, 39): slides/whips sit on 23, 31 (dip) and 39 (dip),
 * hard cuts on the phrase downbeats 24, 32, 40.
 *
 * Music edit: file bar 16 → 48, then a downbeat splice to file bar 68 (the track's
 * own outro phrase) which dies to silence at file bar 72. Video bar k ≥ 48 plays
 * file bar k + 20. One 125 BPM lattice throughout.
 *
 *   S1 hook      16 → 20  comic: "who is 0xF977…?" 11 chains, 3 BNB networks, one address
 *   S2 logo      20 → 23  Tessera mosaic slam + "Evidence over narrative." + NOW ON BNB CHAIN
 *   S3 how       23 → 28  slide; 4 steps on 24 (DROP) · 25 · 26 · 27
 *   S4 hot       28 → 32  REAL `tessera scan-chain` of the Binance hot wallet (comic terminal)
 *   S5 routers   32 → 36  DROP: PancakeSwap routers flagged Contract on 56 / 204 / 97
 *   S6 backend   36 → 40  REAL `serve` on :3300 — /api/health + MCP tools/call scan_chain
 *   S7 product   40 → 44  DROP: REAL frontend (landing → features → /dashboard)
 *   S8 limit     44 → 46  honest limit: BscScan V1 is dead → needs an Etherscan V2 key
 *   S9 stats     46 → 48  stat wall
 *   S10 outro    48 → 52  SPLICE → outro tail: mark + tagline + badge, fade to silence
 */
export const TRACK: Track = TRACKS.cermin;

export const MUSIC_START_BAR = 16;
export const SPLICE_BAR = 48;
export const SPLICE_TO_BAR = 68;
export const END_BAR = 52;

/** Per-bar RMS of the file (scripts/energy.py cermin-baground.mp3 125 0). */
const FILE_E: Record<number, number> = {
  16: 0.98, 17: 0.98, 18: 0.95, 19: 0.94, 20: 0.95, 21: 0.98, 22: 0.94, 23: 0.94, 24: 0.99, 25: 0.98, 26: 0.95, 27: 0.94, 28: 0.95, 29: 1.0, 30: 0.94, 31: 0.89, 32: 0.98, 33: 0.97, 34: 0.94, 35: 0.94, 36: 0.95, 37: 0.99, 38: 0.94, 39: 0.89, 40: 0.99, 41: 0.98, 42: 0.94, 43: 0.94, 44: 0.96, 45: 0.99, 46: 0.94, 47: 0.95,
  68: 0.89, 69: 0.78, 70: 0.84, 71: 0.66, 72: 0.02,
};
const BAR_S = (4 * 60) / TRACK.bpm;
export const fileBar = (k: number) => (k >= SPLICE_BAR ? k + (SPLICE_TO_BAR - SPLICE_BAR) : k);
const ENERGY: EnergyPoint[] = Array.from({ length: END_BAR - MUSIC_START_BAR + 1 }, (_, i) => MUSIC_START_BAR + i).flatMap((k) => {
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
  hook: 16,
  logo: 20,
  how: 23,
  hot: 28,
  routers: 32,
  backend: 36,
  product: 40,
  limit: 44,
  stats: 46,
  outro: 48,
  end: END_BAR,
} as const;

export const TOTAL = G.bar(BAR.end);

/** File-time (s) of a track bar — for the music splice. */
export const fileTimeS = (fileBarIdx: number) => fileBarIdx * BAR_S;
