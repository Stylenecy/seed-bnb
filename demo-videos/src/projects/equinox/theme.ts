import { staticFile } from "remotion";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { FONTS } from "../../kit";

/**
 * Equinox Agent brand tokens — lifted from Equinox-agent/frontend/app/globals.css
 * (@theme): near-black ink, lime accent #e4f33d, violet→blue brand gradient,
 * emerald / amber / rose health states (HealthGauge.tsx). Space Grotesk is the
 * app's own face. BNB gold is the chain accent.
 */
const sg = loadSpaceGrotesk("normal", { weights: ["300", "400", "500", "600", "700"], subsets: ["latin"], ignoreTooManyRequestsWarning: true });

export const C = {
  bg: "#0f0f0f",
  surface: "#131512",
  card: "#191919",
  text: "#ededeb",
  textMuted: "#8a8a85",
  textDim: "#555550",
  lime: "#e4f33d",
  violet: "#9181f5",
  violetSoft: "#b6a8ff",
  indigo: "#4361fc",
  azure: "#407aff",
  emerald: "#16d9a8",
  emeraldSoft: "#6cf2cc",
  amber: "#ffc46b",
  rose: "#ff7a90",
  danger: "#ff6b6b",
  cyan: "#5cd8ff",
} as const;

export const BRAND_GRADIENT = `linear-gradient(90deg, ${C.violet} 0%, ${C.indigo} 45.5%, ${C.azure} 100%)`;

export const F = {
  display: FONTS.display,
  sans: sg.fontFamily, // the app ships Space Grotesk
  mono: FONTS.mono,
  comic: FONTS.comic,
};

/** HF → the app's own status colours (HealthGauge.tsx statusForHF). */
export const hfColor = (hf: number): string => (hf >= 1.5 ? C.emerald : hf >= 1.3 ? C.amber : C.rose);

/**
 * Real captures of the frontend (scripts/equinox/capture.mjs, next start :3230
 * with frontend/.env.bsc-testnet). The frontend is MOCK DATA ONLY — every shot
 * is labelled "UI preview (mock data)" on screen. 1920×1080.
 */
export const SCREEN = {
  concepts: staticFile("equinox/01-concepts.png"),
  onboarding: staticFile("equinox/02-onboarding.png"),
  dashboard: staticFile("equinox/03-dashboard.png"),
  activity: staticFile("equinox/04-activity.png"),
  withdraw: staticFile("equinox/05-withdraw.png"),
} as const;

/** Real BSC-testnet facts — contracts/deployments/bsc-testnet.json + VERIFY-BNB.md. */
export const CHAIN = {
  registry: "0x3295b8931F72D98D426334f8266aDC0a7c661537",
  oracle: "0xcC4041A339686d812aFB0d8697ce2EBeEaC5e95d",
  vaults: "0x5735380DD9Fa22f2c6f5B5e34A6Cb0619CA90B32",
  poolDebt: "0xEbC610e820f6997bF8BC53C596B6fB00799E2d49",
  poolColl: "0x647A40014401B65c23518D9d11772a0530d49549",
  shadow: "0x3D8bC76c19257E5f56b21Bfcc08f01845c193C89",
  tWBNB: "0xe3768ca9E91B43F9f96f1A5d37848e2568023923",
  tUSDT: "0x3Ba7BFdFe0D3a5435665839e4F8F57Fd874Cb6d4",
  tx: {
    price700: "0xe9bc3653d861edb11aafcb76f88771c715e92a58ab0d98c7e1ec070ce99e89e2",
    openVault: "0x7752a7c0f68e466b891e41e5cb2728eebb631944ecf0d439ce082ebf507400e5",
    deposit: "0x12d11f2719a1dee9229e346bea09336b50e8e0df0afa65055b078029a890b309",
    openAgent: "0x3fe39baef509f9220c7664e55fef20aa2d3cd17cae04d77df3e0ac7a2889da26",
    skim: "0xeaea3333480f38e0152c9251e465b86b11b1bdd3b5b363880878ab89cb859eac",
    record: "0x4bec85f211fbb225c51052f92b52089f1c530f6926ad4b4b7d33a32cb1e4e03b",
    crash: "0x5586676c58569140a3d45679c1e80595c5641357b60a48d0120f0d2b2543df85",
    defend: "0xe5edc92ad34b6eb18b210b6b8543e665d74fb5b507ea56c82f11b9e7896eeaa4",
  },
} as const;

export const short = (h: string, head = 6, tail = 4) => `${h.slice(0, head)}…${h.slice(-tail)}`;
