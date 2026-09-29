import React from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTS } from "./fonts";
import { BNB_GOLD, clamp, INK, PAPER } from "./tokens";

/**
 * comicFx — the shared comic house style: halftone texture, ink panel frames,
 * hand-wobbled speed bursts, starburst seals, slam-in comic panels, caption
 * boxes and ink-lettered numbers. All code-drawn (SVG/CSS). Colours default
 * to kit tokens; pass project brand colours as props.
 */

/* ------------------------------------------------------------- Halftone -- */

/** Newsprint dot texture. Keep opacity low (0.04–0.1) on dark pages. */
export const Halftone: React.FC<{
  opacity?: number;
  color?: string;
  dot?: number;
  gap?: number;
  /** Fade the dots toward one side (CSS mask). */
  mask?: string;
  style?: React.CSSProperties;
}> = ({ opacity = 0.06, color = PAPER, dot = 1.6, gap = 16, mask, style }) => {
  const id = React.useId().replace(/:/g, "");
  return (
    <AbsoluteFill style={{ pointerEvents: "none", maskImage: mask, WebkitMaskImage: mask, ...style }}>
      <svg width="100%" height="100%" style={{ display: "block" }}>
        <defs>
          <pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
            <circle cx={gap / 2} cy={gap / 2} r={dot} fill={color} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} opacity={opacity} />
      </svg>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------- InkFrame -- */

/** Thick ink rule inset around the frame — makes the screen read as a page. */
export const InkFrame: React.FC<{
  inset?: number;
  color?: string;
  width?: number;
  radius?: number;
  opacity?: number;
  /** Optional inner accent hairline (e.g. BNB gold). */
  innerColor?: string;
}> = ({ inset = 26, color = PAPER, width = 4, radius = 20, opacity = 0.8, innerColor }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", inset, border: `${width}px solid ${color}`, borderRadius: radius, opacity }} />
    {innerColor ? (
      <div
        style={{
          position: "absolute",
          inset: inset + 10,
          border: `1.5px solid ${innerColor}`,
          borderRadius: Math.max(0, radius - 6),
          opacity: opacity * 0.45,
        }}
      />
    ) : null}
  </AbsoluteFill>
);

/* ----------------------------------------------------------- SpeedBurst -- */

/**
 * Radial, hand-wobbled speed lines snapping out from (cx, cy) on LOCAL frame
 * `from`. Coordinates are 1920×1080 content px.
 */
export const SpeedBurst: React.FC<{
  cx: number;
  cy: number;
  from?: number;
  count?: number;
  spread?: number;
  inner?: number;
  color?: string;
  opacity?: number;
  width?: number;
  seed?: string;
  /** Fade out ~1s after the pop instead of holding. */
  fade?: boolean;
}> = ({
  cx,
  cy,
  from = 0,
  count = 14,
  spread = 420,
  inner = 120,
  color = BNB_GOLD,
  opacity = 0.55,
  width = 6,
  seed = "sb",
  fade = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - from, fps, config: { damping: 12, stiffness: 180, mass: 0.6 } });
  if (pop <= 0.001) return null;
  const op = opacity * (fade ? interpolate(frame - from, [0, 6, 22, 40], [0, 1, 1, 0], clamp) : 1);
  if (op <= 0.001) return null;
  const rays: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2 + (random(`${seed}a${i}`) - 0.5) * 0.2;
    const r0 = inner * (0.82 + random(`${seed}r${i}`) * 0.34);
    const r1 = r0 + spread * (0.5 + random(`${seed}l${i}`) * 0.6) * pop;
    const x1 = cx + Math.cos(ang) * r0;
    const y1 = cy + Math.sin(ang) * r0;
    const x2 = cx + Math.cos(ang) * r1;
    const y2 = cy + Math.sin(ang) * r1;
    const bow = (random(`${seed}b${i}`) - 0.5) * 18;
    const mx = (x1 + x2) / 2 + Math.cos(ang + Math.PI / 2) * bow;
    const my = (y1 + y2) / 2 + Math.sin(ang + Math.PI / 2) * bow;
    rays.push(
      <path
        key={i}
        d={`M${x1.toFixed(1)} ${y1.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`}
        fill="none"
        stroke={color}
        strokeWidth={width * (0.5 + random(`${seed}w${i}`))}
        strokeLinecap="round"
      />,
    );
  }
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <g opacity={op}>{rays}</g>
      </svg>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ Starburst -- */

