import React from "react";
import { INK, PAPER } from "../../kit";
import { C, F } from "./theme";

/**
 * Code-drawn comic props for TESSERA (SVG <g>, positioned in the parent svg).
 */

/** Magnifying glass; `tilt` rotates it, the lens tints signal-cyan. */
export const Magnifier: React.FC<{ x: number; y: number; s?: number; rot?: number; lens?: string }> = ({ x, y, s = 1, rot = -30, lens = C.signal }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-16} y={70} width={32} height={120} rx={14} fill={C.ember} stroke={INK} strokeWidth={9} />
    <circle cx={0} cy={0} r={82} fill={lens} fillOpacity={0.35} stroke={INK} strokeWidth={26} />
    <circle cx={0} cy={0} r={82} fill="none" stroke={PAPER} strokeWidth={10} />
    <path d="M-44 -30 Q-36 -52 -12 -58" stroke="#ffffff" strokeWidth={12} fill="none" strokeLinecap="round" opacity={0.8} />
  </g>
);

/** Address slip: a paper tag with a (shortened, real) address. */
export const AddressTag: React.FC<{ x: number; y: number; s?: number; rot?: number; text: string }> = ({ x, y, s = 1, rot = -6, text }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-150} y={-38} width={300} height={76} rx={10} fill={PAPER} stroke={INK} strokeWidth={7} />
    <circle cx={-120} cy={0} r={10} fill={INK} />
    <text x={14} y={13} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={34} fill={INK}>
      {text}
    </text>
  </g>
);

/** Stack of browser tabs / explorer windows (the manual way). `n` windows. */
export const TabStack: React.FC<{ x: number; y: number; n: number; s?: number; labels: string[] }> = ({ x, y, n, s = 1, labels }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {Array.from({ length: n }, (_, i) => {
      const dx = (i % 4) * 26 - 40 + i * 6;
      const dy = i * 22 - 90;
      const rot = ((i * 37) % 11) - 5;
      return (
        <g key={i} transform={`translate(${dx} ${dy}) rotate(${rot})`}>
          <rect x={-120} y={-70} width={240} height={150} rx={10} fill={i % 2 ? "#dfe8ea" : PAPER} stroke={INK} strokeWidth={6} />
          <rect x={-120} y={-70} width={240} height={30} rx={8} fill={[C.gold, C.signal, C.ember, C.boneDim][i % 4]} stroke={INK} strokeWidth={6} />
          <text x={-104} y={-47} fontFamily={F.mono} fontWeight={700} fontSize={18} fill={INK}>
            {labels[i % labels.length]}
          </text>
          <rect x={-100} y={-20} width={150} height={12} rx={6} fill={INK} opacity={0.25} />
          <rect x={-100} y={4} width={190} height={12} rx={6} fill={INK} opacity={0.18} />
          <rect x={-100} y={28} width={110} height={12} rx={6} fill={INK} opacity={0.18} />
        </g>
      );
    })}
  </g>
);

/** Hub + spokes: one address fanning out to `nodes` chain nodes; `p` 0..1 draws spokes; `hot` indices glow gold. */
export const FanOut: React.FC<{ x: number; y: number; r: number; p: number; labels: string[]; hot?: number[]; s?: number }> = ({ x, y, r, p, labels, hot = [], s = 1 }) => {
  const n = labels.length;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {labels.map((lab, i) => {
        const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
        const q = Math.max(0, Math.min(1, p * n - i * 0.6));
        const ex = Math.cos(a) * r * q;
        const ey = Math.sin(a) * r * q;
        const isHot = hot.includes(i);
        return (
          <g key={i}>
            <line x1={0} y1={0} x2={ex} y2={ey} stroke={INK} strokeWidth={10} strokeLinecap="round" />
            <line x1={0} y1={0} x2={ex} y2={ey} stroke={isHot ? C.gold : C.signal} strokeWidth={4} strokeLinecap="round" />
            {q >= 1 ? (
              <g transform={`translate(${ex} ${ey})`}>
                <circle r={isHot ? 30 : 24} fill={isHot ? C.gold : "#dff7f5"} stroke={INK} strokeWidth={6} />
                <text y={isHot ? 8 : 7} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={isHot ? 20 : 17} fill={INK}>
                  {lab}
                </text>
              </g>
            ) : null}
          </g>
        );
      })}
      <circle r={40} fill={C.ember} stroke={INK} strokeWidth={8} />
      <text y={10} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={28} fill={INK}>
        0x
      </text>
    </g>
  );
};

/** Two stamps — EOA / CONTRACT — the classification step. */
export const TypeStamps: React.FC<{ x: number; y: number; which: "none" | "eoa" | "both" }> = ({ x, y, which }) => (
  <g transform={`translate(${x} ${y})`}>
    <g transform="translate(-10 -80) rotate(-8)" opacity={which === "none" ? 0.25 : 1}>
      <rect x={-110} y={-36} width={220} height={72} rx={8} fill={PAPER} stroke={C.signalDeep} strokeWidth={8} />
      <text x={0} y={16} textAnchor="middle" fontFamily={F.comic} fontSize={48} fill={C.signalDeep}>
        EOA
      </text>
    </g>
    <g transform="translate(20 20) rotate(6)" opacity={which === "both" ? 1 : 0.25}>
      <rect x={-140} y={-36} width={280} height={72} rx={8} fill={PAPER} stroke={C.ember} strokeWidth={8} />
      <text x={0} y={16} textAnchor="middle" fontFamily={F.comic} fontSize={48} fill={C.emberDeep}>
        CONTRACT
      </text>
    </g>
  </g>
);

/** Stacked stablecoin coins with a "18dp" tag. */
export const CoinStack: React.FC<{ x: number; y: number; s?: number; n?: number; labels?: string[] }> = ({ x, y, s = 1, n = 3, labels = ["USDT", "USDC", "FDUSD"] }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {Array.from({ length: n }, (_, i) => (
      <g key={i} transform={`translate(${i * 12 - 12} ${-i * 34})`}>
        <ellipse cx={0} cy={14} rx={70} ry={22} fill={C.emberDeep} stroke={INK} strokeWidth={6} />
        <rect x={-70} y={-6} width={140} height={20} fill={C.gold} stroke="none" />
        <ellipse cx={0} cy={-6} rx={70} ry={22} fill={C.gold} stroke={INK} strokeWidth={6} />
        <line x1={-70} y1={-6} x2={-70} y2={14} stroke={INK} strokeWidth={6} />
        <line x1={70} y1={-6} x2={70} y2={14} stroke={INK} strokeWidth={6} />
        <text x={0} y={2} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={20} fill={INK}>
          {labels[i % labels.length]}
        </text>
      </g>
    ))}
  </g>
);
