import { beatConfig, makeBeat, TRACKS } from "../../kit";

/**
 * gridora — "Bring It On" (128.01 BPM, first beat 0.209 s, bar = 1.875 s = 56.24 f).
 * Start bars already taken on this file: iusd-pay 0, equinox 2, liber 4, flowroll 5,
 * bingo-chain 8. GRIDORA starts it at TRACK bar 3 (musicStartS 5.83 s) — the file's
 * quietest break bar — so the video opens on a hush and the hook slams on the bar-4 drop.
 * Shape: 3 bars up + 1 break; drops on 4, 8 … 36; outro tail 38–39; silent from 40.
 *
 *   S1 hook     bars  3 →  8  break 3: "the bot has a plan." · DROP 4: plan ±7% · 5: market dumps
 *                             · 6: the plan gets quietly edited → break 7 "NO RECEIPTS."
 *   S2 logo     bars  8 → 11  DROP: coral mark slam + gridora + tagline + BUILT ON BNB CHAIN
 *   S3 how      bars 11 → 16  slide on the break (title); ladder 12 · commit 13 · TWAK 14 · attest 15 (break)
 *   S4 grid     bars 16 → 20  DROP: the grid at work — fills pop on the beats, spread banked;
 *                             break 19 = the circuit breaker "FLAT!"
 *   S5 product  bars 20 → 24  DROP: REAL verifier on BSC mainnet (hero · tape · proof), break 23 → the
 *                             same frontend pointed at the BSC testnet deploy
 *   S6 testnet  bars 24 → 28  DROP: the testnet run — register 24 · commit 25 · record +85 26 · attest 27 (break)
 *   S7 proof    bars 28 → 32  DROP: testnet contracts (28), 4 agent txs (29–30), mainnet contracts (31 break)
 *   S8 stats    bars 32 → 36  DROP (the track's peak): stat wall, honest note on the 35 break
 *   S9 outro    bars 36 → 40+ mark + tagline + badge, fade over the tail to silence
 */
export const TRACK = TRACKS.bringItOn;
export const MUSIC_START_BAR = 3;
export const MUSIC_START_S = TRACK.offsetS + MUSIC_START_BAR * ((4 * 60) / TRACK.bpm);
export const G = makeBeat(beatConfig(TRACK, { musicStartS: MUSIC_START_S }));

export const BAR = {
  hook: 3,
  logo: 8,
  how: 11,
  grid: 16,
  product: 20,
  testnet: 24,
  proof: 28,
  stats: 32,
  outro: 36,
  end: 40,
} as const;

/** One beat past bar 40 (the music is silent there) so the fade lands clean. */
export const TOTAL = G.bar(BAR.end) + G.beats(1);
