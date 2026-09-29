import { staticFile } from "remotion";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import { FONTS } from "../../kit";

/**
 * NEURAL ALPHA brand tokens — lifted verbatim from
 * bnbhack-winn/neural-alpha/dashboard/src/app/globals.css (@theme inline):
 * void/surface/raised Binance-style darks, neon green #0ecb81 (buy, running,
 * logo), cyan #1e9ff2, danger #f6465d, warning = BNB gold #f0b90b.
 * The dashboard ships Inter + IBM Plex Mono; Fraunces is the kit display serif.
 */
const mono = loadMono("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"], ignoreTooManyRequestsWarning: true });

export const C = {
  void: "#050608",
  surface: "#0e1013",
  raised: "#14171c",
  overlay: "#1c2026",
  line: "#1f2328",
  lineBright: "#2b3139",
  neon: "#0ecb81",
  neonSoft: "#5fe3ad",
  neonDeep: "#07784c",
  cyan: "#1e9ff2",
  danger: "#f6465d",
  gold: "#F0B90B",
  text: "#eaecef",
  text2: "#b7bdc6",
  muted: "#848e9c",
} as const;

export const F = {
  display: FONTS.display,
  sans: FONTS.inter,
  mono: mono.fontFamily,
  comic: FONTS.comic,
};

/**
 * Real captures of the Neural Alpha dashboard (scripts/neural-alpha/capture.mjs):
 * `next build` + `next start -p 3321`, AGENT_API_URL → the real agent on :3320
 * (AGENT_MODE=paper, BRIDGE_MODE=mock, TWAK CLI off, no keys), paused after
 * cycle 8. 1600×1000 @1.2 = 1920×1200.
 */
export const SCREEN = {
  overview: staticFile("neural-alpha/01-overview.png"),
  trades: staticFile("neural-alpha/02-trades-brain.png"),
  positions: staticFile("neural-alpha/03-positions-wallet.png"),
  signals: staticFile("neural-alpha/04-signals.png"),
} as const;
export const SHOT_W = 1920;
export const SHOT_H = 1200;

/**
 * Chain facts — Neural Alpha deploys NO contracts; this demo signed NO txs.
 * Everything is from VERIFY-BNB.md + the live read-only runs in
 * scripts/neural-alpha/runs/ (2026-09-25 UTC).
 */
export const CHAIN = {
  /** A real BSC trader (not ours) the trade-history scanner was pointed at. */
  trader: "0x0f0067cd819cb8f20bda62046daff7a2b5c88280",
  /** The 4 swaps `fetchRpcRecentTradeHistory` returned (receipts: status 1). */
  swaps: [
    { hash: "0xab624ee807845e8206819b9154b7537522c5c0d9f8b8eaf2589b722e04825a77", pair: "FF → USDT", amt: "702.92 FF → 93.12 USDT", block: 123999203 },
    { hash: "0x47661bfcdd176f4bddd8d544ccf59513fd00d367adfb397066458dd4b8e7239c", pair: "USDT → INJ", amt: "77.60 USDT → 9.4670 INJ", block: 123999158 },
    { hash: "0x733b8155cffb99aca9686e4a3934327eb8e5d2964c3e77ca57e7cfd2091bafe6", pair: "USDT → ETH", amt: "682.88 USDT → 0.25341 ETH", block: 123999130 },
    { hash: "0x3ae3bede6f8bfa8cc460197108b5228ec156619791e31633e96269d21680f0f9", pair: "USDT → LTC", amt: "46.55 USDT → 0.65536 LTC", block: 123999085 },
  ],
  pengu: "0x6418c0dd099a9FDA397C766304CDd918233E8847",
  usdt: "0x55d398326f99059fF775485246999027B3197955",
} as const;

/** The 11 corrected BEP-20 entries, re-read on-chain (runs/bep20-verify.json). */
export const FIXED = [
  { sym: "BONK", onchain: "Bonk", dec: 5 },
  { sym: "DEXE", onchain: "DEXE", dec: 18 },
  { sym: "BRETT", onchain: "BRETT", dec: 18 },
  { sym: "LUNC", onchain: "LUNA", dec: 6 },
  { sym: "PENGU", onchain: "PENGU", dec: 18 },
  { sym: "SUSHI", onchain: "SUSHI", dec: 18 },
  { sym: "COMP", onchain: "COMP", dec: 18 },
  { sym: "AXS", onchain: "AXS", dec: 18 },
  { sym: "STG", onchain: "STG", dec: 18 },
  { sym: "BabyDoge", onchain: "BabyDoge", dec: 9 },
  { sym: "APE", onchain: "APE", dec: 18 },
] as const;
export const REMOVED = ["SNX", "LDO", "RAY", "NILA"] as const;

export const short = (h: string, head = 6, tail = 4) => `${h.slice(0, head)}…${h.slice(-tail)}`;
