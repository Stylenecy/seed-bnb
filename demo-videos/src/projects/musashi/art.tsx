import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { clamp, INK } from "../../kit";
import { C, F } from "./theme";

/**
 * Code-drawn samurai-comic props for MUSASHI: sumi-ink brush strokes, katana
 * slashes, a samurai silhouette, hinomaru sun, hanko seals, token coins, torii
 * gates, washi paper. SVG <g> pieces are placed in a parent <svg>; full-frame
 * pieces are AbsoluteFills. All timing args are LOCAL frames.
 */

/** Rough-edged ink filter; drop <InkDefs/> inside any <svg> that uses url(#ink-rough). */
export const InkDefs: React.FC<{ id?: string; scale?: number; freq?: number }> = ({ id = "ink-rough", scale = 7, freq = 0.035 }) => (
  <defs>
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={3} seed={7} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </defs>
);

/** Washi paper page: warm fibre noise + vignette. */
export const Washi: React.FC<{ tint?: string; opacity?: number }> = ({ tint = C.washi, opacity = 1 }) => (
  <AbsoluteFill style={{ background: tint, opacity }}>
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
      <filter id="washi-n">
        <feTurbulence type="fractalNoise" baseFrequency="0.9 0.06" numOctaves={2} seed={3} />
        <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0 0.12  0 0 0 0.22 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#washi-n)" />
    </svg>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(90,60,20,0.35))" }} />
  </AbsoluteFill>
);

/** Dark ink-wash night: the frontend's #030303 → #110505 with amber + crimson glows. */
export const InkNight: React.FC<{ glow?: number; sun?: boolean; sunX?: number; sunY?: number; sunR?: number }> = ({ glow = 1, sun = false, sunX = 960, sunY = 420, sunR = 300 }) => (
  <AbsoluteFill style={{ background: `linear-gradient(135deg, #050505 0%, ${C.bgWarm} 50%, #080303 100%)` }}>
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 18% 60%, rgba(217,119,6,${0.16 * glow}), transparent 38%), radial-gradient(circle at 85% 25%, rgba(198,40,40,${0.14 * glow}), transparent 36%)`,
      }}
    />
    <AbsoluteFill
      style={{
        opacity: 0.05,
        backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    />
    {sun ? (
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <InkDefs id="sun-rough" scale={10} freq={0.02} />
        <circle cx={sunX} cy={sunY} r={sunR} fill={C.crimson} opacity={0.9} filter="url(#sun-rough)" />
        <circle cx={sunX} cy={sunY} r={sunR * 1.25} fill="none" stroke={C.crimson} strokeWidth={3} opacity={0.25} />
      </svg>
    ) : null}
  </AbsoluteFill>
);

/**
 * A single sumi brush sweep (tapered, dry-brush streaks) drawn on from left to
 * right between `at` and `at + dur`. Placed in a parent svg.
 */
export const BrushStroke: React.FC<{ x: number; y: number; w: number; h: number; at: number; dur?: number; color?: string; rot?: number; opacity?: number; id?: string }> = ({
  x,
  y,
  w,
  h,
  at,
  dur = 8,
  color = INK,
  rot = 0,
  opacity = 1,
  id = "bs",
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  if (f < at) return null;
  const d = `M0 ${h * 0.55} C ${w * 0.08} ${h * 0.05}, ${w * 0.3} ${h * 0.02}, ${w * 0.55} ${h * 0.12} S ${w * 0.92} ${h * 0.2}, ${w} ${h * 0.42} C ${w * 0.9} ${h * 0.7}, ${w * 0.6} ${h * 0.95}, ${w * 0.3} ${h * 0.9} S ${w * 0.04} ${h * 0.85}, 0 ${h * 0.55} Z`;
  const streaks = Array.from({ length: 6 }, (_, i) => {
    const yy = h * (0.25 + i * 0.1);
    const x0 = w * (0.45 + random(`${id}s${i}`) * 0.2);
    return <path key={i} d={`M${x0} ${yy} Q ${w * 0.85} ${yy + 6} ${w * (0.95 + random(`${id}t${i}`) * 0.08)} ${yy + 18}`} stroke={color} strokeWidth={3 + random(`${id}w${i}`) * 5} fill="none" opacity={0.7} />;
  });
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={opacity}>
      <clipPath id={`${id}-clip`}>
        <rect x={-20} y={-h} width={(w + 60) * p} height={h * 3} />
      </clipPath>
      <g clipPath={`url(#${id}-clip)`} filter="url(#ink-rough)">
        <path d={d} fill={color} />
        {streaks}
      </g>
    </g>
  );
};

/**
 * Full-frame katana slash: a white-hot edge whips from (x1,y1) to (x2,y2) over
 * 4 frames at `at`, leaves a crimson gash + ink splatter that fades out.
 */
