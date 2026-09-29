import React from "react";
import { AbsoluteFill } from "remotion";
import { BeatProvider, duckFor, Flashes, Music, placeVo, SceneTimeline, SfxTrack, VoTrack } from "../../kit";
import type { SceneSpec, VoCue, VoProps } from "../../kit";
import { S1Hook } from "./scenes/S1Hook";
import { S2Logo } from "./scenes/S2Logo";
import { S3HowItWorks } from "./scenes/S3HowItWorks";
import { S4Run } from "./scenes/S4Run";
import { S5Dashboard } from "./scenes/S5Dashboard";
import { S6Scan } from "./scenes/S6Scan";
import { S7Fix } from "./scenes/S7Fix";
import { S8Narrative } from "./scenes/S8Narrative";
import { S9Safe } from "./scenes/S9Safe";
import { S10Stats } from "./scenes/S10Stats";
import { S11Outro } from "./scenes/S11Outro";
import { BAR, G, MUSIC_START_S, TOTAL, TRACK } from "./timeline";
import { VO_LINES } from "./vo.gen";
import type { VoId } from "./vo.gen";

export { TOTAL };

/** Scene layout — every boundary is a track bar (see timeline.ts). */
const SCENES: SceneSpec[] = [
  { id: "S1-hook", from: G.bar(BAR.hook), to: G.bar(BAR.logo), component: S1Hook },
  { id: "S2-logo", from: G.bar(BAR.logo), to: G.bar(BAR.how), component: S2Logo }, // DROP 4: hard cut
  { id: "S3-how", from: G.bar(BAR.how), to: G.bar(BAR.run), enter: "slide", component: S3HowItWorks }, // break 7: slide
  { id: "S4-run", from: G.bar(BAR.run), to: G.bar(BAR.dash), component: S4Run }, // DROP 12: hard cut
  { id: "S5-dash", from: G.bar(BAR.dash), to: G.bar(BAR.scan), enter: "zoom", component: S5Dashboard }, // DROP 16: punch-in
  { id: "S6-scan", from: G.bar(BAR.scan), to: G.bar(BAR.fix), component: S6Scan }, // DROP 20: hard cut
  { id: "S7-fix", from: G.bar(BAR.fix), to: G.bar(BAR.narr), component: S7Fix }, // DROP 24: hard cut
  { id: "S8-narr", from: G.bar(BAR.narr), to: G.bar(BAR.safe), enter: "whip", component: S8Narrative }, // DROP 28: whip
  { id: "S9-safe", from: G.bar(BAR.safe), to: G.bar(BAR.stats), enter: "slide", component: S9Safe }, // break 31: slide
  { id: "S10-stats", from: G.bar(BAR.stats), to: G.bar(BAR.outro), component: S10Stats }, // DROP 32: hard cut
  { id: "S11-outro", from: G.bar(BAR.outro), to: TOTAL, component: S11Outro }, // DROP 36: hard cut
];

/** 1-frame flashes on the drops (big on act changes, soft inside scenes). */
const FLASHES = [
  ...[BAR.logo, BAR.run, BAR.dash, BAR.scan, BAR.fix, BAR.stats].map((k) => ({ f: G.bar(k), peak: 0.6 })),
  ...[8, BAR.narr, BAR.outro].map((k) => ({ f: G.bar(k), peak: 0.3 })),
  { f: G.at(3), peak: 0.45, color: "#f6465d" }, // REKT
  { f: G.at(13, 2), peak: 0.35, color: "#0ecb81" }, // PAPER BUY
  { f: G.at(24, 2), peak: 0.35, color: "#f6465d" }, // NO CONTRACT
  { f: G.at(27), peak: 0.35, color: "#0ecb81" }, // 88/88
  { f: G.at(35), peak: 0.35, color: "#F0B90B" }, // ZERO REAL TRADES
];

/** Transition whooshes (landing ON the cut) — scene-internal SFX live in scenes. */
const TRANSITION_SFX = [
  { name: "whoosh" as const, at: G.bar(BAR.logo), volume: 0.8 },
  { name: "whoosh" as const, at: G.bar(BAR.how), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.run), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.dash), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.scan), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.fix), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.narr), volume: 0.75 },
  { name: "whoosh" as const, at: G.bar(BAR.safe), volume: 0.6 },
  { name: "whoosh" as const, at: G.bar(BAR.stats), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.outro), volume: 0.6 },
];

/**
 * Voice-over ("neural-alpha-vo" only; lines in scripts/neural-alpha/vo.lines).
 * [id, TRACK bar, beat, +frames]. Music alone on: REKT. (3.x), the logo drop
 * (4.0–4.1), EVERY CYCLE. (7.2), PAPER BUY! (13.2), the summary stamp (15.2),
 * 4 REAL SWAPS! (21.3), NO CONTRACT! (24.2), 88/88 (27.x), PAPER MODE. (31),
 * ZERO REAL TRADES. (35) and the outro slam (36.0).
 */
const VO_AT: VoCue<VoId>[] = [
  ["hook", 1, 0], // BSC trades 24/7 · you sleep · bot with no guardrails (ends before REKT.)
  ["logo", 4, 2], // mark pins → NEURAL ALPHA wordmark + tagline
  ["paper", 6, 2, 2], // chips: BSC 56 · USDT · PAPER MODE (ends before EVERY CYCLE.)
  ["ingest", 8, 1], // step 1 INGEST → step 2 SCORE (9 factors)
  ["gate", 10, 1], // step 3 RISK GATE → step 4 EXECUTE (paper on, live off)
  ["real", 12, 1], // real paper-run log, live Binance enrichment (ends before PAPER BUY!)
  ["slots", 14, 1], // risk 3/3 → "nothing to execute"
  ["dash", 16, 1], // real dashboard, same run; data source MOCK for CMC/F&G
  ["scan", 20, 1], // scanner output (ends before 4 REAL SWAPS!)
  ["match", 22, 0], // explorer card, READ-ONLY
  ["bad", 24, 3], // "…but marked routable"
  ["fixed", 26, 0], // 11 corrected + 4 removed (ends before 88/88)
  ["narr", 28, 1], // Narrative-Alpha companion, not wired in
  ["live", 32, 1], // stat wall (ends before ZERO REAL TRADES.)
  ["outro", 37, 1], // tagline
];
const VO = placeVo(G, VO_LINES, VO_AT);
const duck = duckFor(VO);

export const Main: React.FC<VoProps> = ({ vo = false }) => (
  <BeatProvider grid={G}>
    <AbsoluteFill style={{ background: "#050608" }}>
      <SceneTimeline scenes={SCENES} />
      <Flashes hits={FLASHES} />
      <Music track={TRACK} total={TOTAL} volume={0.5} trimBeforeS={MUSIC_START_S} fadeIn={3} fadeOut={G.beats(6)} duck={vo ? duck : undefined} />
      {vo ? <VoTrack clips={VO} volume={1.2} /> : null}
      <SfxTrack hits={TRANSITION_SFX} />
    </AbsoluteFill>
  </BeatProvider>
);
