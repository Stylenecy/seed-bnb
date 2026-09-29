import React from "react";
import { AbsoluteFill } from "remotion";
import { BeatProvider, duckFor, Flashes, Music, placeVo, SceneTimeline, SfxTrack, VoTrack } from "../../kit";
import type { SceneSpec, VoCue, VoProps } from "../../kit";
import { S1Hook } from "./scenes/S1Hook";
import { S2Logo } from "./scenes/S2Logo";
import { S3Celo } from "./scenes/S3Celo";
import { S4HowItWorks } from "./scenes/S4HowItWorks";
import { S5Product } from "./scenes/S5Product";
import { S6Proof } from "./scenes/S6Proof";
import { S7Stats } from "./scenes/S7Stats";
import { S8Outro } from "./scenes/S8Outro";
import { BAR, G, MUSIC_START_S, TOTAL, TRACK } from "./timeline";
import { C } from "./theme";
import { VO_LINES } from "./vo.gen";
import type { VoId } from "./vo.gen";

export { TOTAL };

/** Scene layout: every boundary is a track bar (see timeline.ts). */
const SCENES: SceneSpec[] = [
  { id: "S1-hook", from: G.bar(BAR.hook), to: G.bar(BAR.logo), component: S1Hook }, // frame 0 = bar-8 drop
  { id: "S2-logo", from: G.bar(BAR.logo), to: G.bar(BAR.celo), component: S2Logo }, // DROP bar 12: hard cut + flash
  { id: "S3-celo", from: G.bar(BAR.celo), to: G.bar(BAR.how), enter: "slide", component: S3Celo }, // break: half-beat slide
  { id: "S4-how", from: G.bar(BAR.how), to: G.bar(BAR.product), enter: "whip", component: S4HowItWorks }, // break: whip
  { id: "S5-product", from: G.bar(BAR.product), to: G.bar(BAR.proof), enter: "zoom", component: S5Product }, // DROP bar 24: punch-in
  { id: "S6-proof", from: G.bar(BAR.proof), to: G.bar(BAR.stats), component: S6Proof }, // DROP bar 28: hard cut
  { id: "S7-stats", from: G.bar(BAR.stats), to: G.bar(BAR.outro), component: S7Stats }, // DROP bar 32 (peak): hard cut
  { id: "S8-outro", from: G.bar(BAR.outro), to: TOTAL, component: S8Outro }, // DROP bar 36: hard cut
];

const FLASHES = [
  { f: G.bar(BAR.hook), peak: 0.5 },
  ...[BAR.logo, BAR.stats].map((k) => ({ f: G.bar(k), peak: 0.6 })),
  { f: G.bar(BAR.product), peak: 0.45, color: C.neon },
  { f: G.at(26, 1), peak: 0.35, color: C.neon }, // BINGO!
  { f: G.bar(BAR.proof), peak: 0.35, color: "#F0B90B" },
  ...[16, 20, 35, BAR.outro].map((k) => ({ f: G.bar(k), peak: 0.25 })),
];

const TRANSITION_SFX = [
  { name: "whoosh" as const, at: G.bar(BAR.logo), volume: 0.8 },
  { name: "whoosh" as const, at: G.bar(BAR.celo), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.how), volume: 0.75 },
  { name: "whoosh" as const, at: G.bar(BAR.product), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.proof), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.stats), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.outro), volume: 0.6 },
];

/**
 * Voice-over ("bingo-chain-vo" only; lines in scripts/bingo-chain/vo.lines).
 * [id, TRACK bar, beat, +frames]. Music alone on: RIGGED?! (11.0), the logo
 * slam + B-I-N-G-O balls (12.0–13.1), MULTICHAIN! (14.2), BATTLE-TESTED!
 * (18.1), the call balls (21.x), BINGO! (22.2, 26.1), the product drop (24.0),
 * the five real calls (25.1–26.1), IT'S A TIE! (27.0), the proof drop +
 * DEPLOYED! (28.x), SETTLED! (31.0), the stat-wall drop (32.0), FULL HOUSE!
 * (35.0) and the outro slam (36.0).
 */
const VO_AT: VoCue<VoId>[] = [
  ["hook", 8, 1], // panel 1: player + card
  ["house", 9, 3], // "Nobody sees the drum."
  ["multi", 14, 3], // LIVE ON CELO + NOW ON BNB CHAIN badges
  ["celo", 16, 1], // Celo mainnet counters: 479 arenas · 8,996 calls
  ["seal", 19, 1], // step 1: seal (hash on-chain, padlock)
  ["verify", 22, 3], // step 4: reveal + replay → payout
  ["app", 24, 1], // real BSC-testnet lobby → create
  ["split", 27, 1], // after IT'S A TIE!: +0.00099 each
  ["game", 29, 0], // the 13 live txs land
  ["receipts", 31, 1], // 13 receipts, all status 1
  ["secs", 32, 2], // 35 SEC cell
  ["fee", 33, 3], // 1% fee cell
  ["tests", 35, 1, -3], // after FULL HOUSE!: 95/95 cell (ends before the outro slam)
  ["outro", 37, 2], // lockup + badges
];
const VO = placeVo(G, VO_LINES, VO_AT);
const duck = duckFor(VO);

export const Main: React.FC<VoProps> = ({ vo = false }) => (
  <BeatProvider grid={G}>
    <AbsoluteFill style={{ background: C.bg }}>
      <SceneTimeline scenes={SCENES} />
      <Flashes hits={FLASHES} />
      <Music track={TRACK} total={TOTAL} volume={0.5} fadeIn={2} trimBeforeS={MUSIC_START_S} fadeOut={G.beats(6)} duck={vo ? duck : undefined} />
      {vo ? <VoTrack clips={VO} volume={1.2} /> : null}
      <SfxTrack hits={TRANSITION_SFX} />
    </AbsoluteFill>
  </BeatProvider>
);