/** Rough-edged comic starburst polygon (an SVG element — put inside <svg>). */
export const Starburst: React.FC<{
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  spikes?: number;
  inner?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  seed?: string;
  rotate?: number;
}> = ({ cx, cy, rx, ry, spikes = 18, inner = 0.78, fill = BNB_GOLD, stroke = INK, strokeWidth = 6, seed = "st", rotate = 0 }) => {
  const pts: string[] = [];
  const n = spikes * 2;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2 + (rotate * Math.PI) / 180;
    const r = (i % 2 === 0 ? 1 : inner) * (1 + (random(`${seed}${i}`) - 0.5) * 0.12);
    pts.push(`${(cx + Math.cos(ang) * rx * r).toFixed(1)},${(cy + Math.sin(ang) * ry * r).toFixed(1)}`);
  }
  return <polygon points={pts.join(" ")} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />;
};

/* --------------------------------------------------------------- CoinDot -- */

/** Coin glyph as an SVG <g> (place inside an <svg>). `label` prints on the face. */
export const CoinDot: React.FC<{
  cx: number;
  cy: number;
  r?: number;
  face?: string;
  ring?: string;
  label?: string;
  opacity?: number;
  scaleX?: number;
  rotate?: number;
}> = ({ cx, cy, r = 14, face = BNB_GOLD, ring = "#FFE08A", label, opacity = 1, scaleX = 1, rotate = 0 }) => (
  <g transform={`translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rotate}) scale(${scaleX.toFixed(3)} 1)`} opacity={opacity}>
    <circle r={r} fill={face} stroke={INK} strokeWidth={Math.max(1.5, r * 0.16)} />
    <circle r={r * 0.66} fill="none" stroke={ring} strokeWidth={Math.max(1, r * 0.11)} />
    {label ? (
      <text
        y={r * 0.34}
        textAnchor="middle"
        fontFamily={FONTS.comic}
        fontSize={r * 0.95}
        fill={INK}
        style={{ letterSpacing: 0 }}
      >
        {label}
      </text>
    ) : null}
  </g>
);

/* ---------------------------------------------------------- inkTextStyle -- */

/** Bangers + ink stroke + hard offset shadow for flow-layout numbers/words. */
export const inkTextStyle = (size: number, fill: string = BNB_GOLD, strokeW?: number): React.CSSProperties => {
  const s = strokeW ?? Math.max(2, size * 0.05);
  const off = size * 0.05;
  return {
    fontFamily: FONTS.comic,
    fontWeight: 400,
    fontSize: size,
    lineHeight: 0.92,
    color: fill,
    WebkitTextStroke: `${s}px ${INK}`,
    paintOrder: "stroke fill",
    textShadow: `${off}px ${off}px 0 ${INK}`,
    letterSpacing: "0.01em",
  };
};

/* ------------------------------------------------------------ DriftDots -- */

/** Slow-drifting particle dots for quiet atmosphere. */
export const DriftDots: React.FC<{ count?: number; seed?: string; color?: string; alt?: string; opacity?: number }> = ({
  count = 10,
  seed = "drift",
  color = BNB_GOLD,
  alt = PAPER,
  opacity = 0.3,
}) => {
  const frame = useCurrentFrame();
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const x0 = 100 + random(`${seed}x${i}`) * 1720;
    const y0 = 140 + random(`${seed}y${i}`) * 900;
    const speed = 0.15 + random(`${seed}s${i}`) * 0.25;
    const ph = random(`${seed}p${i}`) * Math.PI * 2;
    const y = ((y0 - frame * speed) % 1000 + 1000) % 1000 + 40;
    dots.push(
      <circle
        key={i}
        cx={x0 + Math.sin(frame * 0.02 * speed + ph) * 24}
        cy={y}
        r={2.5 + random(`${seed}r${i}`) * 4}
        fill={random(`${seed}c${i}`) > 0.4 ? color : alt}
        opacity={opacity * (0.55 + 0.45 * Math.sin(frame * 0.05 + ph))}
      />,
    );
  }
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        {dots}
      </svg>
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------------- ComicPanel -- */

