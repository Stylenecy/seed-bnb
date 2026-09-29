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
  { id: "S1-hook", from: G.bar(BAR.hook), to: G.bar(BAR.logo), component: S1Hook }, // frame 0 = bar 4
  { id: "S2-logo", from: G.bar(BAR.logo), to: G.bar(BAR.celo), component: S2Logo }, // hard cut + flash
  { id: "S3-celo", from: G.bar(BAR.celo), to: G.bar(BAR.how), enter: "slide", component: S3Celo },
  { id: "S4-how", from: G.bar(BAR.how), to: G.bar(BAR.product), enter: "whip", component: S4HowItWorks },
  { id: "S5-product", from: G.bar(BAR.product), to: G.bar(BAR.proof), enter: "zoom", component: S5Product }, // DROP 13
  { id: "S6-proof", from: G.bar(BAR.proof), to: G.bar(BAR.stats), component: S6Proof },
  { id: "S7-stats", from: G.bar(BAR.stats), to: G.bar(BAR.outro), component: S7Stats }, // DROP 17
  { id: "S8-outro", from: G.bar(BAR.outro), to: TOTAL, component: S8Outro }, // DROP 19
];

const FLASHES = [
  { f: G.at(5, 0), peak: 0.45, color: C.clay }, // SILOED!
  { f: G.bar(BAR.logo), peak: 0.55 },
  { f: G.at(12, 0), peak: 0.4, color: C.clay }, // ONE POOL
  ...[13, 17, 19].map((k) => ({ f: G.bar(k), peak: 0.6 })), // drops
  { f: G.bar(BAR.proof), peak: 0.35, color: "#F0B90B" },
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
 * Voice-over ("lance-hub-vo" only; lines in scripts/lance-hub/vo.lines).
 * [id, track bar, beat, +frames]. Music alone on: SILOED (5.0), the logo slam (6.0),
 * MULTICHAIN (7.2), LIVE ON CELO (9.2), ONE POOL (12.0), the drops 13.0 / 17.0 / 19.0,
 * MINTED (14.3), CONFIRMED (16.3) and ONE SHARED POOL (18.2).
 */
const VO_AT: VoCue<VoId>[] = [
  ["hook", 4, 1], // work app / game app panels
  ["silo", 5, 1], // after SILOED · "Nothing flows between them."
  ["intro", 6, 1], // hub mark + LanceHub wordmark
  ["celo", 8, 1], // live Celo reads (supply / pool) · ends before LIVE ON CELO
  ["deposit", 10, 0], // step 1 DEPOSIT · step 2 USE IT
  ["redeem", 11, 0], // step 3 FUND POOL · step 4 REDEEM · ends before ONE POOL
  ["bingo", 13, 1], // real Bingo /create screen: LANCE ring, stake ring
  ["proof", 15, 1], // BSC testnet contracts → smoke txs · ends before CONFIRMED
  ["tests", 17, 1], // stat wall: 13/13 forge tests
  ["outro", 19, 1], // constellation tiles + wordmark
  ["credit", 20, 2], // "internal ecosystem credit · not listed on any exchange"
];
const VO = placeVo(G, VO_LINES, VO_AT);
const duck = duckFor(VO);

export const Main: React.FC<VoProps> = ({ vo = false }) => (
  <BeatProvider grid={G}>
    <AbsoluteFill style={{ background: C.bg }}>
      <SceneTimeline scenes={SCENES} />
      <Flashes hits={FLASHES} />
      <Music track={TRACK} total={TOTAL} volume={0.5} fadeIn={3} trimBeforeS={MUSIC_START_S} fadeOut={Math.round(G.beats(4))} duck={vo ? duck : undefined} />
      {vo ? <VoTrack clips={VO} volume={1.2} /> : null}
      <SfxTrack hits={TRANSITION_SFX} />
    </AbsoluteFill>
  </BeatProvider>
);
