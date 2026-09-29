import { beatConfig, makeBeat, TRACKS } from "../../kit";

/**
 * stax — "Hitslab — Marketing Ads" (82.65 BPM, first beat 0.464s). Bars are
 * TRACK bars (1 bar = 2.904s = 87.1f). Steady bed, breaks on bars 2 and 4,
 * lifts from bar 11 (drops 11, 13, 17, 19), last bar 21, audio ends ~65.8s.
 *
 *   S1 hook      bars  0 → 3   comic problem: "which stocks? how much risk?" (bar 2 break "UGH.")
 *   S2 logo      bars  3 → 5   logo slam + "Now on BNB Chain" (bar 4 break = subtitle beat)
 *   S3 how       bars  5 → 9   slide in; 4 comic steps, one per bar
 *   S4 product   bars  9 → 13  real Stax app: home → Vera builds → plan (bar 11 lift) → invested
 *   S5 vera      bars 13 → 15  DROP: Vera, ERC-8004 agent 97:2473
 *   S6 proof     bars 15 → 19  contracts (15–16) then the $20 smoke txs (17 DROP–18)
 *   S7 stats     bars 19 → 21  DROP: stat wall, a panel every 2 beats
 *   S8 outro     bars 21 → end logo + tagline + BNB badge, fade with the track
 */
export const TRACK = TRACKS.hitslab;
export const G = makeBeat(beatConfig(TRACK));

export const BAR = {
  hook: 0,
  logo: 3,
  how: 5,
  product: 9,
  vera: 13,
  proof: 15,
  stats: 19,
  outro: 21,
  end: 22,
} as const;

/** Bar 22 + 2 beats ≈ 65.8s — the file's end; music fades over the last bar. */
export const TOTAL = G.bar(BAR.end) + G.beats(2);
