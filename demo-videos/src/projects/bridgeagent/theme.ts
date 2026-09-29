import { staticFile } from "remotion";
import { loadFont as loadInstrument } from "@remotion/google-fonts/InstrumentSerif";
import { FONTS } from "../../kit";

/**
 * BridgeAgent brand tokens — lifted from BridgeAgent/web (tailwind.config.ts +
 * globals.css): the "moss" palette on a moss-950 page, a single warm "bone"
 * accent for the Instrument Serif italic, JetBrains Mono for data, a neo-grotesque
 * (Inter) for display numbers. BNB gold is the chain accent.
 */
const instrument = loadInstrument("normal", { weights: ["400"], subsets: ["latin"], ignoreTooManyRequestsWarning: true });
loadInstrument("italic", { weights: ["400"], subsets: ["latin"], ignoreTooManyRequestsWarning: true });

export const C = {
  bg: "#0f1c15", // moss-950
  panel: "#0c1612",
  card: "#132219",
  line: "rgba(146,178,156,0.16)",
  text: "#f1f6f3", // moss-50
  textMuted: "#92b29c", // moss-300
  textDim: "#4d785f", // moss-500
  moss: "#699378", // moss-400
  mossHi: "#92b29c",
  mossSoft: "#bcd0c2", // moss-200
  mossDeep: "#22332a", // moss-900
  bone: "#f5e9d2",
  pos: "#8fdcaa",
  red: "#f87171",
  amber: "#fbbf24",
  gold: "#F0B90B",
} as const;

export const F = {
  serif: instrument.fontFamily, // Instrument Serif (the editorial italic)
  sans: FONTS.inter,
  mono: FONTS.mono,
  comic: FONTS.comic,
};

/**
 * Real captures of the BridgeAgent status page (scripts/bridgeagent/capture.mjs):
 * `next build` + `next start -p 3290` with web/.env.bsc-testnet, SSR-reading the
 * live BSC-testnet contracts. 1600×1000 @1.2 = 1920×1200.
 */
export const SCREEN = {
  hero: staticFile("bridgeagent/01-hero.png"),
  agent: staticFile("bridgeagent/02-agent.png"),
  trades: staticFile("bridgeagent/03-trades.png"),
  tradeOpen: staticFile("bridgeagent/04-trade-open.png"),
  verify: staticFile("bridgeagent/05-verify.png"),
} as const;
export const SHOT_W = 1920;
export const SHOT_H = 1200;

/**
 * Real BSC-testnet facts — README.md + VERIFY-BNB.md "Real BSC Testnet deploy
 * (2026-09-25)". Receipts re-read from bsc-testnet-rpc.publicnode.com: all status 1.
 */
export const CHAIN = {
  registry: "0xf8280D3A28dD94682b1F97a6A3fa1c8CbC9C018C",
  journal: "0x108A8347484E2b2A88D4b732F0CdB4Ada742F45E",
  owner: "0xa5663b2511456460c6dc9858D14d1f33a156cC61",
  agentId: 1,
  tx: {
    deployRegistry: "0x8b05512583bb09a9e3aae13c341839a6d58540c8fa00a6f2aa1543cf321e45ae",
    deployJournal: "0x485c0060fb0093a53a2265c91cdd2e5cc4ae1a9d1677fbd09e29b46759005401",
    register: "0xa2fbf2b68ff172f78d5d1172fb6a5db6ce42a09042bfcc0f04333d9f3569be46",
    trade1: "0x74febe544c9a79187d0f711b8e8b952c7b183b9d1b323cde402ae0e97535fb79",
    trade2: "0xb50a0231ff483295ca226a6e13c15f45f04173b101c931a20716f2b2a1de4067",
  },
  /** gasUsed from the receipts. */
  gas: { deployRegistry: 1585701, deployJournal: 473017, register: 202232, trade1: 165625, trade2: 151325 },
  block: { registry: 132984734, journal: 132984739, register: 132984883, trade1: 132984890, trade2: 132984912 },
  /** tradeHash values stored in the TradeJournal (read back by the web page). */
  tradeHash: {
    t1: "0x262154ad7bbf30886dc07a73f330c96caeead862c04706f04057f5705b930ebc",
    t2: "0xb340b5f663fe18e3f98eb7434cb7d408ab1829f2e551d88055f20a6354ffff05",
  },
  pnl: { t1: 150, t2: 75 },
  deployTbnb: "0.000206",
  agentTbnb: "0.000052",
  forge: 13,
  extraData: 279,
} as const;

export const short = (h: string, head = 6, tail = 4) => `${h.slice(0, head)}…${h.slice(-tail)}`;
