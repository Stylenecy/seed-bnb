import React from "react";
import { INK, PAPER } from "../../kit";
import { C, F } from "./theme";

/**
 * Project-local comic props (SVG <g>, ~200px box around 0,0 like kit/comicArt):
 * Shield, CrashChart, Zzz, ChainLinks, Coin stack. Flat fill + ink outline.
 */
type Place = { x: number; y: number; s?: number; rot?: number; opacity?: number };
const T = ({ x, y, s = 1, rot = 0 }: Place) => `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot}) scale(${s})`;

export const Shield: React.FC<Place & { fill?: string; mark?: string; label?: string }> = ({ fill = C.lime, mark = INK, label, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <path d="M0 -96 L78 -66 Q80 30 0 96 Q-80 30 -78 -66 Z" fill={fill} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M-50 -52 Q-52 12 -20 52" stroke="#fff" strokeOpacity={0.45} strokeWidth={9} fill="none" strokeLinecap="round" />
    <path d="M-30 0 L-6 26 L36 -26" stroke={mark} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {label ? (
      <text x={0} y={140} textAnchor="middle" fontFamily={F.comic} fontSize={34} fill={PAPER} stroke={INK} strokeWidth={6} paintOrder="stroke">
        {label}
      </text>
    ) : null}
  </g>
);

/** A candle-ish price line that falls; `p` 0..1 draws it on. */
export const CrashChart: React.FC<Place & { p?: number; w?: number; h?: number; color?: string }> = ({ p = 1, w = 360, h = 220, color = C.rose, ...pl }) => {
  const pts: [number, number][] = [
    [0, 0.2], [0.12, 0.28], [0.22, 0.14], [0.34, 0.24], [0.44, 0.18], [0.54, 0.3], [0.62, 0.52], [0.72, 0.46], [0.82, 0.78], [0.9, 0.7], [1, 0.95],
  ];
  const d = pts.map(([a, b], i) => `${i === 0 ? "M" : "L"}${(a * w - w / 2).toFixed(1)} ${(b * h - h / 2).toFixed(1)}`).join(" ");
  const len = w * 1.9;
  return (
    <g transform={T(pl)} opacity={pl.opacity ?? 1}>
      <rect x={-w / 2 - 24} y={-h / 2 - 24} width={w + 48} height={h + 48} rx={14} fill="#15161a" stroke={INK} strokeWidth={7} />
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={-w / 2} x2={w / 2} y1={g * h - h / 2} y2={g * h - h / 2} stroke="#fff" strokeOpacity={0.08} strokeWidth={2} />
      ))}
      <path d={d} fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
      <path d={d} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
    </g>
  );
};

export const Zzz: React.FC<Place & { t?: number }> = ({ t = 0, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    {[0, 1, 2].map((i) => (
      <text
        key={i}
        x={i * 34}
        y={-i * 40 - ((t * 0.6 + i * 8) % 24)}
        fontFamily={F.comic}
        fontSize={44 + i * 14}
        fill={PAPER}
        stroke={INK}
        strokeWidth={6}
        paintOrder="stroke"
      >
        Z
      </text>
    ))}
  </g>
);

/** Hash-chain links; `n` links shown (0..count). */
export const ChainLinks: React.FC<Place & { n?: number; count?: number; color?: string }> = ({ n = 3, count = 3, color = C.violetSoft, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    {Array.from({ length: count }).map((_, i) =>
      i < n ? (
        <g key={i} transform={`translate(${(i - (count - 1) / 2) * 76} 0) rotate(${i % 2 ? 90 : 0})`}>
          <rect x={-48} y={-26} width={96} height={52} rx={26} fill="none" stroke={INK} strokeWidth={22} />
          <rect x={-48} y={-26} width={96} height={52} rx={26} fill="none" stroke={color} strokeWidth={11} />
        </g>
      ) : null,
    )}
  </g>
);

/** A small stack of USDT-ish coins (green) with a label. */
export const CoinStack: React.FC<Place & { n?: number; label?: string; fill?: string }> = ({ n = 4, label, fill = "#26A17B", ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    {Array.from({ length: n }).map((_, i) => (
      <g key={i} transform={`translate(0 ${-i * 18})`}>
        <ellipse cx={0} cy={8} rx={54} ry={18} fill={INK} />
        <ellipse cx={0} cy={0} rx={54} ry={18} fill={fill} stroke={INK} strokeWidth={5} />
      </g>
    ))}
    <text x={0} y={-(n - 1) * 18 + 8} textAnchor="middle" fontFamily={F.comic} fontSize={24} fill="#fff">
      ₮
    </text>
    {label ? (
      <text x={0} y={62} textAnchor="middle" fontFamily={F.comic} fontSize={30} fill={PAPER} stroke={INK} strokeWidth={6} paintOrder="stroke">
        {label}
      </text>
    ) : null}
  </g>
);
