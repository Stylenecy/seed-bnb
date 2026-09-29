import { staticFile } from "remotion";
import { loadFont as loadHanken } from "@remotion/google-fonts/HankenGrotesk";
import { FONTS } from "../../kit";

/**
 * Stax brand tokens — lifted from web/src/app/globals.css (`.stax` scope,
 * dark mode) as documented in web/DESIGN.md ("Soft" theme): sage-green primary,
 * terracotta accent, warm near-black surfaces. Fraunces display + Hanken
 * Grotesk UI + JetBrains Mono, exactly as the app ships. BNB gold = chain accent.
 */
const hanken = loadHanken("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"], ignoreTooManyRequestsWarning: true });

export const C = {
  bg: "#0c0f12",
  paper: "#15191a",
  surface: "#1f2427",
  surface2: "#282f33",
  line: "#303840",
  text: "#eef2f0",
  textDim: "#a6aeac",
  muted: "#6f7876",
  sage: "#6cc09c",
  sageDeep: "#57a07e",
  sageLight: "#a8e0c4",
  sageSoft: "#1e2c25",
  terracotta: "#ecab7e",
  neg: "#ec8d6c",
  gold: "#F0B90B",
} as const;

export const HERO_GRAD = "linear-gradient(120deg, #6cb38f 0%, #57a07e 50%, #4b956f 100%)";

export const F = {
  display: FONTS.display,
  sans: hanken.fontFamily,
  mono: FONTS.mono,
  comic: FONTS.comic,
};

/**
 * Real captures of the Stax web app (next start with web/.env.bsc-testnet on
 * :3200, see scripts/stax/capture.mjs). Phone shots are /demo (the real LiteApp
 * screens with the app's own DEMO data, no login), 860×1864 @2x.
 */
export const SCREEN = {
  home: staticFile("stax/01-home.png"),
  thinking: staticFile("stax/02-thinking.png"),
  plan: staticFile("stax/03-plan.png"),
  placing: staticFile("stax/04-placing.png"),
  success: staticFile("stax/05-success.png"),
  vera: staticFile("stax/06-vera.png"),
  landing: staticFile("stax/landing.png"),
  landingTrack: staticFile("stax/landing-track.png"),
} as const;

/** The project's own brand art (web/public/brand). */
export const LOGO = staticFile("stax/stax-dark.png");
export const VERA = staticFile("stax/vera.png");

/** Real BSC-testnet facts — contracts/deployments/bsc-testnet.json + VERIFY-BNB.md. */
export const CHAIN = {
  executor: "0x8d684d9efcd779e69c29901292bd88266d5d2bdf",
  verifier: "0x674031d24b0b7874f1b9b278b98ebfebbdaa96ec",
  registry: "0x5dd8fcb6a206b9f24847fbbc925e642b836555ea",
  usdc: "0x83f2dd5155dfe7d8eaa3d390c21fe89e2f1968bb",
  aaplx: "0xfc66023ef47b05bfd192cda3619e4f34db882258",
  tslax: "0x1affa0ee05549c777772a100cb32877dd1390b9e",
  aaplPool: "0x3649748053A842c65A0f0Fdb9F932f5A542b13b4",
  tslaPool: "0x77ebB0FAFb1BE749C5055E9bB81EaD2210BFa582",
  router: "0x1b81D678ffb9C0263b24A97847620C99d213eB14",
  treasury: "0xeAAedEae0d96f2155062c8B47832af87A5d4797A",
  erc8004: {
    registry: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
    agentId: "97:2473",
    registerTx: "0xe9b4271eb5553cd8a0801769663afa198238265a59189ece9f1f347836794957",
    owner: "0x71a909625BA8B0c67BA16a9B620De41FB2488D95",
  },
  tx: {
    fee: "0xa9954c92a7188a2beb1d245c8e7fc86a96989f9704567bb4c0442b365e1be530",
    approve: "0x0698ed2ea54fe3874d7b61a9592ec33e264932d452bb25a74bf71a789ea3c7a8",
    invest: "0x5c5b05d7e67616839913505497bd1105f2ec551ff4a234ea32d9b3a187812d48",
  },
  /** Smoke-flow numbers (VERIFY-BNB.md "Smoke flow on real testnet"). */
  smoke: {
    gross: 20,
    fee: 0.05,
    net: 19.95,
    aaplOut: "0.04803",
    aaplMin: "0.04771",
    tslaOut: "0.03535",
    tslaMin: "0.03511",
    gas: "368k",
    riskTried: 9500,
    riskMax: 7000,
  },
  /** /api/prices read from the live pools (VERIFY-BNB.md "Web on real testnet"). */
  prices: { aapl: "230.44", tsla: "250.35" },
} as const;