/**
 * A comic panel: flat colour field + halftone + thick ink border + hard
 * offset shadow, slamming in on LOCAL frame `at` (overshoot + tilt settle).
 * Children are laid out in the panel's own px box (w × h).
 */
export const ComicPanel: React.FC<{
  at: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rot?: number;
  bg?: string;
  /** Second colour for a diagonal gradient field. */
  bg2?: string;
  border?: string;
  borderW?: number;
  shadow?: number;
  halftone?: number;
  halftoneColor?: string;
  from?: "up" | "down" | "left" | "right" | "scale";
  radius?: number;
  children?: React.ReactNode;
  /** Extra per-beat punch scale (from useBeatPunch). */
  punch?: number;
  style?: React.CSSProperties;
}> = ({
  at,
  x,
  y,
  w,
  h,
  rot = 0,
  bg = "#FFE9A8",
  bg2,
  border = INK,
  borderW = 7,
  shadow = 14,
  halftone = 0.16,
  halftoneColor = INK,
  from = "scale",
  radius = 6,
  children,
  punch = 1,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hid = `ht${React.useId().replace(/:/g, "")}`;
  const p = spring({ frame: frame - at, fps, config: { damping: 11, stiffness: 190, mass: 0.7 } });
  if (frame < at) return null;
  const d = 1 - p;
  const off: Record<string, string> = {
    up: `translateY(${d * -260}px)`,
    down: `translateY(${d * 260}px)`,
    left: `translateX(${d * -320}px)`,
    right: `translateX(${d * 320}px)`,
    scale: "",
  };
  const sc = (from === "scale" ? 0.55 + 0.45 * p : 1) * punch;
  const r = rot + d * (rot >= 0 ? 7 : -7);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        transform: `${off[from]} rotate(${r}deg) scale(${sc})`,
        opacity: interpolate(p, [0, 0.25], [0, 1], clamp),
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${shadow}px, ${shadow}px)`,
          background: INK,
          borderRadius: radius,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: bg2 ? `linear-gradient(135deg, ${bg}, ${bg2})` : bg,
          border: `${borderW}px solid ${border}`,
          borderRadius: radius,
          overflow: "hidden",
        }}
      >
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <pattern id={hid} width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
              <circle cx={7} cy={7} r={2.1} fill={halftoneColor} />
            </pattern>
            <linearGradient id={`${hid}m`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity={0} />
              <stop offset="1" stopColor="#fff" stopOpacity={1} />
            </linearGradient>
            <mask id={`${hid}k`}>
              <rect width="100%" height="100%" fill={`url(#${hid}m)`} />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${hid})`} opacity={halftone} mask={`url(#${hid}k)`} />
        </svg>
        <div style={{ position: "absolute", inset: 0 }}>{children}</div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------- Caption -- */

/** Rectangular comic caption box (narration), pops on LOCAL frame `at`. */
export const Caption: React.FC<{
  at: number;
  children: React.ReactNode;
  x: number;
  y: number;
  size?: number;
  bg?: string;
  color?: string;
  rot?: number;
  maxWidth?: number;
  font?: string;
}> = ({ at, children, x, y, size = 30, bg = PAPER, color = INK, rot = -1.5, maxWidth = 620, font = FONTS.comic }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 220, mass: 0.6 } });
  if (frame < at) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        maxWidth,
        transform: `rotate(${rot}deg) scale(${0.6 + 0.4 * p})`,
        transformOrigin: "0% 50%",
        opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
        background: bg,
        color,
        border: `4px solid ${INK}`,
        boxShadow: `6px 6px 0 ${INK}`,
        padding: `${size * 0.28}px ${size * 0.5}px`,
        fontFamily: font,
        fontSize: size,
        lineHeight: 1.05,
        letterSpacing: font === FONTS.comic ? "0.02em" : undefined,
        textTransform: font === FONTS.comic ? "uppercase" : undefined,
      }}
    >
      {children}
    </div>
  );
};

/* ------------------------------------------------------------ InkArrow -- */

/**
 * Hand-drawn ink arrow from (x1,y1) to (x2,y2) that DRAWS ON between local
 * frames [at, at+dur]. SVG element — place inside a 1920×1080 <svg>.
 */
