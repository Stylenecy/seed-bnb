import { beatConfig, makeBeat, TRACKS } from "../../kit";

/**
 * neural-alpha — "Bring It On" (128.01 BPM, first beat 0.209 s, bar = 1.875 s = 56.24 f).
 * Start bars already taken on this file: iusd-pay 0, equinox 2, liber 4,
 * flowroll 5, gridora 3, bingo-chain 8. NEURAL-ALPHA starts it at TRACK bar 1
 * (musicStartS ≈ 2.08 s): frame 0 is a downbeat mid-phrase, the hook rides
 * two up-bars into the bar-3 break ("REKT.") and the logo lands on the bar-4 drop.
 * Shape: 3 bars up + 1 break; drops on 4, 8 … 36; outro tail 38–39; silent from 40.
 * All bar numbers below are TRACK bars.
 *
 *   S1 hook      1 →  4  comic: BSC never sleeps · bot with no guardrails · bar 3 break "REKT."
 *   S2 logo      4 →  7  DROP: Neural Alpha mark slam + tagline + BUILT ON BNB CHAIN + PAPER chip
 *   S3 how       7 → 12  slide on break 7; 4 steps on 8 (DROP) · 9 · 10 · 11
 *   S4 run      12 → 16  DROP: REAL paper-mode agent log (8 cycles, 3 paper buys) · break 15 summary
 *   S5 dash     16 → 20  DROP: REAL dashboard on the same run (4 screens, one per bar)
 *   S6 scan     20 → 24  DROP: REAL trade-history scanner → 4 real BSC swaps (explorer card on 22)
 *   S7 fix      24 → 28  DROP: 15/88 BEP-20 addresses were wrong → fixed → 88/88 on-chain (break 27)
 *   S8 narr     28 → 31  DROP: Narrative-Alpha companion strategy skill (real CLI + 24/24 tests)
 *   S9 safe     31 → 32  break: title card — PAPER MODE · TWAK OFF · NO KEYS
 *   S10 stats   32 → 36  DROP: stat wall, a card every 2 beats; break 35 = "ZERO REAL TRADES."
 *   S11 outro   36 → 40  DROP: mark + tagline + badge; tail 38–39; fade to silence at 40
 */
export const TRACK = TRACKS.bringItOn;
export const MUSIC_START_BAR = 1;
export const MUSIC_START_S = TRACK.offsetS + MUSIC_START_BAR * ((4 * 60) / TRACK.bpm);
export const G = makeBeat(beatConfig(TRACK, { musicStartS: MUSIC_START_S }));

export const BAR = {
  hook: 1,
  logo: 4,
  how: 7,
  run: 12,
  dash: 16,
  scan: 20,
  fix: 24,
  narr: 28,
  safe: 31,
  stats: 32,
  outro: 36,
  end: 40,
} as const;

/** One beat past bar 40 (music is silent there) so the fade lands clean. */
export const TOTAL = G.bar(BAR.end) + G.beats(1);
