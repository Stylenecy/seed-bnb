import React from "react";
import { AbsoluteFill } from "remotion";
import { BeatProvider, duckFor, Flashes, Music, placeVo, SceneTimeline, SfxTrack, VoTrack } from "../../kit";
import type { SceneSpec, VoCue, VoProps } from "../../kit";
import { S1Hook } from "./scenes/S1Hook";
import { S2Logo } from "./scenes/S2Logo";
import { S3HowItWorks } from "./scenes/S3HowItWorks";
import { S4Product } from "./scenes/S4Product";
import { S5Live } from "./scenes/S5Live";
import { S6Fork } from "./scenes/S6Fork";
import { S7Proof } from "./scenes/S7Proof";
import { S8Stats } from "./scenes/S8Stats";
import { S9Outro } from "./scenes/S9Outro";
import { BAR, G, MUSIC_START_S, TOTAL, TRACK } from "./timeline";
import { VO_LINES } from "./vo.gen";
import type { VoId } from "./vo.gen";

export { TOTAL };

/** Scene layout — every boundary is a track bar (see timeline.ts). */
const SCENES: SceneSpec[] = [
  { id: "S1-hook", from: G.bar(BAR.hook), to: G.bar(BAR.logo), component: S1Hook },
  { id: "S2-logo", from: G.bar(BAR.logo), to: G.bar(BAR.how), component: S2Logo }, // DROP: hard cut
  { id: "S3-how", from: G.bar(BAR.how), to: G.bar(BAR.product), enter: "slide", component: S3HowItWorks }, // break: slide
  { id: "S4-product", from: G.bar(BAR.product), to: G.bar(BAR.live), component: S4Product }, // DROP: hard cut
  { id: "S5-live", from: G.bar(BAR.live), to: G.bar(BAR.fork), enter: "slide", component: S5Live }, // break: slide
  { id: "S6-fork", from: G.bar(BAR.fork), to: G.bar(BAR.proof), enter: "whip", component: S6Fork }, // whip
  { id: "S7-proof", from: G.bar(BAR.proof), to: G.bar(BAR.stats), component: S7Proof }, // DROP: hard cut
  { id: "S8-stats", from: G.bar(BAR.stats), to: G.bar(BAR.outro), component: S8Stats }, // DROP (peak)
  { id: "S9-outro", from: G.bar(BAR.outro), to: TOTAL, component: S9Outro }, // DROP
];

const FLASHES = [
  ...[BAR.logo, BAR.product, BAR.proof, BAR.stats].map((k) => ({ f: G.bar(k), peak: 0.6 })),
  ...[8, 16, 20, BAR.outro].map((k) => ({ f: G.bar(k), peak: 0.28 })),
  { f: G.bar(23), peak: 0.5, color: "#ff7a90" }, // the price crash
  { f: G.bar(24), peak: 0.45, color: "#e4f33d" }, // defend
];

const TRANSITION_SFX = [
  { name: "whoosh" as const, at: G.bar(BAR.logo), volume: 0.8 },
  { name: "whoosh" as const, at: G.bar(BAR.how), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.product), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.live), volume: 0.75 },
  { name: "whoosh" as const, at: G.bar(BAR.fork), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.proof), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.stats), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.outro), volume: 0.6 },
];

/**
 * Voice-over ("equinox-vo" only; lines in scripts/equinox/vo.lines).
 * [id, bar, beat, +frames] — each line starts on a beat next to its step and
 * clears the slams: LIQUIDATED?! (3.0), logo (4.0), LIVE RUN! (19.0),
 * CRASH! (23.0), DEFENDED! (24.0), DEPLOYED! (29.2), the stat-wall drop (32.0)
 * and the outro logo (36.0) play with music alone.
 */
const VO_AT: VoCue<VoId>[] = [
  ["hook", 2, 0], // panels 1–3: borrowed, crash, asleep · ends before LIQUIDATED?!
  ["intro", 4, 2], // logo wordmark, after the slam
  ["bnb", 6, 0], // NOW ON BNB CHAIN badge
  ["deposit", 8, 0], // step 1: vault (CLUNK!)
  ["skim", 9, 0], // step 2: skim
  ["shadow", 10, 0], // step 3: shadow wallet
  ["defend", 11, 0], // step 4: defend · ends before the bar-12 drop
  ["mock", 12, 1], // UI preview · MOCK DATA tag
  ["dash", 14, 0], // dashboard: collateral · debt · shadow · HF gauge
  ["feed", 16, 0], // activity feed "Defense triggered"
  ["withdraw", 17, 1], // withdraw from the shadow wallet
  ["live", 20, 0], // live BSC-testnet run: openVault · deposit
  ["borrowed", 21, 2], // skimToReserve 1,400 tUSDT · HF 2.00 · ends before CRASH!
  ["back", 24, 1], // defend(1) → HF 1.50
  ["venus", 26, 1], // Venus adapter FORK test cards
  ["deployed", 28, 0, 8], // 8 contracts · ends before DEPLOYED!
  ["gas", 30, 0], // smoke txs + 0.000997 tBNB
  ["tests", 35, 0], // 15/15 unit tests
  ["outro", 37, 0], // tagline
];
const VO = placeVo(G, VO_LINES, VO_AT);
const duck = duckFor(VO);

export const Main: React.FC<VoProps> = ({ vo = false }) => (
  <BeatProvider grid={G}>
    <AbsoluteFill style={{ background: "#07080a" }}>
      <SceneTimeline scenes={SCENES} />
      <Flashes hits={FLASHES} />
      <Music track={TRACK} total={TOTAL} volume={0.5} trimBeforeS={MUSIC_START_S} fadeIn={4} fadeOut={G.beats(4)} duck={vo ? duck : undefined} />
      {vo ? <VoTrack clips={VO} volume={1.2} /> : null}
      <SfxTrack hits={TRANSITION_SFX} />
    </AbsoluteFill>
  </BeatProvider>
);
