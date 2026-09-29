import { staticFile } from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadSans } from "@remotion/google-fonts/SchibstedGrotesk";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import { FONTS } from "../../kit";

/**
 * TESSERA brand tokens — lifted verbatim from Tessera/frontend/src/app/globals.css
 * ("Obsidian Observatory"): obsidian surfaces, warm bone text, ember signature,
 * signal-cyan for live data. Display Instrument Serif · UI Schibsted Grotesk ·
 * data IBM Plex Mono (the app's own next/font trio). BNB gold is the chain accent.
 */
const serif = loadSerif("normal", { weights: ["400"], subsets: ["latin"], ignoreTooManyRequestsWarning: true });
loadSerif("italic", { weights: ["400"], subsets: ["latin"], ignoreTooManyRequestsWarning: true });
const sans = loadSans("normal", { weights: ["400", "500", "600", "700", "800", "900"], subsets: ["latin"], ignoreTooManyRequestsWarning: true });
const mono = loadMono("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"], ignoreTooManyRequestsWarning: true });

export const C = {
  void: "#07090a",
  bg: "#0a0c0e",
  surface: "#0f1417",
  raised: "#151c21",
  line: "#222b31",
  lineBright: "#33404a",
  bone: "#ece7da",
  boneDim: "#9ba39f",
  boneFaint: "#626c6a",
  ember: "#e8633a",
  emberBright: "#ff7d52",
  emberDeep: "#a83c1c",
  signal: "#46d6d0",
  signalBright: "#74f2ec",
  signalDeep: "#1c817d",
  good: "#5fd1a0",
  warn: "#e8b23a",
  bad: "#ef5d5d",
  gold: "#F0B90B",
} as const;

export const F = {
  display: serif.fontFamily,
  sans: sans.fontFamily,
  mono: mono.fontFamily,
  comic: FONTS.comic,
};

/**
 * Real captures of the Tessera frontend (scripts/tessera/capture.mjs): a copy of
 * Tessera/frontend, `next build` with NEXT_PUBLIC_API_URL=http://localhost:3300 →
 * the real Go backend (`PORT=3300 ./tessera serve`), `next start -p 3301`.
 * 1600×1000 @1.2 = 1920×1200.
 */
export const SCREEN = {
  landing: staticFile("tessera/01-landing.png"),
  features: staticFile("tessera/02-features.png"),
  dashboard: staticFile("tessera/03-dashboard.png"),
  dashAddr: staticFile("tessera/04-dashboard-addr.png"),
} as const;
export const SHOT_W = 1920;
export const SHOT_H = 1200;

/**
 * Chain facts — Tessera has NO contracts and signs NO txs. Everything here is
 * from VERIFY-BNB.md + the live read-only runs in scripts/tessera/runs/.
 */
export const CHAIN = {
  rpc: {
    56: "bsc-dataseed.bnbchain.org",
    204: "opbnb-mainnet-rpc.bnbchain.org",
    97: "data-seed-prebsc-1-s1.bnbchain.org:8545",
  },
  hotWallet: "0xF977814e90dA44bFA03b6295A0616a897441aceC",
  pcsV3: "0x678Aa4bF4E210cf2166753e054d5b7c31cc7fa86",
  pcsV2: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  pcsTestnet: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
  usdt: "0x55d398326f99059fF775485246999027B3197955",
  usdc: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  fdusd: "0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409",
} as const;

export const short = (h: string, head = 6, tail = 4) => `${h.slice(0, head)}…${h.slice(-tail)}`;
