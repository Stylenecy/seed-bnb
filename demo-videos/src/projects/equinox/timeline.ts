import { beatConfig, makeBeat, TRACKS } from "../../kit";

/**
 * equinox — "Bring It On" (128.01 BPM, first beat 0.209s, bar = 1.875s = 56.24f).
 * The file is started at TRACK bar 2 (other videos start it at bar 0), so the
 * hook gets one up-bar + the bar-3 break and the logo lands on the bar-4 drop.
 * Structure: 3 bars up + 1 break; drops on 4, 8 … 36; silent from bar 40.
 *
 *   S1 hook     bars  2 →  4  comic: debt + crash + asleep → bar 3 break "LIQUIDATED?!"
 *   S2 logo     bars  4 →  7  DROP: logo slam + "Now on BNB Chain"
 *   S3 how      bars  7 → 12  slide in on the break; 4 steps on bars 8–11
 *   S4 product  bars 12 → 19  DROP: UI preview (mock data) — concepts, onboarding, dashboard, withdraw
 *   S5 live     bars 19 → 26  slide on the break: the live BSC-testnet run — skim HF 2.00,
 *                              CRASH on the bar-23 break (HF 1.14), DEFEND on the bar-24 drop (1.50)
 *   S6 fork     bars 26 → 28  Venus adapter vs live Venus (BSC mainnet FORK test)
 *   S7 proof    bars 28 → 32  DROP: contracts (28–29) then smoke txs (30–31)
 *   S8 stats    bars 32 → 36  DROP (peak): stat wall
 *   S9 outro    bars 36 → 40+ logo + tagline + BNB badge, rides the outro to silence
 */
export const TRACK = TRACKS.bringItOn;
export const MUSIC_START_BAR = 2;
export const MUSIC_START_S = TRACK.offsetS + MUSIC_START_BAR * ((4 * 60) / TRACK.bpm);
export const G = makeBeat(beatConfig(TRACK, { musicStartS: MUSIC_START_S }));

export const BAR = {
  hook: 2,
  logo: 4,
  how: 7,
  product: 12,
  live: 19,
  fork: 26,
  proof: 28,
  stats: 32,
  outro: 36,
  end: 40,
} as const;

/** One beat after bar 40 (the music is silent there) so the fade lands clean. */
export const TOTAL = G.bar(BAR.end) + G.beats(1);
