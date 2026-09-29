import { staticFile } from "remotion";
import { FONTS } from "../../kit";

/**
 * Cermin brand tokens — lifted from Cermin/frontend/src/app/globals.css
 * (@theme: warm cream paper, amber accent, "shadow" ink ramp) and the
 * frontend's type system (Fraunces serif headlines + Geist sans; we use the
 * kit's Manrope as the sans). BNB gold is the chain accent.
 */
export const C = {
  ink: "#1f1b17", // --color-shadow-900
  ink2: "#3a3530", // --color-shadow-700
  muted: "#8a8278", // --color-shadow-300
  cream: "#faf6f0", // --color-cream-100
  cream2: "#f5efe5",
  cream3: "#ede4d5",
  ivory: "#f7e9cb",
  peach: "#f4d5c0",
  amber: "#c77a3a", // --color-amber-500
  amberHi: "#e8c99a", // --color-amber-200
  amberDeep: "#a85f26", // --color-amber-600
  success: "#6b8e5a",
  successHi: "#8fc27a",
  danger: "#a84a3a",
  dangerHi: "#ff6a52",
  info: "#5c7a8e",
  text: "#f4ede2",
  textDim: "rgba(244,237,226,0.62)",
} as const;

export const F = {
  display: FONTS.display, // Fraunces — same serif as the frontend
  sans: FONTS.manrope,
  mono: FONTS.mono,
  comic: FONTS.comic,
};

export const LOGO = staticFile("cermin/logo.png");
export const HERO_ART = staticFile("cermin/hero-horizon-figure.webp");

/**
 * Real captures of the Cermin frontend (`next start -p 3195`, built with
 * .env.bsc-testnet). Onboarding = mobile 430×932 @2x (860×1864) against real
 * BSC testnet (mock feed price $90,000/BNB). Dashboard = desktop 1600×1000
 * @1.2 (1920×1200) against REAL BSC TESTNET (chain 97), 2026-09-27: a live
 * vault opened, defended, withdrawn from and closed through the UI, with the
 * testnet MockPriceFeed moved by its owner and skim called as the keeper.
 * See scripts/cermin/live.mjs (dashboard) and capture.mjs (onboarding).
 */
export const SCREEN = {
  landing: staticFile("cermin/01-landing.png"),
  modal: staticFile("cermin/connect-modal.png"),
  deposit: staticFile("cermin/m/04-onb-deposit.png"),
  goal: staticFile("cermin/m/06-onb-goal.png"),
  risk: staticFile("cermin/m/08-onb-risk.png"),
  preview: staticFile("cermin/m/09-onb-preview.png"),
  confirm: staticFile("cermin/m/10-onb-confirm.png"),
  openTop: staticFile("cermin/s1-open-top.png"),
  openCards: staticFile("cermin/s1-open-cards.png"),
  skimTop: staticFile("cermin/s2-skim-top.png"),
  dipTop: staticFile("cermin/s3-dip-top.png"),
  defendTop: staticFile("cermin/s4-defend-top.png"),
  defendActivity: staticFile("cermin/s4-defend-activity.png"),
  withdrawActivity: staticFile("cermin/s5-withdraw-activity.png"),
} as const;


/** Real BSC-testnet facts — contracts/deployments/bsc-testnet.json + VERIFY-BNB.md. */
export const CHAIN = {
  factory: "0x4A832Cf199B236ecE52c7AFC50F355d0a1eB1930",
  vaultImpl: "0x930403144279aF3E980621765Fb5d6d5A28a2667",
  priceFeed: "0xf59178E78ED1056ACD16d0a4968713fFe028da5F",
  musd: "0x3Bffc923F1e4636fE8E09a76b2bfc57AD27A3007",
  troveManager: "0xb63bDC5bEBD4Abd24530Fb7cd2d4f34A8FCD52D7",
  borrowerOps: "0x2f7D1bB2622Fd1F47E6581E4a6fCD952b9FC16Bc",
  savingsVault: "0x719049BecbA18f255c5Da01E9653013313C66F85",
  smokeVault: "0x11d157eec22340C651b268F0884683aCff47CD75",
  /** The live UI-driven vault (2026-09-27), owner 0x87e0…900A. */
  liveVault: "0x06615D5323A2Ad9838E1F9508BBfA8ab817e87B8",
  liveOwner: "0x87e0b1e3eC8fa8606FA3729984272391537C900A",
  chainlinkMainnet: "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE",
  chainlinkTestnet: "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526",
  /** Live UI-driven run on real BSC testnet, 2026-09-27 — every receipt status 1. */
  tx: {
    open: "0x745159047fd9f11394c955e53d598a0d93752a180ad3de1c2a7f5ed023bbc477",
    priceUp: "0x3f1268a4b2d45a5f5042aa6da89be0749eae2facd26b4a7a996c4f63510dd8b1",
    skim: "0xd33003bb77e6775736a0dca9793b75f73d4dc19ec63211ef7ae3e4306f710583",
    priceDown: "0x6262f1d5999df8bc0b2a74ef2b70decde7875f3c7ddfc456280dec159b1e6c60",
    defend: "0x6de0e6aff2ee999a82bb2585b568655e3461042ecf485a015b24fd2a65d660ef",
    withdraw: "0x6c866088e786aa7029137fe7929d60ddef13b50c48e739c2353b87ebf1ffdacd",
    close: "0x10b262969419fd9ea514c794202616f5a1a699e418589d5227bade57cba34e42",
  },
  /** Earlier cast smoke run (VERIFY-BNB.md, 2026-09-25), vault 0x11d1…CD75. */
  smokeTx: {
    open: "0xb72e9dbbac40903584383eea68e9819f4b3ed3b0eb85e928142201c33d1dd335",
    priceUp: "0x0d4ca6456136f00706a31c13d817270db034374d67bde739f3d6f33d747cda62",
    skim: "0x4630460de2e20bb4dae80d6d67b67f0d7894261a77f2675ba38ed6f5fe311884",
    priceDown: "0x09c262a46a0cad8ed2502efe8f1b4a6c1e36e4a7e011c17771e4827bfe1a5769",
    defend: "0xb2467e31e34f6b221640f58c21fe81282fb348c4e42c2fd4331bc2fa937b757d",
    withdraw: "0x6032a5e8d1a3636b9fdf05732174ab18c4e5978753e61c408b7f91ba848c1e60",
    approve: "0xcca9356da743d4914eef93fa2f3b49934722a8bdc7b84a95e90c8ad8440cb447",
    close: "0xd0265b56f907f34a2830d3e727d2bc03191e2c6fbdbc4963ac3a99209d515680",
  },
} as const;

export const short = (h: string, a = 6, b = 4) => `${h.slice(0, a)}…${h.slice(-b)}`;