export const InkArrow: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  at: number;
  dur?: number;
  bend?: number;
  color?: string;
  width?: number;
  dashed?: boolean;
}> = ({ x1, y1, x2, y2, at, dur = 10, bend = -40, color = PAPER, width = 7, dashed = false }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + dur], [0, 1], clamp);
  if (p <= 0) return null;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + bend;
  const d = `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`;
  const len = Math.hypot(x2 - x1, y2 - y1) * 1.15;
  const ang = Math.atan2(y2 - my, x2 - mx);
  const hx = x2;
  const hy = y2;
  const head = 22;
  const headPts = [
    [hx, hy],
    [hx - Math.cos(ang - 0.45) * head, hy - Math.sin(ang - 0.45) * head],
    [hx - Math.cos(ang + 0.45) * head, hy - Math.sin(ang + 0.45) * head],
  ]
    .map((q) => q.join(","))
    .join(" ");
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={width + 6} strokeLinecap="round" strokeDasharray={`${len}`} strokeDashoffset={len * (1 - p)} />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dashed ? "18 14" : `${len}`}
        strokeDashoffset={dashed ? -frame * 2 : len * (1 - p)}
        opacity={dashed ? p : 1}
      />
      {p > 0.92 ? <polygon points={headPts} fill={color} stroke={INK} strokeWidth={4} strokeLinejoin="round" /> : null}
    </g>
  );
};

/* --------------------------------------------------------- SpeechBubble -- */

/**
 * Comic speech bubble (rounded, ink outline, pointed tail) popping on LOCAL
 * frame `at`. (x, y) = bubble top-left in the parent's px; the tail points
 * toward (tailX, tailY) relative to the bubble's top-left.
 */
export const SpeechBubble: React.FC<{
  at: number;
  x: number;
  y: number;
  w: number;
  h: number;
  tailX: number;
  tailY: number;
  children: React.ReactNode;
  size?: number;
  bg?: string;
  color?: string;
  shout?: boolean;
}> = ({ at, x, y, w, h, tailX, tailY, children, size = 30, bg = "#ffffff", color = INK, shout = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 10, stiffness: 240, mass: 0.55 } });
  if (frame < at) return null;
  const cx = w / 2;
  const cy = h / 2;
  const ang = Math.atan2(tailY - cy, tailX - cx);
  const bx1 = cx + Math.cos(ang - 0.35) * Math.min(w, h) * 0.35;
  const by1 = cy + Math.sin(ang - 0.35) * Math.min(w, h) * 0.35;
  const bx2 = cx + Math.cos(ang + 0.35) * Math.min(w, h) * 0.35;
  const by2 = cy + Math.sin(ang + 0.35) * Math.min(w, h) * 0.35;
  const shape = shout
    ? (() => {
        const pts: string[] = [];
        const n = 28;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          const r = i % 2 === 0 ? 1 : 0.86;
          pts.push(`${(cx + (Math.cos(a) * w * r) / 2).toFixed(1)},${(cy + (Math.sin(a) * h * r) / 2).toFixed(1)}`);
        }
        return <polygon points={pts.join(" ")} fill={bg} stroke={INK} strokeWidth={5} strokeLinejoin="round" />;
      })()
    : <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} fill={bg} stroke={INK} strokeWidth={5} />;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        transform: `scale(${0.4 + 0.6 * p})`,
        transformOrigin: `${(tailX / w) * 100}% ${(tailY / h) * 100}%`,
        opacity: interpolate(p, [0, 0.25], [0, 1], clamp),
      }}
    >
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <polygon points={`${bx1},${by1} ${tailX},${tailY} ${bx2},${by2}`} fill={bg} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {shape}
        <polygon points={`${bx1},${by1} ${(bx1 + tailX) / 2},${(by1 + tailY) / 2} ${bx2},${by2}`} fill={bg} />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: `0 ${w * 0.12}px`,
          fontFamily: FONTS.comic,
          fontSize: size,
          lineHeight: 1,
          color,
          textTransform: "uppercase",
          letterSpacing: "0.02em",
        }}
      >
        {children}
      </div>
    </div>
  );
};