export const KatanaSlash: React.FC<{ at: number; x1?: number; y1?: number; x2?: number; y2?: number; color?: string; width?: number; seed?: string; hold?: number }> = ({
  at,
  x1 = -80,
  y1 = 900,
  x2 = 2000,
  y2 = 160,
  color = C.crimson,
  width = 26,
  seed = "slash",
  hold = 14,
}) => {
  const f = useCurrentFrame();
  if (f < at || f > at + hold + 14) return null;
  const draw = interpolate(f, [at, at + 4], [0, 1], clamp);
  const fade = interpolate(f, [at + hold, at + hold + 14], [1, 0], clamp);
  const thin = interpolate(f, [at + 3, at + hold], [1, 0.35], clamp);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const nx = -(y2 - y1) / len;
  const ny = (x2 - x1) / len;
  const drops = Array.from({ length: 26 }, (_, i) => {
    const t = random(`${seed}t${i}`);
    const side = random(`${seed}s${i}`) > 0.5 ? 1 : -1;
    const off = (20 + random(`${seed}o${i}`) * 120) * side;
    const r = 3 + random(`${seed}r${i}`) * 13;
    const fly = interpolate(f, [at + 2, at + 12], [0, 1], clamp);
    return (
      <circle
        key={i}
        cx={x1 + (x2 - x1) * t + nx * off * (0.4 + fly)}
        cy={y1 + (y2 - y1) * t + ny * off * (0.4 + fly)}
        r={r}
        fill={i % 3 === 0 ? color : INK}
        opacity={draw >= t ? 1 : 0}
      />
    );
  });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: fade }}>
      <svg width={1920} height={1080}>
        <InkDefs id={`${seed}-rough`} scale={9} />
        <g filter={`url(#${seed}-rough)`}>{drops}</g>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width * thin * 1.8} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} opacity={0.85} />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth={width * 0.45 * thin} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} style={{ filter: "drop-shadow(0 0 18px #fff) drop-shadow(0 0 40px rgba(255,220,180,0.9))" }} />
      </svg>
    </AbsoluteFill>
  );
};

/**
 * Splits its children along a line through (cx,cy) at `angle` deg once `at`
 * passes: the two halves slide apart along the normal (`gap` px) and tilt.
 */
export const SlashSplit: React.FC<{ at: number; w: number; h: number; cx?: number; cy?: number; angle?: number; gap?: number; children: React.ReactNode }> = ({
  at,
  w,
  h,
  cx = w / 2,
  cy = h / 2,
  angle = -24,
  gap = 70,
  children,
}) => {
  const f = useCurrentFrame();
  if (f < at) return <div style={{ position: "relative", width: w, height: h }}>{children}</div>;
  const p = interpolate(f, [at + 2, at + 14], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const a = (angle * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const L = w + h;
  const A = { x: cx - dx * L, y: cy - dy * L };
  const B = { x: cx + dx * L, y: cy + dy * L };
  const nx = -dy;
  const ny = dx;
  const poly = (s: number) => {
    const o = { x: nx * L * s, y: ny * L * s };
    return `polygon(${A.x}px ${A.y}px, ${B.x}px ${B.y}px, ${B.x + o.x}px ${B.y + o.y}px, ${A.x + o.x}px ${A.y + o.y}px)`;
  };
  const half = (s: number) => (
    <div
      style={{
        position: "absolute",
        inset: 0,
        clipPath: poly(s),
        transform: `translate(${nx * gap * p * s}px, ${ny * gap * p * s + 30 * p * (s > 0 ? 1 : 0)}px) rotate(${4 * p * s}deg)`,
        transformOrigin: `${cx}px ${cy}px`,
      }}
    >
      {children}
    </div>
  );
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      {half(-1)}
      {half(1)}
    </div>
  );
};

/**
 * Samurai silhouette (kasa hat, topknot, haori + hakama, red obi). `strike`
 * 0..1 swings the katana from a raised guard down through the cut.
 */
export const Samurai: React.FC<{ x: number; y: number; s?: number; strike?: number; flip?: boolean; ink?: string; accent?: string; blade?: string }> = ({
  x,
  y,
  s = 1,
  strike = 0,
  flip = false,
  ink = INK,
  accent = C.crimson,
  blade = "#e8edf2",
}) => {
  const arm = interpolate(strike, [0, 1], [-128, 22]);
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {/* back leg / hakama */}
      <path d="M-70 40 L-120 250 L-30 250 L0 90 L30 250 L120 250 L70 40 Z" fill={ink} />
      {/* haori body */}
      <path d="M-78 -70 Q-96 20 -80 60 L80 60 Q96 20 78 -70 Q40 -96 0 -96 Q-40 -96 -78 -70 Z" fill={ink} />
      <path d="M-78 30 L78 30 L80 52 L-80 52 Z" fill={accent} />
      {/* collar */}
      <path d="M-22 -92 L0 -40 L22 -92" stroke={C.washi} strokeWidth={6} fill="none" opacity={0.8} />
      {/* head */}
      <circle cx={0} cy={-122} r={30} fill={ink} />
      {/* kasa hat */}
      <path d="M-120 -128 L0 -196 L120 -128 Q0 -112 -120 -128 Z" fill={ink} />
      <path d="M-120 -128 Q0 -112 120 -128" stroke={accent} strokeWidth={5} fill="none" />
      {/* sword arm + katana */}
      <g transform={`translate(40 -64) rotate(${arm})`}>
        <path d="M0 -12 L96 -10 L100 12 L0 14 Z" fill={ink} />
        <rect x={92} y={-9} width={46} height={18} rx={4} fill={ink} stroke={accent} strokeWidth={3} />
        <ellipse cx={142} cy={0} rx={6} ry={18} fill={C.gold} stroke={ink} strokeWidth={3} />
        <path d="M146 -6 L400 -14 Q430 -10 438 0 L146 6 Z" fill={blade} stroke={ink} strokeWidth={3} />
        <path d="M150 -2 L420 -8" stroke="#fff" strokeWidth={2} opacity={0.8} />
      </g>
    </g>
  );
};

