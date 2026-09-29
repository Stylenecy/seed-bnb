import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BNB_GOLD, clamp, FONTS, INK, PAPER } from "../../kit";
import { C } from "./theme";

/**
 * LanceHub comic props (SVG <g>, kit/comicArt conventions: designed around
 * (0,0), placed with x/y/s/rot, thick ink outline). All code-drawn.
 */
type Place = { x: number; y: number; s?: number; rot?: number; opacity?: number };
const T = ({ x, y, s = 1, rot = 0 }: Place) => `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot}) scale(${s})`;
const SW = 6;

/** The hub glyph: a ring with six spokes into a centre node (no text). */
export const HubGlyph: React.FC<{ r: number; color?: string; spin?: number; stroke?: number }> = ({ r, color = INK, spin = 0, stroke }) => {
  const w = stroke ?? r * 0.13;
  return (
    <g transform={`rotate(${spin})`}>
      <circle r={r * 0.78} fill="none" stroke={color} strokeWidth={w} />
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const c = Math.cos((a * Math.PI) / 180);
        const s = Math.sin((a * Math.PI) / 180);
        return (
          <g key={a}>
            <line x1={c * r * 0.26} y1={s * r * 0.26} x2={c * r * 0.78} y2={s * r * 0.78} stroke={color} strokeWidth={w * 0.8} strokeLinecap="round" />
            <circle cx={c * r * 0.78} cy={s * r * 0.78} r={w * 1.05} fill={color} />
          </g>
        );
      })}
      <circle r={r * 0.24} fill={color} />
    </g>
  );
};

/** $LANCE coin: clay face, ink rim, hub glyph (or a short label). */
export const LanceCoin: React.FC<Place & { r?: number; face?: string; label?: string; spin?: number; flip?: number }> = ({
  r = 60,
  face = C.clay,
  label,
  spin = 0,
  flip = 1,
  ...pl
}) => (
  <g transform={`${T(pl)} scale(${flip.toFixed(3)} 1)`} opacity={pl.opacity ?? 1}>
    <circle r={r} fill={face} stroke={INK} strokeWidth={Math.max(3, r * 0.1)} />
    <circle r={r * 0.8} fill="none" stroke={C.claySoft} strokeWidth={Math.max(1.5, r * 0.05)} opacity={0.8} />
    {label ? (
      <text y={r * 0.3} textAnchor="middle" fontFamily={FONTS.comic} fontSize={r * 0.82} fill={INK}>
        {label}
      </text>
    ) : (
      <g transform={`scale(0.72)`}>
        <HubGlyph r={r} color={INK} spin={spin} />
      </g>
    )}
  </g>
);

/** A comic "app island": rounded tile with a simple icon (laptop / ball / hub). */
export const AppTile: React.FC<Place & { kind: "work" | "play"; fill?: string; label?: string }> = ({ kind, fill, label, ...pl }) => {
  const bg = fill ?? (kind === "work" ? C.clay : C.neon);
  return (
    <g transform={T(pl)} opacity={pl.opacity ?? 1}>
      <rect x={-90} y={-90} width={180} height={180} rx={36} fill={bg} stroke={INK} strokeWidth={SW} />
      {kind === "work" ? (
        <g>
          <rect x={-52} y={-44} width={104} height={66} rx={8} fill="#1b1614" stroke={INK} strokeWidth={5} />
          <text x={-40} y={-12} fontFamily={FONTS.mono} fontSize={22} fill={C.claySoft}>
            {">_"}
          </text>
          <path d="M-66 24 H66 L58 40 H-58 Z" fill="#3a3430" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        </g>
      ) : (
        <g>
          <circle r={50} fill={PAPER} stroke={INK} strokeWidth={5} />
          <circle r={30} fill="#fff" stroke={INK} strokeWidth={3} />
          <text y={12} textAnchor="middle" fontFamily={FONTS.comic} fontSize={36} fill={INK}>
            B7
          </text>
        </g>
      )}
      {label ? (
        <g>
          <rect x={-86} y={104} width={172} height={42} rx={8} fill={PAPER} stroke={INK} strokeWidth={4} />
          <text x={0} y={135} textAnchor="middle" fontFamily={FONTS.comic} fontSize={28} fill={INK}>
            {label}
          </text>
        </g>
      ) : null}
    </g>
  );
};

