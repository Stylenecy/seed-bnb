import React from "react";
import { BNB_GOLD, FONTS, INK, PAPER } from "../../kit";
import { C } from "./theme";

/**
 * Code-drawn comic props for BridgeAgent (SVG <g>, positioned in the parent svg).
 */
type Place = { x: number; y: number; s?: number; rot?: number };
const T = ({ x, y, s = 1, rot = 0 }: Place) => `translate(${x}, ${y}) rotate(${rot}) scale(${s})`;

/** A bragging "PnL screenshot": green line shooting up, big % label. `p` 0..1 draws the line. */
export const FlexChart: React.FC<Place & { p: number; label: string; fill?: string }> = ({ p, label, fill = "#ffffff", ...pl }) => {
  const pts = Array.from({ length: 24 }, (_, i) => {
    const t = i / 23;
    return [-120 + t * 240, 60 - Math.pow(t, 2.2) * 150 + (i % 3 === 1 ? 8 : 0)] as const;
  });
  const n = Math.max(2, Math.round(p * pts.length));
  const d = pts.slice(0, n).map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");
  return (
    <g transform={T(pl)}>
      <rect x={-150} y={-150} width={300} height={260} rx={18} fill={fill} stroke={INK} strokeWidth={8} />
      <rect x={-150} y={-150} width={300} height={44} rx={18} fill={INK} />
      <circle cx={-124} cy={-128} r={6} fill="#ff5f57" />
      <circle cx={-106} cy={-128} r={6} fill="#febc2e" />
      <circle cx={-88} cy={-128} r={6} fill="#28c840" />
      <path d={d} stroke={INK} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke="#22c55e" strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x={-128} y={-60} textAnchor="start" fontFamily={FONTS.comic} fontSize={50} fill="#22c55e" stroke={INK} strokeWidth={6} paintOrder="stroke">
        {label}
      </text>
    </g>
  );
};

/** A hooded, anonymous bot: no face, just question marks. */
export const MaskBot: React.FC<Place & { fill?: string }> = ({ fill = "#5b6b62", ...pl }) => (
  <g transform={T(pl)}>
    <path d="M-80 60 Q-86 -70 0 -110 Q86 -70 80 60 Z" fill={fill} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <ellipse cx={0} cy={-18} rx={52} ry={58} fill={INK} />
    <text x={0} y={2} textAnchor="middle" fontFamily={FONTS.comic} fontSize={78} fill={C.amber}>
      ?
    </text>
    <path d="M-86 60 L86 60 L100 150 L-100 150 Z" fill={fill} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
  </g>
);

/** ERC-8004 identity card (the agent NFT). */
export const IdCard: React.FC<Place & { id?: string; shine?: number }> = ({ id = "#1", shine = 0, ...pl }) => (
  <g transform={T(pl)}>
    <rect x={-150} y={-100} width={300} height={200} rx={22} fill={C.mossDeep} stroke={INK} strokeWidth={9} />
    <rect x={-150} y={-100} width={300} height={200} rx={22} fill="none" stroke={BNB_GOLD} strokeWidth={4} opacity={0.9} />
    <g transform="translate(-92, -30) scale(5)">
      <path d="M2 3 V15 M2 3 H14 M2 9 H11 M2 15 H14" stroke={C.mossSoft} strokeWidth={1.6} fill="none" strokeLinecap="square" transform="translate(-8,-9)" />
      <circle cx={6} cy={-6} r={1.1} fill={BNB_GOLD} />
    </g>
    <text x={60} y={20} textAnchor="middle" fontFamily={FONTS.comic} fontSize={96} fill={PAPER} stroke={INK} strokeWidth={6} paintOrder="stroke">
      {id}
    </text>
    <text x={0} y={80} textAnchor="middle" fontFamily={FONTS.mono} fontWeight={700} fontSize={22} fill={C.mossHi} letterSpacing={3}>
      ERC-8004 · AGENT
    </text>
    {shine > 0 ? <path d={`M${-200 + shine * 400} -100 l60 0 l-60 200 l-60 0 Z`} fill="#fff" opacity={0.25} /> : null}
  </g>
);

