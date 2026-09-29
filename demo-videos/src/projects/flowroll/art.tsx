import React from "react";
import { BNB_GOLD, FONTS, INK, PAPER } from "../../kit";

/** Code-drawn Flowroll comic props (SVG <g>, positioned like the kit's comicArt). */
type Place = { x: number; y: number; s?: number; rot?: number; opacity?: number };
const T = ({ x, y, s = 1, rot = 0 }: Place) => `translate(${x} ${y}) rotate(${rot}) scale(${s})`;
const SW = 6;

/** Payday clock: `t` 0..1 sweeps the hand once round; `face` colour. */
export const PaydayClock: React.FC<Place & { t?: number; face?: string; label?: string }> = ({ t = 0, face = PAPER, label, ...pl }) => {
  const a = t * Math.PI * 2 - Math.PI / 2;
  return (
    <g transform={T(pl)} opacity={pl.opacity ?? 1}>
      <circle r={78} fill={face} stroke={INK} strokeWidth={SW} />
      {Array.from({ length: 12 }, (_, i) => {
        const r = (i / 12) * Math.PI * 2;
        return <line key={i} x1={Math.cos(r) * 60} y1={Math.sin(r) * 60} x2={Math.cos(r) * 70} y2={Math.sin(r) * 70} stroke={INK} strokeWidth={i % 3 === 0 ? 6 : 3} strokeLinecap="round" />;
      })}
      <path d={`M0 0 L0 -62 A62 62 0 ${t > 0.5 ? 1 : 0} 1 ${Math.cos(a) * 62} ${Math.sin(a) * 62} Z`} fill="#f59e0b" opacity={0.45} />
      <line x1={0} y1={0} x2={Math.cos(a) * 56} y2={Math.sin(a) * 56} stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <circle r={9} fill={BNB_GOLD} stroke={INK} strokeWidth={4} />
      <rect x={-18} y={-104} width={36} height={22} rx={5} fill={INK} />
      {label ? (
        <text x={0} y={118} textAnchor="middle" fontFamily={FONTS.comic} fontSize={30} fill={PAPER} stroke={INK} strokeWidth={6} paintOrder="stroke">
          {label}
        </text>
      ) : null}
    </g>
  );
};

/** Growing bar chart in a card (yield): `g` 0..1 grows the bars. */
export const GrowthChart: React.FC<Place & { g?: number; color?: string }> = ({ g = 1, color = "#10b981", ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <rect x={-90} y={-80} width={180} height={150} rx={14} fill={PAPER} stroke={INK} strokeWidth={SW} />
    {[0.35, 0.55, 0.75, 1].map((h, i) => (
      <rect key={i} x={-68 + i * 36} y={52 - 110 * h * g} width={26} height={110 * h * g} rx={4} fill={color} stroke={INK} strokeWidth={4} />
    ))}
    <path d={`M-70 ${30 - 20 * g} L-30 ${10 - 40 * g} L10 ${0 - 50 * g} L64 ${-10 - 70 * g}`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

/** Calendar page with a big day count. */
export const CalendarPage: React.FC<Place & { day: string; head?: string; fill?: string }> = ({ day, head = "PAYDAY IN", fill = PAPER, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <rect x={-80} y={-86} width={160} height={176} rx={14} fill={fill} stroke={INK} strokeWidth={SW} />
    <rect x={-80} y={-86} width={160} height={48} rx={14} fill="#f43f5e" stroke={INK} strokeWidth={SW} />
    <text x={0} y={-52} textAnchor="middle" fontFamily={FONTS.comic} fontSize={26} fill={PAPER}>
      {head}
    </text>
    <text x={0} y={50} textAnchor="middle" fontFamily={FONTS.comic} fontSize={96} fill={INK}>
      {day}
    </text>
    {[-40, 0, 40].map((cx) => (
      <circle key={cx} cx={cx} cy={-96} r={8} fill={INK} />
    ))}
  </g>
);

/** Heavy padlock + chain across something (funds stuck). */
export const Padlock: React.FC<Place & { fill?: string }> = ({ fill = "#f43f5e", ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <path d="M-34 -10 L-34 -44 A34 34 0 0 1 34 -44 L34 -10" stroke={INK} strokeWidth={16} fill="none" />
    <path d="M-34 -10 L-34 -44 A34 34 0 0 1 34 -44 L34 -10" stroke="#C9CED8" strokeWidth={8} fill="none" />
    <rect x={-54} y={-14} width={108} height={86} rx={12} fill={fill} stroke={INK} strokeWidth={SW} />
    <circle cx={0} cy={20} r={11} fill={INK} />
    <rect x={-4} y={22} width={8} height={24} fill={INK} />
  </g>
);

/** Chain links across a width (centered on x). */
export const ChainLinks: React.FC<Place & { n?: number }> = ({ n = 7, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    {Array.from({ length: n }, (_, i) => (
      <rect key={i} x={(i - n / 2) * 44} y={i % 2 === 0 ? -14 : -9} width={56} height={i % 2 === 0 ? 28 : 18} rx={12} fill="none" stroke={INK} strokeWidth={10} />
    ))}
    {Array.from({ length: n }, (_, i) => (
      <rect key={`c${i}`} x={(i - n / 2) * 44} y={i % 2 === 0 ? -14 : -9} width={56} height={i % 2 === 0 ? 28 : 18} rx={12} fill="none" stroke="#C9CED8" strokeWidth={5} />
    ))}
  </g>
);

/** Code-drawn Flowroll mark (navy squircle, grey ring, emerald cup) for comic panels. */
export const MarkGlyph: React.FC<Place> = (pl) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <rect x={-50} y={-50} width={100} height={100} rx={34} fill="#111a2c" stroke={INK} strokeWidth={5} />
    <circle r={27} fill="none" stroke="#e5e7eb" strokeWidth={5} />
    <path d="M-12 0 A12 12 0 0 1 12 0" fill="#fff" />
    <path d="M-12 0 A12 12 0 0 0 12 0 Z" fill="#10b981" />
    <circle r={5.5} fill="#10b981" stroke="#111a2c" strokeWidth={2.5} />
  </g>
);
