/**
 * Design tokens — lifted verbatim from the Cermin frontend dark theme
 * (`frontend/src/index.css`). The video must look like the app, exactly.
 */

export const COLORS = {
  // Surfaces, darkest (page) to most elevated.
  app: "#0a0c10",
  raised: "#171a21",
  sunken: "#1c1f27",
  overlay: "#262a34",
  overlayStrong: "#343945",
  // Hairlines.
  hairline: "rgba(243, 237, 226, 0.08)",
  hairlineStrong: "rgba(243, 237, 226, 0.14)",
  // Foreground / parchment text.
  text: "#f3ede2",
  muted: "#c9c2b4",
  faint: "#8b8778",
  // Brand accent (gold).
  gold: "#c9a869",
  goldSoft: "#e4cf9d",
  onGold: "#0a0c10",
  // Status families.
  sage: "#8fc39b",
  sageDim: "#3c4a3f",
  amber: "#dba75c",
  amberDim: "#4a3f2b",
  terracotta: "#d68a6c",
  terracottaDim: "#4a352d",
} as const;

export const SHADOW_CARD =
  "0 1px 0 rgba(243, 237, 226, 0.04) inset, 0 20px 40px -24px rgba(0, 0, 0, 0.6)";

export const RADIUS = 16;

// Atmosphere background: ink app color with a faint gold glow top-left and a
// faint sage glow top-right (mirrors the FE's atmosphere gradients).
export const ATMOSPHERE_BG = [
  "radial-gradient(60% 50% at 12% 0%, rgba(201, 168, 105, 0.10), transparent 60%)",
  "radial-gradient(55% 45% at 88% 2%, rgba(143, 195, 155, 0.07), transparent 60%)",
  `linear-gradient(${COLORS.app}, ${COLORS.app})`,
].join(", ");

import { FPS, XFADE_FRAMES, TOTAL_FRAMES, SEAM_FRAME, barA, barB, barC } from "./beat";

export { FPS };

/** Soft-gap crossfade/slide overlap (half a beat). Impact gaps are hard cuts. */
export const TRANSITION = XFADE_FRAMES;

/**
 * Scene START frames — every boundary lands exactly on a bar of the beat grid.
 *   S1  cold open     0        → barA(7)  crash slam on bar 4 (DROP 1)
 *   S2  logo reveal   barA(7)  → barA(8)  reveals in the quiet breakdown
 *   S3  diagram       barA(8)  → barA(15) comic strip, incident on the PEAK
 *   S4a live journey  barA(15) → barB(13) ONE unbroken take: login → rescue (seam)
 *   S4b YIELD reveal  barB(13) → barB(16) enters at the seam (coupon swept)
 *   S4c MECHANISM     barB(16) → barB(22) defense-vs-liquidation chart (6 bars)
 *   S5  control       barB(22) → barB(27) split-panel + 0/0/0 zeros (5 bars)
 *   S5b UNDER HOOD    barC(23) → barC(33) money flow + per-party contracts (10 bars)
 *   S6  BSC proof     barC(33) → barC(38) one stat per bar (5 bars)
 *   S7  close         barC(38) → TOTAL    launch close, rides the real outro
 *
 *  NOTE barC(23) === barB(27) === 2876 — the SEAM2 comp frame — so S5 privacy is
 *  byte-for-byte unchanged; the new S5b explainer slots in where S6 used to
 *  start, and S6/S7 shift ~9.3s later onto part-C's real outro.
 */
export const SCENE_START = {
  s1: 0,
  s2: barA(7), // 401 — ONE bar only: the logo blinks in the quiet and cuts
  s3: barA(8), // 457 — comic strip slams in exactly as the build re-enters
  s4a: barA(16), // 907 — SAVED panel holds a full bar; the demo trims its
  // redundant landing hover by exactly one bar, so every footage moment keeps
  // its absolute comp time (trimBefore compensates the later start)
  s4b: SEAM_FRAME, // 2088 (= barB(13)) — YIELD reveal enters at the seam
  s4c: barB(16), // 2257 — MECHANISM explainer: defense-vs-liquidation chart
  s5: barB(22), // 2594 — privacy split-panel
  s5btech: barC(23), // 2876 (= barB(27); = SEAM2) — UNDER THE HOOD explainer
  s6: barC(33), // 3439 — BSC testnet proof
  s7: barC(38), // 3720 — launch close (rides the real outro)
} as const;

/** Total composition length (frames) — the launch cut now rides the track's
 *  REAL outro and lands on ink+silence together (~2:11). */
export const TOTAL_DUR = TOTAL_FRAMES;

/**
 * TransitionSeries sequence durations. Each = (next scene's bar start − this
 * scene's bar start) + the transition that FOLLOWS it, so every scene's own
 * frame 0 lands exactly on its bar. Only ONE gap now carries a soft transition
 * (S5→S5b slide — the same slide that used to lead into S6, unmoved in comp
 * time because barC(23) === barB(27)); the impact gaps — S1→S2, S2→S3, S3→S4a,
 * the S4a→S4b SEAM, S4b→S4c, S4c→S5, S5b→S6 (SEAM2) and S6→S7 — are hard cuts
 * that land the incoming scene on the downbeat.
 */
export const SCENE_DUR = {
  s1: SCENE_START.s2 - SCENE_START.s1, // hard cut → S2
  s2: SCENE_START.s3 - SCENE_START.s2, // HARD CUT → S3, on the bar-8 downbeat
  s3: SCENE_START.s4a - SCENE_START.s3, // hard cut → S4a
  s4a: SCENE_START.s4b - SCENE_START.s4a, // hard cut (seam) → S4b
  s4b: SCENE_START.s4c - SCENE_START.s4b, // hard cut → S4c
  s4c: SCENE_START.s5 - SCENE_START.s4c, // hard cut → S5
  s5: SCENE_START.s5btech - SCENE_START.s5 + TRANSITION, // slide → S5b (unchanged: barC(23)===barB(27))
  s5btech: SCENE_START.s6 - SCENE_START.s5btech, // hard cut (seam 2) → S6
  s6: SCENE_START.s7 - SCENE_START.s6, // hard cut → S7
  s7: TOTAL_DUR - SCENE_START.s7,
} as const;
