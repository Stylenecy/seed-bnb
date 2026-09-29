import { staticFile } from "remotion";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadRoboto } from "@remotion/google-fonts/Roboto";
import { FONTS } from "../../kit";

/**
 * Flowroll brand tokens, lifted from flowroll-frontend/src/app/globals.css and
 * app/page.tsx: the hero gradient is violet-600 → teal-500 (violet-400 →
 * teal-400 on dark), the mark is navy + emerald, dark surfaces are
 * #0A0F1C / #162032, payday is amber. Headings are Montserrat, body Roboto
 * (next/font in app/layout.tsx). BNB gold #F0B90B is the chain accent.
 */
export const C = {
  bg: "#070a12",
  navy: "#0A0F1C",
  panel: "#162032",
  violet: "#7c3aed",
  violetLite: "#a78bfa",
  teal: "#14b8a6",
  tealLite: "#2dd4bf",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  gold: "#F0B90B",
  text: "#eef2f7",
  dim: "rgba(238,242,247,0.62)",
  faint: "rgba(238,242,247,0.38)",
  line: "rgba(255,255,255,0.12)",
} as const;

export const GRADIENT = `linear-gradient(90deg, ${C.violetLite} 0%, ${C.tealLite} 100%)`;

const opts = { subsets: ["latin"] as ["latin"], ignoreTooManyRequestsWarning: true };
const montserrat = loadMontserrat("normal", { weights: ["500", "600", "700", "800"], ...opts });
const roboto = loadRoboto("normal", { weights: ["400", "500", "700"], ...opts });

export const F = {
  display: montserrat.fontFamily,
  sans: roboto.fontFamily,
  serif: FONTS.display, // Fraunces italic for small editorial asides
  mono: FONTS.mono,
  comic: FONTS.comic,
};

/**
 * REAL captures of the Flowroll frontend (next build with .env.bsc-testnet,
 * next start :3280), 1600×1000 @1.2 = 1920×1200. A read-only injected wallet
 * reports the real smoke-run employer / employee addresses, so every number
 * is a live BSC-testnet read (scripts/flowroll/capture.mjs).
 */
export const SHOT_W = 1920;
export const SHOT_H = 1200;
export const SCREEN = {
  landing: staticFile("flowroll/01-landing.png"),
  createGroup: staticFile("flowroll/02-create-group.png"),
  group: staticFile("flowroll/03-group.png"),
  creditHub: staticFile("flowroll/04-credit-hub.png"),
  claim: staticFile("flowroll/05-claim.png"),
  onboarding: staticFile("flowroll/06-onboarding.png"),
  logo: staticFile("flowroll/logo.png"),
} as const;

/** Real BSC-testnet facts, verbatim from VERIFY-BNB.md ("Real BSC Testnet deploy (2026-09-25)"). */
export const CHAIN = {
  deploymentBlock: "132984157",
  usdc: "0x9Bff57e4becEDD645813600d24d44F069eCf2F34",
  mwbnb: "0xeaD52374a331A27be4e4e15B21d3212b5244DFAB",
  zapper: "0x546af13359C5e71420Fc2622bc38a3b63C46cB5A",
  yieldRouter: "0xefE4d6A2bb6359EdB745460130164e4a21DF81d4",
  payrollManager: "0xC41a28492C6B07f4f6c97193022A764047fd69D7",
  dispatcher: "0xbc0FA138002504D7cE99c19d159abd352801572B",
  payVault: "0xDA21296afff7441F13dC123B684d55d150A5861F",
  credit: "0xA2180532601e7C5372DE556b66950A604Bb51bad",
  employer: "0xE5ACd0f4c449B783f1DddB0C1C6932409b71D33a",
  agent: "0x83edC257CE75Da133C8fFD841544F9bb433d463b",
  employee: "0x7e13A02a488F48901e7D32Cb21D48bf43719D5C0",
  tx: {
    createGroup: "0xd7a30b3b17bd86062d55e145165d8797da5f5d0496f4dc3fe929748c49fae8f6",
    addEmployeeA: "0x02c3234d7917b02ffb84d0d04306dc9cdb14a60a04208f2ec3e707f8cf071303",
    addEmployeeB: "0x3ccabe5e7b733f4c5763f9b0c026ba4e9902e15685a95eab8067e86b5b9141a0",
    deposit: "0x18955d07cf0e24715c697397bdbf0f65f0cc104f2afffa9168d752fe638d2f4a",
    zap: "0xf909754ef31276d2e68c4cb288e766458130dbaff542d1aaf1c72ea1b43a2cda",
    advance: "0xd9a528c88c054b1578efb49bf56cd3bb0cb63df8fab78526eb86ae4539433a48",
    rebalanced: "0x56d8b82ab92a97e7232123dc1602ba90606418331a1e31b96f556b058d3eb49b",
    buffer: "0x0d0b8a246746edc6c9a4a6a4d5127612d36add1ca86001f243d725f94753438f",
    payday: "0x6038a7e3e200e884318d532aad633abb51d764323b41ead8e4afd993832301bb",
    claim: "0xdccb85b226ac6ea046a338cc8b517df7c7e9ae58e5573f217802071a91f3258b",
  },
  gasBurned: "~0.0025 tBNB",
  bugError: "0xe025cb32",
} as const;

export const short = (h: string, head = 6, tail = 4) => `${h.slice(0, head)}…${h.slice(-tail)}`;
