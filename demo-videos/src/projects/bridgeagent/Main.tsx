import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from "remotion";
import { BeatProvider, clamp, duckFor, Flashes, placeVo, SceneTimeline, SfxTrack, VoTrack } from "../../kit";
import type { SceneSpec, VoCue, VoProps } from "../../kit";
import { S1Hook } from "./scenes/S1Hook";
import { S2Logo } from "./scenes/S2Logo";
import { S3HowItWorks } from "./scenes/S3HowItWorks";
import { S4Product } from "./scenes/S4Product";
import { S5Smoke } from "./scenes/S5Smoke";
import { S6Bug } from "./scenes/S6Bug";
import { S7Proof } from "./scenes/S7Proof";
import { S8Verify } from "./scenes/S8Verify";
import { S9Stats } from "./scenes/S9Stats";
import { S10Outro } from "./scenes/S10Outro";
import { VO_LINES } from "./vo.gen";
import type { VoId } from "./vo.gen";
import { BAR, fileTimeS, G, MUSIC_START_BAR, SPLICE_BAR, SPLICE_TO_BAR, TOTAL, TRACK } from "./timeline";

export { TOTAL };

/** Scene layout: every boundary is a track bar (see timeline.ts). */
const SCENES: SceneSpec[] = [
  { id: "S1-hook", from: G.bar(BAR.hook), to: G.bar(BAR.logo), component: S1Hook },
  { id: "S2-logo", from: G.bar(BAR.logo), to: G.bar(BAR.how), component: S2Logo }, // phrase downbeat 16: hard cut + flash
  { id: "S3-how", from: G.bar(BAR.how), to: G.bar(BAR.product), enter: "slide", component: S3HowItWorks },
  { id: "S4-product", from: G.bar(BAR.product), to: G.bar(BAR.smoke), component: S4Product }, // phrase 24: hard cut
  { id: "S5-smoke", from: G.bar(BAR.smoke), to: G.bar(BAR.bug), enter: "whip", component: S5Smoke },
  { id: "S6-bug", from: G.bar(BAR.bug), to: G.bar(BAR.proof), component: S6Bug }, // phrase 32: hard cut + red flash
  { id: "S7-proof", from: G.bar(BAR.proof), to: G.bar(BAR.verify), enter: "slide", component: S7Proof },
  { id: "S8-verify", from: G.bar(BAR.verify), to: G.bar(BAR.stats), enter: "whip", component: S8Verify },
  { id: "S9-stats", from: G.bar(BAR.stats), to: G.bar(BAR.outro), component: S9Stats }, // phrase 40: hard cut
  { id: "S10-outro", from: G.bar(BAR.outro), to: TOTAL, enter: "zoom", component: S10Outro }, // splice downbeat
];

const FLASHES = [
  ...[BAR.logo, BAR.product, BAR.stats].map((k) => ({ f: G.bar(k), peak: 0.6 })),
  ...[14, 15, 31, 39, BAR.outro].map((k) => ({ f: G.bar(k), peak: 0.3 })),
  { f: G.bar(BAR.bug), peak: 0.55, color: "#f87171" }, // CRASH
  { f: G.bar(BAR.bug + 1), peak: 0.4, color: "#8fdcaa" }, // FIXED
  { f: G.bar(BAR.proof), peak: 0.35, color: "#F0B90B" },
];

const TRANSITION_SFX = [
  { name: "whoosh" as const, at: G.bar(BAR.logo), volume: 0.8 },
  { name: "whoosh" as const, at: G.bar(BAR.how), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.product), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.smoke), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.bug), volume: 0.75 },
  { name: "whoosh" as const, at: G.bar(BAR.proof), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.verify), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.stats), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.outro), volume: 0.6 },
];

/**
 * Voice-over ("bridgeagent-vo" only; lines in scripts/bridgeagent/vo.lines).
 * [id, bar, beat, +frames] — track bars (the file starts at bar 12). Each line
 * starts on a beat next to its step and clears the slams: WHO ARE YOU? (14.0),
 * TRUST ME, BRO. (15.0), the logo (16.0), NOW ON BNB CHAIN + ANCHORED! (18.0–18.2),
 * 4 STEPS. (19.2), RECEIPTS. (31.0), CRASH! (32.0, 6f alone), FIXED! (33.0),
 * DEPLOYED! (34.3), ALL STATUS 1! (36.2), DON'T TRUST. VERIFY. (39.0), the stat
 * wall downbeat (40.0) and RECEIPTS > SCREENSHOTS. (43.0) play with music alone.
 */
const VO_AT: VoCue<VoId>[] = [
  ["hook", 12, 0], // panels: +300% · anon · empty ledger · ends before WHO ARE YOU?
  ["intro", 16, 1], // mark slam → wordmark types
  ["register", 20, 0], // step 1 REGISTER (ERC-8004)
  ["trade", 21, 2], // steps 2–3: trade · mirror to the journal
  ["verify", 23, 1], // step 4 VERIFY: anyone can read
  ["page", 24, 1], // REAL status page hero
  ["ledger", 26, 0], // trades screen: 2 trades
  ["bps", 27, 0], // trade record: pnlBps 150
  ["smoke", 28, 0], // bnb_smoke_test.py: register #1 → trade #1
  ["synth", 29, 2], // runtime_mirror_smoke.py: trade #2 synthetic via the real mirror path
  ["bug", 32, 0, 6], // ExtraDataLengthError · ends before FIXED!
  ["fix", 33, 1], // the middleware fix
  ["txs", 35, 0], // 5 txs, one per beat · ends before ALL STATUS 1!
  ["unverif", 37, 0], // gas footer + honest note: not BscScan-verified
  ["cast", 38, 0], // the page's own cast call
  ["stats", 40, 1], // 2 trades · 13/13 forge tests
  ["honest", 42, 0], // THE HONEST PART: venue trading not exercised
  ["outro", 44, 2], // wordmark → tagline "Receipts included."
];
const VO = placeVo(G, VO_LINES, VO_AT);
const DUCK = duckFor(VO);
const NO_DUCK = () => 1;

const FPS = 30;
const MUSIC_VOL = 0.5;
const SPLICE_F = G.bar(SPLICE_BAR);
const XF = 2; // 2-frame crossfade at the splice (click guard)

/** File bar 12 → 44, spliced on a downbeat to the file's own outro tail (bar 68 → silence at 72). */
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
          Math.min(MUSIC_VOL * interpolate(f, [0, XF], [0, 1], clamp), MUSIC_VOL * interpolate(SPLICE_F + f, [G.at(47, 2), TOTAL], [1, 0], clamp)) *
          duck(SPLICE_F + f)
        }
      />
    </Sequence>
  </>
);

export const Main: React.FC<VoProps> = ({ vo = false }) => (
  <BeatProvider grid={G}>
    <AbsoluteFill style={{ background: C_BG }}>
      <SceneTimeline scenes={SCENES} />
      <Flashes hits={FLASHES} />
      <MusicBed duck={vo ? DUCK : NO_DUCK} />
      <SfxTrack hits={TRANSITION_SFX} />
      {vo ? <VoTrack clips={VO} volume={1.2} /> : null}
    </AbsoluteFill>
  </BeatProvider>
);
const C_BG = "#0f1c15";
