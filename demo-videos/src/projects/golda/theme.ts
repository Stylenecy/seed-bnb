import { FONTS } from "../../kit";

/**
 * Golda Finance brand tokens. The repo has NO frontend (README's /FE is absent,
 * VERIFY-BNB.md "Backend / frontend: SKIPPED"), so there is no CSS to lift:
 * the palette is a code-drawn "bullion" look — warm ink, metallic gold for the
 * PAXG leg, Tether green for the USDT leg, cream type. BNB gold stays the chain
 * accent (it is cooler/yellower than Golda's bullion gold).
 * Every product screen is drawn in code and labelled "CONCEPT UI".
 */
export const C = {
  bg: "#0c0a07",
  surface: "#15120c",
  card: "#1b1710",
  text: "#f4eedf",
  textMuted: "#a89f8a",
  textDim: "#6b6454",
  gold: "#d9ae4a",
  goldSoft: "#f3d98b",
  goldDeep: "#9c7420",
  usdt: "#26a17b",
  usdtSoft: "#6fdcb4",
  fork: "#7cc8ff",
  rose: "#ff6b6b",
  amber: "#ffb547",
  wbnb: "#F0B90B",
} as const;

export const GOLD_GRADIENT = `linear-gradient(100deg, ${C.goldDeep} 0%, ${C.gold} 35%, ${C.goldSoft} 55%, ${C.gold} 75%, ${C.goldDeep} 100%)`;

export const F = {
  display: FONTS.display,
  sans: FONTS.manrope,
  mono: FONTS.mono,
  comic: FONTS.comic,
};

/**
 * Real facts, verbatim from monad-Golda-finance/VERIFY-BNB.md,
 * Contracts/.env.bsc-testnet and Contracts/broadcast/DeployGolda.s.sol/97/run-latest.json.
 */
export const CHAIN = {
  vault: "0x8b91743bA458eb322DdAd7F75f265382581c95e0",
  usdt: "0xeA200bD121a2AE2B149E0B46aDd2e3C620F1457A",
  paxg: "0x2790a5B7c8fe75F346d6932edd4e491E0FdFce43",
  deployer: "0xE5ACd0f4c449B783f1DddB0C1C6932409b71D33a",
  lifi: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  deploy: {
    usdt: "0x477667dcbe92ae33dd48f57250b39d23af4f039e54fd3bc20ed4ccc0bb9d22d1",
    usdtMint: "0x62f2ab1e4bfbec908d321ff63ee47b6c4d92373573a81c42f68a28d1a9540014",
    paxg: "0xe58b1448c34846e1fcc0749f86709c28fd3aa1dc7c062eb0f8734554afc59630",
    paxgMint: "0x328cb0d040622ee77c32330a8f499a426c1da9bb7e949617d26ff7c6fe5adab9",
    vault: "0xfda7146d4e744082dab7725d1a1af694e64dcf6c918f5a15677485eb6717aecd",
    sel1: "0xe99af5efa570182239af572fb7e82cd89a6b9921ab0f2dfa714b13285f592cb7",
    sel2: "0xb608b1ea3426b39c1c3cc78117447c88aee18965dcbf4e66067d8900867c5e1c",
  },
  tx: {
    approve: "0x5fea4b60bf281684d7b36b83f60dfff1f0db25b034e01cfa1067e4667b9c7597",
    deposit: "0x2978f8f4ae850a5a119d051b710fe46383347f98505863890bc461cef5d861d6",
    redeem: "0xca73731dd3272b4e9d93f2fff3fb4ff9530dadce777a82aec87cabfc8844df1a",
  },
  /** BSC MAINNET FORK (anvil, chain 56) — not a live deploy. */
  fork: {
    realUsdt: "0x55d398326f99059fF775485246999027B3197955",
    realPaxg: "0x7950865a9140cB519342433146Ed5b40c6F210f7",
    pcsPool: "0x172f…f849",
    selLive: "0x5fd9ae2e",
    selNew2: "0x4666fc80",
    selOld: ["0x4630a0d8", "0xd6a4bc50"],
  },
} as const;

export const short = (h: string, head = 6, tail = 4) => `${h.slice(0, head)}…${h.slice(-tail)}`;
