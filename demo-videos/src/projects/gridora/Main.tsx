import React from "react";
import { AbsoluteFill } from "remotion";
import { BeatProvider, duckFor, Flashes, Music, placeVo, SceneTimeline, SfxTrack, VoTrack } from "../../kit";
import type { SceneSpec, VoCue, VoProps } from "../../kit";
import { S1Hook } from "./scenes/S1Hook";
import { S2Logo } from "./scenes/S2Logo";
import { S3HowItWorks } from "./scenes/S3HowItWorks";
import { S4Grid } from "./scenes/S4Grid";
import { S5Product } from "./scenes/S5Product";
import { S6Testnet } from "./scenes/S6Testnet";
import { S7Proof } from "./scenes/S7Proof";
import { S8Stats } from "./scenes/S8Stats";
import { S9Outro } from "./scenes/S9Outro";
import { C } from "./theme";
import { BAR, G, MUSIC_START_S, TOTAL, TRACK } from "./timeline";
import { VO_LINES } from "./vo.gen";
import type { VoId } from "./vo.gen";

export { TOTAL };

/** Scene layout — every boundary is a track bar (see timeline.ts). */
const SCENES: SceneSpec[] = [
  { id: "S1-hook", from: G.bar(BAR.hook), to: G.bar(BAR.logo), component: S1Hook },
  { id: "S2-logo", from: G.bar(BAR.logo), to: G.bar(BAR.how), component: S2Logo }, // DROP: hard cut
  { id: "S3-how", from: G.bar(BAR.how), to: G.bar(BAR.grid), enter: "slide", component: S3HowItWorks }, // break: slide
  { id: "S4-grid", from: G.bar(BAR.grid), to: G.bar(BAR.product), component: S4Grid }, // DROP: hard cut
  { id: "S5-product", from: G.bar(BAR.product), to: G.bar(BAR.testnet), enter: "zoom", component: S5Product }, // DROP: zoom punch
  { id: "S6-testnet", from: G.bar(BAR.testnet), to: G.bar(BAR.proof), component: S6Testnet }, // DROP: hard cut
  { id: "S7-proof", from: G.bar(BAR.proof), to: G.bar(BAR.stats), enter: "whip", component: S7Proof }, // DROP: whip
  { id: "S8-stats", from: G.bar(BAR.stats), to: G.bar(BAR.outro), component: S8Stats }, // DROP (peak)
  { id: "S9-outro", from: G.bar(BAR.outro), to: TOTAL, component: S9Outro }, // DROP
];

const FLASHES = [
  ...[4, BAR.logo, BAR.grid, BAR.product, BAR.testnet, BAR.proof, BAR.stats].map((k) => ({ f: G.bar(k), peak: 0.6 })),
  ...[12, BAR.outro].map((k) => ({ f: G.bar(k), peak: 0.3 })),
  { f: G.bar(19), peak: 0.5, color: "#fb7185" }, // circuit breaker
  { f: G.bar(27), peak: 0.35, color: "#9FFF00" }, // attested
  { f: G.bar(31), peak: 0.3, color: "#F0B90B" }, // mainnet
];

const TRANSITION_SFX = [BAR.logo, BAR.how, BAR.grid, BAR.product, BAR.testnet, BAR.proof, BAR.stats, BAR.outro].map((k) => ({
  name: "whoosh" as const,
  at: G.bar(k),
  volume: k === BAR.logo ? 0.8 : 0.65,
}));

/** Voice-over cues (id, bar, beat): each line lands next to the step it explains, ends before the next hit. */
const VO_AT: VoCue<VoId>[] = [
  ["hook", 3, 0], // lone bot in the dark (music hush)
  ["promise", 5, 2], // market dumps → plan edited (ends before NO RECEIPTS. on 7)
  ["intro", 8, 2], // gridora types in → tagline (ends before BUILT ON BNB CHAIN, 10)
  ["grid", 12, 1], // step 1 GRID
  ["commit", 13, 2], // step 2 COMMIT, sub line
  ["trade", 14, 2], // step 3 TRADE, sub line
  ["attest", 15, 1], // step 4 ATTEST (ends before the 16 drop)
  ["illus", 16, 1], // the grid at work — illustration pill on screen
  ["breakout", 18, 0], // sets up FLAT! on 19 (left to the music)
  ["real", 20, 1], // REAL verifier, mainnet hero
  ["tape", 21, 3], // mainnet tape, click → BscScan
  ["testrun", 24, 1], // testnet register → commit
  ["record", 25, 3], // record +85 bps (ends before ATTESTED. on 27)
  ["deployed", 28, 1], // testnet contracts card
  ["status", 29, 2], // 7 txs, all status 1
  ["mainnet", 31, 1], // same contracts on BSC mainnet (ends before the 32 peak)
  ["stats", 32, 1], // 38 trades journaled · 22 green
  ["honest", 33, 2], // the honest part (ends before THE TAPE DOESN'T LIE. on 35)
  ["outro", 37, 1], // tagline
];
const VO = placeVo(G, VO_LINES, VO_AT);
const duck = duckFor(VO);

export const Main: React.FC<VoProps> = ({ vo = false }) => (
  <BeatProvider grid={G}>
    <AbsoluteFill style={{ background: C.bg }}>
      <SceneTimeline scenes={SCENES} />
      <Flashes hits={FLASHES} />
      <Music track={TRACK} total={TOTAL} volume={0.5} trimBeforeS={MUSIC_START_S} fadeIn={3} fadeOut={G.beats(4)} duck={vo ? duck : undefined} />
      {vo ? <VoTrack clips={VO} volume={1.2} /> : null}
      <SfxTrack hits={TRANSITION_SFX} />
    </AbsoluteFill>
  </BeatProvider>
);