/** A torn paper receipt with a PnL line. */
export const Receipt: React.FC<Place & { lines?: string[]; big?: string; bigColor?: string }> = ({ lines = [], big, bigColor = "#15803d", ...pl }) => {
  const zig = Array.from({ length: 11 }, (_, i) => `L${100 - i * 20} ${i % 2 ? 136 : 150}`).join(" ");
  return (
    <g transform={T(pl)}>
      <path d={`M-100 -140 L100 -140 ${zig} Z`} fill={PAPER} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      {lines.map((l, i) => (
        <text key={i} x={-78} y={-96 + i * 34} fontFamily={FONTS.mono} fontWeight={700} fontSize={22} fill={INK}>
          {l}
        </text>
      ))}
      {big ? (
        <text x={0} y={108} textAnchor="middle" fontFamily={FONTS.comic} fontSize={46} fill={bigColor} stroke={INK} strokeWidth={4} paintOrder="stroke">
          {big}
        </text>
      ) : null}
    </g>
  );
};

/** Open ledger book with append-only rows; `rows` of them are filled in. */
export const Ledger: React.FC<Place & { rows?: number; total?: number }> = ({ rows = 2, total = 4, ...pl }) => (
  <g transform={T(pl)}>
    <path d="M-170 -110 Q-85 -135 0 -110 L0 120 Q-85 95 -170 120 Z" fill={PAPER} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <path d="M170 -110 Q85 -135 0 -110 L0 120 Q85 95 170 120 Z" fill="#ece3cf" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    {Array.from({ length: total }, (_, i) => (
      <g key={i}>
        <line x1={-150} y1={-70 + i * 44} x2={-20} y2={-70 + i * 44} stroke={INK} strokeWidth={3} opacity={0.3} />
        <line x1={20} y1={-70 + i * 44} x2={150} y2={-70 + i * 44} stroke={INK} strokeWidth={3} opacity={0.3} />
        {i < rows ? <rect x={-150} y={-88 + i * 44} width={100 + (i % 2) * 20} height={12} rx={6} fill={C.moss} /> : null}
        {i < rows ? <rect x={30} y={-88 + i * 44} width={70} height={12} rx={6} fill="#15803d" /> : null}
      </g>
    ))}
  </g>
);

/** Magnifying glass. */
export const Magnifier: React.FC<Place> = (pl) => (
  <g transform={T(pl)}>
    <path d="M40 40 L110 110" stroke={INK} strokeWidth={34} strokeLinecap="round" />
    <path d="M40 40 L110 110" stroke="#8b5a2b" strokeWidth={20} strokeLinecap="round" />
    <circle cx={0} cy={0} r={70} fill="rgba(220,240,255,0.55)" stroke={INK} strokeWidth={12} />
    <path d="M-40 -20 Q-30 -45 -5 -50" stroke="#fff" strokeWidth={9} fill="none" strokeLinecap="round" />
  </g>
);

/** Chain block header with its extraData field drawn to scale (bytes → px). */
export const BlockHeader: React.FC<Place & { bytes: number; cap?: number; color?: string }> = ({ bytes, cap = 32, color = C.red, ...pl }) => {
  const px = 1.4;
  return (
    <g transform={T(pl)}>
      <rect x={0} y={-40} width={cap * px * 3.2} height={80} rx={10} fill={C.mossDeep} stroke={INK} strokeWidth={6} />
      <rect x={10} y={-20} width={Math.min(bytes, 400) * px} height={40} rx={6} fill={color} stroke={INK} strokeWidth={5} />
      <line x1={10 + cap * px} y1={-56} x2={10 + cap * px} y2={56} stroke={BNB_GOLD} strokeWidth={6} strokeDasharray="10 8" />
    </g>
  );
};

/** Chain link pair (on-chain). */
export const ChainLinks: React.FC<Place & { color?: string }> = ({ color = BNB_GOLD, ...pl }) => (
  <g transform={T(pl)}>
    <rect x={-70} y={-24} width={80} height={48} rx={24} fill="none" stroke={INK} strokeWidth={20} />
    <rect x={-70} y={-24} width={80} height={48} rx={24} fill="none" stroke={color} strokeWidth={10} />
    <rect x={-10} y={-24} width={80} height={48} rx={24} fill="none" stroke={INK} strokeWidth={20} />
    <rect x={-10} y={-24} width={80} height={48} rx={24} fill="none" stroke={color} strokeWidth={10} />
  </g>
);
