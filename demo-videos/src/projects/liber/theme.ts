import { staticFile } from "remotion";
import { loadFont as loadNewsreader } from "@remotion/google-fonts/Newsreader";
import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { FONTS } from "../../kit";

/**
 * Liber brand tokens — lifted verbatim from stellar-apac/frontend/src/app/globals.css
 * (@theme inline) and fonts.ts (Newsreader display + Bricolage Grotesque body).
 * BNB gold #F0B90B is the chain accent; Liber's own gold (#e7a33a) is the CTA colour.
 */
export const C = {
  ink: "#101e1a",
  paper: "#f5f7f1",
  emerald: "#0b6b4e",
  bright: "#2fd98a",
  deep: "#063d2c",
  gold: "#e7a33a",
  goldDeep: "#8a5c14",
  rose: "#d6533f",
  bg: "#06120e",
  text: "#eef3ee",
  dim: "rgba(238,243,238,0.62)",
} as const;

const opts = { subsets: ["latin"] as ["latin"], ignoreTooManyRequestsWarning: true };
const newsreader = loadNewsreader("normal", { weights: ["400", "500", "600"], ...opts });
loadNewsreader("italic", { weights: ["400", "500", "600"], ...opts });
const bricolage = loadBricolage("normal", { weights: ["400", "500", "600", "700", "800"], ...opts });

export const F = {
  display: newsreader.fontFamily,
  sans: bricolage.fontFamily,
  mono: FONTS.mono,
  comic: FONTS.comic,
};

/** Balance-card gradient from GradientBalanceCard.tsx (emerald-deep → emerald → emerald-bright). */
export const CARD_GRADIENT = `linear-gradient(135deg, ${C.deep} 0%, ${C.emerald} 55%, ${C.bright} 100%)`;

/**
 * REAL captures of the Liber frontend (next build, chain 97, MockUSDC
 * 0x2116…cC97, real backend) — scripts/liber/capture.mjs. 860×1864 (430×932 @2x).
 */
export const SCREEN = {
  landing: staticFile("liber/01-landing.png"),
  onboarding: staticFile("liber/02-onboarding.png"),
  awaiting: staticFile("liber/03-awaiting-funding.png"),
  home: staticFile("liber/04-home.png"),
  profile: staticFile("liber/05-profile.png"),
  topup: staticFile("liber/06-topup.png"),
  history: staticFile("liber/07-history.png"),
  quote: staticFile("liber/09-quote.png"),
} as const;

/** Real BSC-testnet facts — contracts/deployments/bsc-testnet.json + VERIFY-BNB.md. */
export const CHAIN = {
  mockUsdc: "0x2116D4a3f11Aa7059Ad0911ad5C89897CC0BcC97",
  deployer: "0xE2D654a82893c5F97A40332D0f0ACb6Ad34318b5",
  kolo: "0x000000000000000000000000000000000000dEaD", // stand-in Kolo address used in the smoke run
  tx: {
    deploy: "0xf1b791670032e6fc7d0d1b1afe8d6720d2d89dd38de51bfa5e5215e734451941",
    faucet: "0xa3926a9e0b864e501c77fc2b06a9de32be8e1639e7795c3e440c7835da09d7e5",
    transfer: "0xe0a9a6b78beb2701bcf4d4499b0ad76ffba16590a465b18d0989dd86b46f06b4",
  },
  activationBnb: "0.001",
  gasSpent: "~0.000106 tBNB",
  mainnetUsdc: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
} as const;
