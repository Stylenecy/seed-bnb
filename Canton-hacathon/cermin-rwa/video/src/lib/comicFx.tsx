import React from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "./tokens";
import { FONT_COMIC } from "./fonts";

/**
 * comicFx — the SHARED comic-house-style helper set used by every "designed"
 * scene (S2 logo · S5b under-the-hood · S6 stats wall · S7 close) so they read
 * as one book: ink panel borders, halftone dot texture, hand-wobbled ink
 * speed-lines, and the little gold bond-seal coins that ride the money flows.
 *
 * Everything is code-drawn (SVG/CSS) — no generated images. Colours come from
 * the brand palette in tokens.ts; the ink is the app surface `#0a0c10`.
 */

const INK = "#0a0c10";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ============================================================= Halftone ==== */

/**
 * A halftone dot texture overlay (the comic newsprint shading). Full-frame by
 * default; drop it near the top of a scene so it sits UNDER the content. Keep
 * `opacity` low (0.04–0.08) — it should whisper, not shout.
 */
export const Halftone: React.FC<{
  opacity?: number;
  color?: string;
  /** Dot radius (px). */
  dot?: number;
  /** Pattern tile size (px) — bigger = sparser dots. */
  gap?: number;
  style?: React.CSSProperties;
}> = ({ opacity = 0.05, color = COLORS.text, dot = 1.5, gap = 16, style }) => {
  const id = React.useId();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", ...style }}>
      <svg width="100%" height="100%" style={{ display: "block" }}>
        <defs>
          <pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse">
            <circle cx={gap * 0.25} cy={gap * 0.25} r={dot} fill={color} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} opacity={opacity} />
      </svg>
    </AbsoluteFill>
  );
};

/* ============================================================= InkFrame ==== */

/**
 * A thin ink frame inset around the whole screen — the comic panel border that
 * makes the frame feel like a page. Optional inner hairline (gold) for a
 * double-rule seal look.
 */
export const InkFrame: React.FC<{
  inset?: number;
  color?: string;
  width?: number;
  radius?: number;
  opacity?: number;
  /** Add a faint inner gold hairline a few px inside the ink rule. */
  innerRule?: boolean;
}> = ({
  inset = 30,
  color = COLORS.text,
  width = 4,
  radius = 22,
  opacity = 0.85,
  innerRule = false,
}) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div
      style={{
        position: "absolute",
        inset,
        border: `${width}px solid ${color}`,
        borderRadius: radius,
        opacity,
      }}
    />
    {innerRule ? (
      <div
        style={{
          position: "absolute",
          inset: inset + 10,
          border: `1.5px solid ${COLORS.gold}`,
          borderRadius: radius - 6,
          opacity: opacity * 0.4,
        }}
      />
    ) : null}
  </AbsoluteFill>
);

/* ============================================================ SpeedBurst ==== */

/**
 * Radial comic speed-lines snapping out from (cx, cy) — the "pop" energy behind
 * a reveal. Hand-wobbled (each ray is a slightly bent, tapered ink/gold stroke
 * of varied length + width), scale-in fast on the beat. Full-frame SVG, so
 * cx/cy are in 1920×1080 content space.
 */
export const SpeedBurst: React.FC<{
  cx: number;
  cy: number;
  count?: number;
  /** Max ray length (px). */
  spread?: number;
  /** Inner radius the rays start from (px). */
  inner?: number;
  /** LOCAL frame the burst pops on. */
  from?: number;
  color?: string;
  opacity?: number;
  width?: number;
  /** Deterministic seed so a scene's bursts don't share a pattern. */
  seed?: string;
  /** Hold forever (default) or fade out over ~1s after the pop. */
  fade?: boolean;
}> = ({
  cx,
  cy,
  count = 10,
  spread = 420,
  inner = 110,
  from = 0,
  color = COLORS.gold,
  opacity = 0.5,
  width = 5,
  seed = "sb",
  fade = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({
    frame: frame - from,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.6 },
  });
  if (pop <= 0.001) return null;
  const fadeOp = fade
    ? interpolate(frame - from, [0, 8, 26, 44], [0, 1, 1, 0], clamp)
    : 1;
  const groupOp = opacity * fadeOp;
  if (groupOp <= 0.001) return null;

  const rays: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const baseAng = (i / count) * Math.PI * 2;
    const ang = baseAng + (random(`${seed}-a-${i}`) - 0.5) * 0.18;
    const r0 = inner * (0.82 + random(`${seed}-r-${i}`) * 0.34);
    const len = spread * (0.55 + random(`${seed}-l-${i}`) * 0.55) * pop;
    const r1 = r0 + len;
    const x1 = cx + Math.cos(ang) * r0;
    const y1 = cy + Math.sin(ang) * r0;
    const x2 = cx + Math.cos(ang) * r1;
    const y2 = cy + Math.sin(ang) * r1;
    // Slight perpendicular bow at the midpoint for a hand-drawn wobble.
    const perp = ang + Math.PI / 2;
    const bow = (random(`${seed}-b-${i}`) - 0.5) * 18;
    const mx = (x1 + x2) / 2 + Math.cos(perp) * bow;
    const my = (y1 + y2) / 2 + Math.sin(perp) * bow;
    const w = width * (0.5 + random(`${seed}-w-${i}`) * 1.0);
    rays.push(
      <path
        key={i}
        d={`M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`}
        fill="none"
        stroke={color}
        strokeWidth={w}
        strokeLinecap="round"
      />,
    );
  }
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <g opacity={groupOp}>{rays}</g>
      </svg>
    </AbsoluteFill>
  );
};

