import { staticFile } from "remotion";

/**
 * Narration (VO) cue sheet — BNB Chain version, NEW script (2026-09-27).
 * Generated with edge-tts `en-GB-RyanNeural` (British male neural; per-line
 * rate/pitch tuning), silence-trimmed with ffmpeg and two-pass loudness-
 * normalized to −12 LUFS (scratchpad tn/vo/gen.sh + lines.tsv). The script
 * EXPLAINS beyond the on-screen text (control not privacy, the trigger rule,
 * the Solidity contract, live BSC testnet) — it never just reads the slams.
 * Music ducks to 0.35 under each line (duckAt / Main.tsx).
 *
 * `at` is the COMP frame the line starts on — every cue sits ON a beat of the
 * grid (beat.ts) nearest the measured on-screen step; `dur` is the clip
 * length in frames (ffprobe — keep in sync if a line is regenerated).
 */
export type VoCue = { src: string; at: number; dur: number };

const V = (name: string): string => `audio/vo/${name}.m4a`;

export const VO_CUES: VoCue[] = [
  // S1 hook — phrase-synced to the panels ("Your loan. In public." 120 ·
  // "One price dip" 176 · "Sold." 288).
  { src: V("vo-01a-onchain"), at: 7, dur: 81 }, // "You put your Treasuries on-chain, and borrowed against them."
  { src: V("vo-01b-dip"), at: 176, dur: 62 }, // "Then, one bad day in the market..."
  { src: V("vo-01c-sold"), at: 288, dur: 92 }, // "and a liquidation bot sells you out. In public."
  // S3 comic strip — the product in one breath, then the guard (after the
  // "I watch." slam at 691).
  { src: V("vo-02-cermin"), at: 471, dur: 196 }, // "With Cermin, you post your Treasury, … a reserve that only you and your guard can move."
  { src: V("vo-03-guard"), at: 710, dur: 134 }, // "A Guard Agent watches your loan around the clock, and steps in before any liquidator can."
  // S4 demo — BSC testnet take. Measured S4-local steps (comp = local + 907):
  // type 13–32 · funded 158 · drag 233–306 · Aggressive 376 · Sweep 476 ·
  // Confirm 556 / Done 594 · ring 627 · vault 681 → 1,500 at 791 · Simulate
  // 834 · drop 874 · rescue click 953 · 126.7% 989 · green 145.0% 1024.
  { src: V("vo-d1-live"), at: 921, dur: 152 }, // "This is the live app, on BSC testnet. Your name becomes a real on-chain address."
  { src: V("vo-d2-borrow"), at: 1090, dur: 123 }, // "Claim test Treasury tokens, then slide to borrow six thousand dollars against them."
  { src: V("vo-d3-strategy"), at: 1245, dur: 143 }, // "Pick a strategy, not a percentage. Balanced steps in at one hundred and thirty per cent."
  { src: V("vo-d4-confirm"), at: 1399, dur: 126 }, // "Coupon Sweep on, and confirm. Four transactions land on-chain."
  { src: V("vo-d5-vault"), at: 1554, dur: 149 }, // "One sixty-seven per cent, and healthy. Now fund the Shadow Vault with fifteen hundred."
  { src: V("vo-d6-crash"), at: 1737, dur: 162 }, // "Now crash the market. The oracle drops to seventy-six cents, and the loan slides below its trigger."
  { src: V("vo-d7-rescued"), at: 1934, dur: 152 }, // "No click needed. The Guard Agent repaid from your vault, on its own. Back to green."
  // S4b yield — the coupon note lands at comp 2150.
  { src: V("vo-10-coupon"), at: 2116, dur: 127 }, // "And when your Treasury pays its coupon, the agent sweeps it straight into your loan."
  // S4c mechanism chart — the step-down insight (touches at 2369 / 2482).
  { src: V("vo-11-mechanism"), at: 2271, dur: 199 }, // "Here's the trick. Every rescue shrinks your debt, …"
  // S5 control — ends as "The pool can't touch it." slams (2834).
  { src: V("vo-12-control"), at: 2608, dur: 229 }, // "On a public chain, the real question is control. …"
  // S5b UNDER THE HOOD — stage 1 flow, stage 2 rules (bar 27 = 3101), headline (3326).
  { src: V("vo-15-contract"), at: 2890, dur: 224 }, // "Under the hood, it's one Solidity contract: CerminRWA. …"
  { src: V("vo-16-rules"), at: 3129, dur: 149 }, // "The contract names who may act on each piece. The pool can touch the loan, never your vault."
  { src: V("vo-16b-trigger"), at: 3326, dur: 93 }, // "And the guard's repay reverts, unless you're below your own trigger."
  // S6 proof wall (badge 3439, cards 3495–3664).
  { src: V("vo-13-proof"), at: 3453, dur: 208 }, // "None of this is a mock-up. Every step you just watched is a real transaction on BSC testnet, …"
  // S7 close — rides the outro.
  { src: V("vo-14-close"), at: 3734, dur: 160 }, // "Cermin R W A. Borrow against your Treasuries, and let the guard keep you out of liquidation."
];

export const voSrc = (cue: VoCue): string => staticFile(cue.src);

/** Duck multiplier for the MUSIC at a COMP frame: dips to 0.5 under a VO line
 *  with a 8-frame ease in and a 12-frame recovery. */
const DUCK = 0.35;
const IN = 8;
const OUT = 12;
export const duckAt = (compFrame: number): number => {
  let m = 1;
  for (const c of VO_CUES) {
    const start = c.at - IN;
    const end = c.at + c.dur + OUT;
    if (compFrame <= start || compFrame >= end) continue;
    let v = DUCK;
    if (compFrame < c.at) {
      const t = (compFrame - start) / IN; // 0..1
      v = 1 - (1 - DUCK) * t;
    } else if (compFrame > c.at + c.dur) {
      const t = (compFrame - (c.at + c.dur)) / OUT; // 0..1
      v = DUCK + (1 - DUCK) * t;
    }
    m = Math.min(m, v);
  }
  return m;
};
