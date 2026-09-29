import React from "react";
import { AbsoluteFill } from "remotion";
import { BeatProvider, duckFor, Flashes, Music, placeVo, SceneTimeline, SfxTrack, VoTrack } from "../../kit";
import type { SceneSpec, VoCue, VoProps } from "../../kit";
import { S1Hook } from "./scenes/S1Hook";
import { S2Logo } from "./scenes/S2Logo";
import { S3HowItWorks } from "./scenes/S3HowItWorks";
import { S4Product } from "./scenes/S4Product";
import { S5Chain } from "./scenes/S5Chain";
import { S6Season } from "./scenes/S6Season";
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
  { id: "S2-logo", from: G.bar(BAR.logo), to: G.bar(BAR.how), component: S2Logo }, // hard cut on the downbeat
  { id: "S3-how", from: G.bar(BAR.how), to: G.bar(BAR.product), enter: "slide", component: S3HowItWorks }, // half-beat slide
  { id: "S4-product", from: G.bar(BAR.product), to: G.bar(BAR.chain), enter: "zoom", component: S4Product }, // punch-in
  { id: "S5-chain", from: G.bar(BAR.chain), to: G.bar(BAR.season), component: S5Chain }, // DROP 13: hard cut
  { id: "S6-season", from: G.bar(BAR.season), to: G.bar(BAR.proof), enter: "whip", component: S6Season }, // whip
  { id: "S7-proof", from: G.bar(BAR.proof), to: G.bar(BAR.stats), component: S7Proof }, // DROP 17: hard cut
  { id: "S8-stats", from: G.bar(BAR.stats), to: G.bar(BAR.outro), component: S8Stats }, // DROP 19: hard cut
  { id: "S9-outro", from: G.bar(BAR.outro), to: TOTAL, component: S9Outro }, // hard cut
];

const FLASHES = [
  ...[BAR.logo, BAR.chain, BAR.proof, BAR.stats].map((k) => ({ f: G.bar(k), peak: 0.6 })),
  ...[11, BAR.outro].map((k) => ({ f: G.bar(k), peak: 0.3 })),
  { f: G.at(BAR.chain + 1, 2), peak: 0.35, color: "#34d399" }, // MATCHED!
  { f: G.at(BAR.season, 2), peak: 0.35, color: "#F0B90B" }, // PAID!
];

const TRANSITION_SFX = [
  { name: "whoosh" as const, at: G.bar(BAR.logo), volume: 0.8 },
  { name: "whoosh" as const, at: G.bar(BAR.how), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.product), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.chain), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.season), volume: 0.8 },
  { name: "whoosh" as const, at: G.bar(BAR.proof), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.stats), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.outro), volume: 0.6 },
];

/**
 * Voice-over cut ("zero-arena-vo"): lines on the track's beat grid, next to the
 * step they explain; the PROVE IT / drop / MATCHED / PAID / DENIED hits stay music-only.
 * Claims from zero-arena/VERIFY-BNB.md (0G Storage skipped → placeholder roots).
 */
const VO_AT: VoCue<VoId>[] = [
  ["hook", 1, 1], // brag panels · ends before PROVE IT (2,2)
  ["intro", 3, 1], // wordmark after the ZA slam
  ["bnb", 4, 2], // NOW ON BNB CHAIN badge
  ["certify", 5, 1], // step 1 CERTIFY
  ["mint", 6, 0], // step 2 MINT
  ["live", 7, 0], // step 3 LIVE RUN
  ["season", 8, 0], // step 4 SEASON
  ["app", 9, 1], // real dashboard: leaderboard
  ["cert", 10, 1], // agent page runHash · ends before the lift (11)
  ["run", 11, 1], // live page: genesis + 2 epochs
  ["settled", 12, 1], // /season/1 "Settled" · ends before DROP 13
  ["chain", 13, 1], // hash chain after the drop slam
  ["match", 14, 0], // recompute · ends before MATCHED! (14,2)
  ["paid", 15, 0], // settle · ends before PAID! (15,2)
  ["oracle", 16, 0, -2], // transfer oracle panel · ends before DENIED! (16,2)
  ["proof", 17, 1], // 5 deployed contracts, after the DROP 17 slam
  ["smoke", 18, 0], // 9 smoke txs · ends before DROP 19
  ["stats", 19, 1], // 2 epochs, hash chain matched
  ["honest", 20, 0], // honest caveat: 0G storage skipped · ends before outro (21)
  ["outro", 21, 1], // wordmark → tagline
];
const VO = placeVo(G, VO_LINES, VO_AT);
const duck = duckFor(VO);

export const Main: React.FC<VoProps> = ({ vo = false }) => (
  <BeatProvider grid={G}>
    <AbsoluteFill style={{ background: "#0a0a0f" }}>
      <SceneTimeline scenes={SCENES} />
      <Flashes hits={FLASHES} />
      <Music track={TRACK} total={TOTAL} volume={0.5} trimBeforeS={MUSIC_START_S} fadeIn={4} fadeOut={G.beats(4)} duck={vo ? duck : undefined} />
      {vo ? <VoTrack clips={VO} volume={1.2} /> : null}
      <SfxTrack hits={TRANSITION_SFX} />
    </AbsoluteFill>
  </BeatProvider>
);
