import { beatConfig, makeBeat, TRACKS } from "../../kit";

/**
 * iusd-pay — "Bring It On" (128.01 BPM, first beat 0.209s). Bars are TRACK
 * bars (1 bar = 1.875s = 56.24f). Structure: 3 bars up + 1 break bar, drops
 * on 4, 8, 12, … 36; outro tail 38–39; silent from bar 40.
 *
 *   S1 hook      bars  0 → 4   comic problem strip (bar 3 = break "UGH!")
 *   S2 logo      bars  4 → 7   DROP: logo slam + "Now on BNB Chain"
 *   S3 how       bars  7 → 12  slide in on the break; 4 steps on bars 8–11
 *   S4 product   bars 12 → 20  DROP: real app screens (sign-in → card → send → auto-claim)
 *   S5 gifts     bars 20 → 24  whip in; gift boxes pop on beats
 *   S6 proof     bars 24 → 32  DROP: contracts (24–27) then txs (28–31)
 *   S7 stats     bars 32 → 36  DROP (max energy): stat wall, one per bar
 *   S8 outro     bars 36 → 40+ logo + tagline + BNB badge, rides the outro
 */
export const TRACK = TRACKS.bringItOn;
export const G = makeBeat(beatConfig(TRACK));

export const BAR = {
  hook: 0,
  logo: 4,
  how: 7,
  product: 12,
  gifts: 20,
  proof: 24,
  stats: 32,
  outro: 36,
  end: 40,
} as const;

/** Ends one beat after bar 40 (music is silent there) so the fade lands clean. */
export const TOTAL = G.bar(BAR.end) + G.beats(1);
