import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from "remotion";
import { BeatProvider, clamp, Flashes, SceneTimeline, SfxTrack } from "../../kit";
import type { SceneSpec } from "../../kit";
import { S1Hook } from "./scenes/S1Hook";
import { S2Logo } from "./scenes/S2Logo";
import { S3HowItWorks } from "./scenes/S3HowItWorks";
import { S4Product } from "./scenes/S4Product";
import { S5Flow } from "./scenes/S5Flow";
import { S6Proof } from "./scenes/S6Proof";
import { S7Stats } from "./scenes/S7Stats";
import { S8Outro } from "./scenes/S8Outro";
import { VO_LINES } from "./vo.gen";
import type { VoId } from "./vo.gen";
import { BAR, fileTimeS, G, MUSIC_START_BAR, SPLICE_BAR, SPLICE_TO_BAR, TOTAL, TRACK } from "./timeline";

export { TOTAL };

/** Scene layout — every boundary is a track bar (see timeline.ts). */
const SCENES: SceneSpec[] = [
  { id: "S1-hook", from: G.bar(BAR.hook), to: G.bar(BAR.logo), component: S1Hook },
  { id: "S2-logo", from: G.bar(BAR.logo), to: G.bar(BAR.how), component: S2Logo }, // DROP: hard cut
  { id: "S3-how", from: G.bar(BAR.how), to: G.bar(BAR.product), enter: "slide", component: S3HowItWorks },
  { id: "S4-product", from: G.bar(BAR.product), to: G.bar(BAR.flow), component: S4Product }, // phrase start: cut
  { id: "S5-flow", from: G.bar(BAR.flow), to: G.bar(BAR.proof), enter: "whip", component: S5Flow },
  { id: "S6-proof", from: G.bar(BAR.proof), to: G.bar(BAR.stats), enter: "slide", component: S6Proof },
  { id: "S7-stats", from: G.bar(BAR.stats), to: G.bar(BAR.outro), component: S7Stats }, // music splice: cut
  { id: "S8-outro", from: G.bar(BAR.outro), to: TOTAL, enter: "zoom", component: S8Outro },
];

const FLASHES = [
  ...[BAR.logo, BAR.product, BAR.stats].map((k) => ({ f: G.bar(k), peak: 0.6 })),
  ...[BAR.flow, 27, 29, 32].map((k) => ({ f: G.bar(k), peak: 0.28 })),
  { f: G.bar(BAR.proof), peak: 0.3, color: "#F0B90B" },
  { f: G.bar(BAR.outro), peak: 0.25, color: "#F0B90B" },
];

const TRANSITION_SFX = [
  { name: "whoosh" as const, at: G.bar(BAR.logo), volume: 0.8 },
  { name: "whoosh" as const, at: G.bar(BAR.how), volume: 0.6 },
  { name: "whoosh" as const, at: G.bar(BAR.product), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.flow), volume: 0.75 },
  { name: "whoosh" as const, at: G.bar(BAR.proof), volume: 0.6 },
  { name: "impact" as const, at: G.bar(BAR.stats), volume: 0.8 },
  { name: "whoosh" as const, at: G.bar(BAR.outro), volume: 0.55 },
];

/**
 * Voice-over: a new en-GB-RyanNeural read (edge-tts, scripts/cermin/vo.py —
 * silence-trimmed, -12 LUFS, m4a). Every line starts on a beat of the track
 * grid, on the bar where its step is on screen (see timeline.ts):
 *   hook 4.1 · never 7.2 (with the on-screen question) · intro 8.2 (logo drop)
 *   how 11 · dips 14.1 (DEFEND panel) · rises 15.1 (SKIM panel)
 *   app 16.2 · setup 19 (goal/risk) · sign 21.2 (preview → confirm)
 *   vault 24 · pump 26.1 · skim 27 · dip 28 · defend 29.1 · safe 30.2
 *   anyone 32 (PERMISSIONLESS) · withdraw 33.1 · close 34.3
 *   proof 36.1 · stats 40.2 · outro 43.2   (bar.beat)
 */
