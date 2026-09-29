import { staticFile } from "remotion";
import { loadFont as loadSpace } from "@remotion/google-fonts/SpaceGrotesk";
import { FONTS } from "../../kit";

/**
 * LanceHub has no frontend of its own. Its $LANCE card lives inside the
 * Claudelance app, so the palette borrows Claudelance's clay (apps/web
 * globals.css `.dark`) for the hub, BingoChain's neon for "play", Celo yellow
 * for the Celo track record and BNB gold for the new chain.
 */
const space = loadSpace("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"], ignoreTooManyRequestsWarning: true });

export const C = {
  bg: "#0e0c0b",
  card: "#191615",
  line: "#2f2b27",
  text: "#efece7",
  textDim: "#a19991",
  clay: "#e47444", // Claudelance --primary: the hub / $LANCE
  clayLight: "#f3a47f",
  claySoft: "#f7cdb6",
  neon: "#6FFF00", // BingoChain --primary: play
  celo: "#FCFF52",
  gold: "#F0B90B",
  emerald: "#34d399",
  sky: "#5cbcf0",
} as const;

export const F = {
  display: FONTS.display, // Fraunces (headlines)
  brand: space.fontFamily, // Space Grotesk (Claudelance display, the wordmark)
  sans: FONTS.inter,
  mono: FONTS.mono,
  comic: FONTS.comic,
};

/**
 * Real captures reused from the ecosystem apps (copied from public/bingo-chain
 * and public/claudelance, see those projects' capture scripts), 1920×1200.
 *  bingoCreate: BINGOChain web built for BSC testnet (NEXT_PUBLIC_CHAIN_ID=97),
 *    /create with the LANCE settlement token and a 10 LANCE entry stake.
 *  lanceCard: Claudelance /profile, whose $LANCE card reads the Celo hub
 *    (supply 5,620 · pool 5.71 CELO · backed 100%).
 */
export const SCREEN = {
  bingoCreate: staticFile("lance-hub/bingo-bsc-create.png"),
  lanceCard: staticFile("lance-hub/claudelance-lance-card.png"),
} as const;
export const SHOT_ASPECT = 1200 / 1920;

/**
 * Celo track record: live reads of the LanceHub proxy on Celo mainnet
 * (scripts/lance-hub/celo-reads.sh → celo-reads.json, 2026-09-25) and
 * contracts/deployments/celo-mainnet.json.
 */
export const CELO = {
  proxy: "0xb70c9Cd73428Afe51eEEA832C49E8840D3f85cA2",
  owner: "0xe9Fc48f315fD4E989637fAcC29AaF2717E19f7F0", // operator Safe, threshold 2
  block: 78458296,
  nav: "0.0010165", // nav() = 1016505248202553 wei (CELO per LANCE)
  supply: 5620.32, // totalSupply() LANCE
  pool: 5.713, // totalAssets() CELO
  feeBps: 100,
  seedCelo: 20,
  rate: 1000, // LANCE per CELO at seed
} as const;

/** Real BSC-testnet facts: contracts/deployments/bsc-testnet.json + VERIFY-BNB.md. */
export const CHAIN = {
  proxy: "0x56a647A62C68BF7228Cb0b876a937a7331a41bf9",
  impl: "0x278d0FbaD0C63335aa05163edA7abd673F2f4a41",
  wbnb: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
  owner: "0x3F46b654035aA92738FE4dC7dc9538Ca9bA07CEA",
  deployBlock: 132984102,
  bingo: "0x501125227641B73061B1EDAf1a60CbF56701d110", // BingoChain BSC testnet proxy (Bingo-chain VERIFY-BNB.md)
  tests: "13/13",
  tx: {
    impl: "0xa25aacf76fa30697937d636681de6d95b6b196d942e288cf73a226990c955828",
    proxy: "0x6d2b11b8486655b12fd751d329bba9b1d7ba377212853dfcdc2e6893cc560ff9",
    seed: "0x5849a06f7a8bab555bd219096ecb0cdffb8af4188a1cf1172f00f3668970a88f",
    approve: "0x06620ff791ed79d29d988374ae5ea9b6b70b2e54f53aee7e2f6cf1d63ee6045e",
    deposit: "0xb687161828dd1930fdcfd72eed1fd19a062100958cefe09860c9de86d6ebb443",
    fundPool: "0x2ec209a355c3b8d319e9ef3cb7351e993909c85f95799d32e6e6ff261300e776",
    redeem: "0x56acfed05ea5dda8808b3fc3932f31d5ea6e4f51f3016cad4e857d16ff05425e",
    allowLance: "0xa74de6ed2ec839b5dcccee2a85515d6a2f4f646b9537faae5987db584231f409", // BingoChain allowToken(LANCE, 10)
  },
  smoke: {
    deposit: "0.001", // WBNB in → ~1 LANCE
    navBefore: "0.001",
    fund: "0.0005",
    navAfter: "0.001167",
    redeemLance: "0.5",
    redeemOut: "0.0005775", // WBNB, after the 1% fee
    feeBps: 100,
    gas: "0.00029", // tBNB, whole deploy + smoke
    bingoMin: 10, // LANCE min stake on BingoChain BSC
  },
} as const;
