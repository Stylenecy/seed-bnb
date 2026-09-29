import React from "react";
import { INK, PAPER } from "../../kit";
import { C, F } from "./theme";

/**
 * Golda comic props (SVG <g>, ~200 px box around 0,0 like kit/comicArt):
 * GoldBar, UsdtStack, StormCloud, Candles, ShareTicket, RouterNode, Padlock, Scale.
 * Flat fill + thick ink outline.
 */
type Place = { x: number; y: number; s?: number; rot?: number; opacity?: number };
const T = ({ x, y, s = 1, rot = 0 }: Place) => `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot}) scale(${s})`;

/** A gold ingot (trapezoid, top face + front face) with an optional stamp. */
export const GoldBar: React.FC<Place & { stamp?: string; shine?: number }> = ({ stamp = "Au", shine = 0, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <path d="M-96 34 L-70 -20 L70 -20 L96 34 Z" fill={C.goldDeep} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M-70 -20 L-52 -46 L52 -46 L70 -20 Z" fill={C.goldSoft} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M-84 30 L-64 -14 L64 -14 L84 30 Z" fill={C.gold} />
    <path d="M-60 -8 L-48 -30" stroke="#fff" strokeOpacity={0.6 + 0.4 * shine} strokeWidth={8} strokeLinecap="round" />
    <text x={0} y={18} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={34} fill={C.goldDeep}>
      {stamp}
    </text>
  </g>
);

/** A stack of USDT coins (Tether green). */
export const UsdtStack: React.FC<Place & { n?: number; label?: string }> = ({ n = 4, label, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    {Array.from({ length: n }).map((_, i) => (
      <g key={i} transform={`translate(0 ${-i * 18})`}>
        <ellipse cx={0} cy={8} rx={54} ry={18} fill={INK} />
        <ellipse cx={0} cy={0} rx={54} ry={18} fill={C.usdt} stroke={INK} strokeWidth={5} />
      </g>
    ))}
    <text x={0} y={-(n - 1) * 18 + 9} textAnchor="middle" fontFamily={F.comic} fontSize={26} fill="#fff">
      ₮
    </text>
    {label ? (
      <text x={0} y={64} textAnchor="middle" fontFamily={F.comic} fontSize={30} fill={PAPER} stroke={INK} strokeWidth={6} paintOrder="stroke">
        {label}
      </text>
    ) : null}
  </g>
);

/** Storm cloud with a lightning bolt; `flash` 0..1 lights the bolt. */
export const StormCloud: React.FC<Place & { flash?: number }> = ({ flash = 1, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <path
      d="M-110 30 q-40 0 -40 -36 q0 -36 42 -38 q6 -46 58 -46 q40 0 56 32 q14 -12 36 -8 q44 8 42 52 q30 6 28 26 q-2 20 -32 18 z"
      fill="#5b6070"
      stroke={INK}
      strokeWidth={7}
      strokeLinejoin="round"
    />
    <path d="M-10 36 L-40 106 L-8 100 L-30 170 L42 78 L8 84 L30 36 Z" fill={flash > 0.5 ? "#FFE45C" : "#8a8a70"} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
  </g>
);

/** Red/green candles falling; `p` 0..1 reveals them left→right. */
export const Candles: React.FC<Place & { p?: number }> = ({ p = 1, ...pl }) => {
  const cs = [
    { x: -150, o: -30, c: -60, hi: -80, lo: -10 },
    { x: -90, o: -60, c: -20, hi: -70, lo: 0 },
    { x: -30, o: -20, c: 30, hi: -30, lo: 50 },
    { x: 30, o: 30, c: 10, hi: -4, lo: 40 },
    { x: 90, o: 10, c: 70, hi: 0, lo: 90 },
    { x: 150, o: 70, c: 110, hi: 50, lo: 130 },
  ];
  return (
    <g transform={T(pl)} opacity={pl.opacity ?? 1}>
      <rect x={-196} y={-120} width={392} height={280} rx={14} fill="#16140f" stroke={INK} strokeWidth={7} />
      {cs.map((c, i) => {
        if (i / cs.length > p) return null;
        const up = c.c < c.o;
        const col = up ? C.usdtSoft : C.rose;
        return (
          <g key={i}>
            <line x1={c.x} x2={c.x} y1={c.hi} y2={c.lo} stroke={col} strokeWidth={5} />
            <rect x={c.x - 18} y={Math.min(c.o, c.c)} width={36} height={Math.max(8, Math.abs(c.c - c.o))} fill={col} stroke={INK} strokeWidth={4} />
          </g>
        );
      })}
    </g>
  );
};

/** The gVAULT share ticket (ERC-4626 share). */
export const ShareTicket: React.FC<Place & { label?: string }> = ({ label = "gVAULT", ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <path d="M-90 -44 h180 v26 a18 18 0 0 0 0 36 v26 h-180 v-26 a18 18 0 0 0 0 -36 z" fill={C.goldSoft} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <line x1={-50} x2={-50} y1={-40} y2={40} stroke={INK} strokeWidth={3} strokeDasharray="6 6" />
    <text x={-70} y={10} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={30} fill={C.goldDeep}>
      G
    </text>
    <text x={22} y={11} textAnchor="middle" fontFamily={F.comic} fontSize={32} fill={INK}>
      {label}
    </text>
  </g>
);

/** A router hub (diamond) with a label — the LI.FI Diamond. */
export const RouterNode: React.FC<Place & { label?: string; fill?: string }> = ({ label = "LI.FI", fill = "#b9a7ff", ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <path d="M0 -80 L80 0 L0 80 L-80 0 Z" fill={fill} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M0 -52 L52 0 L0 52 L-52 0 Z" fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={4} />
    <text x={0} y={11} textAnchor="middle" fontFamily={F.comic} fontSize={32} fill={INK}>
      {label}
    </text>
  </g>
);

/** Padlock; `open` 0..1 lifts the shackle. */
export const Padlock: React.FC<Place & { fill?: string; open?: number; mark?: string }> = ({ fill = C.gold, open = 0, mark, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <path d={`M-34 ${-18 - open * 26} v-26 a34 34 0 0 1 68 0 v${26 + open * 0}`} fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" />
    <path d={`M-34 ${-18 - open * 26} v-26 a34 34 0 0 1 68 0 v${26 + open * 0}`} fill="none" stroke="#c9ced8" strokeWidth={8} strokeLinecap="round" />
    <rect x={-56} y={-22} width={112} height={92} rx={14} fill={fill} stroke={INK} strokeWidth={7} />
    {mark ? (
      <text x={0} y={42} textAnchor="middle" fontFamily={F.comic} fontSize={40} fill={INK}>
        {mark}
      </text>
    ) : (
      <circle cx={0} cy={20} r={10} fill={INK} />
    )}
  </g>
);

/** Balance scale; `tilt` in degrees (+ = right pan down). */
export const Scale: React.FC<Place & { tilt?: number; left?: React.ReactNode; right?: React.ReactNode }> = ({ tilt = 0, left, right, ...pl }) => {
  const a = (tilt * Math.PI) / 180;
  const lx = -110 * Math.cos(a);
  const ly = -110 * Math.sin(a);
  const rx = 110 * Math.cos(a);
  const ry = 110 * Math.sin(a);
  return (
    <g transform={T(pl)} opacity={pl.opacity ?? 1}>
      <rect x={-10} y={-70} width={20} height={170} fill="#7a6a4a" stroke={INK} strokeWidth={6} />
      <rect x={-60} y={96} width={120} height={20} rx={6} fill="#7a6a4a" stroke={INK} strokeWidth={6} />
      <line x1={lx} y1={ly - 70} x2={rx} y2={ry - 70} stroke={INK} strokeWidth={12} strokeLinecap="round" />
      <circle cx={0} cy={-70} r={12} fill={C.gold} stroke={INK} strokeWidth={5} />
      {[
        [lx, ly, left],
        [rx, ry, right],
      ].map(([x, y, node], i) => (
        <g key={i} transform={`translate(${x as number} ${(y as number) - 70})`}>
          <line x1={-40} y1={70} x2={0} y2={0} stroke={INK} strokeWidth={4} />
          <line x1={40} y1={70} x2={0} y2={0} stroke={INK} strokeWidth={4} />
          <path d="M-54 70 h108 q-8 26 -54 26 q-46 0 -54 -26z" fill="#c9ced8" stroke={INK} strokeWidth={6} />
          <g transform="translate(0 50)">{node as React.ReactNode}</g>
        </g>
      ))}
    </g>
  );
};
