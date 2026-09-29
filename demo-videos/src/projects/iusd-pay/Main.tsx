import React from "react";
import { AbsoluteFill } from "remotion";
import { BeatProvider, duckFor, Flashes, Music, placeVo, SceneTimeline, SfxTrack, VoTrack } from "../../kit";
import type { SceneSpec, VoCue, VoProps } from "../../kit";
import { S1Hook } from "./scenes/S1Hook";
import { S2Logo } from "./scenes/S2Logo";
import { S3HowItWorks } from "./scenes/S3HowItWorks";
import { S4Product } from "./scenes/S4Product";
import { S5Gifts } from "./scenes/S5Gifts";
import { S6Proof } from "./scenes/S6Proof";
import { S7Stats } from "./scenes/S7Stats";
import { S8Outro } from "./scenes/S8Outro";
import { BAR, G, TOTAL, TRACK } from "./timeline";
import { VO_LINES } from "./vo.gen";
import type { VoId } from "./vo.gen";

export { TOTAL };

/** Scene layout — every boundary is a track bar (see timeline.ts). */
const SCENES: SceneSpec[] = [
  { id: "S1-hook", from: G.bar(BAR.hook), to: G.bar(BAR.logo), component: S1Hook },
  { id: "S2-logo", from: G.bar(BAR.logo), to: G.bar(BAR.how), component: S2Logo }, // DROP: hard cut
  { id: "S3-how", from: G.bar(BAR.how), to: G.bar(BAR.product), enter: "slide", component: S3HowItWorks }, // break: half-beat slide
  { id: "S4-product", from: G.bar(BAR.product), to: G.bar(BAR.gifts), component: S4Product }, // DROP: hard cut
  { id: "S5-gifts", from: G.bar(BAR.gifts), to: G.bar(BAR.proof), enter: "whip", component: S5Gifts }, // re-entry: whip
  { id: "S6-proof", from: G.bar(BAR.proof), to: G.bar(BAR.stats), component: S6Proof }, // DROP: hard cut
  { id: "S7-stats", from: G.bar(BAR.stats), to: G.bar(BAR.outro), component: S7Stats }, // DROP (peak): hard cut
  { id: "S8-outro", from: G.bar(BAR.outro), to: TOTAL, component: S8Outro }, // DROP: hard cut
];

/** 1-frame flashes on the drops (big on act changes, soft inside scenes). */
const FLASHES = [
  ...[BAR.logo, BAR.product, BAR.proof, BAR.stats].map((k) => ({ f: G.bar(k), peak: 0.6 })),
  ...[8, 16, 28, BAR.outro].map((k) => ({ f: G.bar(k), peak: 0.28 })),
  { f: G.bar(BAR.gifts), peak: 0.35, color: "#F0B90B" },
];

/** Transition whooshes (landing ON the cut) — scene-internal SFX live in scenes. */
const TRANSITION_SFX = [
  { name: "whoosh" as const, at: G.bar(BAR.logo), volume: 0.8 },
  { name: "whoosh" as const, at: G.bar(BAR.how), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.product), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.gifts), volume: 0.8 },
  { name: "whoosh" as const, at: G.bar(BAR.proof), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.stats), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.outro), volume: 0.6 },
];

/**
 * Voice-over ("iusd-pay-vo" only; lines in scripts/iusd-pay/vo.lines).
 * [id, bar, beat, +frames] — each line starts on a beat next to its step and
 * clears the slams: UGH (3.0), SENT! (17.0), the stat-wall drop (32.0) and the
 * outro logo (36.0) play with music alone.
 */
const VO_AT: VoCue<VoId>[] = [
  ["hook", 0, 1], // panel 1: pay a friend
  ["gas", 1, 2, 2], // panels 2–3: gas for both · ends before UGH
  ["intro", 4, 2], // logo drop, after the slam
  ["bnb", 6, 1], // NOW ON BNB CHAIN badge
  ["pool", 8, 1], // steps 1–2: send · hold
  ["relayer", 10, 1], // step 3: auto-claim (ZOOM!)
  ["app", 12, 1], // real app: sign-in
  ["card", 13, 3], // pay card
  ["send", 15, 1], // transfer form → 0.5% fee
  ["auto", 18, 1], // auto-claim toggle → result card
  ["gifts", 20, 1], // gift boxes whip in
  ["designs", 22, 2], // after POP!
  ["proof", 24, 1], // deployed contracts
  ["smoke", 27, 0], // break → smoke-flow txs
  ["nogas", 30, 0], // relayer paid gas / recipient none
  ["received", 32, 2], // 10 → 9.95 counter
  ["tests", 34, 0], // 0 gas · 18/18 tests
  ["outro", 37, 0], // tagline
];
const VO = placeVo(G, VO_LINES, VO_AT);
const duck = duckFor(VO);

export const Main: React.FC<VoProps> = ({ vo = false }) => (
  <BeatProvider grid={G}>
    <AbsoluteFill style={{ background: "#07080a" }}>
      <SceneTimeline scenes={SCENES} />
      <Flashes hits={FLASHES} />
      <Music track={TRACK} total={TOTAL} volume={0.5} fadeOut={G.beats(4)} duck={vo ? duck : undefined} />
      {vo ? <VoTrack clips={VO} volume={1.2} /> : null}
      <SfxTrack hits={TRANSITION_SFX} />
    </AbsoluteFill>
  </BeatProvider>
);