/* ============================================================== CoinDot ==== */

export type CoinVariant = "gold" | "cream";

/**
 * A tiny coin glyph — gold disc + inner ring + a bond-seal centre dot. Returns
 * an SVG `<g>` (NOT a standalone svg), so drop it INSIDE an existing `<svg>` and
 * position via cx/cy. `cream` is the parchment stablecoin variant. `scaleX`/
 * `scaleY` let a coin squash as it lands in a destination node.
 */
export const CoinDot: React.FC<{
  cx: number;
  cy: number;
  r?: number;
  variant?: CoinVariant;
  opacity?: number;
  scaleX?: number;
  scaleY?: number;
  rotate?: number;
}> = ({ cx, cy, r = 9, variant = "gold", opacity = 1, scaleX = 1, scaleY = 1, rotate = 0 }) => {
  const cream = variant === "cream";
  const face = cream ? COLORS.text : COLORS.gold;
  const ring = cream ? COLORS.gold : COLORS.goldSoft;
  const seal = cream ? COLORS.gold : INK;
  return (
    <g
      transform={`translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rotate}) scale(${scaleX.toFixed(3)} ${scaleY.toFixed(3)})`}
      opacity={opacity}
    >
      <circle r={r} fill={face} stroke={INK} strokeWidth={Math.max(1, r * 0.16)} />
      <circle r={r * 0.62} fill="none" stroke={ring} strokeWidth={Math.max(0.8, r * 0.12)} />
      <circle r={r * 0.2} fill={seal} />
    </g>
  );
};

/* ========================================================== inkTextStyle ==== */

/**
 * CSS for a Bangers number/word with the ComicText ink treatment (thick ink
 * stroke behind the fill + a hard offset shadow), for use in plain flow layout
 * (e.g. the big "277" inside a stat card) where the animated <ComicText> block
 * would be awkward.
 */
export const inkTextStyle = (
  size: number,
  fill: string = COLORS.gold,
  strokeW?: number,
): React.CSSProperties => {
  const s = strokeW ?? Math.max(2, size * 0.05);
  const off = size * 0.045;
  return {
    fontFamily: FONT_COMIC,
    fontWeight: 400,
    fontSize: size,
    lineHeight: 0.9,
    color: fill,
    WebkitTextStroke: `${s}px ${INK}`,
    paintOrder: "stroke fill",
    textShadow: `${off}px ${off}px 0 ${INK}`,
    letterSpacing: "0.01em",
  };
};

/* =========================================================== DriftDots ==== */

/**
 * A handful of slow-drifting ink / gold particle dots — the quiet atmosphere in
 * the close. Full-frame; deterministic per `seed`.
 */
export const DriftDots: React.FC<{
  count?: number;
  seed?: string;
  color?: string;
  opacity?: number;
}> = ({ count = 7, seed = "drift", color = COLORS.gold, opacity = 0.32 }) => {
  const frame = useCurrentFrame();
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const x0 = 120 + random(`${seed}-x-${i}`) * 1680;
    const y0 = 120 + random(`${seed}-y-${i}`) * 840;
    const rr = 2.5 + random(`${seed}-r-${i}`) * 4;
    const speed = 0.12 + random(`${seed}-s-${i}`) * 0.22;
    const phase = random(`${seed}-p-${i}`) * Math.PI * 2;
    const dx = Math.sin(frame * 0.008 * speed * 6 + phase) * 26;
    const dy = -(frame * speed) % 200; // slow upward drift, wrapping
    const twinkle = 0.5 + 0.5 * Math.sin(frame * 0.05 + phase);
    const gold = random(`${seed}-c-${i}`) > 0.4;
    dots.push(
      <circle
        key={i}
        cx={x0 + dx}
        cy={y0 + dy}
        r={rr}
        fill={gold ? color : COLORS.faint}
        opacity={opacity * (0.5 + 0.5 * twinkle)}
      />,
    );
  }
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">{dots}</svg>
    </AbsoluteFill>
  );
};
