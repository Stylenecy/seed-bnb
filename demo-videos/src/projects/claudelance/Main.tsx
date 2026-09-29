import React from "react";
import { AbsoluteFill } from "remotion";
import { BeatProvider, duckFor, Flashes, Music, placeVo, SceneTimeline, SfxTrack, VoTrack } from "../../kit";
import type { SceneSpec, VoCue, VoProps } from "../../kit";
import { S1Hook } from "./scenes/S1Hook";
import { S2Logo } from "./scenes/S2Logo";
import { S3Celo } from "./scenes/S3Celo";
import { S4HowItWorks } from "./scenes/S4HowItWorks";
import { S5Product } from "./scenes/S5Product";
import { S6Identity } from "./scenes/S6Identity";
import { S7Proof } from "./scenes/S7Proof";
import { S8Stats } from "./scenes/S8Stats";
import { S9Outro } from "./scenes/S9Outro";
import { BAR, G, MUSIC_START_S, TOTAL, TRACK } from "./timeline";
import { VO_LINES } from "./vo.gen";
import type { VoId } from "./vo.gen";

export { TOTAL };

/** Scene layout: every boundary is a track bar (see timeline.ts). */
const SCENES: SceneSpec[] = [
  { id: "S1-hook", from: G.bar(BAR.hook), to: G.bar(BAR.logo), component: S1Hook },
  { id: "S2-logo", from: G.bar(BAR.logo), to: G.bar(BAR.celo), component: S2Logo }, // DROP bar 8: hard cut + flash
  { id: "S3-celo", from: G.bar(BAR.celo), to: G.bar(BAR.how), enter: "slide", component: S3Celo }, // half-beat slide
  { id: "S4-how", from: G.bar(BAR.how), to: G.bar(BAR.product), enter: "whip", component: S4HowItWorks }, // whip
  { id: "S5-product", from: G.bar(BAR.product), to: G.bar(BAR.identity), enter: "zoom", component: S5Product }, // punch-in
  { id: "S6-identity", from: G.bar(BAR.identity), to: G.bar(BAR.proof), component: S6Identity }, // hard cut
  { id: "S7-proof", from: G.bar(BAR.proof), to: G.bar(BAR.stats), enter: "whip", component: S7Proof }, // whip
  { id: "S8-stats", from: G.bar(BAR.stats), to: G.bar(BAR.outro), component: S8Stats }, // phrase DROP bar 32: hard cut
  { id: "S9-outro", from: G.bar(BAR.outro), to: TOTAL, component: S9Outro }, // hard cut
];

const FLASHES = [
  ...[BAR.logo, BAR.stats].map((k) => ({ f: G.bar(k), peak: 0.6 })),
  ...[BAR.identity, 16, 34, BAR.outro].map((k) => ({ f: G.bar(k), peak: 0.3 })),
  { f: G.bar(BAR.proof), peak: 0.35, color: "#F0B90B" },
  { f: G.bar(BAR.product), peak: 0.3, color: "#F0B90B" },
];

const TRANSITION_SFX = [
  { name: "whoosh" as const, at: G.bar(BAR.logo), volume: 0.8 },
  { name: "whoosh" as const, at: G.bar(BAR.celo), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.how), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.product), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.identity), volume: 0.6 },
  { name: "whoosh" as const, at: G.bar(BAR.proof), volume: 0.8 },
  { name: "whoosh" as const, at: G.bar(BAR.stats), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.outro), volume: 0.6 },
];

/**
 * Voice-over ("claudelance-vo" only; lines in scripts/claudelance/vo.lines).
 * [id, bar, beat, +frames] — track bars (the file starts at bar 4). Each line
 * starts on a beat next to its step and clears the slams: ZZZ (7.0), the logo
 * drop (8.0), WAKE UP (9.3), BATTLE-TESTED (13.1), PAID (17.1), DEPLOYED (27.2),
 * PAID (31.2), the stat-wall drop (32.0), ONE PROTOCOL (34.3) and the outro
 * logo (36.0) play with music alone.
 */
const VO_AT: VoCue<VoId>[] = [
  ["hook", 4, 0], // panel 1: $200/mo Claude Code
  ["idle", 5, 1], // 24h dial → idle laptop · ends before ZZZ
  ["intro", 8, 1], // logo wordmark stamps, after the slam
  ["celo", 10, 0], // real app on Celo mainnet
  ["record", 11, 1], // 80/96 resolved · ERC-8004 workers
  ["post", 14, 0], // step 1: escrow
  ["claim", 15, 0, 2], // step 2: stake + claim (+2f clears "post")
  ["ship", 16, 0], // step 3: deliverable + CI · ends before PAID!
  ["bnb", 18, 1], // BSC testnet header + hero
  ["chains", 20, 0], // chain switcher
  ["earned", 22, 0], // profile: 2.98 USDT (+0.98)
  ["agent", 24, 0], // ERC-8004 card, agentId 2474
  ["proof", 26, 1], // contracts card
  ["lifecycle", 28, 0], // bounty txs
  ["revert", 29, 3], // "attestCI from a non-relayer → reverts" chip
  ["txs", 32, 1], // 11 TXS panel
  ["tests", 33, 2], // 115 forge tests panel
  ["both", 35, 0], // "Same contract. Same SDK."
  ["outro", 36, 2], // tagline
];
const VO = placeVo(G, VO_LINES, VO_AT);
const duck = duckFor(VO);

export const Main: React.FC<VoProps> = ({ vo = false }) => (
  <BeatProvider grid={G}>
    <AbsoluteFill style={{ background: "#110f0d" }}>
      <SceneTimeline scenes={SCENES} />
      <Flashes hits={FLASHES} />
      <Music track={TRACK} total={TOTAL} volume={0.5} trimBeforeS={MUSIC_START_S} fadeOut={G.beats(6)} duck={vo ? duck : undefined} />
      {vo ? <VoTrack clips={VO} volume={1.2} /> : null}
      <SfxTrack hits={TRANSITION_SFX} />
    </AbsoluteFill>
  </BeatProvider>
);
