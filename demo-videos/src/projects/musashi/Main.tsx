import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from "remotion";
import { BeatProvider, clamp, duckFor, Flashes, placeVo, SceneTimeline, SfxTrack, VoTrack } from "../../kit";
import type { SceneSpec, VoCue, VoProps } from "../../kit";
import { S1Hook } from "./scenes/S1Hook";
import { S2Logo } from "./scenes/S2Logo";
import { S3HowItWorks } from "./scenes/S3HowItWorks";
import { S4Product } from "./scenes/S4Product";
import { S5Gates } from "./scenes/S5Gates";
import { S6Strike } from "./scenes/S6Strike";
import { S7Proof } from "./scenes/S7Proof";
import { S8Stack } from "./scenes/S8Stack";
import { S9Stats } from "./scenes/S9Stats";
import { S10Outro } from "./scenes/S10Outro";
import { VO_LINES } from "./vo.gen";
import type { VoId } from "./vo.gen";
import { BAR, fileTimeS, G, MUSIC_START_BAR, SPLICE_BAR, SPLICE_TO_BAR, TOTAL, TRACK } from "./timeline";

export { TOTAL };

/** Scene layout: every boundary is a track bar (see timeline.ts). */
const SCENES: SceneSpec[] = [
  { id: "S1-hook", from: G.bar(BAR.hook), to: G.bar(BAR.logo), component: S1Hook },
  { id: "S2-logo", from: G.bar(BAR.logo), to: G.bar(BAR.how), component: S2Logo }, // phrase downbeat 40: hard cut + flash
  { id: "S3-how", from: G.bar(BAR.how), to: G.bar(BAR.product), enter: "slide", component: S3HowItWorks },
  { id: "S4-product", from: G.bar(BAR.product), to: G.bar(BAR.gates), enter: "zoom", component: S4Product }, // phrase 48: punch-in
  { id: "S5-gates", from: G.bar(BAR.gates), to: G.bar(BAR.strike), component: S5Gates }, // hard cut
  { id: "S6-strike", from: G.bar(BAR.strike), to: G.bar(BAR.proof), enter: "slide", component: S6Strike }, // dip bar 55: slide
  { id: "S7-proof", from: G.bar(BAR.proof), to: G.bar(BAR.stack), component: S7Proof }, // hard cut
  { id: "S8-stack", from: G.bar(BAR.stack), to: G.bar(BAR.stats), enter: "whip", component: S8Stack },
  { id: "S9-stats", from: G.bar(BAR.stats), to: G.bar(BAR.outro), component: S9Stats }, // hard cut
  { id: "S10-outro", from: G.bar(BAR.outro), to: TOTAL, component: S10Outro }, // splice downbeat: hard cut
];

const FLASHES = [
  ...[BAR.logo, 56].map((k) => ({ f: G.bar(k), peak: 0.6 })),
  ...[BAR.product, BAR.gates, BAR.proof, BAR.stats, BAR.outro].map((k) => ({ f: G.bar(k), peak: 0.3 })),
  { f: G.at(38), peak: 0.45, color: "#f43f5e" }, // RUG!
  { f: G.at(BAR.gates, 3), peak: 0.4, color: "#c62828" }, // CAKE cut
  { f: G.at(57, 3), peak: 0.35, color: "#10b981" }, // WIN!
];

const TRANSITION_SFX = [
  { name: "whoosh" as const, at: G.bar(BAR.how), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.product), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.gates), volume: 0.6 },
  { name: "whoosh" as const, at: G.bar(BAR.strike), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.proof), volume: 0.6 },
  { name: "whoosh" as const, at: G.bar(BAR.stack), volume: 0.75 },
  { name: "whoosh" as const, at: G.bar(BAR.stats), volume: 0.6 },
  { name: "whoosh" as const, at: G.bar(BAR.outro), volume: 0.6 },
];

