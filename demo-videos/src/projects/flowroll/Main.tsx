import React from "react";
import { AbsoluteFill } from "remotion";
import { BeatProvider, duckFor, Flashes, Music, placeVo, SceneTimeline, SfxTrack, VoTrack } from "../../kit";
import type { SceneSpec, VoCue, VoProps } from "../../kit";
import { S1Hook } from "./scenes/S1Hook";
import { S2Logo } from "./scenes/S2Logo";
import { S3HowItWorks } from "./scenes/S3HowItWorks";
import { S4Product } from "./scenes/S4Product";
import { S5Live } from "./scenes/S5Live";
import { S6Bug } from "./scenes/S6Bug";
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
  { id: "S2-logo", from: G.bar(BAR.logo), to: G.bar(BAR.how), component: S2Logo }, // DROP: hard cut
  { id: "S3-how", from: G.bar(BAR.how), to: G.bar(BAR.product), enter: "slide", component: S3HowItWorks },
  { id: "S4-product", from: G.bar(BAR.product), to: G.bar(BAR.live), component: S4Product }, // DROP: hard cut
  { id: "S5-live", from: G.bar(BAR.live), to: G.bar(BAR.bug), enter: "whip", component: S5Live },
  { id: "S6-bug", from: G.bar(BAR.bug), to: G.bar(BAR.proof), enter: "slide", component: S6Bug },
  { id: "S7-proof", from: G.bar(BAR.proof), to: G.bar(BAR.stats), enter: "zoom", component: S7Proof },
  { id: "S8-stats", from: G.bar(BAR.stats), to: G.bar(BAR.outro), component: S8Stats }, // DROP (peak): hard cut
  { id: "S9-outro", from: G.bar(BAR.outro), to: TOTAL, component: S9Outro }, // hard cut
];

/** 1-frame flashes: big on the drops, soft on act changes, amber on PAYDAY. */
const FLASHES = [
  ...[BAR.logo, BAR.product, BAR.proof, BAR.stats].map((k) => ({ f: G.bar(k), peak: 0.6 })),
  ...[12, 20, BAR.outro].map((k) => ({ f: G.bar(k), peak: 0.28 })),
  { f: G.bar(24), peak: 0.65, color: "#f59e0b" }, // PAYDAY (bar-24 drop)
  { f: G.bar(BAR.bug + 1), peak: 0.35, color: "#10b981" }, // FIXED
  { f: G.bar(BAR.hook + 2), peak: 0.3, color: "#a78bfa" }, // IDLE CASH.
];

/** Transition whooshes land ON the cut. Scene-internal SFX live in the scenes. */
const TRANSITION_SFX = [BAR.logo, BAR.how, BAR.product, BAR.live, BAR.bug, BAR.proof, BAR.stats, BAR.outro].map((k) => ({
  name: "whoosh" as const,
  at: G.bar(k),
  volume: k === BAR.logo || k === BAR.live ? 0.8 : 0.65,
}));

/**
 * Voice-over ("flowroll-vo" only; lines in scripts/flowroll/vo.lines).
 * [id, TRACK bar, beat, +frames]. Music alone on: IDLE CASH. BROKE STAFF. (7.x),
 * the logo drop (8.0–8.2), NOW ON BNB CHAIN (10.0), PAYDAY! (15.1) into the
 * product drop (16.0), the live-run whip (21.0), PAYDAY! drop (24.0–24.1),
 * CLAIMED! (25.x), STUCK!/FIXED! (26.x–27.0), the proof drop (28.0),
 * DEPLOYED! (29.2), PAID! (31.0), the stat-wall drop (32.x) and the outro slam (36.0).
 */
const VO_AT: VoCue<VoId>[] = [
  ["hook", 5, 1], // idle vault + Z Z Z
  ["work", 8, 3], // FLOWROLL stamps → hero line
  ["bnb", 10, 1], // after the NOW ON BNB CHAIN slam
  ["deposit", 12, 0], // step 1 DEPOSIT
  ["earn", 13, 0], // step 2 EARN
  ["advance", 14, 0], // step 3 ADVANCE, 1.5% (ends as PAYDAY! pops, 15.1)
  ["real", 16, 1], // real landing page
  ["credit", 19, 1], // Credit Hub: debt 0.00
  ["live", 21, 1], // createGroup / addEmployee / deposit txs
  ["net", 22, 2, 2], // requestSalary(1000) → 985 net
  ["left", 24, 2], // balances 5,000 − 1,000 = 4,000
  ["stuck", 26, 0], // payday reverts 0xe025cb32, vault chained
  ["fixed", 27, 1, -2], // after FIXED!: 265/265, 3 new regression tests
  ["proof", 28, 1], // contracts card rows
  ["mocks", 29, 3], // after DEPLOYED!
  ["fee", 33, 1], // 1,000 → 985 · flat 1.5%
  ["tests", 35, 0], // 265/265 tests panel (ends before the outro slam)
  ["outro", 37, 1], // tagline
];
const VO = placeVo(G, VO_LINES, VO_AT);
const duck = duckFor(VO);

export const Main: React.FC<VoProps> = ({ vo = false }) => (
  <BeatProvider grid={G}>
    <AbsoluteFill style={{ background: "#05070c" }}>
      <SceneTimeline scenes={SCENES} />
      <Flashes hits={FLASHES} />
      <Music track={TRACK} total={TOTAL} volume={0.5} trimBeforeS={MUSIC_START_S} fadeIn={3} fadeOut={G.beats(4)} duck={vo ? duck : undefined} />
      {vo ? <VoTrack clips={VO} volume={1.2} /> : null}
      <SfxTrack hits={TRANSITION_SFX} />
    </AbsoluteFill>
  </BeatProvider>
);