const VO_AT: Array<[VoId, number, number, number?]> = [
  ["hook", 4, 1],
  ["never", 7, 2],
  ["intro", 8, 2],
  ["how", 11, 0],
  ["dips", 14, 1],
  ["rises", 15, 1],
  ["app", 16, 2],
  ["setup", 19, 0],
  ["sign", 21, 2],
  ["vault", 24, 0],
  ["pump", 26, 1],
  ["skim", 27, 0, 8], // just after the SKIMMED! slam, clear of the pump line
  ["dip", 28, 0],
  ["defend", 29, 1],
  ["safe", 30, 2],
  ["anyone", 32, 0],
  ["withdraw", 33, 1],
  ["close", 34, 3, 4],
  ["proof", 36, 1],
  ["stats", 40, 2],
  ["outro", 43, 2],
];
const VO_CLIPS = VO_AT.map(([id, k, bt, nudge = 0]) => ({
  id,
  src: staticFile(VO_LINES[id].file),
  at: G.at(k, bt) + 2 + nudge, // consonant onset a hair after the beat
  len: Math.ceil(VO_LINES[id].dur * 30),
}));

const MUSIC_VOL = 0.5; // ≈ -6 dB under the SFX
const DUCK_VOL = 0.2; // under the narrator
const duckAt = (f: number) =>
  VO_CLIPS.reduce((v, c) => {
    const d = interpolate(f, [c.at - 6, c.at, c.at + c.len, c.at + c.len + 8], [0, 1, 1, 0], clamp);
    return Math.min(v, MUSIC_VOL - (MUSIC_VOL - DUCK_VOL) * d);
  }, MUSIC_VOL);

const FPS = 30;
const SPLICE_F = G.bar(SPLICE_BAR);
const XF = 2; // 2-frame crossfade at the splice (inaudible click guard)

/** The bed: file bar 4 → 40, spliced on a downbeat to the file's own outro (bar 64 →). */
const MusicBed: React.FC = () => (
  <>
    <Sequence from={0} durationInFrames={SPLICE_F + XF} name="music-a">
      <Audio
        src={staticFile(TRACK.file)}
        trimBefore={Math.round(fileTimeS(MUSIC_START_BAR) * FPS)}
        volume={(f) => Math.min(duckAt(f), MUSIC_VOL * interpolate(f, [0, 4], [0, 1], clamp), MUSIC_VOL * interpolate(f, [SPLICE_F, SPLICE_F + XF], [1, 0], clamp))}
      />
    </Sequence>
    <Sequence from={SPLICE_F} durationInFrames={TOTAL - SPLICE_F} name="music-b">
      <Audio
        src={staticFile(TRACK.file)}
        trimBefore={Math.round(fileTimeS(SPLICE_TO_BAR) * FPS + (SPLICE_F - (fileTimeS(SPLICE_BAR) - fileTimeS(MUSIC_START_BAR)) * FPS))}
        volume={(f) =>
          Math.min(
            duckAt(SPLICE_F + f),
            MUSIC_VOL * interpolate(f, [0, XF], [0, 1], clamp),
            MUSIC_VOL * interpolate(SPLICE_F + f, [G.at(47, 2), TOTAL], [1, 0], clamp),
          )
        }
      />
    </Sequence>
  </>
);

const Voice: React.FC = () => (
  <>
    {VO_CLIPS.map((c, i) => (
      <Sequence key={i} from={c.at} durationInFrames={c.len + 2} name={`vo-${c.id}`}>
        <Audio src={c.src} volume={1} />
      </Sequence>
    ))}
  </>
);

export const Main: React.FC = () => (
  <BeatProvider grid={G}>
    <AbsoluteFill style={{ background: "#0d0b09" }}>
      <SceneTimeline scenes={SCENES} />
      <Flashes hits={FLASHES} />
      <MusicBed />
      <Voice />
      <SfxTrack hits={TRANSITION_SFX} />
    </AbsoluteFill>
  </BeatProvider>
);