/**
 * Voice-over ("musashi-vo" only; lines in scripts/musashi/vo.lines). Calm, deliberate.
 * [id, bar, beat, +frames] — each line starts on a beat next to its step and
 * clears the slams: RUG!/TOO LATE. (38–39), the logo SLASH! (40.0), CAKE CUT! (52.3),
 * the strike SLASH! (56.0), WIN! (57.3), SERVED! (61.3) and the outro slam (64.0).
 */
const VO_AT: VoCue<VoId>[] = [
  ["hook", 36, 0], // token rain → trader · ends before RUG!
  ["intro", 40, 1], // MUSASHI after the SLASH!
  ["bnb", 42, 0], // NOW ON BNB CHAIN
  ["gates", 44, 0], // panel 1: 7 gates
  ["strike", 45, 3], // debate → strike panels · ends before the product punch-in
  ["app", 48, 1], // real landing → pipeline
  ["ledger", 50, 2], // dashboard reputation (+2500 bps)
  ["aria", 53, 0], // ARIA gates pass (read-only live BSC) · after CAKE CUT!
  ["logged", 56, 1], // logStrike, after the SLASH! · ends before WIN!
  ["proof", 58, 0], // deployed contracts
  ["smoke", 59, 0, 2], // smoke txs, status 1 (+2f clears "proof")
  ["stack", 60, 0, 4], // daemon + frontend · ends before SERVED!
  ["stats", 62, 0], // stat wall + honest 0G note
  ["outro", 64, 1], // MUSASHI 武蔵 → tagline
];
const VO = placeVo(G, VO_LINES, VO_AT);
const duck = duckFor(VO);
const NO_DUCK = () => 1;

const FPS = 30;
const MUSIC_VOL = 0.5;
const SPLICE_F = G.bar(SPLICE_BAR);
const XF = 2; // 2-frame crossfade at the splice (click guard)

/** File bar 36 → 64, spliced on a downbeat to the file's own last phrase (bar 68 → silence at 72). */
const MusicBed: React.FC<{ duckAt: (f: number) => number }> = ({ duckAt }) => (
  <>
    <Sequence from={0} durationInFrames={SPLICE_F + XF} name="music-a">
      <Audio
        src={staticFile(TRACK.file)}
        trimBefore={Math.round(fileTimeS(MUSIC_START_BAR) * FPS)}
        volume={(f) => duckAt(f) * Math.min(MUSIC_VOL * interpolate(f, [0, 4], [0, 1], clamp), MUSIC_VOL * interpolate(f, [SPLICE_F, SPLICE_F + XF], [1, 0], clamp))}
      />
    </Sequence>
    <Sequence from={SPLICE_F} durationInFrames={TOTAL - SPLICE_F} name="music-b">
      <Audio
        src={staticFile(TRACK.file)}
        trimBefore={Math.round(fileTimeS(SPLICE_TO_BAR) * FPS + (SPLICE_F - (fileTimeS(SPLICE_BAR) - fileTimeS(MUSIC_START_BAR)) * FPS))}
        volume={(f) => duckAt(SPLICE_F + f) * Math.min(MUSIC_VOL * interpolate(f, [0, XF], [0, 1], clamp), MUSIC_VOL * interpolate(SPLICE_F + f, [G.at(66, 2), TOTAL], [1, 0], clamp))}
      />
    </Sequence>
  </>
);

export const Main: React.FC<VoProps> = ({ vo = false }) => (
  <BeatProvider grid={G}>
    <AbsoluteFill style={{ background: "#050303" }}>
      <SceneTimeline scenes={SCENES} />
      <Flashes hits={FLASHES} />
      <MusicBed duckAt={vo ? duck : NO_DUCK} />
      {vo ? <VoTrack clips={VO} volume={1.2} /> : null}
      <SfxTrack hits={TRANSITION_SFX} />
    </AbsoluteFill>
  </BeatProvider>
);
