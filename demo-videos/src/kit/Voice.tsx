import React from "react";
import { Audio, interpolate, Sequence, staticFile } from "remotion";
import type { BeatGrid } from "./beat";
import { clamp } from "./tokens";

/**
 * Voice-over support (opt-in; see KIT.md → "Voice-over cut").
 *
 *   // vo.gen.ts is written by scripts/_vo/gen.py <slug>
 *   const VO = placeVo(G, VO_LINES, [["hook", 0, 1], ["intro", 4, 2, 4]]);
 *   <Music track={TRACK} total={TOTAL} duck={vo ? duckFor(VO) : undefined} />
 *   {vo ? <VoTrack clips={VO} /> : null}
 *
 * Lines start on a beat of the project's grid (plus `lead` frames so the
 * consonant onset sits a hair after the beat), never overlap (placeVo throws),
 * and the music ducks under them while SFX stay untouched.
 */

/** One generated line (shape of VO_LINES entries in vo.gen.ts). */
export type VoLine = { file: string; dur: number; text?: string };
/** [line id, track bar, beat in bar, optional extra frames]. */
export type VoCue<Id extends string = string> = readonly [Id, number, number, number?];
/** A placed line in COMPOSITION frames. */
export type VoClip = { id: string; src: string; at: number; len: number };
/** Props a project's Main accepts to render its VO cut ("<slug>-vo"). */
export type VoProps = { vo?: boolean };

/**
 * Place lines on the beat grid. Throws if two lines overlap (with `gap`
 * frames of air) so a bad cue fails loudly in Studio instead of mumbling.
 */
export const placeVo = <Id extends string>(
  grid: BeatGrid,
  lines: Record<Id, VoLine>,
  cues: ReadonlyArray<VoCue<Id>>,
  { lead = 2, gap = 2 }: { lead?: number; gap?: number } = {},
): VoClip[] => {
  const clips = cues
    .map(([id, k, bt, nudge = 0]) => {
      const line = lines[id];
      if (!line) throw new Error(`VO line "${id}" is not in vo.gen.ts — rerun scripts/_vo/gen.py`);
      return { id, src: staticFile(line.file), at: grid.at(k, bt) + lead + nudge, len: Math.ceil(line.dur * grid.fps) };
    })
    .sort((a, b) => a.at - b.at);
  clips.forEach((c, i) => {
    const next = clips[i + 1];
    if (next && c.at + c.len + gap > next.at) {
      throw new Error(`VO "${c.id}" (frames ${c.at}–${c.at + c.len}) runs into "${next.id}" at ${next.at}`);
    }
  });
  return clips;
};

/**
 * Music gain multiplier (1 = full, `depth` = under a line) for comp frame f.
 * Short attack before each line, a slightly longer release after it; gaps
 * shorter than attack+release stay ducked instead of pumping.
 */
export const duckFor =
  (clips: VoClip[], { depth = 0.35, attack = 6, release = 8 }: { depth?: number; attack?: number; release?: number } = {}) =>
  (f: number): number =>
    clips.reduce((m, c) => {
      const d = interpolate(f, [c.at - attack, c.at, c.at + c.len, c.at + c.len + release], [0, 1, 1, 0], clamp);
      return Math.min(m, 1 - (1 - depth) * d);
    }, 1);

/** Mount at the top level of Main (comp frames). */
export const VoTrack: React.FC<{ clips: VoClip[]; volume?: number }> = ({ clips, volume = 1 }) => (
  <>
    {clips.map((c) => (
      <Sequence key={`${c.id}-${c.at}`} from={c.at} durationInFrames={c.len + 2} name={`vo-${c.id}`} layout="none">
        <Audio src={c.src} volume={volume} />
      </Sequence>
    ))}
  </>
);
