/**
 * Kit-wide neutral tokens. Project brand colours live in
 * src/projects/<slug>/theme.ts and are passed into kit components as props
 * (every kit component has sensible defaults from here).
 */
export const INK = "#08090b"; // comic ink: outlines, hard shadows, page
export const PAPER = "#f4efe4"; // comic paper / parchment lettering
export const BNB_GOLD = "#F0B90B";
export const BNB_GOLD_SOFT = "#F8D33A";

/** Premium dark "liquid glass" neutrals (perps-agent look). */
export const GLASS = {
  bg: "#07080a",
  fill: "rgba(255,255,255,0.035)",
  fillHi: "rgba(255,255,255,0.06)",
  line: "rgba(255,255,255,0.10)",
  grid: "rgba(255,255,255,0.045)",
  txt: "#EEF0F2",
  txtMid: "rgba(238,240,242,0.74)",
  txtDim: "rgba(238,240,242,0.50)",
  txtFaint: "rgba(238,240,242,0.32)",
} as const;

export const SUCCESS = "#34C759";
export const DANGER = "#FF5A4E";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
