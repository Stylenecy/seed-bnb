import React from "react";
import { Audio, interpolate, Sequence, staticFile } from "remotion";
import { clamp } from "./tokens";
import type { Track } from "./tracks";

export type SfxName = "whoosh" | "impact" | "tick" | "chime";

/** Frames before the hit where each sample's transient/peak should start so
 *  it LANDS on the beat (whoosh peaks ~0.27s in). */
const LEAD: Record<SfxName, number> = { whoosh: 8, impact: 0, tick: 0, chime: 0 };
const LEN: Record<SfxName, number> = { whoosh: 20, impact: 16, tick: 6, chime: 18 };

export type SfxHit = { name: SfxName; at: number; volume?: number };

/**
 * One SFX landing ON frame `at` (the sample is started `LEAD` frames early so
 * its peak hits the beat). `at` is relative to the enclosing Sequence.
 */
export const Sfx: React.FC<SfxHit> = ({ name, at, volume = 0.8 }) => (
  <Sequence from={Math.max(0, at - LEAD[name])} durationInFrames={LEN[name] + 4} name={`sfx-${name}`} layout="none">
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

/** A list of SFX at COMP frames (mount at the top level of Main). */
export const SfxTrack: React.FC<{ hits: SfxHit[] }> = ({ hits }) => (
  <>
    {hits.map((h, i) => (
      <Sfx key={`${h.name}-${h.at}-${i}`} {...h} />
    ))}
  </>
);

/**
 * The score. `volume` ≈ 0.5 sits the music ~-6 dB under the SFX. Fades in
 * over `fadeIn` frames and out over the last `fadeOut` frames of `total`.
 * `trimBeforeS` starts the file mid-way (pair with makeBeat's musicStartS).
 * `duck` (optional) is a per-frame gain multiplier, e.g. `duckFor(voClips)`
 * from Voice.tsx; frames are Music's own (= comp frames at Main's top level).
 */
export const Music: React.FC<{
  track: Track;
  total: number;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  trimBeforeS?: number;
  fps?: number;
  duck?: (f: number) => number;
}> = ({ track, total, volume = 0.5, fadeIn = 6, fadeOut = 45, trimBeforeS = 0, fps = 30, duck }) => (
  <Audio
    src={staticFile(track.file)}
    trimBefore={Math.round(trimBeforeS * fps)}
    volume={(f) =>
      volume *
      Math.min(interpolate(f, [0, fadeIn], [0, 1], clamp), interpolate(f, [total - fadeOut, total], [1, 0], clamp)) *
      (duck ? duck(f) : 1)
    }
  />
);
