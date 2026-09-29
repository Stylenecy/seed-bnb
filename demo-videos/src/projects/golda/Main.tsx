import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from "remotion";
import { BeatProvider, clamp, duckFor, Flashes, placeVo, SceneTimeline, SfxTrack, VoTrack } from "../../kit";
import type { SceneSpec, VoCue, VoProps } from "../../kit";
import { S1Hook } from "./scenes/S1Hook";
import { S2Logo } from "./scenes/S2Logo";
import { S3HowItWorks } from "./scenes/S3HowItWorks";
import { S4Product } from "./scenes/S4Product";
import { S5Fork } from "./scenes/S5Fork";
import { S6Bug } from "./scenes/S6Bug";
import { S7Proof } from "./scenes/S7Proof";
import { S8Stats } from "./scenes/S8Stats";
import { S9Outro } from "./scenes/S9Outro";
import { BAR, fileTimeS, G, MUSIC_START_BAR, SPLICE_BAR, SPLICE_TO_BAR, TOTAL, TRACK } from "./timeline";
import { VO_LINES } from "./vo.gen";
import type { VoId } from "./vo.gen";

export { TOTAL };

/** Scene layout: every boundary is a video bar (see timeline.ts). */
const SCENES: SceneSpec[] = [
  { id: "S1-hook", from: G.bar(BAR.hook), to: G.bar(BAR.logo), component: S1Hook },
  { id: "S2-logo", from: G.bar(BAR.logo), to: G.bar(BAR.how), component: S2Logo }, // break bar 4: hard cut
  { id: "S3-how", from: G.bar(BAR.how), to: G.bar(BAR.product), enter: "slide", component: S3HowItWorks }, // half-beat slide
  { id: "S4-product", from: G.bar(BAR.product), to: G.bar(BAR.fork), enter: "zoom", component: S4Product }, // punch-in
  { id: "S5-fork", from: G.bar(BAR.fork), to: G.bar(BAR.bug), component: S5Fork }, // DROP 13: hard cut
  { id: "S6-bug", from: G.bar(BAR.bug), to: G.bar(BAR.proof), component: S6Bug }, // DROP 17: hard cut
  { id: "S7-proof", from: G.bar(BAR.proof), to: G.bar(BAR.stats), enter: "whip", component: S7Proof },
  { id: "S8-stats", from: G.bar(BAR.stats), to: G.bar(BAR.outro), enter: "slide", component: S8Stats },
  { id: "S9-outro", from: G.bar(BAR.outro), to: TOTAL, component: S9Outro }, // break 25: hard cut
];

const FLASHES = [
  ...[11, BAR.fork, SPLICE_BAR, BAR.bug].map((k) => ({ f: G.bar(k), peak: 0.55 })),
  ...[21, 23].map((k) => ({ f: G.bar(k), peak: 0.35 })),
  { f: G.bar(BAR.logo), peak: 0.4, color: "#d9ae4a" },
  { f: G.at(BAR.bug, 2), peak: 0.45, color: "#ff6b6b" }, // revert
  { f: G.bar(BAR.proof), peak: 0.35, color: "#F0B90B" },
  { f: G.bar(BAR.outro), peak: 0.3 },
];

const TRANSITION_SFX = [
  { name: "whoosh" as const, at: G.bar(BAR.logo), volume: 0.8 },
  { name: "whoosh" as const, at: G.bar(BAR.how), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.product), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.fork), volume: 0.75 },
  { name: "whoosh" as const, at: G.bar(BAR.bug), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.proof), volume: 0.8 },
  { name: "whoosh" as const, at: G.bar(BAR.stats), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.outro), volume: 0.6 },
];

/**
 * Voice-over ("golda-vo" only; lines in scripts/golda/vo.lines).
 * [id, bar, beat, +frames] in video bars (long bars: 82.65 BPM, 1 beat = 0.726 s).
 * Each line starts on a beat next to its step and ends before the next line and
 * the next scene hit. Music alone on: NO HEDGE?! (3.0), the logo slam (4.0), the
 * product zoom (10.0), MINTED drop (11.0), the fork drop (13.0), the splice drop
 * (15.0), the bug drop (17.0), the proof whip (19.0), DEPLOYED (20.2), the smoke
 * drop (21.0), the stat drop (23.0) and the outro slam (25.0).
 */
const VO_AT: VoCue<VoId>[] = [
  ["hook", 2, 1], // panels: 100% dollars · market turns · ends before NO HEDGE?!
  ["intro", 4, 1], // mark + wordmark
  ["bnb", 5, 2, -2], // NOW ON BNB CHAIN badge · ends before the how slide
  ["deposit", 6, 1], // step 1
  ["decide", 7, 1], // step 2
  ["swap", 8, 1], // step 3
  ["guard", 9, 1], // step 4 (TWAP) · ends before the product zoom
  ["concept", 10, 1, -2], // CONCEPT UI tag · ends before the 11 drop
  ["minted", 11, 1], // after MINTED: 1000 → 1000 gVAULT
  ["redeem", 12, 0], // 400 typed → REDEEMED · ends before the fork drop
  ["swapped", 13, 1, -2], // fork tag + quote card → 1,000 USDT → 1.277 WBNB · ends before the splice drop
  ["twap", 15, 1], // TWAP card on the PCS V3 USDT/WBNB pool
  ["honest", 16, 0], // why WBNB: PAXG 50 supply, no pool · ends before the bug drop
  ["bug", 17, 1, -2], // BEFORE: facetAddress() = 0x0 → REVERT
  ["fixed", 18, 2], // after FIXED: 24/24 tests · ends before the proof whip
  ["deploy", 19, 1], // contract + deploy rows · ends before DEPLOYED
  ["smoke", 21, 1], // live smoke txs
  ["stats", 22, 1], // minted / pro-rata panels · ends before the 23 drop
  ["blocker", 24, 0], // honest "not yet" strip · ends before the outro
  ["outro", 25, 1], // wordmark + tagline
];
const VO = placeVo(G, VO_LINES, VO_AT);
const DUCK = duckFor(VO);
const NO_DUCK = () => 1;

const FPS = 30;
const MUSIC_VOL = 0.5;
const SPLICE_F = G.bar(SPLICE_BAR);
const XF = 2; // 2-frame crossfade at the splice (click guard)

/** File bar 2 → 15, spliced on a downbeat back to file bar 11 (the lift), which then rides to the end of the file. */
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
          Math.min(MUSIC_VOL * interpolate(f, [0, XF], [0, 1], clamp), MUSIC_VOL * interpolate(SPLICE_F + f, [G.at(BAR.end, 0), TOTAL], [1, 0], clamp)) *
          duck(SPLICE_F + f)
        }
      />
    </Sequence>
  </>
);

export const Main: React.FC<VoProps> = ({ vo = false }) => (
  <BeatProvider grid={G}>
    <AbsoluteFill style={{ background: "#0c0a07" }}>
      <SceneTimeline scenes={SCENES} />
      <Flashes hits={FLASHES} />
      <MusicBed duck={vo ? DUCK : NO_DUCK} />
      <SfxTrack hits={TRANSITION_SFX} />
      {vo ? <VoTrack clips={VO} volume={1.2} /> : null}
    </AbsoluteFill>
  </BeatProvider>
);
