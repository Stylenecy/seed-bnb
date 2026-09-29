import { staticFile } from "remotion";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadCondiment } from "@remotion/google-fonts/Condiment";
import { loadFont as loadHanken } from "@remotion/google-fonts/HankenGrotesk";
import { FONTS } from "../../kit";

/**
 * BINGOChain brand tokens, lifted from apps/web/app/globals.css (:root):
 * deep navy canvas (226 96% 8% = #010828), cream foreground (#EFF4FF), neon
 * green primary (94 100% 50% = #6FFF00), plus the game-state tones. The app
 * ships Anton (display), Condiment (cursive accent), Hanken Grotesk (sans) and
 * Geist Mono. Celo yellow marks the Celo track record, BNB gold the new chain.
 */
const opts = { subsets: ["latin"] as ["latin"], ignoreTooManyRequestsWarning: true };
const anton = loadAnton("normal", { weights: ["400"], ...opts });
const condiment = loadCondiment("normal", { weights: ["400"], ...opts });
const hanken = loadHanken("normal", { weights: ["400", "500", "600", "700", "800"], ...opts });

export const C = {
  bg: "#010828", // --background
  card: "#0d1631", // --card 226 58% 12%
  surface: "#16203f", // --secondary
  line: "#222d52", // --border
  text: "#EFF4FF", // --foreground
  textDim: "#aab6d6", // --muted-foreground 220 26% 74%
  neon: "#6FFF00", // --primary
  neonSoft: "#b6ff7a", // --gold-300 (re-pointed)
  neonDeep: "#4fb80a",
  playing: "#5cbcf0", // --state-playing
  revealing: "#b79ae8", // --state-revealing
  full: "#f5b63f", // --state-full
  danger: "#e0604f",
  celo: "#FCFF52",
  gold: "#F0B90B",
  // classic bingo-ball colours per column (B I N G O)
  ballB: "#3d8bff",
  ballI: "#ff4d6d",
  ballN: "#f4efe4",
  ballG: "#6FFF00",
  ballO: "#ff9f1c",
} as const;

export const BALL_COLORS = [C.ballB, C.ballI, C.ballN, C.ballG, C.ballO] as const;

export const F = {
  display: anton.fontFamily,
  script: condiment.fontFamily,
  sans: hanken.fontFamily,
  mono: FONTS.mono,
  comic: FONTS.comic,
};

/**
 * Real captures (scripts/bingo-chain/capture.mjs), 1920×1200 png.
 * bsc-*: the BINGOChain web app built with NEXT_PUBLIC_CHAIN_ID=97 +
 *   apps/web/.env.bsc-testnet (`next start -p 3220`), wallet = Player 1 from
 *   VERIFY-BNB.md (read-only injected), every arena read live from the
 *   BSC-testnet proxy 0x5011…d110.
 * celo-*: the live production app (bingochain.vercel.app) reading Celo mainnet.
 */
export const SCREEN = {
  bscHome: staticFile("bingo-chain/bsc-home.png"),
  bscArenas: staticFile("bingo-chain/bsc-arenas.png"),
  bscCreate: staticFile("bingo-chain/bsc-create.png"),
  bscArena: staticFile("bingo-chain/bsc-arena1-connected.png"),
  bscHow: staticFile("bingo-chain/bsc-how.png"),
  celoHome: staticFile("bingo-chain/celo-home.png"),
  celoArena: staticFile("bingo-chain/celo-arena200.png"),
} as const;
export const SHOT_ASPECT = 1200 / 1920;

export const LOGO = staticFile("bingo-chain/logo.png");

/**
 * Celo track record — live mainnet reads (scripts/bingo-chain/celo-reads.mjs →
 * celo-reads.json, 2026-09-25, block 78,453,998) + README / VERIFY-BNB.md.
 */
export const CELO = {
  proxy: "0x8bE7c07CCF9FF515d82D4c36aB4EB937941432f1",
  version: "1.3.0",
  block: 78453998,
  arenas: 479,
  settled: 458,
  numbersCalled: 8996,
  seats: 1438,
} as const;

/** Real BSC-testnet facts — contracts/deployments/bsc-testnet.json + VERIFY-BNB.md. */
export const CHAIN = {
  proxy: "0x501125227641B73061B1EDAf1a60CbF56701d110",
  impl: "0x6Bc43092780Ab107c8E4976d8E39733Ae01508Cb",
  lance: "0x56a647A62C68BF7228Cb0b876a937a7331a41bf9",
  wbnb: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
  owner: "0x3F46b654035aA92738FE4dC7dc9538Ca9bA07CEA",
  p2: "0x090c9E1c284b1789709f7f2EFf5A63bd31B9D8c7",
  deployBlock: 132984340,
  tests: "95/95",
  tx: {
    impl: "0xe6c9b297715f784f067c44b2868a96457668931dea0ae5a19e5f06ab5156789b",
    proxy: "0xc0703ad1c66f405330f93bf5a60b519a875e2d7f107c84490980f33d3d124635",
    allowWbnb: "0x3f60807f216769c85153aaa26e54ff58f92af6f42929b1fb462b2de7ac3b57b7",
    allowLance: "0xa74de6ed2ec839b5dcccee2a85515d6a2f4f646b9537faae5987db584231f409",
    create: "0x7480b034963077523f94d3a7802f3644d7f34af06c6073568227c911630c4bc6",
    commit1: "0xe1b09ed237ebc3ded90cd3f67321f689337de321203c9f6450588bb8c96c5d23",
    commit2: "0xeca91a0ce44ad325caa13ada6737e4616105829e2235f46e93b858d927d4a173",
    calls: [
      "0xa26954e276b9fcf916425dbf4a46499c8499951af70370196687127d3e5b2181",
      "0xa69feb476de119a3752dca6e415481d422fa107a03b6ab4dd39a175d0e9d6806",
      "0x13c8100f5d7d2a1302ef05ad9021692578b59ccf0cff1e1c36e05f1b1d834783",
      "0x82f526e9af97e3ec958e3620cbfe4d0808ab42a49d44383efa448083c11e8014",
      "0x1bff8ddbc79038db0a8155524b89443642207ba3e4001a8556532c144af8f4df",
    ],
    claim: "0xe39caff22042ded099088d19b7c6d75449687ce0d950a0e4b3fb56ebf647a72e",
    reveal1: "0xd50990f4ed3e136ce2dd00b1be5baf6657080419ec8967a2c90cd72a05383259",
    reveal2: "0xae74f0c25215b4d85ced4c0c7d2a1700f7131edce6e6610d360cc104e4b0b6ac",
    settle: "0xb5b11ace179c9bf4abbe8b6586ce02ceecc514544a0549fe0f150af52401e6b4",
    withdraw: "0x67948247fb0d5084379b222d8238532c9ad3fa99c3bbe7b6681447dd60fd7d64",
  },
  smoke: {
    stake: "0.001", // WBNB per player
    pot: "0.002",
    prizeEach: "0.00099", // tie: each winner
    fee: "0.00002", // 1% → treasury
    feeBps: 100,
    gas: "0.00057", // tBNB, whole game
    txs: 13, // create, 2 commit, 5 call, claim, 2 reveal, settle, withdraw
    calls: [1, 2, 3, 4, 5],
    secs: 35, // create block 22:45:56 → settle block 22:46:31 UTC (block timestamps)
  },
  /** Revealed boards read from revealedBoardOf(1, player) on the proxy. */
  boardP1: Array.from({ length: 25 }, (_, i) => i + 1),
  boardP2: Array.from({ length: 25 }, (_, i) => 25 - i),
} as const;
