import React from "react";
import { INK, PAPER } from "../../kit";
import { C, F } from "./theme";

/**
 * Code-drawn comic props for NEURAL ALPHA (SVG <g>, positioned in the parent svg).
 */

/** Deterministic candle series (o/c in 0..1 space). */
const SERIES = [0.42, 0.48, 0.45, 0.55, 0.52, 0.6, 0.57, 0.66, 0.62, 0.7, 0.64, 0.5, 0.36, 0.22];

/**
 * Candlestick chart. `shown` = how many candles are drawn; candles past index
 * `crashFrom` go red and fall hard (the "rekt" beat).
 */
export const Candles: React.FC<{ x: number; y: number; w: number; h: number; shown: number; crashFrom?: number; s?: number }> = ({ x, y, w, h, shown, crashFrom = 99, s = 1 }) => {
  const n = SERIES.length;
  const cw = w / n;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-12} y={-12} width={w + 24} height={h + 24} rx={12} fill={C.void} stroke={INK} strokeWidth={7} />
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={0} x2={w} y1={h * g} y2={h * g} stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
      ))}
      {SERIES.slice(0, Math.min(n, Math.floor(shown))).map((v, i) => {
        const prev = i === 0 ? v - 0.04 : SERIES[i - 1]!;
        const up = v >= prev && i < crashFrom;
        const top = h * (1 - Math.max(v, prev));
        const bot = h * (1 - Math.min(v, prev));
        const col = up ? C.neon : C.danger;
        const cx = i * cw + cw / 2;
        return (
          <g key={i}>
            <line x1={cx} x2={cx} y1={top - 12} y2={bot + 12} stroke={col} strokeWidth={4} />
            <rect x={cx - cw * 0.32} y={top} width={cw * 0.64} height={Math.max(6, bot - top)} fill={col} stroke={INK} strokeWidth={3} rx={2} />
          </g>
        );
      })}
    </g>
  );
};

/** A token coin with a symbol, and an optional bad-address tag hanging off it. */
export const TokenCoin: React.FC<{ x: number; y: number; s?: number; sym: string; fill?: string; bad?: boolean; rot?: number }> = ({ x, y, s = 1, sym, fill = C.gold, bad = false, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <ellipse cx={0} cy={10} rx={78} ry={78} fill={INK} />
    <circle cx={0} cy={0} r={78} fill={fill} stroke={INK} strokeWidth={9} />
    <circle cx={0} cy={0} r={56} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={6} />
    <text x={0} y={14} textAnchor="middle" fontFamily={F.comic} fontSize={sym.length > 4 ? 36 : 46} fill={INK}>
      {sym}
    </text>
    {bad ? (
      <g transform="translate(40 96) rotate(8)">
        <rect x={-120} y={-30} width={240} height={60} rx={8} fill={PAPER} stroke={INK} strokeWidth={6} />
        <text x={0} y={11} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={26} fill={C.danger}>
          0x…??? no code
        </text>
      </g>
    ) : null}
  </g>
);

/** Data-feed antenna broadcasting rings (INGEST step). `p` 0..1 animates the rings. */
export const Antenna: React.FC<{ x: number; y: number; s?: number; p: number }> = ({ x, y, s = 1, p }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[0, 1, 2].map((i) => {
      const r = 40 + ((p * 3 + i) % 3) * 38;
      return <circle key={i} cx={0} cy={-110} r={r} fill="none" stroke={C.cyan} strokeWidth={8} opacity={1 - r / 160} />;
    })}
    <path d="M-60 90 L0 -100 L60 90 Z" fill="none" stroke={INK} strokeWidth={12} strokeLinejoin="round" />
    <path d="M-60 90 L0 -100 L60 90 Z" fill="none" stroke={PAPER} strokeWidth={5} strokeLinejoin="round" />
    <line x1={-38} y1={20} x2={38} y2={20} stroke={INK} strokeWidth={10} />
    <circle cx={0} cy={-110} r={20} fill={C.neon} stroke={INK} strokeWidth={7} />
  </g>
);

/** Score gauge with a needle; `v` in -1..1 (sell ↔ buy). */
export const Gauge: React.FC<{ x: number; y: number; s?: number; v: number; label?: string }> = ({ x, y, s = 1, v, label }) => {
  const a = (-90 + v * 80) * (Math.PI / 180);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-130 0 A130 130 0 0 1 130 0 Z" fill={PAPER} stroke={INK} strokeWidth={9} />
      <path d="M-110 0 A110 110 0 0 1 -38 -103" fill="none" stroke={C.danger} strokeWidth={22} />
      <path d="M-38 -103 A110 110 0 0 1 38 -103" fill="none" stroke="#c8ccd3" strokeWidth={22} />
      <path d="M38 -103 A110 110 0 0 1 110 0" fill="none" stroke={C.neon} strokeWidth={22} />
      <line x1={0} y1={0} x2={Math.cos(a) * 100} y2={Math.sin(a) * 100} stroke={INK} strokeWidth={10} strokeLinecap="round" />
      <circle r={16} fill={INK} />
      {label ? (
        <text x={0} y={52} textAnchor="middle" fontFamily={F.comic} fontSize={40} fill={INK}>
          {label}
        </text>
      ) : null}
    </g>
  );
};

/** Shield with a check (RISK GATE). `lit` 0..1 fills it neon. */
export const Shield: React.FC<{ x: number; y: number; s?: number; lit: number }> = ({ x, y, s = 1, lit }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 -120 L100 -80 L92 20 Q70 100 0 130 Q-70 100 -92 20 L-100 -80 Z" fill={INK} transform="translate(10 10)" />
    <path d="M0 -120 L100 -80 L92 20 Q70 100 0 130 Q-70 100 -92 20 L-100 -80 Z" fill={lit > 0.5 ? C.neon : "#2a3036"} stroke={INK} strokeWidth={9} />
    <path d="M-44 0 L-10 36 L50 -34" fill="none" stroke={lit > 0.5 ? INK : "#5a636b"} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" opacity={0.4 + 0.6 * lit} />
  </g>
);

/** Toggle switch (EXECUTE step): `on` state, label to the right. */
export const Toggle: React.FC<{ x: number; y: number; on: boolean; label: string; color: string; s?: number }> = ({ x, y, on, label, color, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={0} y={-30} width={110} height={60} rx={30} fill={on ? color : "#3a4047"} stroke={INK} strokeWidth={7} />
    <circle cx={on ? 80 : 30} cy={0} r={22} fill={PAPER} stroke={INK} strokeWidth={6} />
    <text x={130} y={14} fontFamily={F.comic} fontSize={44} fill={INK}>
      {label}
    </text>
  </g>
);

/** Sleeping "Z"s drifting up from (x, y); `t` = local frame for drift. */
export const Zzz: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => (
  <g>
    {[0, 1, 2].map((i) => {
      const k = ((t / 20 + i / 3) % 1 + 1) % 1;
      return (
        <text key={i} x={x + i * 26 + k * 30} y={y - k * 120} fontFamily={F.comic} fontSize={40 + i * 14} fill={PAPER} stroke={INK} strokeWidth={4} paintOrder="stroke" opacity={1 - k}>
          Z
        </text>
      );
    })}
  </g>
);
