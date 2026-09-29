import React from "react";
import { BNB_GOLD, FONTS, INK, PAPER } from "../../kit";
import { C } from "./theme";

/**
 * Code-drawn comic props for LIBER (SVG <g>, placed in a parent <svg>).
 * Style matches kit/comicArt: flat fills, 6px ink outline, one highlight.
 */
type Place = { x: number; y: number; s?: number; rot?: number; opacity?: number };
const T = ({ x, y, s = 1, rot = 0 }: Place) => `translate(${x} ${y}) rotate(${rot}) scale(${s})`;

/** The Liber app mark (frontend/src/components/Logo.tsx), as an HTML-sized svg. */
export const LiberMark: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 64, style }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: "block", ...style }}>
    <rect width="64" height="64" rx="16" fill={C.deep} />
    <path d="M 44 20 A 17 17 0 1 0 47 40" fill="none" stroke={C.bright} strokeWidth="6" strokeLinecap="round" />
    <circle cx="47" cy="40" r="6" fill={C.gold} />
  </svg>
);

/** A QRIS standee on a counter: pseudo-QR grid (deterministic), "QRIS" header. */
export const QrisStand: React.FC<Place & { price?: string }> = ({ price, ...pl }) => {
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
      const finder = (r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3);
      const on = !finder && (r * 7 + c * 13 + r * c) % 3 === 0;
      if (on) cells.push(<rect key={`${r}-${c}`} x={-54 + c * 12} y={-40 + r * 12} width={11} height={11} fill={INK} />);
    }
  return (
    <g transform={T(pl)} opacity={pl.opacity ?? 1}>
      <path d="M-40 110 L40 110 L26 80 L-26 80 Z" fill="#6b4a2b" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <rect x={-78} y={-100} width={156} height={186} rx={12} fill={PAPER} stroke={INK} strokeWidth={6} />
      <rect x={-78} y={-100} width={156} height={42} rx={12} fill={C.rose} stroke={INK} strokeWidth={6} />
      <text x={0} y={-68} textAnchor="middle" fontFamily={FONTS.comic} fontSize={32} fill="#fff">QRIS</text>
      {cells}
      {[
        [-54, -40],
        [18, -40],
        [-54, 32],
      ].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width={35} height={35} fill={INK} />
          <rect x={x! + 6} y={y! + 6} width={23} height={23} fill={PAPER} />
          <rect x={x! + 11} y={y! + 11} width={13} height={13} fill={INK} />
        </g>
      ))}
      {price ? (
        <text x={0} y={146} textAnchor="middle" fontFamily={FONTS.comic} fontSize={34} fill={INK}>
          {price}
        </text>
      ) : null}
    </g>
  );
};

