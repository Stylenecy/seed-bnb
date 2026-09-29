import { beatConfig, makeBeat, TRACKS } from "../../kit";

/**
 * liber — "Bring It On" (128.01 BPM, first beat 0.209s, bar = 1.875s = 56.24f).
 * iusd-pay starts the file at bar 0, equinox at 2, bingo-chain at 8. LIBER
 * starts it at TRACK bar 4 (musicStartS 7.71s): frame 0 is the bar-4 DROP, so
 * the hook opens hard and rides 3 up-bars into the bar-7 break.
 * Structure: 3 bars up + 1 break; drops on 4, 8 … 36; silent from bar 40.
 *
 *   S1 hook     bars  4 →  8  comic: paid in USDC, coffee costs QRIS rupiah → exchange detour → bar 7 break "STUCK."
 *   S2 logo     bars  8 → 11  DROP: Liber mark slam + "Now on BNB Chain"
 *   S3 how      bars 11 → 16  slide on the break (title); 4 steps on 12 · 13 · 14 · 15
 *   S4 product  bars 16 → 23  DROP: REAL frontend — onboarding → 202 awaiting 0.001 BNB → home 995 → Kolo top-up → scan/quote → history
 *   S5 api      bars 23 → 28  slide on the break: the real backend — 202 awaiting_funding (24 DROP) vs 201 (25), /balance 995 (26), bar 27 break
 *   S6 proof    bars 28 → 32  DROP: MockUSDC + deploy (28), faucet (29), 5 USDC transfer (30), balances 995/5 (31 break)
 *   S7 stats    bars 32 → 36  DROP (peak): stat wall
 *   S8 outro    bars 36 → 40+ logo + tagline + BNB badge, fade over the tail
 */
export const TRACK = TRACKS.bringItOn;
export const MUSIC_START_BAR = 4;
export const MUSIC_START_S = TRACK.offsetS + MUSIC_START_BAR * ((4 * 60) / TRACK.bpm);
export const G = makeBeat(beatConfig(TRACK, { musicStartS: MUSIC_START_S }));

export const BAR = {
  hook: 4,
  logo: 8,
  how: 11,
  product: 16,
  api: 23,
  proof: 28,
  stats: 32,
  outro: 36,
  end: 40,
} as const;

/** One beat past bar 40 (music is silent there) so the fade lands clean. */
export const TOTAL = G.bar(BAR.end) + G.beats(1);
