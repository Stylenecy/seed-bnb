import { staticFile } from "remotion";
import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";
import { FONTS } from "../../kit";

/**
 * Gridora brand tokens — lifted from Gridora/frontend/web (globals.css + gridora-mark.svg)
 * and the project's own Remotion video (Gridora/video/src/theme.ts):
 *   porcelain #EDEEF5 page · ink #1A1A1A · volt #9FFF00 (fills only) · lime-700 #4D7C0F
 *   pos lime-800 #3F6212 · neg rose-700 #BE123C · the coral mark #F2AE80 → #D97757 → #A24E32
 *   Outfit (lowercase display) · Inter (body) · JetBrains Mono (data).
 * For the comic cut the canvas goes to a warm ink so the coral mark, the volt and the
 * BNB gold carry the light; the real site screens stay porcelain inside glass frames.
 */
const outfit = loadOutfit("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"], ignoreTooManyRequestsWarning: true });

export const C = {
  bg: "#0e0c0b", // warm ink canvas
  panel: "#16120f",
  line: "rgba(242,174,128,0.16)",
  text: "#F3F1EA",
  textMuted: "#b9aea5",
  textDim: "#7b6f66",
  coral: "#D97757",
  coralHi: "#F2AE80",
  clay: "#A24E32",
  cream: "#FFE9DC",
  etch: "#3a1d12",
  porcelain: "#EDEEF5",
  ink: "#1A1A1A",
  volt: "#9FFF00",
  lime: "#4D7C0F",
  pos: "#3F6212",
  posHi: "#a3e635", // readable profit on the dark canvas
  neg: "#BE123C",
  negHi: "#fb7185", // readable loss on the dark canvas
  gold: "#F0B90B",
} as const;

export const F = {
  display: outfit.fontFamily, // Outfit — the site's lowercase editorial voice
  sans: FONTS.inter,
  mono: FONTS.mono,
  comic: FONTS.comic,
};

/**
 * Real captures of the Gridora verifier (frontend/web, `next build && next start`),
 * scripts/gridora/capture.mjs, 1600×1000 @1.2 = 1920×1200. The page reads BNB Chain
 * with viem: counters via eth_call on the public RPC, the `Recorded` event history via
 * a capture-time proxy that answers eth_getLogs from REAL logs (scripts/gridora/logs-scan.mjs,
 * public RPCs have pruned that history).
 *   main*  — :3310, NEXT_PUBLIC_TESTNET=false, the BSC mainnet contracts (agent #1, 38 trades)
 *   test*  — :3311, NEXT_PUBLIC_TESTNET=true, the BSC testnet contracts (agent #1, 1 trade)
 */
export const SCREEN = {
  mainHero: staticFile("gridora/01-main-hero.png"),
  mainTape: staticFile("gridora/02-main-tape.png"),
  mainProof: staticFile("gridora/03-main-proof.png"),
  testHero: staticFile("gridora/04-test-hero.png"),
  testTape: staticFile("gridora/05-test-tape.png"),
  testProof: staticFile("gridora/06-test-proof.png"),
} as const;
export const SHOT_W = 1920;
export const SHOT_H = 1200;

/**
 * Real chain facts. Every value re-read (read-only, cast) on 2026-09-26:
 *   testnet — contracts/broadcast/Deploy.s.sol/97/run-latest.json + receipts from
 *             bsc-testnet.publicnode.com; the 4 agent txs found by bisecting the agent
 *             wallet's nonce (3 → 7) over archive state, calldata decoded with cast.
 *   mainnet — README "On-chain" table + contracts/broadcast/Deploy.s.sol/56/run-latest.json,
 *             totalAgents()=1 / totalTrades()=38 read live.
 */
export const AGENT = "0x7053676258ef5bFB9b27FCF42092F13fB37B9989";

export const TESTNET = {
  identity: "0x979e680B6D826db811bcFa0f7D7B5B330da1aAFE",
  journal: "0xCf80352de52E3a041BE8202373CCb2e1bdB2d068",
  ledger: "0x400B0D1a98735871175D3B3C231A6250322ECA5A",
  deployBlock: 114323796,
  tx: {
    deployIdentity: "0x31dd99cb55b10249131b9d5ec6e44e2d6761eeecd7887d604177eed3edd1c4a9",
    deployJournal: "0x93ce737e47927de92ed3e4a8550d1cb11e08b6a64f24774659db63b5205ae87b",
    deployLedger: "0x7125205b96533a18a1bcf5d28b3d1fc2e051e6f69b4a18d9add8dcedf0b9c760",
    register: "0xb8fc2cd67d558970d1563a123b7f474c05d6d8209f137f55b8c53fa6ef626820",
    commit: "0x61ae5b92065cf2f476222577c4e72f5033019de72a673bf9ea6e3e93a09c82b5",
    record: "0xc50e64c8bf0bd3cc65f9be2693834eed7961568e63dd24bbe058811ceeb54d8e",
    attest: "0xea54daebe29364f31c1554fa6d34204b5d57bc8fd7ce5c53d0014086dd417fa7",
  },
  gas: { deployIdentity: 1507309, deployJournal: 279993, deployLedger: 240871, register: 145145, commit: 69011, record: 74606, attest: 51936 },
  block: { register: 114324369, commit: 114412364, record: 114412371, attest: 114412374 },
  agentId: 1,
  uri: "ipfs://gridora-agent.json",
  instanceId: "0xa5a4355caed48ca332870486edba678784a94eded85269376bb90bf894783603",
  configHash: "0xb835f59edd133699af68d8d4ff4b8929fa2ec91395eb9e07e2892c87b637b345",
  outcomeHash: "0xad3808d9ce547752fb3d95947781d84466958591b099b7a8a29b0b5e40ca7819",
  tradeHash: "0x41fe6b1d26f70abac74bdbc9c37ef7595727dd80c31a215d857ac13c1dfa3bcf",
  pnlBps: 85,
  /** Σ gasUsed × gasPrice: deploy at 0.1 gwei, agent txs at 1 gwei. */
  deployTbnb: "0.000203",
  agentTbnb: "0.000341",
} as const;

export const MAINNET = {
  identity: "0x400B0D1a98735871175D3B3C231A6250322ECA5A",
  journal: "0xE946C28ea10bf29AcA9a094f66079De84a50d409",
  ledger: "0x56D4831a39A991Ac0fa8CAe533Cb74E47A5DD79d",
  deployBlock: 105522340,
  erc8004Id: "140004",
  erc8004Tx: "0x8b90829ef0a6854deeff31b212e3fb49f6e3262ebd740d71c0d405400015fdb9",
  competitionTx: "0x11137b00830122e2949620920e6538ccf7c3cb915706cf55e8231f7ea253f692",
  totalTrades: 38,
} as const;

/** VERIFY-BNB.md. */
export const CHECKS = { forge: 20, pytest: 130, tokens: 49, eligible: 149 } as const;

export const short = (h: string, head = 6, tail = 4) => `${h.slice(0, head)}…${h.slice(-tail)}`;