/** Coffee cup with steam. */
export const Coffee: React.FC<Place & { steam?: number }> = ({ steam = 0, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    {[-18, 0, 18].map((dx, i) => (
      <path
        key={i}
        d={`M${dx} -70 q${10 + Math.sin(steam + i) * 6} -18 0 -36 q-10 -18 0 -36`}
        stroke="#ffffff"
        strokeOpacity={0.8}
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
      />
    ))}
    <path d="M52 -30 q40 0 36 30 q-4 26 -40 22" stroke={INK} strokeWidth={10} fill="none" />
    <path d="M-60 -50 L60 -50 L48 60 Q0 76 -48 60 Z" fill="#fff4dd" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-56 -20 L57 -20 L53 14 L-53 14 Z" fill={C.emerald} />
    <path d="M-40 -40 Q-44 0 -36 44" stroke="#fff" strokeOpacity={0.6} strokeWidth={7} fill="none" strokeLinecap="round" />
  </g>
);

/** A bank / exchange building with a slow "clock" and a fee tag. */
export const Bank: React.FC<Place & { label?: string; hand?: number }> = ({ label = "EXCHANGE", hand = 0, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <path d="M-120 -40 L0 -110 L120 -40 Z" fill="#c9cfd6" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <rect x={-110} y={-40} width={220} height={24} fill="#aeb6bf" stroke={INK} strokeWidth={6} />
    {[-80, -30, 20, 70].map((cx) => (
      <rect key={cx} x={cx - 8} y={-16} width={26} height={110} fill="#e3e7ea" stroke={INK} strokeWidth={5} />
    ))}
    <rect x={-124} y={94} width={248} height={24} fill="#aeb6bf" stroke={INK} strokeWidth={6} />
    <text x={0} y={-50} textAnchor="middle" fontFamily={FONTS.comic} fontSize={20} fill={INK}>
      {label}
    </text>
    <g transform="translate(0 -74)">
      <circle r={20} fill="#fff" stroke={INK} strokeWidth={4} />
      <line x1={0} y1={0} x2={Math.sin(hand) * 13} y2={-Math.cos(hand) * 13} stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <line x1={0} y1={0} x2={Math.sin(hand * 12) * 9} y2={-Math.cos(hand * 12) * 9} stroke={C.rose} strokeWidth={3} strokeLinecap="round" />
    </g>
  </g>
);

/** A price tag (fee, waiting time). */
export const Tag: React.FC<Place & { text: string; fill?: string; color?: string }> = ({ text, fill = C.rose, color = "#fff", ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <path d="M-80 -30 L60 -30 L90 0 L60 30 L-80 30 Z" fill={fill} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <circle cx={58} cy={0} r={6} fill={INK} />
    <text x={-10} y={11} textAnchor="middle" fontFamily={FONTS.comic} fontSize={30} fill={color}>
      {text}
    </text>
  </g>
);

/** A Kolo-style crypto Visa card (generic; name only, no third-party art). */
export const KoloCard: React.FC<Place & { glow?: boolean }> = ({ glow = false, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    {glow ? <rect x={-112} y={-72} width={224} height={144} rx={22} fill={C.bright} opacity={0.35} /> : null}
    <rect x={-100} y={-62} width={200} height={124} rx={16} fill="#1b2a44" stroke={INK} strokeWidth={6} />
    <path d="M-100 10 Q0 -40 100 -10 L100 46 Q100 62 84 62 L-84 62 Q-100 62 -100 46 Z" fill="#2f4f8a" />
    <rect x={-78} y={-34} width={34} height={26} rx={5} fill={BNB_GOLD} stroke={INK} strokeWidth={3} />
    <text x={-80} y={42} fontFamily={FONTS.comic} fontSize={26} fill="#fff">KOLO</text>
    <text x={80} y={42} textAnchor="end" fontFamily={FONTS.comic} fontSize={24} fill="#fff" fontStyle="italic">VISA</text>
  </g>
);

/** Chain link with a red "no" slash — "no trustline". */
export const NoTrustline: React.FC<Place> = (pl) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <rect x={-70} y={-24} width={80} height={48} rx={24} fill="none" stroke="#9aa3ad" strokeWidth={14} />
    <rect x={-10} y={-24} width={80} height={48} rx={24} fill="none" stroke="#9aa3ad" strokeWidth={14} />
    <rect x={-70} y={-24} width={80} height={48} rx={24} fill="none" stroke={INK} strokeWidth={4} />
    <rect x={-10} y={-24} width={80} height={48} rx={24} fill="none" stroke={INK} strokeWidth={4} />
    <circle r={78} fill="none" stroke={C.rose} strokeWidth={14} />
    <line x1={-55} y1={55} x2={55} y2={-55} stroke={C.rose} strokeWidth={14} strokeLinecap="round" />
  </g>
);

/** A small BNB coin (gold, diamond glyph) for the 0.001 BNB activation. */
export const BnbCoin: React.FC<Place & { label?: string }> = ({ label, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <circle r={46} fill={BNB_GOLD} stroke={INK} strokeWidth={6} />
    <circle r={34} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={4} />
    <path d="M0 -22 L22 0 L0 22 L-22 0 Z" fill="#fff" stroke={INK} strokeWidth={3} />
    {label ? (
      <text x={0} y={80} textAnchor="middle" fontFamily={FONTS.comic} fontSize={30} fill={PAPER} stroke={INK} strokeWidth={1.5}>
        {label}
      </text>
    ) : null}
  </g>
);
