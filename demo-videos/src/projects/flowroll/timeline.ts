import { beatConfig, makeBeat, TRACKS } from "../../kit";

/**
 * flowroll — "Bring It On" (128.01 BPM, first beat 0.209 s, bar = 1.875 s = 56.24 f).
 * Start bars already taken on this file: iusd-pay 0, equinox 2, liber 4,
 * bingo-chain 8 (cermin 36 is musashi's). FLOWROLL starts it at TRACK bar 5
 * (musicStartS 9.58 s): frame 0 is the up-bar right after the bar-4 drop, so
 * the hook opens with the band already in and rides into the bar-7 break.
 * Shape: 3 bars up + 1 break; drops on 8, 12 … 36; silent from bar 40.
 *
 *   S1 hook     bars  5 →  8  comic: payroll cash sleeps (5), broke before payday (6), loan-shark fees (6 b2)
 *                             → bar-7 break "IDLE CASH. BROKE STAFF."
 *   S2 logo     bars  8 → 11  DROP: Flowroll mark slam + "Payroll that pays for itself." + NOW ON BNB CHAIN
 *   S3 how      bars 11 → 16  slide on the break (title); steps deposit 12 · earn 13 · advance 14 · payday 15
 *   S4 product  bars 16 → 21  DROP: REAL frontend. Landing → create group → Testnet Team → Credit Hub (19 break) → Liquidity Hub
 *   S5 live     bars 21 → 26  whip: the live smoke run. Group + 8,000 (21), zap + 1,000 → 985 (22),
 *                             agent rebalances on the bar-23 break, PAYDAY on the bar-24 DROP, repaid + claim 4,000 (25)
 *   S6 bug      bars 26 → 28  slide: the pre-existing payday bug found in verification (26) → FIXED, 265/265 (27 break)
 *   S7 proof    bars 28 → 32  DROP (zoom): contracts (28–29), then the smoke-flow txs (30), pills on the 31 break
 *   S8 stats    bars 32 → 36  DROP (the track's peak): stat wall
 *   S9 outro    bars 36 → 40+ logo + tagline + BNB badge, fade over the tail to silence
 */
export const TRACK = TRACKS.bringItOn;
export const MUSIC_START_BAR = 5;
export const MUSIC_START_S = TRACK.offsetS + MUSIC_START_BAR * ((4 * 60) / TRACK.bpm);
export const G = makeBeat(beatConfig(TRACK, { musicStartS: MUSIC_START_S }));

export const BAR = {
  hook: 5,
  logo: 8,
  how: 11,
  product: 16,
  live: 21,
  bug: 26,
  proof: 28,
  stats: 32,
  outro: 36,
  end: 40,
} as const;

/** One beat past bar 40 (the music is silent there) so the fade lands clean. */
export const TOTAL = G.bar(BAR.end) + G.beats(1);
