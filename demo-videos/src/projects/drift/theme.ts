import { staticFile } from "remotion";
import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { FONTS } from "../../kit";

/**
 * DRIFT brand tokens — lifted from drift/apps/web (Tailwind classes in
 * features/trade + features/dashboard): near-black #0b0c0f cockpit, the
 * periwinkle accent #9aa8f0 (buttons, links, guard banner), emerald/rose for
 * up/down, amber for warnings. The app ships Geist + Geist Mono.
 * BNB gold is the chain accent.
 */
const geist = loadGeist("normal", { weights: ["300", "400", "500", "600", "700", "800"], subsets: ["latin"], ignoreTooManyRequestsWarning: true });
const geistMono = loadGeistMono("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"], ignoreTooManyRequestsWarning: true });

export const C = {
  bg: "#0b0c0f",
  panel: "#111216",
  card: "#15161b",
  line: "rgba(255,255,255,0.09)",
  text: "#ececf1",
  textMuted: "#8b8d98",
  textDim: "#55575f",
  peri: "#9aa8f0",
  periSoft: "#aeb9f4",
  periDeep: "#14152b",
  green: "#34d399",
  red: "#f87171",
  amber: "#fbbf24",
  gold: "#F0B90B",
} as const;

export const F = {
  display: FONTS.display,
  sans: geist.fontFamily,
  mono: geistMono.fontFamily,
  comic: FONTS.comic,
};

/** Regime enum on MacroGuard: RiskOn=0, Neutral=1, RiskOff=2 (engine labels). */
export const REGIME = {
  on: { label: "RISK-ON", color: C.green },
  neutral: { label: "NEUTRAL", color: "#c7c9d3" },
  off: { label: "RISK-OFF", color: C.red },
} as const;

/**
 * Real captures of the DRIFT web cockpit (scripts/drift/capture.mjs): `next
 * build` with NEXT_PUBLIC_TRADER_URL → the real Python engine on :3240, which
 * reads the live BSC-testnet MacroGuard. 1600×1000 @1.2 = 1920×1200.
 */
export const SCREEN = {
  landing: staticFile("drift/01-landing.png"),
  markets: staticFile("drift/02-dashboard.png"),
  research: staticFile("drift/08-research.png"),
  guard: staticFile("drift/09-guard.png"),
  logo: staticFile("drift/logo.png"),
} as const;
export const SHOT_W = 1920;
export const SHOT_H = 1200;

/** Real BSC-testnet facts — contracts/deployments/bsc-testnet.json + VERIFY-BNB.md (receipts re-checked: status 1). */
export const CHAIN = {
  guard: "0x8F2CbB56Cc9A46EfC3997146369257Ff9450Fe5A",
  agent: "0xE85f64383Fd58ddC0b7eC64EF1557317B91Ac0B1",
  tx: {
    deploy: "0xd5a98f89e24d30f1d828e50753d7146fad4aa078cd16af831dc81763b6d66056",
    riskOff: "0x2ef7c028dac1c3f9b872448e7a53011b9a6792b8d0f3228c1e2b8907ac06f54f",
    dd5: "0x90ce4065711ce98d48cb2eb601a0068d4bb40fabd64f927f1ebe1ef36ced37f6",
    dd25: "0x4b9b0379eb0835fbd87c85b5c08e10b636ac8814cb9f9b90a0abdeeb88d21701",
    resume: "0x42d3f85fced0679dd27fde647265c24cbddcef0b0d6892e05b268802b1965b70",
    neutral: "0x9f05d9ce0cc7e0a56ff3d75a3593e4b210d595b004e5bddc19c0d5fbca72908b",
    castRiskOn: "0xda1845eec6aa454a79d6ec764207998142f3aa8e0daa3220044f052607a4a318",
    engineRestore: "0x0630981c8e7717d4e6f78c9ba3b178fba7ed5eab7c8a5bddf84c063192c67b31",
    engineRecord: "0x2d76d8f2458d855cf507fcc9d0e607124e417fabfb1d823b48ffba7a46ba9cd6",
  },
  /** gasUsed from the receipts. */
  gas: { deploy: 449207, riskOff: 27790, dd5: 33225, dd25: 34347, resume: 27030, neutral: 27802, engineRestore: 27802, engineRecord: 33203 },
  notAgent: "0x0d9ab13f",
  totalGas: "0.0000688",
} as const;

export const short = (h: string, head = 6, tail = 4) => `${h.slice(0, head)}…${h.slice(-tail)}`;
