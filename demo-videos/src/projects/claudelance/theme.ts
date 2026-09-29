import { staticFile } from "remotion";
import { loadFont as loadSpace } from "@remotion/google-fonts/SpaceGrotesk";
import { FONTS } from "../../kit";

/**
 * Claudelance brand tokens — lifted from apps/web/app/globals.css `.dark`
 * (warm near-black canvas, Claude-clay primary hsl(18 75% 58%)). The app ships
 * Space Grotesk (display) + Inter (sans) + Geist Mono. Celo yellow marks the
 * Celo track record, BNB gold marks the new chain.
 */
const space = loadSpace("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"], ignoreTooManyRequestsWarning: true });

export const C = {
  bg: "#110f0d", // --background 24 12% 6%
  card: "#191615", // --card 24 10% 9%
  surface: "#24201e", // --secondary 24 10% 13%
  line: "#2f2b27", // --border 24 9% 17%
  text: "#efece7", // --foreground 40 20% 92%
  textDim: "#a19991", // --muted-foreground 30 8% 60%
  clay: "#e47444", // --primary 18 75% 58%
  clayDeep: "#a65030", // light --primary 16 55% 42%
  clayLight: "#f3a47f",
  claySoft: "#f7cdb6",
  celo: "#FCFF52",
  emerald: "#34d399",
  gold: "#F0B90B",
  neg: "#ff6b5a",
} as const;

export const F = {
  display: space.fontFamily,
  sans: FONTS.inter,
  serif: FONTS.display,
  mono: FONTS.mono,
  comic: FONTS.comic,
};

/**
 * Real captures of the Claudelance web app: `next build` with
 * apps/web/.env.bsc-testnet, `next start -p 3210`, headless Chrome at
 * 1600×1000 @1.2 (1920×1200 png), dark theme, read-only injected wallet =
 * the VERIFY-BNB.md test worker 0x199C…FFc7 (scripts/claudelance/capture.mjs).
 * celo-* shots: wallet on Celo (42220), live mainnet reads.
 * bsc-* shots: wallet on BNB Smart Chain Testnet (97), live testnet reads.
 */
export const SCREEN = {
  celoBounties: staticFile("claudelance/celo-bounties.png"),
  celoPulse: staticFile("claudelance/celo-home-900.png"),
  celoWorkers: staticFile("claudelance/celo-workers.png"),
  bscHome: staticFile("claudelance/bsc-home.png"),
  bscChains: staticFile("claudelance/bsc-chain-modal.png"),
  bscProfile: staticFile("claudelance/bsc-profile.png"),
} as const;
export const SHOT_ASPECT = 1200 / 1920;

export const LOGO = staticFile("claudelance/logo.png");

/** Celo track record — README "What's live" + VERIFY-BNB.md (Celo checks). */
export const CELO = {
  v3Proxy: "0x68c83D75Ee95860E83A893Aa13556AdE8411e3c8",
  v2Core: "0x1362d874F40B7e28836cBeCcA14f5EfBe6c6E423",
  keeperScanned: 261, // VERIFY-BNB: keeper tick scanned 261 bounties, 0 failures
  v2Resolved: 80,
  v2Total: 96,
  tests: 115, // VERIFY-BNB: forge test 115 passed, 0 failed
} as const;

/** Real BSC-testnet facts — contracts/deployments/bsc-testnet.json + VERIFY-BNB.md. */
export const CHAIN = {
  proxy: "0xD13958F9b62E912CEd21Ba351f8aFaecc1C733C5",
  impl: "0xEB194356B798b81586B589e294b8b1b989895C63",
  usdt: "0x9200cABD0190EdC632691d58FB785e3A7272Ed1E",
  wbnb: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
  usdc: "0xb796355023580Fb29f7Be47460A0079B12aFd03e",
  identity: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
  reputation: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
  worker: "0x199C32c75865117e0a8E4e94E67CA28279a9FFc7",
  relayer: "0x860DdD8fb4f4E3cA87854812444C45DcB74cb96e",
  deployBlock: 132984885,
  agentId: 2474,
  tx: {
    implDeploy: "0x78b61ad9f94530be3eb98301b713135c75101599b5e9f17fcdf407e191670173",
    proxyDeploy: "0x3f213abc085c8197abe0b0f5ba2d05ec579991dcaf5e2297a13d29a49a0a0d32",
    register: "0x6c28d54784d14582fd32d40997850ed43b31f4cb14489bb5e43f5adedefa4ed5",
    post: "0x3b0f571b4a686dee600091a78759c7e1bfa745980f2a133d26a8ef3a7b20d179",
    claim: "0x270c4b7cb463cea938a7d218a8d6373dcf764f151d5213dcd262653e8c5c027e",
    submit: "0x6212ca9b5f7167e391074e5c6db4b0b54be2f1fd3588239605af9c4580d4902b",
    attestCI: "0xb2bc174395cad7924bf43c4aecb55f7d6bbf9f1d490194ad58f1bd759e2634dc",
    pickWinner: "0x6c4730c4aef912b92794ed0beac66470332191e0a8fdff715f875332ec267abb",
    settle: "0xb50143958927cacb808f4eb6844b0d98c7cc4c960e7cf8babebf7510fcc4340c",
    withdraw: "0xaa9d4da3a3bdb64ec0814ffe49c466b51365c15d75e89c1ff8c89e9a951c2691",
    reputation: "0xd51fb24aff595ab38716d9a90b8f0b7344c34a43446da3729743920b4a4ad29e",
  },
  smoke: {
    bounty: 1, // USDT
    stake: 0.1,
    toWorker: 0.98,
    fee: 0.02,
    before: 2,
    after: 2.98,
    gas: "0.00082",
    txs: 11, // register, 2× approve, post, claim, submit, attestCI, pickWinner, settle, withdraw, attestReputation
  },
} as const;
