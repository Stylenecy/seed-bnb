import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";

import { S1Problem } from "./scenes/S1Problem";
import { S2Logo } from "./scenes/S2Logo";
import { S3HowItWorks } from "./scenes/S3HowItWorks";
import { S4Product } from "./scenes/S4Product";
import { S4bYield } from "./scenes/S4bYield";
import { S4cMechanism } from "./scenes/S4cMechanism";
import { S5Privacy } from "./scenes/S5Privacy";
import { S5bUnderHood } from "./scenes/S5bUnderHood";
import { S6Live } from "./scenes/S6Live";
import { S7Close } from "./scenes/S7Close";

import { MUSIC } from "./lib/assets";
import { VO_CUES, voSrc, duckAt } from "./lib/vo";
import { SectionFlashes } from "./lib/Pulse";
import { COLORS, SCENE_DUR, TOTAL_DUR, TRANSITION } from "./lib/tokens";
import { B_MUSIC_START_S, C_MUSIC_START_S, FPS, SEAM_FRAME, SEAM2_FRAME } from "./lib/beat";

const timing = linearTiming({ durationInFrames: TRANSITION });

// Mix headroom: music 0.7 + narration 0.82 keep the summed master under −1 dBFS
// (the −12 LUFS VO clips + the hot score + SFX clipped at 0.9 / 1.0).
const MUSIC_VOL = 0.7;
const SEAM_XFADE = 4; // frames of crossfade across each seam
const PART_B_LEN = SEAM2_FRAME - SEAM_FRAME; // 788 — part B now ends at seam 2
const PART_C_LEN = TOTAL_DUR - SEAM2_FRAME; // 1065 — part C rides the real outro
const B_TRIM_BEFORE = Math.round(B_MUSIC_START_S * FPS); // 738
const C_TRIM_BEFORE = Math.round(C_MUSIC_START_S * FPS); // 1301

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Music assembly. The track (78.75s) is shorter than the cut, so it plays in
 * THREE parts joined by short crossfades on shared bar boundaries (bar 37 → bar
 * 13 at seam 1; bar 27 → bar 23 at seam 2), which keeps the beat phase
 * continuous. Part A carries the first act; Part B rides the peak; Part C jumps
 * back to the pre-DROP-2 break (bar 23) and plays through the track's REAL
 * outro, so the video fades to ink exactly as the outro fades to silence.
 */
// Music ducks under every narration line (duckAt works in COMP frames; each
// part's volume callback receives SEQUENCE-local frames, so offset parts B/C).
const partAVol = (f: number): number => {
  const inn = interpolate(f, [0, 12], [0, MUSIC_VOL], clamp);
  const out = interpolate(f, [SEAM_FRAME, SEAM_FRAME + SEAM_XFADE], [MUSIC_VOL, 0], clamp);
  return Math.min(inn, out) * duckAt(f);
};

const partBVol = (f: number): number => {
  const inn = interpolate(f, [0, SEAM_XFADE], [0, MUSIC_VOL], clamp);
  // Part B hands off to Part C at seam 2 (local frame PART_B_LEN) with the same
  // 4-frame crossfade that hides seam 1.
  const out = interpolate(f, [PART_B_LEN, PART_B_LEN + SEAM_XFADE], [MUSIC_VOL, 0], clamp);
  return Math.min(inn, out) * duckAt(f + SEAM_FRAME);
};

const partCVol = (f: number): number => {
  const inn = interpolate(f, [0, SEAM_XFADE], [0, MUSIC_VOL], clamp);
  // Ride the track's own outro; a short safety fade over the final ~1.3s
  // guarantees clean silence at TOTAL_DUR (the audio source has already run out
  // by then). Mirrors partBVol — duckAt takes COMP frames, so offset by SEAM2.
  const out = interpolate(f, [PART_C_LEN - 40, PART_C_LEN], [MUSIC_VOL, 0], clamp);
  return Math.min(inn, out) * duckAt(f + SEAM2_FRAME);
};

