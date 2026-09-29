import React from "react";
import { INK, PAPER } from "../../kit";
import { C } from "./theme";

/**
 * Code-drawn comic props for DRIFT (SVG <g>, positioned in the parent svg).
 */

/** Candlestick run; `p` 0..1 reveals candles left→right. `crash` bends it down. */
export const Candles: React.FC<{ x: number; y: number; w: number; h: number; p: number; crash?: boolean; n?: number }> = ({ x, y, w, h, p, crash = true, n = 14 }) => {
  const shown = Math.floor(p * n + 0.001);
  const cw = w / n;
  // deterministic path: up-drift then a cliff
  const mids = Array.from({ length: n }, (_, i) => {
    const up = h * 0.62 - i * (h * 0.028) + (i % 3 === 1 ? 10 : -6);
    if (!crash || i < n * 0.55) return up;
    const d = i - n * 0.55;
    return up + d * d * (h * 0.028);
  });
  return (
    <g transform={`translate(${x - w / 2}, ${y - h / 2})`}>
      <line x1={0} y1={h} x2={w} y2={h} stroke={INK} strokeWidth={5} />
      {mids.slice(0, shown).map((m, i) => {
        const prev = i > 0 ? mids[i - 1]! : m + 12;
        const down = m > prev;
        const col = down ? C.red : C.green;
        const top = Math.min(prev, m);
        const bh = Math.max(12, Math.abs(m - prev));
        return (
          <g key={i}>
            <line x1={i * cw + cw / 2} y1={top - 16} x2={i * cw + cw / 2} y2={top + bh + 16} stroke={INK} strokeWidth={4} />
            <rect x={i * cw + cw * 0.18} y={top} width={cw * 0.64} height={bh} fill={col} stroke={INK} strokeWidth={4} rx={2} />
          </g>
        );
      })}
    </g>
  );
};

/** MacroGuard shield with a keyhole; `lock` 0..1 closes the shackle. */
export const Shield: React.FC<{ x: number; y: number; s?: number; fill?: string; rot?: number }> = ({ x, y, s = 1, fill = C.peri, rot = 0 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M0 -110 L92 -76 Q96 30 0 110 Q-96 30 -92 -76 Z" fill={fill} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
    <path d="M0 -84 L66 -58 Q68 20 0 82 Z" fill="#ffffff" opacity={0.28} />
    <circle cx={0} cy={-8} r={20} fill={INK} />
    <path d="M-10 4 L10 4 L16 48 L-16 48 Z" fill={INK} />
  </g>
);

/** Storm cloud with a lightning bolt — the macro "risk-off" weather. */
export const Storm: React.FC<{ x: number; y: number; s?: number; bolt?: boolean }> = ({ x, y, s = 1, bolt = true }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    {bolt ? <path d="M-6 30 L-34 96 L-6 90 L-24 150 L34 70 L6 76 L22 30 Z" fill={C.amber} stroke={INK} strokeWidth={6} strokeLinejoin="round" /> : null}
    <path
      d="M-110 30 Q-140 30 -140 0 Q-140 -34 -104 -36 Q-96 -80 -48 -76 Q-24 -112 22 -96 Q64 -114 84 -70 Q134 -74 136 -26 Q150 30 104 30 Z"
      fill="#5b5f73"
      stroke={INK}
      strokeWidth={8}
      strokeLinejoin="round"
    />
    <path d="M-80 -30 Q-60 -52 -30 -44" stroke="#8a8fa6" strokeWidth={8} fill="none" strokeLinecap="round" />
  </g>
);

/** Equity curve that falls to a drawdown floor; `p` reveals it. */
export const EquityDrop: React.FC<{ x: number; y: number; w: number; h: number; p: number }> = ({ x, y, w, h, p }) => {
  const pts = Array.from({ length: 40 }, (_, i) => {
    const t = i / 39;
    const v = t < 0.35 ? 0.2 - 0.12 * Math.sin(t * 9) * 0.3 : 0.2 + Math.pow((t - 0.35) / 0.65, 1.4) * 0.72;
    return [t * w, v * h] as const;
  });
  const n = Math.max(2, Math.round(p * pts.length));
  const d = pts.slice(0, n).map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");
  return (
    <g transform={`translate(${x - w / 2}, ${y - h / 2})`}>
      <line x1={0} y1={h * 0.2} x2={w} y2={h * 0.2} stroke={INK} strokeWidth={3} strokeDasharray="10 10" opacity={0.5} />
      <path d={d} stroke={INK} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={C.red} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

/** Simple chain link pair (on-chain). */
export const ChainLinks: React.FC<{ x: number; y: number; s?: number; color?: string }> = ({ x, y, s = 1, color = C.gold }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <rect x={-70} y={-24} width={80} height={48} rx={24} fill="none" stroke={INK} strokeWidth={20} />
    <rect x={-70} y={-24} width={80} height={48} rx={24} fill="none" stroke={color} strokeWidth={10} />
    <rect x={-10} y={-24} width={80} height={48} rx={24} fill="none" stroke={INK} strokeWidth={20} />
    <rect x={-10} y={-24} width={80} height={48} rx={24} fill="none" stroke={color} strokeWidth={10} />
  </g>
);

/** Snake (the Python engine) — a friendly coil with a gear eye. */
export const Snake: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <path d="M-90 60 Q-90 0 -30 0 Q30 0 30 -50 Q30 -100 80 -100" stroke={INK} strokeWidth={46} fill="none" strokeLinecap="round" />
    <path d="M-90 60 Q-90 0 -30 0 Q30 0 30 -50 Q30 -100 80 -100" stroke="#3b82c4" strokeWidth={32} fill="none" strokeLinecap="round" />
    <path d="M-90 60 Q-90 0 -30 0" stroke={C.amber} strokeWidth={32} fill="none" strokeLinecap="round" />
    <ellipse cx={96} cy={-104} rx={40} ry={30} fill="#3b82c4" stroke={INK} strokeWidth={7} />
    <circle cx={106} cy={-114} r={9} fill={PAPER} stroke={INK} strokeWidth={4} />
    <circle cx={108} cy={-114} r={4} fill={INK} />
    <path d="M134 -98 l18 4 m-18 -4 l14 -10" stroke={C.red} strokeWidth={5} strokeLinecap="round" />
  </g>
);
