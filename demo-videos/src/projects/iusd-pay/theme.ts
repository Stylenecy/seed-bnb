import { staticFile } from "remotion";
import { FONTS } from "../../kit";

/**
 * iUSD Pay brand tokens — lifted from packages/app/src/index.css (dark theme)
 * and the pay-card gradient on the Registered/Dashboard screens. The product
 * UI is monochrome ink + warm off-white; colour comes from the pay card
 * (pink → yellow → green) and the rose pink accent. BNB gold is the chain accent.
 */
export const C = {
  bg: "#141414",
  surface: "#1e1e1e",
  raised: "#252525",
  border: "rgba(255,255,255,0.09)",
  text: "#e8e8e3",
  textDim: "#9a9a9a",
  muted: "#636366",
  pink: "#E8457E",
  cardPink: "#EE8A8F",
  cardYellow: "#ECD35E",
  cardGreen: "#4C9933",
  yellow: "#F4D35E",
  green: "#34C759",
  teal: "#5EF0FF",
} as const;

export const CARD_GRADIENT = `linear-gradient(120deg, ${C.cardPink} 0%, ${C.cardYellow} 50%, ${C.cardGreen} 100%)`;

export const F = {
  display: FONTS.display,
  sans: FONTS.inter, // the app ships Inter
  mono: FONTS.mono,
  comic: FONTS.comic,
};

/** Real captures of the app (see scripts/iusd-pay/capture.mjs). 860×1864 @2x. */
export const SCREEN = {
  signin: staticFile("iusd-pay/01-signin.png"),
  welcome: staticFile("iusd-pay/02-welcome.png"),
  card: staticFile("iusd-pay/03-card.png"),
  dashboard: staticFile("iusd-pay/04-dashboard.png"),
  transfer: staticFile("iusd-pay/05-transfer.png"),
  settings: staticFile("iusd-pay/06-settings.png"),
  request: staticFile("iusd-pay/07-request.png"),
} as const;

export const LOGO = staticFile("iusd-pay/iusd.png");

export type GiftColor = "10_gold" | "0_red" | "6_teal" | "7_pink" | "4_blue" | "8_purple";
/** The app's own gift-box art (packages/app/public/images/gift-assets). */
export const gift = (stage: "box" | "open1" | "open2", color: GiftColor) => staticFile(`iusd-pay/gifts/${stage}_${color}.png`);

/** Real BSC-testnet facts — deployments/bsc-testnet.json + VERIFY-BNB.md. */
export const CHAIN = {
  token: "0x4DC7AaB064D301711573c636b08c2B7F7BD2133E",
  pool: "0xa2AeEaA76FCE9D4B0dE56CF58449403cA5DFA34F",
  giftPool: "0xe17b45A76a7013cE1a0Ff9960287A7b076C02aD3",
  relayer: "0xA23C8C58e9Fe85Aa4b7D0398A49cf2b59b54C46A",
  treasury: "0x4f00eD30da63A09F58235914Af1B6466B3c628cE",
  tx: {
    mint: { hash: "0x7435cca39586f2833cb9e94c76b6518837cbbca43210bc1cf4ef12ce86894432", gas: "68,108" },
    approve: { hash: "0x8dbb01f8e5b1bf291343bea53abc337d0899ba77a345f06b7493c265a9deae5c", gas: "45,971" },
    deposit: { hash: "0xfda7199fc4408b2803be54a759bf2e8e221d5aaec45968bf8bce99652302db6c", gas: "796,226" },
    claim: { hash: "0x3e99dc465b5b9fa944392391e5a0c68da53d2b8a1b95990531876dfbea1094f9", gas: "77,948" },
  },
} as const;
