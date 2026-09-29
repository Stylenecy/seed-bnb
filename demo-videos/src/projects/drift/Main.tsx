import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from "remotion";
import { BeatProvider, clamp, duckFor, Flashes, placeVo, SceneTimeline, SfxTrack, VoTrack } from "../../kit";
import type { SceneSpec, VoCue, VoProps } from "../../kit";
import { S1Hook } from "./scenes/S1Hook";
import { S2Logo } from "./scenes/S2Logo";
import { S3HowItWorks } from "./scenes/S3HowItWorks";
import { S4Product } from "./scenes/S4Product";
import { S5Guard } from "./scenes/S5Guard";
import { S6Engine } from "./scenes/S6Engine";
import { S7Proof } from "./scenes/S7Proof";
import { S8Stats } from "./scenes/S8Stats";
import { S9Outro } from "./scenes/S9Outro";
import { BAR, fileTimeS, G, MUSIC_START_BAR, SPLICE_BAR, SPLICE_TO_BAR, TOTAL, TRACK } from "./timeline";
import { VO_LINES } from "./vo.gen";
import type { VoId } from "./vo.gen";

export { TOTAL };

/** Scene layout: every boundary is a track bar (see timeline.ts). */
const SCENES: SceneSpec[] = [
  { id: "S1-hook", from: G.bar(BAR.hook), to: G.bar(BAR.logo), component: S1Hook },
  { id: "S2-logo", from: G.bar(BAR.logo), to: G.bar(BAR.how), component: S2Logo }, // phrase-half downbeat: hard cut + flash
  { id: "S3-how", from: G.bar(BAR.how), to: G.bar(BAR.product), enter: "slide", component: S3HowItWorks }, // dip bar 31: slide
  { id: "S4-product", from: G.bar(BAR.product), to: G.bar(BAR.guard), enter: "zoom", component: S4Product }, // punch-in
  { id: "S5-guard", from: G.bar(BAR.guard), to: G.bar(BAR.engine), component: S5Guard }, // phrase DROP 40: hard cut
  { id: "S6-engine", from: G.bar(BAR.engine), to: G.bar(BAR.proof), enter: "whip", component: S6Engine },
  { id: "S7-proof", from: G.bar(BAR.proof), to: G.bar(BAR.stats), enter: "slide", component: S7Proof },
  { id: "S8-stats", from: G.bar(BAR.stats), to: G.bar(BAR.outro), component: S8Stats }, // hard cut
  { id: "S9-outro", from: G.bar(BAR.outro), to: TOTAL, component: S9Outro }, // splice downbeat: hard cut
];

const FLASHES = [
  ...[BAR.logo, 32, BAR.guard].map((k) => ({ f: G.bar(k), peak: 0.6 })),
  ...[26, BAR.stats, BAR.outro].map((k) => ({ f: G.bar(k), peak: 0.3 })),
  { f: G.at(42), peak: 0.5, color: "#f87171" }, // Halted
  { f: G.at(47), peak: 0.35, color: "#9aa8f0" }, // engine auto-restore
  { f: G.bar(BAR.proof), peak: 0.35, color: "#F0B90B" },
];

const TRANSITION_SFX = [
  { name: "whoosh" as const, at: G.bar(BAR.logo), volume: 0.8 },
  { name: "whoosh" as const, at: G.bar(BAR.how), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.product), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.guard), volume: 0.75 },
  { name: "whoosh" as const, at: G.bar(BAR.engine), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.proof), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.stats), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.outro), volume: 0.6 },
];

/**
 * Voice-over ("drift-vo" only; lines in scripts/drift/vo.lines).
 * [id, bar, beat, +frames] — track bars (the file starts at bar 24). Each line
 * starts on a beat next to its step and clears the slams: REKT (26.0), the
 * shield (27.0), the logo (28.0), 4 STEPS (31.2), the guard drop (40.0),
 * HALTED (42.1), DENIED (45.1), AUTO-RESTORED (47.0), LOGGED (48.2), the proof
 * slide + DEPLOYED (49.0–49.3), ALL STATUS 1 (52.2), AGENT-ONLY (55.0) and
 * the outro logo (56.0) play with music alone.
 */
const VO_AT: VoCue<VoId>[] = [
  ["hook", 24, 1], // panels: signal · macro storm · ends before REKT
  ["intro", 28, 2], // wordmark stamps, after the slam
  ["bnb", 30, 1], // NOW ON BNB CHAIN badge · ends before 4 STEPS
  ["regime", 32, 1], // steps 1–2: read the macro · push on-chain
  ["veto", 34, 1], // steps 3–4: veto · halt · ends before the product cut
  ["cockpit", 36, 1], // REAL landing → markets
  ["stub", 38, 2], // → bots screen: MacroGuard banner + "Bybit link stubbed" note · ends before the drop
  ["live", 40, 3], // after VETOED: setRegime(RiskOff)
  ["limit", 42, 2], // after HALTED: −25% → halted
  ["agent", 44, 2], // → DENIED (NotAgent)
  ["forced", 46, 1], // cast forces RiskOn
  ["engine", 47, 1], // after AUTO-RESTORED
  ["txs", 50, 1], // the 8 live txs
  ["gas", 53, 1], // 7/7 tests · 0.0000688 tBNB · ends before AGENT-ONLY
  ["outro", 57, 0], // tagline
];
const VO = placeVo(G, VO_LINES, VO_AT);
const DUCK = duckFor(VO);
const NO_DUCK = () => 1;

const FPS = 30;
const MUSIC_VOL = 0.5;
const SPLICE_F = G.bar(SPLICE_BAR);
const XF = 2; // 2-frame crossfade at the splice (click guard)

/** File bar 24 → 56, spliced on a downbeat to the file's own outro tail (bar 68 → silence at 72). */
const MusicBed: React.FC<{ duck: (f: number) => number }> = ({ duck }) => (
  <>
    <Sequence from={0} durationInFrames={SPLICE_F + XF} name="music-a">
      <Audio
        src={staticFile(TRACK.file)}
        trimBefore={Math.round(fileTimeS(MUSIC_START_BAR) * FPS)}
        volume={(f) => Math.min(MUSIC_VOL * interpolate(f, [0, 4], [0, 1], clamp), MUSIC_VOL * interpolate(f, [SPLICE_F, SPLICE_F + XF], [1, 0], clamp)) * duck(f)}
      />
    </Sequence>
    <Sequence from={SPLICE_F} durationInFrames={TOTAL - SPLICE_F} name="music-b">
      <Audio
        src={staticFile(TRACK.file)}
        trimBefore={Math.round(fileTimeS(SPLICE_TO_BAR) * FPS + (SPLICE_F - (fileTimeS(SPLICE_BAR) - fileTimeS(MUSIC_START_BAR)) * FPS))}
        volume={(f) =>
          Math.min(MUSIC_VOL * interpolate(f, [0, XF], [0, 1], clamp), MUSIC_VOL * interpolate(SPLICE_F + f, [G.at(59, 2), TOTAL], [1, 0], clamp)) *
          duck(SPLICE_F + f)
        }
      />
    </Sequence>
  </>
);

export const Main: React.FC<VoProps> = ({ vo = false }) => (
  <BeatProvider grid={G}>
    <AbsoluteFill style={{ background: "#0b0c0f" }}>
      <SceneTimeline scenes={SCENES} />
      <Flashes hits={FLASHES} />
      <MusicBed duck={vo ? DUCK : NO_DUCK} />
      <SfxTrack hits={TRANSITION_SFX} />
      {vo ? <VoTrack clips={VO} volume={1.2} /> : null}
    </AbsoluteFill>
  </BeatProvider>
);
