import React from "react";
import { FONTS, INK, PAPER } from "../../kit";
import { C } from "./theme";

/**
 * Stax-specific comic props (SVG <g>, same conventions as kit/comicArt:
 * designed around (0,0), placed with x/y/s/rot, thick ink outline).
 */
type Place = { x: number; y: number; s?: number; rot?: number; opacity?: number };
const T = ({ x, y, s = 1, rot = 0 }: Place) => `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot}) scale(${s})`;
const SW = 6;

/** A stock ticker card: symbol + a little rising line. */
export const StockTile: React.FC<Place & { sym: string; fill?: string; up?: boolean; draw?: number }> = ({
  sym,
  fill = C.sage,
  up = true,
  draw = 1,
  ...pl
}) => {
  const pts = up ? "-58,34 -30,18 -8,26 18,2 58,-18" : "-58,-18 -30,6 -8,-4 18,22 58,30";
  return (
    <g transform={T(pl)} opacity={pl.opacity ?? 1}>
      <rect x={-86} y={-80} width={172} height={160} rx={18} fill={PAPER} stroke={INK} strokeWidth={SW} />
      <rect x={-86} y={-80} width={172} height={52} rx={18} fill={fill} stroke={INK} strokeWidth={SW} />
      <text x={0} y={-40} textAnchor="middle" fontFamily={FONTS.comic} fontSize={40} fill={INK}>
        {sym}
      </text>
      <polyline
        points={pts}
        transform="translate(0 28)"
        fill="none"
        stroke={up ? C.sageDeep : C.neg}
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
      />
    </g>
  );
};

/** A plan sheet with allocation bars + a signature squiggle (EIP-712). */
export const PlanSheet: React.FC<Place & { weights?: number[]; signed?: number }> = ({ weights = [50, 40, 10], signed = 0, ...pl }) => {
  const cols = [C.sage, C.terracotta, "#9fb4ff"];
  const labels = ["AAPL", "TSLA", "NVDA"];
  return (
    <g transform={T(pl)} opacity={pl.opacity ?? 1}>
      <rect x={-100} y={-120} width={200} height={240} rx={12} fill={PAPER} stroke={INK} strokeWidth={SW} />
      {weights.map((w, i) => (
        <g key={i} transform={`translate(-78 ${-86 + i * 50})`}>
          <text x={0} y={0} fontFamily={FONTS.comic} fontSize={24} fill={INK}>
            {labels[i]}
          </text>
          <rect x={64} y={-20} width={w * 1.9} height={22} rx={5} fill={cols[i]} stroke={INK} strokeWidth={4} />
        </g>
      ))}
      <path
        d="M-70 86 q16 -30 30 0 t30 0 t30 -6 t36 4"
        fill="none"
        stroke={C.sageDeep}
        strokeWidth={6}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - signed}
      />
      <line x1={-78} y1={100} x2={78} y2={100} stroke={INK} strokeWidth={3} />
    </g>
  );
};

/** On-chain risk gate: shield with a gauge needle (0..1) and a ceiling tick. */
export const RiskShield: React.FC<Place & { needle?: number; ceiling?: number; ok?: boolean }> = ({
  needle = 0.4,
  ceiling = 0.7,
  ok = true,
  ...pl
}) => {
  const ang = (v: number) => Math.PI * (1 - v);
  const nx = Math.cos(ang(needle)) * 62;
  const ny = -Math.sin(ang(needle)) * 62;
  const cx = Math.cos(ang(ceiling));
  const cy = -Math.sin(ang(ceiling));
  return (
    <g transform={T(pl)} opacity={pl.opacity ?? 1}>
      <path d="M0 -130 L110 -92 Q112 40 0 130 Q-112 40 -110 -92 Z" fill={ok ? C.sageSoft : "#3a1f18"} stroke={INK} strokeWidth={SW} />
      <path d="M0 -112 L92 -80 Q92 30 0 108" fill="none" stroke="#fff" strokeOpacity={0.18} strokeWidth={8} />
      <g transform="translate(0 10)">
        <path d="M-72 0 A72 72 0 0 1 72 0" fill="none" stroke={PAPER} strokeWidth={14} />
        <path d={`M${(cx * 72).toFixed(1)} ${(cy * 72).toFixed(1)} A72 72 0 0 1 72 0`} fill="none" stroke={C.neg} strokeWidth={14} />
        <line x1={cx * 56} y1={cy * 56} x2={cx * 92} y2={cy * 92} stroke={INK} strokeWidth={6} />
        <line x1={0} y1={0} x2={nx} y2={ny} stroke={INK} strokeWidth={8} strokeLinecap="round" />
        <circle r={12} fill={ok ? C.sage : C.neg} stroke={INK} strokeWidth={4} />
      </g>
      <text x={0} y={80} textAnchor="middle" fontFamily={FONTS.comic} fontSize={30} fill={PAPER}>
        {ok ? "RISK OK" : "TOO RISKY"}
      </text>
    </g>
  );
};

/** PancakeSwap-style pancake stack (the DEX), drawn as a generic stack. */
export const Pancakes: React.FC<Place> = (pl) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    {[40, 12, -16].map((y, i) => (
      <g key={i}>
        <ellipse cx={0} cy={y + 10} rx={88} ry={26} fill="#b87333" stroke={INK} strokeWidth={SW} />
        <ellipse cx={0} cy={y} rx={88} ry={26} fill="#E0A458" stroke={INK} strokeWidth={SW} />
      </g>
    ))}
    <path d="M-30 -30 q30 -20 60 0 q-10 18 -30 16 q-20 2 -30 -16z" fill="#F8D33A" stroke={INK} strokeWidth={4} />
  </g>
);

/** Question-mark cloud around a head (confusion). */
export const QMark: React.FC<Place & { fill?: string; text?: string }> = ({ fill = C.terracotta, text = "?", ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <text x={0} y={0} textAnchor="middle" fontFamily={FONTS.comic} fontSize={90} fill={fill} stroke={INK} strokeWidth={8} paintOrder="stroke">
      {text}
    </text>
  </g>
);
