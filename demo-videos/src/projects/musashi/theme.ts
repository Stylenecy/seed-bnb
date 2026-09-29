import { staticFile } from "remotion";
import { FONTS } from "../../kit";

/**
 * MUSASHI 武蔵 brand tokens, lifted from musashi/frontend (globals.css:
 * body #030303, landing gradient #050505 → #110505, amber-600 #d97706 accent
 * with glow, glass-dark-glow rgba(217,119,6,…), Inter + JetBrains Mono) plus
 * the samurai comic palette (washi paper, sumi ink, hinomaru crimson). BNB
 * gold is the chain accent.
 */
export const C = {
  bg: "#030303",
  bgWarm: "#110505",
  ink: "#0b0907",
  washi: "#efe4cc",
  washiDeep: "#d8c49c",
  amber: "#d97706",
  amberHi: "#f59e0b",
  amberSoft: "#fcd9a0",
  crimson: "#c62828",
  crimsonDeep: "#7a1014",
  gold: "#F0B90B",
  green: "#10b981",
  greenSoft: "#b8f0d8",
  rose: "#f43f5e",
  blue: "#3b82f6",
  text: "#f1f5f9",
  textMuted: "#94a3b8",
  textDim: "#64748b",
} as const;

/** Mincho for the kanji (macOS system font, render machine only). */
export const KANJI = "'Hiragino Mincho ProN', 'Hiragino Mincho Pro', 'Yu Mincho', 'Noto Serif JP', serif";

export const F = {
  display: FONTS.display,
  sans: FONTS.inter,
  mono: FONTS.mono,
  comic: FONTS.comic,
  kanji: KANJI,
};

/**
 * Real captures of the MUSASHI frontend (musashi/frontend `next start -p 3271`
 * with .env.bsc-testnet) talking to the real Go daemon (`musashi-core serve`
 * on :3270) — scripts/musashi/capture.mjs. Dashboard reputation / ledger are
 * LIVE BSC-testnet reads; gate checks are read-only LIVE BSC mainnet data.
 */
export const SCREEN = {
  landing: staticFile("musashi/01-landing.png"),
  pipeline: staticFile("musashi/01-landing-pipeline.png"),
  dashboard: staticFile("musashi/02-dashboard.png"),
  cake: staticFile("musashi/03-gates-cake.png"),
  aria: staticFile("musashi/04-gates-aria.png"),
  ledger: staticFile("musashi/05-ledger.png"),
} as const;

/** The project's own logo (musashi/frontend/public/musashi-logo.png, 647×386). */
export const LOGO = staticFile("musashi/logo.png");

/** Real BSC-testnet facts — deployments/bsc-testnet.json + VERIFY-BNB.md. */
export const CHAIN = {
  convictionLog: "0x194CAC98f5B66f203944e2047d168e4624418d49",
  convictionLogImpl: "0xFAEF4B46FE4c142328727b80AB0BAB67298DD408",
  inft: "0xF10dBDF8A385a60F97Eb1843BefcF18edFB57ac5",
  inftImpl: "0xA589e21A0469ada81D8bF6d108951FE08E475D4B",
  deployer: "0xb4fDcF406c50a789B125a1C27Fdf9ADDaC333308",
  deployBlock: 132984099,
  usdt: "0x55d398326f99059fF775485246999027B3197955", // BSC USDT (chain 56), the strike token
  cake: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
  aria: "0x5d3a12c42e5372b2cc3264ab3cdcf660a1555238",
  tx: {
    mint: "0xc97fd51a03bc8d9b19816c63398c78a5eea1f004a006435ccf4fda1f1bd6ae82",
    strike: "0x2b53b0691d77d62e2b22b704223653829df6604953e6a3a943fcffdc876b5b0d",
    outcome: "0x7d91cff21236ed2ef2e7d22801de1101ed298c0dd8727b4d216b17ffc9f13918",
  },
  gas: { mint: "222,322", strike: "188,897", outcome: "105,369" },
} as const;

export const short = (h: string, head = 6, tail = 4) => `${h.slice(0, head)}…${h.slice(-tail)}`;
