import React from "react";
import { AbsoluteFill } from "remotion";
import { BeatProvider, duckFor, Flashes, Music, placeVo, SceneTimeline, SfxTrack, VoTrack } from "../../kit";
import type { SceneSpec, VoCue, VoProps } from "../../kit";
import { S1Hook } from "./scenes/S1Hook";
import { S2Logo } from "./scenes/S2Logo";
import { S3HowItWorks } from "./scenes/S3HowItWorks";
import { S4Product } from "./scenes/S4Product";
import { S5Api } from "./scenes/S5Api";
import { S6Proof } from "./scenes/S6Proof";
import { S7Stats } from "./scenes/S7Stats";
import { S8Outro } from "./scenes/S8Outro";
import { BAR, G, MUSIC_START_S, TOTAL, TRACK } from "./timeline";
import { VO_LINES } from "./vo.gen";
import type { VoId } from "./vo.gen";

export { TOTAL };

/** Scene layout — every boundary is a track bar (see timeline.ts). */
const SCENES: SceneSpec[] = [
  { id: "S1-hook", from: G.bar(BAR.hook), to: G.bar(BAR.logo), component: S1Hook },
  { id: "S2-logo", from: G.bar(BAR.logo), to: G.bar(BAR.how), component: S2Logo }, // DROP: hard cut
  { id: "S3-how", from: G.bar(BAR.how), to: G.bar(BAR.product), enter: "slide", component: S3HowItWorks }, // break: slide
  { id: "S4-product", from: G.bar(BAR.product), to: G.bar(BAR.api), component: S4Product }, // DROP: hard cut
  { id: "S5-api", from: G.bar(BAR.api), to: G.bar(BAR.proof), enter: "slide", component: S5Api }, // break: slide
  { id: "S6-proof", from: G.bar(BAR.proof), to: G.bar(BAR.stats), component: S6Proof }, // DROP: hard cut
  { id: "S7-stats", from: G.bar(BAR.stats), to: G.bar(BAR.outro), component: S7Stats }, // DROP (peak)
  { id: "S8-outro", from: G.bar(BAR.outro), to: TOTAL, component: S8Outro }, // DROP
];

const FLASHES = [
  ...[BAR.logo, BAR.product, BAR.proof, BAR.stats].map((k) => ({ f: G.bar(k), peak: 0.6 })),
  ...[12, 20, 24, BAR.outro].map((k) => ({ f: G.bar(k), peak: 0.28 })),
  { f: G.bar(25), peak: 0.35, color: "#2fd98a" }, // 201 activated
];

const TRANSITION_SFX = [BAR.logo, BAR.how, BAR.product, BAR.api, BAR.proof, BAR.stats, BAR.outro].map((k) => ({
  name: "whoosh" as const,
  at: G.bar(k),
  volume: k === BAR.logo ? 0.8 : 0.7,
}));

/**
 * Voice-over ("liber-vo" only; lines in scripts/liber/vo.lines).
 * [id, track bar, beat, +frames]. The slams play with music alone: STUCK (7.0),
 * the logo drop (8.0), the product drop (16.0), TOPPED UP (20.3), the proof
 * drop (28.0), the stat-wall peak (32.0) and the outro logo (36.0).
 */
const VO_AT: VoCue<VoId>[] = [
  ["hook", 4, 1], // panel 1: paid in USDC
  ["qris", 5, 1], // panel 2: QRIS stand · ends before panel 3
  ["intro", 8, 1], // logo drop, after the slam
  ["bnb", 10, 1], // NOW ON BNB CHAIN badge
  ["activate", 12, 1], // step 1: activate
  ["scan", 13, 1], // step 2: scan
  ["topup", 14, 2], // step 3: top up Kolo
  ["app", 16, 1], // real app: onboarding
  ["gate", 17, 2], // 202 awaiting funding · 0.001 BNB
  ["cast", 21, 1], // history → on-chain result card (sent with cast)
  ["nobnb", 24, 1], // POST /users → 202
  ["funded", 25, 2], // → 201
  ["balance", 26, 2], // GET /balance 995
  ["proof", 28, 1], // MockUSDC deployed
  ["smoke", 30, 2, -6], // faucet + transfer txs · clears the 32 drop
  ["trust", 32, 2], // 0.001 BNB · 0 trustlines panel
  ["tests", 35, 0], // 42/42 · 29/29 · 3/3
  ["outro", 37, 1], // tagline
];
const VO = placeVo(G, VO_LINES, VO_AT);
const duck = duckFor(VO);

export const Main: React.FC<VoProps> = ({ vo = false }) => (
  <BeatProvider grid={G}>
    <AbsoluteFill style={{ background: "#07080a" }}>
      <SceneTimeline scenes={SCENES} />
      <Flashes hits={FLASHES} />
      <Music track={TRACK} total={TOTAL} volume={0.5} trimBeforeS={MUSIC_START_S} fadeIn={3} fadeOut={G.beats(4)} duck={vo ? duck : undefined} />
      {vo ? <VoTrack clips={VO} volume={1.2} /> : null}
      <SfxTrack hits={TRANSITION_SFX} />
    </AbsoluteFill>
  </BeatProvider>
);
