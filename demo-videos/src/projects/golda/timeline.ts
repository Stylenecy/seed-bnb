import { makeBeat, TRACKS } from "../../kit";
import type { EnergyPoint, Track } from "../../kit";

/**
 * golda — "Hitslab — Marketing Ads" (82.65 BPM, first beat 0.464 s, bar = 2.904 s = 87.1 f).
 * stax plays this file from bar 0, zero-arena from bar 1. GOLDA starts it at
 * file bar 2 (the first break bar), so the hook opens soft and the logo lands
 * on the bar-4 break.
 *
 * Music edit: file bar 2 → 15, then a downbeat splice BACK to file bar 11 (the
 * lift), so the 4-bar lifted phrase 11–14 plays twice and the cut runs ~71 s
 * instead of 59.5 s. Video bar k ≥ 15 plays file bar k − 4; the video ends at
 * video bar 26 + 2 beats = file bar 22 + 2 beats, the end of the file (65.8 s).
 * The grid stays one continuous 82.65 BPM lattice, so bar(k) works across it.
 * Drops in VIDEO bars: 11, 13, 15 (splice → file 11), 17, 21, 23; breaks 2, 4, 25.
 *
 *   S1 hook     bars  2 →  4  comic: treasury 100% dollars · markets wobble · gold is off-chain & manual → bar 3 "NO HEDGE?!"
 *   S2 logo     bars  4 →  6  (break) Golda ingot mark + wordmark; bar 5 tagline + NOW ON BNB CHAIN
 *   S3 how      bars  6 → 10  slide; deposit 6 · agent picks target 7 · LI.FI swap 8 · TWAP guard + pro-rata 9
 *   S4 product  bars 10 → 13  zoom: CONCEPT UI replaying the live testnet run — deposit 1000 → 1000 gVAULT (11 DROP), redeem 400 → 600 (12)
 *   S5 fork     bars 13 → 17  DROP: BSC MAINNET FORK — li.quest calldata (13), 1,000 USDT → 1.277 WBNB (14),
 *                             SPLICE 15: PancakeSwap V3 TWAP 778.97, redeem 2,500 → 2,000 USDT (16)
 *   S6 bug      bars 17 → 19  DROP: wrong LI.FI selectors (17) → fixed (18)
 *   S7 proof    bars 19 → 22  whip: contracts + deploy (19–20), live smoke txs (21 DROP)
 *   S8 stats    bars 22 → 25  stat wall (22), honest PAXG note (23 DROP–24)
 *   S9 outro    bars 25 → 26.5 (break → end of file): mark + tagline + badge, fade to silence
 */
export const TRACK: Track = TRACKS.hitslab;

export const MUSIC_START_BAR = 2;
export const SPLICE_BAR = 15;
export const SPLICE_TO_BAR = 11;

const BAR_S = (4 * 60) / TRACK.bpm;
/** File bar played at video bar k. */
export const fileBar = (k: number) => (k >= SPLICE_BAR ? k - (SPLICE_BAR - SPLICE_TO_BAR) : k);
/** File-time (s) of a file bar. */
export const fileTimeS = (fileBarIdx: number) => TRACK.offsetS + fileBarIdx * BAR_S;

/** Per-bar RMS of the file (tracks.ts hitslab barEnergy, bars 0–22). */
const FILE_E = [0.72, 0.84, 0.67, 0.83, 0.7, 0.84, 0.82, 0.73, 0.81, 0.82, 0.79, 0.89, 0.9, 0.95, 0.94, 0.93, 0.91, 0.98, 0.85, 1.0, 0.91, 0.7, 0.41];

const ENERGY: EnergyPoint[] = Array.from({ length: 27 - MUSIC_START_BAR }, (_, i) => MUSIC_START_BAR + i).flatMap((k) => {
  const e = FILE_E[fileBar(k)] ?? 0.4;
  const t = TRACK.offsetS + k * BAR_S;
  return [
    { t, e },
    { t: t + BAR_S - 0.06, e },
  ];
});

export const G = makeBeat({
  bpm: TRACK.bpm,
  offsetS: TRACK.offsetS,
  fps: 30,
  musicStartS: fileTimeS(MUSIC_START_BAR),
  energy: ENERGY,
});

export const BAR = {
  hook: 2,
  logo: 4,
  how: 6,
  product: 10,
  fork: 13,
  bug: 17,
  proof: 19,
  stats: 22,
  outro: 25,
  end: 26,
} as const;

/** Video bar 26 + 2 beats = file bar 22 + 2 beats ≈ 65.8 s: the end of the file. */
export const TOTAL = G.bar(BAR.end) + G.beats(2);
