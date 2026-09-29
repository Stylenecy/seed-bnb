import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTS } from "./fonts";
import { clamp, INK, PAPER } from "./tokens";

/**
 * ComicText — in-scene comic lettering (Bangers, thick ink stroke, hard offset
 * shadow) that squash-stretch POPS on LOCAL frame `from` (put it on a beat).
 *
 * Variants:
 *   "slam"         — narration/headline lettering.
 *   "onomatopoeia" — sound-effect words ("CLAIMED!", "POP!"): coloured echo
 *                    ghost, bigger overshoot, a short post-pop buzz, and
 *                    optional starburst backing (`burst`).
 *
 * Position is the block CENTRE in 1920×1080 content px. Use tilt/rotate/skew
 * to lay the words along the panel's diagonals so they live IN the art.
 */
const JIT = [-1.15, 1.4, -0.8, 1.05, -1.35, 0.7, 1.2, -0.95, 0.55, -0.6];

export type ComicTextProps = {
  text: string;
  from: number;
  x: number;
  y: number;
  size?: number;
  rotate?: number;
  skewX?: number;
  tiltX?: number;
  tiltY?: number;
  fill?: string;
  jitter?: number;
  variant?: "slam" | "onomatopoeia";
  stroke?: number;
  /** Fade out from this LOCAL frame (10f fade). */
  exitAt?: number;
  echoColor?: string;
  /** Starburst behind the word (onomatopoeia) — fill colour. */
  burst?: string;
  align?: "center" | "left";
  /** Per-letter stagger in frames (0 = whole block pops at once). */
  stagger?: number;
};

const Letters: React.FC<{
  text: string;
  size: number;
  fill: string;
  stroke: number;
  jitter: number;
  offset: number;
  align: "center" | "left";
  ghost?: string;
  local: number;
  stagger: number;
  fps: number;
}> = ({ text, size, fill, stroke, jitter, offset, align, ghost, local, stagger, fps }) => {
  let wi = 0;
  let li = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : "flex-start", gap: size * 0.02 }}>
      {text.split("\n").map((line, lineI) => (
        <div key={lineI} style={{ display: "flex", gap: size * 0.16, justifyContent: align === "center" ? "center" : "flex-start" }}>
          {line.split(" ").map((w, i) => {
            const rot = JIT[wi++ % JIT.length]! * jitter;
            return (
              <span key={i} style={{ display: "inline-flex", transform: `rotate(${rot}deg)` }}>
                {[...w].map((ch, ci) => {
                  const k = li++;
                  const ls = stagger > 0 ? spring({ frame: local - k * stagger, fps, config: { damping: 9, stiffness: 260, mass: 0.5 } }) : 1;
                  return (
                    <span
                      key={ci}
                      style={{
                        display: "inline-block",
                        fontFamily: FONTS.comic,
                        fontWeight: 400,
                        fontSize: size,
                        lineHeight: 0.9,
                        textTransform: "uppercase",
                        color: ghost ?? fill,
                        transform: stagger > 0 ? `translateY(${(1 - ls) * size * 0.4}px) scale(${0.3 + 0.7 * ls})` : undefined,
                        opacity: stagger > 0 ? Math.min(1, ls * 3) : 1,
                        WebkitTextStroke: ghost ? undefined : `${stroke}px ${INK}`,
                        paintOrder: "stroke fill",
                        textShadow: ghost ? undefined : `${offset}px ${offset}px 0 ${INK}, 0 10px 26px rgba(0,0,0,0.55)`,
                      }}
                    >
                      {ch}
                    </span>
                  );
                })}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const ComicText: React.FC<ComicTextProps> = ({
  text,
  from,
  x,
  y,
  size = 120,
  rotate = 0,
  skewX = 0,
  tiltX = 0,
  tiltY = 0,
  fill = PAPER,
  jitter = 1,
  variant = "slam",
  stroke,
  exitAt,
  echoColor = "#E8457E",
  burst,
  align = "center",
  stagger = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ono = variant === "onomatopoeia";
  const strokeW = stroke ?? Math.max(2, size * (ono ? 0.06 : 0.048));
  const offset = size * (ono ? 0.055 : 0.042);
  const local = frame - from;
  const pop = spring({ frame: local, fps, config: ono ? { damping: 8, stiffness: 200, mass: 0.7 } : { damping: 11, stiffness: 210, mass: 0.75 } });
  const scale = interpolate(pop, [0, 1], [ono ? 0.2 : 0.35, 1], clamp);
  const squash = interpolate(local, [0, 3, 8, 14], [0, 1, -0.35, 0], clamp) * (ono ? 0.22 : 0.13);
  const appear = interpolate(pop, [0, 0.3], [0, 1], clamp);
  const exit = exitAt === undefined ? 1 : interpolate(frame, [exitAt, exitAt + 10], [1, 0], clamp);
  const op = Math.min(appear, exit);
  if (local < 0 || op <= 0.001) return null;
  const buzz = ono ? Math.exp(-local / 10) * 2.5 : 0;
  const bx = buzz ? Math.sin(local * 2.7) * buzz : 0;
  const by = buzz ? Math.cos(local * 3.1) * buzz : 0;
  const jit = ono ? jitter * 1.35 : jitter;
  const common = { text, size, fill, stroke: strokeW, jitter: jit, offset, align, local, stagger, fps };
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", pointerEvents: "none" }}>
      <div
        style={{
          transform: `perspective(800px) translate(${bx}px, ${by}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotateZ(${rotate}deg) skewX(${skewX}deg) scale(${scale * (1 + squash)}, ${scale * (1 - squash)})`,
          opacity: op,
          position: "relative",
        }}
      >
        {burst ? (
          <svg
            width={size * text.length * 0.62 + size * 1.4}
            height={size * 2.3 * text.split("\n").length}
            style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", overflow: "visible" }}
          >
            <BurstPoly
              w={size * text.length * 0.62 + size * 1.4}
              h={size * 2.3 * text.split("\n").length}
              fill={burst}
              spikes={16}
              strokeW={Math.max(4, size * 0.05)}
            />
          </svg>
        ) : null}
        {ono ? (
          <div style={{ position: "absolute", left: offset * 2.4, top: offset * 2.4, opacity: 0.9 }}>
            <Letters {...common} ghost={echoColor} />
          </div>
        ) : null}
        <div style={{ position: "relative" }}>
          <Letters {...common} />
        </div>
      </div>
    </div>
  );
};

const BurstPoly: React.FC<{ w: number; h: number; fill: string; spikes: number; strokeW: number }> = ({ w, h, fill, spikes, strokeW }) => {
  const pts: string[] = [];
  const n = spikes * 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = i % 2 === 0 ? 0.5 : 0.36 + ((i * 37) % 7) * 0.012;
    pts.push(`${(w / 2 + Math.cos(a) * w * r).toFixed(1)},${(h / 2 + Math.sin(a) * h * r).toFixed(1)}`);
  }
  return <polygon points={pts.join(" ")} fill={fill} stroke={INK} strokeWidth={strokeW} strokeLinejoin="round" />;
};
