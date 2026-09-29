import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "./tokens";
import { FONT_COMIC } from "./fonts";

/**
 * ComicText — in-scene comic lettering that LIVES INSIDE the illustration.
 *
 * The letters are NOT subtitles: each block is positioned in content space,
 * given a perspective tilt (rotateX/rotateY), a z-rotation and skew so it sits
 * along the art's diagonals / speed-lines, and pops in with a spring
 * squash-stretch ON A BEAT. Parchment/gold fill, thick ink outline + a hard
 * offset shadow so it reads over busy panels. The `onomatopoeia` variant adds a
 * terracotta echo ghost and a jagged buzz for slam words like "CRASH!".
 *
 * Uses the Bangers display face (FONT_COMIC) ONLY — the brand faces
 * (Fraunces/Manrope) stay for every non-comic element.
 */

const INK = "#0a0c10";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Deterministic per-word rotation pattern (× `jitter`) for a hand-lettered feel. */
const JIT = [-1.15, 1.4, -0.8, 1.05, -1.35, 0.7, 1.2, -0.95, 0.55, -0.6];

export type ComicVariant = "slam" | "onomatopoeia";

export type ComicTextProps = {
  /** The phrase. Use "\n" to force a line break; words otherwise flow per line. */
  text: string;
  /** LOCAL frame the squash-stretch pop lands on — put this ON a beat. */
  from: number;
  /** Center of the block in 1920×1080 content px. */
  x: number;
  y: number;
  size?: number;
  /** Z-rotation (deg) — lay the words along the panel's diagonal. */
  rotate?: number;
  /** Horizontal skew (deg) — lean the letters into the composition. */
  skewX?: number;
  /** Perspective tilt (deg) so the block sits IN the scene, not flat on top. */
  tiltX?: number;
  tiltY?: number;
  /** Letter fill (parchment default). */
  fill?: string;
  /** Per-word rotation magnitude (deg). */
  jitter?: number;
  variant?: ComicVariant;
  /** Ink outline width (px). Defaults to ~5% of size. */
  stroke?: number;
  /** Fade out starting at this LOCAL frame (optional). */
  exitAt?: number;
  /** Echo colour for the onomatopoeia ghost. */
  echoColor?: string;
  align?: "center" | "left";
};

const Words: React.FC<{
  text: string;
  size: number;
  fill: string;
  stroke: number;
  jitter: number;
  offset: number;
  align: "center" | "left";
  ghost?: boolean;
  ghostColor?: string;
}> = ({ text, size, fill, stroke, jitter, offset, align, ghost, ghostColor }) => {
  const lines = text.split("\n");
  let wi = 0;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        gap: size * 0.02,
      }}
    >
      {lines.map((line, li) => (
        <div
          key={li}
          style={{
            display: "flex",
            gap: `${size * 0.14}px`,
            justifyContent: align === "center" ? "center" : "flex-start",
          }}
        >
          {line.split(" ").map((w, i) => {
            const rot = JIT[wi++ % JIT.length]! * jitter;
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  fontFamily: FONT_COMIC,
                  fontWeight: 400,
                  fontSize: size,
                  lineHeight: 0.9,
                  textTransform: "uppercase",
                  letterSpacing: "0.005em",
                  color: ghost ? ghostColor : fill,
                  transform: `rotate(${rot}deg)`,
                  WebkitTextStroke: ghost ? undefined : `${stroke}px ${INK}`,
                  // Stroke behind fill so the ink outline never eats the glyph.
                  paintOrder: "stroke fill",
                  textShadow: ghost
                    ? undefined
                    : `${offset}px ${offset}px 0 ${INK}, 0 10px 26px rgba(5,7,10,0.6)`,
                }}
              >
                {w}
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
  fill = COLORS.text,
  jitter = 1,
  variant = "slam",
  stroke,
  exitAt,
  echoColor = COLORS.terracotta,
  align = "center",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isOno = variant === "onomatopoeia";
  const strokeW = stroke ?? Math.max(2, size * (isOno ? 0.06 : 0.048));
  const offset = size * (isOno ? 0.055 : 0.04);

  // Squash-stretch pop: an overshooting spring drives scale; a short squash
  // envelope stretches wide then tall then settles — the classic comic slam.
  const pop = spring({
    frame: frame - from,
    fps,
    config: isOno
      ? { damping: 8, stiffness: 190, mass: 0.7 }
      : { damping: 11, stiffness: 200, mass: 0.75 },
  });
  const scale = interpolate(pop, [0, 1], [0.35, 1], clamp);
  const squash =
    interpolate(frame - from, [0, 3, 8, 14], [0, 1, -0.35, 0], clamp) *
    (isOno ? 0.2 : 0.13);
  const scaleX = scale * (1 + squash);
  const scaleY = scale * (1 - squash);

  const appear = interpolate(pop, [0, 0.32], [0, 1], clamp);
  const exit =
    exitAt === undefined
      ? 1
      : interpolate(frame, [exitAt, exitAt + 10], [1, 0], clamp);
  const op = Math.min(appear, exit);
  if (op <= 0.001) return null;

  // Onomatopoeia keeps a tiny post-pop buzz so the slam word stays alive.
  const buzz = isOno
    ? Math.exp(-(frame - from) / 10) * 2
    : 0;
  const bx = buzz ? Math.sin((frame - from) * 2.7) * buzz : 0;
  const by = buzz ? Math.cos((frame - from) * 3.1) * buzz : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          transform: `perspective(780px) translate(${bx}px, ${by}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotateZ(${rotate}deg) skewX(${skewX}deg) scale(${scaleX}, ${scaleY})`,
          transformStyle: "preserve-3d",
          opacity: op,
          position: "relative",
        }}
      >
        {isOno ? (
          // Terracotta echo ghost, punched down-right behind the slam.
          <div
            style={{
              position: "absolute",
              left: offset * 2.4,
              top: offset * 2.4,
              opacity: 0.85,
            }}
          >
            <Words
              text={text}
              size={size}
              fill={fill}
              stroke={strokeW}
              jitter={jitter * 1.35}
              offset={offset}
              align={align}
              ghost
              ghostColor={echoColor}
            />
          </div>
        ) : null}
        <Words
          text={text}
          size={size}
          fill={fill}
          stroke={strokeW}
          jitter={isOno ? jitter * 1.35 : jitter}
          offset={offset}
          align={align}
        />
      </div>
    </div>
  );
};