export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.app }}>
      {/* Part A — music 0 → 69.6s over comp 0 → seam 1 (+ a 4f crossfade tail). */}
      <Sequence from={0} durationInFrames={SEAM_FRAME + SEAM_XFADE} name="music-A">
        <Audio src={MUSIC} volume={partAVol} />
      </Sequence>
      {/* Part B — jump to bar 13 (24.61s) and ride the peak to seam 2 (50.88s). */}
      <Sequence from={SEAM_FRAME} durationInFrames={PART_B_LEN + SEAM_XFADE} name="music-B">
        <Audio src={MUSIC} trimBefore={B_TRIM_BEFORE} volume={partBVol} />
      </Sequence>
      {/* Part C — jump back to bar 23 (43.363s, the pre-DROP-2 break) and ride
          the track's REAL outro to silence. */}
      <Sequence from={SEAM2_FRAME} durationInFrames={PART_C_LEN} name="music-C">
        <Audio src={MUSIC} trimBefore={C_TRIM_BEFORE} volume={partCVol} />
      </Sequence>

      {/* Narration — edge-tts en-GB-RyanNeural, one clip per cue; the music
          ducks to 0.35 under each line (see duckAt in lib/vo.ts). */}
      {VO_CUES.map((cue) => (
        <Sequence key={cue.src} from={cue.at} durationInFrames={cue.dur + 6} name={`vo-${cue.src.slice(9, -4)}`}>
          <Audio src={voSrc(cue)} volume={0.82} />
        </Sequence>
      ))}

      <TransitionSeries>
        {/* S1 → S2: HARD CUT — the crash cuts to the logo on the breakdown. */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DUR.s1}>
          <S1Problem />
        </TransitionSeries.Sequence>

        {/* S2 → S3: HARD CUT — the logo blinks for ONE quiet bar, then the
            comic strip slams in exactly as the build re-enters on bar 8. */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DUR.s2}>
          <S2Logo />
        </TransitionSeries.Sequence>

        <TransitionSeries.Sequence durationInFrames={SCENE_DUR.s3}>
          <S3HowItWorks />
        </TransitionSeries.Sequence>

        {/* S3 → S4a: HARD CUT — diagram to the real app, on the bar. */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DUR.s4a}>
          <S4Product />
        </TransitionSeries.Sequence>

        {/* S4a → S4b: HARD CUT — the SEAM. The journey hands off to the YIELD
            reveal (music restarts mid-build → act 2). */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DUR.s4b}>
          <S4bYield />
        </TransitionSeries.Sequence>

        {/* S4b → S4c: HARD CUT — yield reveal to the MECHANISM explainer chart
            (defense-vs-liquidation, the core of the pitch). */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DUR.s4c}>
          <S4cMechanism />
        </TransitionSeries.Sequence>

        {/* S4c → S5: HARD CUT — the chart to the privacy point. */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DUR.s5}>
          <S5Privacy />
        </TransitionSeries.Sequence>
        {/* S5 → S5b: soft slide — privacy resolves into the UNDER THE HOOD explainer. */}
        <TransitionSeries.Transition timing={timing} presentation={slide({ direction: "from-right" })} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DUR.s5btech}>
          <S5bUnderHood />
        </TransitionSeries.Sequence>

        {/* S5b → S6: HARD CUT — the SEAM 2. The explainer hands off to the live
            BSC testnet proof (music restarts at the outro build → the close). */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DUR.s6}>
          <S6Live />
        </TransitionSeries.Sequence>

        {/* S6 → S7: HARD CUT — the stats slam into the closing wordmark. */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DUR.s7}>
          <S7Close />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Section-change flashes ride ABOVE every scene (comp-frame aligned):
          parchment on the drops, terracotta on the big breaks. */}
      <SectionFlashes />
    </AbsoluteFill>
  );
};
