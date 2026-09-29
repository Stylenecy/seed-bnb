import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ComicText } from "./ComicText";

/**
 * Callout — a small COMIC caption that lives inside a scene's content space
 * (mount it as a child of a <Camera> so it tracks the footage), parked in the
 * empty dark UI right beside the thing it names.
 *
 * It reuses the existing <ComicText> (Bangers, ink outline + offset shadow,
 * spring squash-stretch pop) at a UI-callout size (~44–60px) and adds a short
 * ink-outlined parchment/gold POINTER aiming at the UI element, plus a gentle
 * idle float so the block breathes without ever disturbing the steady footage.
 */

const INK = "#0a0c10";
const clampBoth = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type PtrVariant = "tri" | "dash";

/** A short ink-outlined comic pointer (speech-tail or curved flick) that pops,
 *  floats and exits in lockstep with its callout, aiming at a UI element. */
export const Pointer: React.FC<{
  x: number;
  y: number;
  /** Aim direction in degrees (0 = tip points right, +y is down). */
  angle: number;
  from: number;
  out: number;
  fill: string;
  variant?: PtrVariant;
  size?: number;
  skew?: number;
  dy?: number;
}> = ({ x, y, angle, from, out, fill, variant = "tri", size = 62, skew = 0, dy = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({
    frame: frame - from,
    fps,
    config: { damping: 12, stiffness: 190, mass: 0.7 },
  });
  const appear = interpolate(pop, [0, 0.4], [0, 1], clampBoth);
  const exit = interpolate(frame, [out, out + 10], [1, 0], clampBoth);
  const op = Math.min(appear, exit);
  if (op <= 0.001) return null;
  const s = interpolate(pop, [0, 1], [0.4, 1], clampBoth);
  // viewBox 0 0 64 44, tip at (60,22) pointing +x before rotation.
  const path =
    variant === "dash"
      ? "M6,10 Q40,3 60,20 Q40,17 12,33 Q15,20 6,10 Z"
      : "M6,6 L60,22 L6,38 Q23,22 6,6 Z";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + dy,
        transform: `translate(-50%,-50%) rotate(${angle}deg) skewX(${skew}deg) scale(${s})`,
        opacity: op,
        pointerEvents: "none",
      }}
    >
      <svg width={size} height={(size * 44) / 64} viewBox="0 0 64 44" style={{ overflow: "visible" }}>
        {/* hard offset shadow, then parchment/gold fill with a thick ink outline */}
        <path d={path} transform="translate(3.2,3.2)" fill={INK} opacity={0.5} />
        <path d={path} fill={fill} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" paintOrder="stroke" />
      </svg>
    </div>
  );
};

export type CalloutSpec = {
  text: string;
  from: number;
  out: number;
  /** Text block centre in content px. */
  tx: number;
  ty: number;
  size: number;
  rotate: number;
  skewX: number;
  textFill: string;
  /** Pointer anchor + aim. */
  px: number;
  py: number;
  angle: number;
  ptrFill: string;
  variant: PtrVariant;
  ptrSkew: number;
};

export const Callout: React.FC<CalloutSpec> = (c) => {
  const frame = useCurrentFrame();
  // Gentle idle bob (±3px), shared by the text and its pointer so they move as
  // one. Starts near 0 at the pop so it never fights the spring entrance.
  const float = Math.sin((frame - c.from) * 0.09) * 3;
  return (
    <>
      <Pointer
        x={c.px}
        y={c.py}
        angle={c.angle}
        from={c.from + 2}
        out={c.out}
        fill={c.ptrFill}
        variant={c.variant}
        skew={c.ptrSkew}
        dy={float}
      />
      <ComicText
        text={c.text}
        from={c.from}
        exitAt={c.out}
        x={c.tx}
        y={c.ty + float}
        size={c.size}
        rotate={c.rotate}
        skewX={c.skewX}
        fill={c.textFill}
        jitter={0.45}
      />
    </>
  );
};
