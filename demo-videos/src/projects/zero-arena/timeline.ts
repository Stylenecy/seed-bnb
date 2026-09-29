import { beatConfig, makeBeat, TRACKS } from "../../kit";

/**
 * zero-arena — "Hitslab — Marketing Ads" (82.65 BPM, first beat 0.464s,
 * bar = 2.904s = 87.1f). stax plays this file from 0; this cut starts it at
 * TRACK bar 1 (3.37s), so the hook opens on a downbeat and the bar-2 break
 * becomes the "PROVE IT." beat. Lifts from bar 11 (drops 11, 13, 17, 19).
 *
 *   S1 hook     bars  1 →  3  comic: bots brag ROI nobody can check → bar 2 break "PROVE IT."
 *   S2 logo     bars  3 →  5  ZA mark slam + "Zero Arena" → bar 4 break: tagline + NOW ON BNB CHAIN
 *   S3 how      bars  5 →  9  slide; 4 comic steps (certify · mint iNFT · live run · season)
 *   S4 product  bars  9 → 13  real dashboard on live testnet data: leaderboard → cert → live (DROP 11) → season #1
 *   S5 chain    bars 13 → 15  DROP: the hash chain — genesis → epoch 0 → epoch 1, "MATCHED!"
 *   S6 season   bars 15 → 17  whip: 0.002 tBNB pool → settle 0.001 + 0.001 refund; transfer oracle 400 / 403
 *   S7 proof    bars 17 → 19  DROP: 5 contracts, then 9 smoke txs
 *   S8 stats    bars 19 → 21  DROP: stat wall + honest caveat (0G storage skipped)
 *   S9 outro    bars 21 → end ZA mark + tagline + BNB badge, fades with the file (65.8s)
 */
export const TRACK = TRACKS.hitslab;
export const MUSIC_START_BAR = 1;
export const MUSIC_START_S = TRACK.offsetS + MUSIC_START_BAR * ((4 * 60) / TRACK.bpm);
export const G = makeBeat(beatConfig(TRACK, { musicStartS: MUSIC_START_S }));

export const BAR = {
  hook: 1,
  logo: 3,
  how: 5,
  product: 9,
  chain: 13,
  season: 15,
  proof: 17,
  stats: 19,
  outro: 21,
  end: 22,
} as const;

/** Bar 22 + 2 beats ≈ 65.8s of the file — its end; the music fades over the last bar. */
export const TOTAL = G.bar(BAR.end) + G.beats(2);
