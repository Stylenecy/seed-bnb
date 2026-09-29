import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from "remotion";
import { BeatProvider, clamp, duckFor, Flashes, placeVo, SceneTimeline, SfxTrack, VoTrack } from "../../kit";
import type { SceneSpec, VoCue, VoProps } from "../../kit";
import { S1Hook } from "./scenes/S1Hook";
import { S2Logo } from "./scenes/S2Logo";
import { S3HowItWorks } from "./scenes/S3HowItWorks";
import { S4HotWallet } from "./scenes/S4HotWallet";
import { S5Routers } from "./scenes/S5Routers";
import { S6Backend } from "./scenes/S6Backend";
import { S7Product } from "./scenes/S7Product";
import { S8Limit } from "./scenes/S8Limit";
import { S9Stats } from "./scenes/S9Stats";
import { S10Outro } from "./scenes/S10Outro";
import { BAR, fileTimeS, G, MUSIC_START_BAR, SPLICE_BAR, SPLICE_TO_BAR, TOTAL, TRACK } from "./timeline";
import { VO_LINES } from "./vo.gen";
import type { VoId } from "./vo.gen";

export { TOTAL };

/** Scene layout: every boundary is a track bar (see timeline.ts). */
const SCENES: SceneSpec[] = [
  { id: "S1-hook", from: G.bar(BAR.hook), to: G.bar(BAR.logo), component: S1Hook },
  { id: "S2-logo", from: G.bar(BAR.logo), to: G.bar(BAR.how), component: S2Logo }, // hard cut + flash
  { id: "S3-how", from: G.bar(BAR.how), to: G.bar(BAR.hot), enter: "slide", component: S3HowItWorks },
  { id: "S4-hot", from: G.bar(BAR.hot), to: G.bar(BAR.routers), enter: "zoom", component: S4HotWallet },
  { id: "S5-routers", from: G.bar(BAR.routers), to: G.bar(BAR.backend), component: S5Routers }, // phrase DROP 32: hard cut
  { id: "S6-backend", from: G.bar(BAR.backend), to: G.bar(BAR.product), enter: "whip", component: S6Backend },
  { id: "S7-product", from: G.bar(BAR.product), to: G.bar(BAR.limit), enter: "zoom", component: S7Product }, // phrase DROP 40
  { id: "S8-limit", from: G.bar(BAR.limit), to: G.bar(BAR.stats), enter: "slide", component: S8Limit },
  { id: "S9-stats", from: G.bar(BAR.stats), to: G.bar(BAR.outro), component: S9Stats }, // hard cut
  { id: "S10-outro", from: G.bar(BAR.outro), to: TOTAL, component: S10Outro }, // splice downbeat: hard cut
];

const FLASHES = [
  ...[BAR.logo, 24, BAR.routers, BAR.product].map((k) => ({ f: G.bar(k), peak: 0.6 })),
  ...[18, BAR.stats, BAR.outro].map((k) => ({ f: G.bar(k), peak: 0.3 })),
  { f: G.at(30, 2), peak: 0.35, color: "#F0B90B" }, // whale
  { f: G.at(34), peak: 0.35, color: "#e8633a" }, // flagged
  { f: G.at(44, 2), peak: 0.45, color: "#ef5d5d" }, // 301
];

const TRANSITION_SFX = [
  { name: "whoosh" as const, at: G.bar(BAR.logo), volume: 0.8 },
  { name: "whoosh" as const, at: G.bar(BAR.how), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.hot), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.routers), volume: 0.75 },
  { name: "whoosh" as const, at: G.bar(BAR.backend), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.product), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.limit), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.stats), volume: 0.7 },
  { name: "whoosh" as const, at: G.bar(BAR.outro), volume: 0.6 },
];

/**
 * Voice-over ("tessera-vo" only; lines in scripts/tessera/vo.lines).
 * [id, TRACK bar, beat, +frames]. Music alone on: TAB HELL! / ONE SCAN (18–19),
 * the logo drop (20.0–20.1), NOW ON BNB CHAIN (22.0), WHALE! (30.2), the router
 * drop (32.0), FLAGGED! (33.2–34.0), 200 OK! (36.x), 10 TOOLS (39.2), the product
 * drop (40.0), 301! (44.0–44.2), the stat-wall cut (46.0) and the outro slam (48.x).
 */
const VO_AT: VoCue<VoId>[] = [
  ["hook", 16, 0], // panels: address · 11 chains · 11 explorers (ends before TAB HELL!)
  ["intro", 20, 2], // mosaic assembling → wordmark
  ["bnb", 22, 1], // chain chips 56 · 204 · 97 (ends before the 24.0 drop)
  ["paste", 24, 1], // step 1 PASTE AN ADDRESS
  ["fan", 25, 0], // step 2 FAN OUT
  ["classify", 26, 0], // step 3 CLASSIFY (eth_getCode)
  ["report", 27, 0, -2], // step 4 REPORT (ends on the 28.0 zoom)
  ["hot", 28, 1], // real scan-chain of the Binance hot wallet
  ["scroll", 29, 2], // Scroll row: RPC error this run (ends before WHALE!)
  ["whale", 30, 3], // BSC USDT/USDC 100M at 18 decimals
  ["router", 32, 1], // PancakeSwap V3 SmartRouter scan
  ["flagged", 34, 1], // Contract on 56/204/97 → explorer card
  ["tools", 37, 0], // MCP tools/list: 10 tools
  ["agent", 38, 1], // tools/call scan_chain JSON
  ["real", 40, 1], // real frontend landing → features
  ["key", 42, 2], // dashboard; "Agent runs need ANTHROPIC_API_KEY" note (43.3)
  ["limit", 44, 3], // after 301!: the Etherscan V2 fix
  ["readonly", 46, 1], // stat wall: 0 contracts · 0 tBNB
  ["outro", 49, 1], // tagline
];
const VO = placeVo(G, VO_LINES, VO_AT);
const duck = duckFor(VO);
const NO_DUCK = () => 1;

const FPS = 30;
const MUSIC_VOL = 0.5;
const SPLICE_F = G.bar(SPLICE_BAR);
const XF = 2; // 2-frame crossfade at the splice (click guard)

/** File bar 16 → 48, spliced on a downbeat to the file's own outro tail (bar 68 → silence at 72). */
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
        volume={(f) =>
          duckAt(SPLICE_F + f) *
          Math.min(MUSIC_VOL * interpolate(f, [0, XF], [0, 1], clamp), MUSIC_VOL * interpolate(SPLICE_F + f, [G.at(51, 2), TOTAL], [1, 0], clamp))
        }
      />
    </Sequence>
  </>
);

export const Main: React.FC<VoProps> = ({ vo = false }) => (
  <BeatProvider grid={G}>
    <AbsoluteFill style={{ background: "#07090a" }}>
      <SceneTimeline scenes={SCENES} />
      <Flashes hits={FLASHES} />
      <MusicBed duckAt={vo ? duck : NO_DUCK} />
      {vo ? <VoTrack clips={VO} volume={1.2} /> : null}
      <SfxTrack hits={TRANSITION_SFX} />
    </AbsoluteFill>
  </BeatProvider>
);