/** Red hanko seal stamp with a white Bangers word; pops in at `at` (local). */
export const Hanko: React.FC<{ x: number; y: number; text: string; at: number; size?: number; rot?: number; color?: string }> = ({ x, y, text, at, size = 150, rot = -8, color = C.crimson }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const p = interpolate(f, [at, at + 5], [1.9, 1], clamp);
  const o = interpolate(f, [at, at + 3], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size * 1.6,
        height: size,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${p})`,
        opacity: o,
        border: `${size * 0.07}px solid ${color}`,
        outline: `${size * 0.025}px solid ${color}`,
        outlineOffset: size * 0.04,
        borderRadius: size * 0.1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: F.comic,
        fontSize: size * 0.46,
        letterSpacing: "0.04em",
        color,
        background: "rgba(255,255,255,0.04)",
        mixBlendMode: "normal",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

/** Token coin with a ticker (in a parent svg). */
export const TokenCoin: React.FC<{ x: number; y: number; r?: number; label: string; fill?: string; text?: string; rot?: number }> = ({ x, y, r = 60, label, fill = C.amberHi, text = INK, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <circle r={r} fill={fill} stroke={INK} strokeWidth={Math.max(4, r * 0.1)} />
    <circle r={r * 0.78} fill="none" stroke={INK} strokeWidth={Math.max(2, r * 0.04)} opacity={0.5} />
    <text textAnchor="middle" dy={r * 0.2} fontFamily={F.comic} fontSize={r * (label.length > 4 ? 0.46 : 0.58)} fill={text}>
      {label}
    </text>
  </g>
);

/** Torii gate (in a parent svg), `w` wide. */
export const Torii: React.FC<{ x: number; y: number; w?: number; color?: string }> = ({ x, y, w = 200, color = C.crimson }) => {
  const h = w * 0.9;
  return (
    <g transform={`translate(${x - w / 2} ${y - h})`}>
      <path d={`M${-w * 0.08} ${h * 0.02} Q ${w / 2} ${h * 0.12} ${w * 1.08} ${h * 0.02} L ${w * 1.02} ${h * 0.14} Q ${w / 2} ${h * 0.22} ${-w * 0.02} ${h * 0.14} Z`} fill={INK} />
      <rect x={w * 0.02} y={h * 0.3} width={w * 0.96} height={h * 0.08} fill={color} stroke={INK} strokeWidth={4} />
      <rect x={w * 0.14} y={h * 0.12} width={w * 0.1} height={h * 0.88} fill={color} stroke={INK} strokeWidth={4} />
      <rect x={w * 0.76} y={h * 0.12} width={w * 0.1} height={h * 0.88} fill={color} stroke={INK} strokeWidth={4} />
      <rect x={w * 0.45} y={h * 0.16} width={w * 0.1} height={h * 0.14} fill={INK} />
    </g>
  );
};

/** Ensō brush circle drawn on with progress `p` 0..1 (in a parent svg). */
export const Enso: React.FC<{ x: number; y: number; r: number; p: number; color?: string; width?: number }> = ({ x, y, r, p, color = INK, width = 26 }) => {
  const len = 2 * Math.PI * r * 0.92;
  return (
    <g transform={`translate(${x} ${y}) rotate(-70)`} filter="url(#ink-rough)">
      <circle r={r} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={`${len * p} ${len * 2}`} />
      <circle r={r - width * 0.35} fill="none" stroke={color} strokeWidth={width * 0.3} strokeDasharray={`${len * p * 0.8} ${len * 2}`} opacity={0.5} />
    </g>
  );
};

/** Vertical kanji column in Mincho with an ink stroke. */
export const Kanji: React.FC<{ text: string; size: number; color?: string; vertical?: boolean; style?: React.CSSProperties }> = ({ text, size, color = INK, vertical = false, style }) => (
  <div
    style={{
      fontFamily: F.kanji,
      fontWeight: 800,
      fontSize: size,
      lineHeight: 1,
      color,
      writingMode: vertical ? "vertical-rl" : undefined,
      letterSpacing: vertical ? "0.05em" : "0.02em",
      ...style,
    }}
  >
    {text}
  </div>
);
