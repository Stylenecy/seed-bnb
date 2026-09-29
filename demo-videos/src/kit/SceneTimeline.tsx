import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import { SceneStartCtx, useBeat, useSceneStart } from "./BeatContext";
import { clamp } from "./tokens";

/**
 * SceneTimeline — lays scenes on the beat grid.
 *
 * Each scene owns [from, to) in COMP frames (both should be bar()/beat()
 * values). `enter` picks how it arrives:
 *   "cut"   — hard cut exactly on `from` (use on drops / downbeats).
 *   "slide" — the scene starts `enterFrames` early and slides in from the
 *             right while the previous scene is pushed left; the move LANDS
 *             on `from` (use on soft gaps; default enterFrames = half a beat).
 *   "whip"  — like slide but faster with motion blur.
 *   "zoom"  — punches in from 1.25× with blur + fade, landing on `from`.
 *
 * Inside a scene, call `useSceneClock()` to convert track bars/beats to
 * LOCAL frames: `const { b } = useSceneClock(); b(8)` = local frame of bar 8,
 * `b(8, 2)` = beat 2 of bar 8.
 */
export type Enter = "cut" | "slide" | "whip" | "zoom";

export type SceneSpec = {
  id: string;
  from: number;
  to: number;
  enter?: Enter;
  enterFrames?: number;
  component: React.FC;
};

const EASE = Easing.bezier(0.7, 0, 0.2, 1);

const EnterFx: React.FC<{ type: Enter; dur: number; children: React.ReactNode }> = ({ type, dur, children }) => {
  const f = useCurrentFrame();
  if (type === "cut" || dur <= 0 || f >= dur) return <AbsoluteFill>{children}</AbsoluteFill>;
  const p = interpolate(f, [0, dur], [0, 1], { ...clamp, easing: EASE });
  let style: React.CSSProperties = {};
  if (type === "slide" || type === "whip") {
    const blur = type === "whip" ? (1 - Math.abs(p - 0.5) * 2) * 18 : 0;
    style = { transform: `translateX(${(1 - p) * 100}%)`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined };
  } else if (type === "zoom") {
    style = { transform: `scale(${1.25 - 0.25 * p})`, opacity: p, filter: `blur(${(1 - p) * 14}px)` };
  }
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

const ExitFx: React.FC<{ type: Enter; dur: number; len: number; children: React.ReactNode }> = ({
  type,
  dur,
  len,
  children,
}) => {
  const f = useCurrentFrame();
  const s = len - dur;
  if (type === "cut" || dur <= 0 || f < s) return <AbsoluteFill>{children}</AbsoluteFill>;
  const p = interpolate(f, [s, len], [0, 1], { ...clamp, easing: EASE });
  let style: React.CSSProperties = {};
  if (type === "slide" || type === "whip") style = { transform: `translateX(${-p * 35}%)`, opacity: 1 - p * 0.6 };
  if (type === "zoom") style = { transform: `scale(${1 - 0.08 * p})`, opacity: 1 - p };
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export const SceneTimeline: React.FC<{ scenes: SceneSpec[] }> = ({ scenes }) => {
  const g = useBeat();
  const half = g.beats(0.5);
  return (
    <>
      {scenes.map((sc, i) => {
        const enter = sc.enter ?? "cut";
        const lead = enter === "cut" ? 0 : sc.enterFrames ?? (enter === "whip" ? Math.round(half * 0.8) : half);
        const next = scenes[i + 1];
        const nextEnter = next?.enter ?? "cut";
        const nextLead =
          nextEnter === "cut" ? 0 : next?.enterFrames ?? (nextEnter === "whip" ? Math.round(half * 0.8) : half);
        const start = sc.from - lead;
        // Keep the outgoing scene alive under the incoming one until it lands.
        const len = sc.to - start;
        const C = sc.component;
        return (
          <Sequence key={sc.id} name={sc.id} from={start} durationInFrames={len} premountFor={30}>
            <SceneStartCtx.Provider value={start}>
              <ExitFx type={nextEnter} dur={nextLead} len={len}>
                <EnterFx type={enter} dur={lead}>
                  <C />
                </EnterFx>
              </ExitFx>
            </SceneStartCtx.Provider>
          </Sequence>
        );
      })}
    </>
  );
};

/** Local-frame helpers for the current scene (see SceneTimeline docs). */
export const useSceneClock = () => {
  const g = useBeat();
  const start = useSceneStart();
  return {
    g,
    start,
    /** Local frame of track bar k (+ beat b inside it). */
    b: (k: number, beat = 0): number => g.at(k, beat) - start,
    /** Local frames of every beat in [fromBar, toBar). */
    beatsIn: (fromBar: number, toBar: number, every = 1): number[] =>
      g.beatsIn(fromBar, toBar, every).map((f) => f - start),
  };
};
