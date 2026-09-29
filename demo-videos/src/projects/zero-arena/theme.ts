import { staticFile } from "remotion";
import { FONTS } from "../../kit";

/**
 * Zero Arena brand tokens, lifted from zero-arena-fe (globals.css
 * `--color-primary: #34d399`, zinc-950 surfaces, emerald/rose metric colours,
 * RainbowKit accent #34d399) and the original demo video's theme.ts (bg
 * #0a0a0f, violet/cyan logo glow). The app ships Inter + a mono. BNB gold is
 * the chain accent.
 */
export const C = {
  bg: "#0a0a0f",
  elev: "#14141c",
  panel: "#1c1c26",
  line: "#2a2a38",
  text: "#fafafa",
  textMuted: "#9a9aa8",
  textDim: "#5e5e6e",
  emerald: "#34d399",
  emeraldDeep: "#1f8c5e",
  emeraldSoft: "#a7f3d0",
  rose: "#f87171",
  violet: "#a78bfa",
  cyan: "#38bdf8",
  amber: "#fbbf24",
  gold: "#F0B90B",
} as const;

export const F = {
  display: FONTS.display,
  sans: FONTS.inter,
  mono: FONTS.mono,
  comic: FONTS.comic,
};

/**
 * Real captures of the Zero Arena dashboard (zero-arena-fe, next build + start
 * on :3251 with the BSC-testnet env; scripts/zero-arena/capture.mjs). All
 * pages read LIVE BSC-testnet state: cert #1 / iNFT #1 / Season #1. 1920×1080.
 */
export const SCREEN = {
  agents: staticFile("zero-arena/01-agents.png"),
  leaderboard: staticFile("zero-arena/02-leaderboard.png"),
  agent: staticFile("zero-arena/03-agent.png"),
  live: staticFile("zero-arena/04-live.png"),
  seasons: staticFile("zero-arena/05-seasons.png"),
  season1: staticFile("zero-arena/06-season1.png"),
} as const;

/** Real BSC-testnet facts — contracts/deployments/97*.json + VERIFY-BNB.md. */
export const CHAIN = {
  cert: "0x4927B51f574035622826d8E703b712Bb5F12bDC8",
  oracle: "0x90D159C2d0d247BAafbd865a6FdD664E397eD984",
  inft: "0x6d0fda52C480E96D2Da3aB0e071d4c6A27Cd263c",
  live: "0xc013bf70429B079D076e36D966A16F382b9c7e46",
  season: "0xA50314e3d9Abd8f35134a91Fe117a18e06461a55",
  deployer: "0xb4fDcF406c50a789B125a1C27Fdf9ADDaC333308",
  operator: "0x38C0152976ff5B392A6CDcF5Afe3BDDE1B6653a5",
  tx: {
    submit: "0x90f001a9faaca1dfd5fabd6fad8d820cbec66f1125e4e1056513c302daf73fb0",
    mint: "0xa77f9ef94ad035d2e86e74b07c3e684b46973a105150c97da937b571cf858909",
    start: "0x05dc8c448b163b441600955f1654115564b98268ca929cea2a5a0b5012e61f1d",
    authorize: "0xf579064b92f166a29ca1de67432952a42f83929b353368338cd55aa8dc0a3307",
    epoch0: "0x1f939f4ab692837b44320042ebf0d0a7f11d49a2a9e6e94c7b7febe4818763c7",
    createSeason: "0x50560f56878ec0a8ecfcdb335ed8ca62ae8f03d23f6c1bb0ab659fb3020c3727",
    enroll: "0xc76e645c21196f7f820e986ff054b020cc24942913ce179d73f6806586e408bf",
    epoch1: "0xaba9c7c45e9c7388641de691dcb48893fccdbc4a09084904158311bbda206890",
    settle: "0x4c3a84312d92d4b49aab52587289205ed0fc5e4dabb130ba615ba6438c93114d",
  },
  /** Hash chain as shown by the live page / VERIFY-BNB.md. */
  hash: {
    genesis: "0x69af411b…89b76c1b", // static runHash (dashboard, token 1)
    afterEpoch0: "0xf3f7…debf", // keccak(runHash ‖ keccak("epoch-0")) — VERIFY-BNB.md
    current: "0x92ec0098…7911d4bc", // cumulativeHash after epoch 1 (dashboard)
  },
} as const;

export const short = (h: string, head = 6, tail = 4) => `${h.slice(0, head)}…${h.slice(-tail)}`;