/** The shared pool: a glass tank with a liquid level (0..1) and bubbles. */
export const PoolTank: React.FC<Place & { level?: number; liquid?: string; label?: string; t?: number; w?: number; h?: number }> = ({
  level = 0.5,
  liquid = BNB_GOLD,
  label,
  t = 0,
  w = 240,
  h = 260,
  ...pl
}) => {
  const top = h / 2 - h * level;
  const wave = Math.sin(t / 6) * 6;
  return (
    <g transform={T(pl)} opacity={pl.opacity ?? 1}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill="rgba(255,255,255,0.08)" stroke={INK} strokeWidth={SW} />
      <clipPath id={`tank-${w}-${h}`}>
        <rect x={-w / 2 + 6} y={-h / 2 + 6} width={w - 12} height={h - 12} rx={20} />
      </clipPath>
      <g clipPath={`url(#tank-${w}-${h})`}>
        <path d={`M${-w / 2} ${top} Q${-w / 4} ${top - wave} 0 ${top} T${w / 2} ${top} V${h / 2} H${-w / 2} Z`} fill={liquid} />
        {[0, 1, 2, 3].map((i) => {
          const y = h / 2 - (((t * 1.6 + i * 50) % (h * level + 1)) || 0);
          return <circle key={i} cx={-w / 3 + i * (w / 4.5)} cy={y} r={6 + (i % 2) * 3} fill="#fff" opacity={0.45} />;
        })}
      </g>
      <path d={`M${-w / 2 + 22} ${-h / 2 + 30} v${h * 0.5}`} stroke="#fff" strokeOpacity={0.35} strokeWidth={8} strokeLinecap="round" />
      {label ? (
        <g>
          <rect x={-w / 2 + 10} y={-h / 2 - 50} width={w - 20} height={40} rx={8} fill={PAPER} stroke={INK} strokeWidth={4} />
          <text x={0} y={-h / 2 - 21} textAnchor="middle" fontFamily={FONTS.comic} fontSize={28} fill={INK}>
            {label}
          </text>
        </g>
      ) : null}
    </g>
  );
};

/** HTML hub mark (for logo lockups): clay disc + ink ring + spinning hub glyph. */
export const HubMark: React.FC<{ size: number; spin?: number; glow?: string }> = ({ size, spin = 0, glow = "rgba(228,116,68,0.45)" }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 999,
      background: `radial-gradient(circle at 35% 30%, ${C.clayLight}, ${C.clay} 55%, #b5532c)`,
      boxShadow: `0 0 0 ${size * 0.035}px ${INK}, ${size * 0.05}px ${size * 0.05}px 0 ${size * 0.035}px ${INK}, 0 0 ${size * 0.45}px ${glow}`,
    }}
  >
    <svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}>
      <HubGlyph r={size * 0.36} color={INK} spin={spin} />
    </svg>
  </div>
);

/** A coin that flies along a straight path between local frames [at, at+dur]. */
export const FlyCoin: React.FC<{ at: number; dur?: number; x1: number; y1: number; x2: number; y2: number; r?: number; face?: string; label?: string; arc?: number }> = ({
  at,
  dur = 14,
  x1,
  y1,
  x2,
  y2,
  r = 26,
  face = C.clay,
  label,
  arc = -80,
}) => {
  const f = useCurrentFrame();
  if (f < at || f > at + dur + 6) return null;
  const p = interpolate(f, [at, at + dur], [0, 1], clamp);
  const x = x1 + (x2 - x1) * p;
  const y = y1 + (y2 - y1) * p + arc * Math.sin(Math.PI * p);
  const op = interpolate(f, [at + dur, at + dur + 6], [1, 0], clamp);
  return <LanceCoin x={x} y={y} r={r} face={face} label={label} opacity={op} flip={Math.cos(p * Math.PI * 3)} />;
};

/** Spring pop helper for HTML elements (scale 0.4 → 1). */
export const usePop = (at: number) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = f < at ? 0 : spring({ frame: f - at, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
  return { p, style: { transform: `scale(${0.4 + 0.6 * p})`, opacity: interpolate(p, [0, 0.25], [0, 1], clamp) } as React.CSSProperties };
};
