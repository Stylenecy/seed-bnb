import { beatConfig, makeBeat, TRACKS } from "../../kit";

/**
 * lance-hub — "Hitslab — Marketing Ads" (82.65 BPM, first beat 0.464s,
 * bar = 2.904s = 87.1f, beat = 21.8f). stax plays the file from bar 0,
 * zero-arena from bar 1, golda from bar 2; this short cut starts at TRACK bar 4
 * (12.08s) and rides the back half to the file's natural end (65.8s) ≈ 53.7s.
 * Lifts at bar 11; drops 13, 17, 19. All bar numbers are TRACK bars.
 *
 *   S1 hook     bars  4 →  6  comic: two apps, two separate balances → "SILOED!"
 *   S2 logo     bars  6 →  8  hub mark slam + "LanceHub" + LIVE ON CELO / NOW ON BNB CHAIN
 *   S3 celo     bars  8 → 10  slide: live Celo mainnet reads of the proxy 0xb70c…5cA2
 *   S4 how      bars 10 → 13  whip: deposit · play · fundPool · redeem (lift on 11) → "ONE POOL"
 *   S5 product  bars 13 → 15  DROP zoom: real Bingo BSC create screen (LANCE stake) + drawn hub console
 *   S6 proof    bars 15 → 17  BSC testnet contracts, then the 4 smoke txs + Bingo allowToken(LANCE)
 *   S7 stats    bars 17 → 19  DROP: stat wall from VERIFY-BNB.md
 *   S8 outro    bars 19 → end DROP: ecosystem constellation + lockup, fades with the file
 */
export const TRACK = TRACKS.hitslab;
export const MUSIC_START_BAR = 4;
export const MUSIC_START_S = TRACK.offsetS + MUSIC_START_BAR * ((4 * 60) / TRACK.bpm);
export const G = makeBeat(beatConfig(TRACK, { musicStartS: MUSIC_START_S }));

export const BAR = {
  hook: 4,
  logo: 6,
  celo: 8,
  how: 10,
  product: 13,
  proof: 15,
  stats: 17,
  outro: 19,
  end: 22,
} as const;

/** Bar 22 + 2 beats ≈ 65.8s of the file (its end); music fades over the last bar. */
export const TOTAL = G.bar(BAR.end) + G.beats(2);
