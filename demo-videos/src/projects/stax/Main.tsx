import React from "react";
import { AbsoluteFill } from "remotion";
import { BeatProvider, duckFor, Flashes, Music, placeVo, SceneTimeline, SfxTrack, VoTrack } from "../../kit";
import type { SceneSpec, VoCue, VoProps } from "../../kit";
import { S1Hook } from "./scenes/S1Hook";
import { S2Logo } from "./scenes/S2Logo";
import { S3HowItWorks } from "./scenes/S3HowItWorks";
import { S4Product } from "./scenes/S4Product";
import { S5Vera } from "./scenes/S5Vera";
import { S6Proof } from "./scenes/S6Proof";
import { S7Stats } from "./scenes/S7Stats";
import { S8Outro } from "./scenes/S8Outro";
import { BAR, G, TOTAL, TRACK } from "./timeline";
import { VO_LINES } from "./vo.gen";
import type { VoId } from "./vo.gen";

export { TOTAL };

/** Scene layout: every boundary is a track bar (see timeline.ts). */
const SCENES: SceneSpec[] = [
  { id: "S1-hook", from: G.bar(BAR.hook), to: G.bar(BAR.logo), component: S1Hook },
  { id: "S2-logo", from: G.bar(BAR.logo), to: G.bar(BAR.how), component: S2Logo }, // hard cut + flash
  { id: "S3-how", from: G.bar(BAR.how), to: G.bar(BAR.product), enter: "slide", component: S3HowItWorks }, // half-beat slide
  { id: "S4-product", from: G.bar(BAR.product), to: G.bar(BAR.vera), enter: "zoom", component: S4Product }, // punch-in
  { id: "S5-vera", from: G.bar(BAR.vera), to: G.bar(BAR.proof), component: S5Vera }, // DROP 13: hard cut
  { id: "S6-proof", from: G.bar(BAR.proof), to: G.bar(BAR.stats), enter: "whip", component: S6Proof }, // whip
  { id: "S7-stats", from: G.bar(BAR.stats), to: G.bar(BAR.outro), component: S7Stats }, // DROP 19: hard cut
  { id: "S8-outro", from: G.bar(BAR.outro), to: TOTAL, component: S8Outro }, // hard cut
];

const FLASHES = [
  ...[BAR.logo, BAR.vera, BAR.stats].map((k) => ({ f: G.bar(k), peak: 0.6 })),
  ...[11, 17, BAR.outro].map((k) => ({ f: G.bar(k), peak: 0.28 })),
  { f: G.bar(BAR.proof), peak: 0.35, color: "#F0B90B" },
];

const TRANSITION_SFX = [
  { name: "whoosh" as const, at: G.bar(BAR.logo), volume: 0.8 },
  { name: "whoosh" as const, at: G.bar(BAR.how), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.product), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.vera), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.proof), volume: 0.8 },
  { name: "whoosh" as const, at: G.bar(BAR.stats), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.outro), volume: 0.6 },
];

/**
 * Voice-over ("stax-vo" only; lines in scripts/stax/vo.lines).
 * [id, bar, beat, +frames]. Bars are long here (82.65 BPM, ~2.9 s), so every
 * line starts on a beat and clears the slams: UGH (2.2), the logo (3.0),
 * INVESTED! (12.2), the Vera drop (13.0), the smoke drop (17.0) + INVESTED!
 * (17.3), BLOCKED! (18.3), the stat-wall drop (19.0), the outro logo (21.0).
 */
const VO_AT: VoCue<VoId>[] = [
  ["hook", 0, 0], // panel 1: Apple & Tesla, $20
  ["risk", 1, 1], // panel 2 "?"s → ends before UGH
  ["intro", 3, 1], // after the logo slam, wordmark
  ["bnb", 4, 2], // NOW ON BNB CHAIN badge
  ["say", 5, 1], // step 1: say it
  ["plan", 6, 1], // step 2: Vera plans + signs
  ["gate", 7, 1], // step 3: risk gate (CHECKED!)
  ["swap", 8, 1], // step 4: swap on PancakeSwap V3
  ["app", 9, 1], // real app home: Invest with Vera
  ["picks", 10, 1], // thinking → plan ready
  ["fee", 11, 1], // zoom onto the fee line
  ["vera", 13, 1], // ERC-8004 identity card, signer key
  ["proof", 15, 1], // deployed contracts card
  ["smoke", 17, 1], // $20 smoke flow card
  ["blocked", 18, 0], // outputs → risk-gate revert, before BLOCKED!
  ["stats", 19, 1], // $20 → AAPLx + TSLAx, 0.25% fee
  ["outro", 21, 1], // wordmark → tagline
];
const VO = placeVo(G, VO_LINES, VO_AT);
const duck = duckFor(VO);

export const Main: React.FC<VoProps> = ({ vo = false }) => (
  <BeatProvider grid={G}>
    <AbsoluteFill style={{ background: "#0c0f12" }}>
      <SceneTimeline scenes={SCENES} />
      <Flashes hits={FLASHES} />
      <Music track={TRACK} total={TOTAL} volume={0.5} fadeOut={G.beats(4)} duck={vo ? duck : undefined} />
      {vo ? <VoTrack clips={VO} volume={1.2} /> : null}
      <SfxTrack hits={TRANSITION_SFX} />
    </AbsoluteFill>
  </BeatProvider>
);
