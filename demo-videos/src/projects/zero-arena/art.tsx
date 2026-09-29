import React from "react";
import { FONTS, INK, PAPER } from "../../kit";
import { C } from "./theme";

/**
 * Zero Arena comic props — SVG <g> groups, same conventions as kit/comicArt:
 * designed around (0,0), placed with x/y/s/rot, thick ink outline.
 */
type Place = { x: number; y: number; s?: number; rot?: number; opacity?: number };
const T = ({ x, y, s = 1, rot = 0 }: Place) => `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot}) scale(${s})`;
const SW = 6;

/** A bragging "post" card: avatar, handle, a huge unverifiable number. */
export const BragCard: React.FC<Place & { handle: string; big: string; sub: string; tint?: string }> = ({ handle, big, sub, tint = C.emerald, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <rect x={-150} y={-92} width={300} height={184} rx={18} fill={PAPER} stroke={INK} strokeWidth={SW} />
    <circle cx={-112} cy={-54} r={20} fill={tint} stroke={INK} strokeWidth={4} />
    <text x={-82} y={-46} fontFamily={FONTS.mono} fontSize={20} fontWeight={700} fill={INK}>
      {handle}
    </text>
    <text x={0} y={30} textAnchor="middle" fontFamily={FONTS.comic} fontSize={70} fill={tint} stroke={INK} strokeWidth={3} paintOrder="stroke">
      {big}
    </text>
    <text x={0} y={70} textAnchor="middle" fontFamily={FONTS.inter} fontWeight={700} fontSize={22} fill={INK}>
      {sub}
    </text>
  </g>
);

/** Rubber stamp (rotated, double border). `p` 0..1 = slam scale. */
export const Stamp: React.FC<Place & { text: string; color?: string; w?: number }> = ({ text, color = C.rose, w = 360, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <rect x={-w / 2} y={-46} width={w} height={92} rx={10} fill="none" stroke={color} strokeWidth={9} />
    <rect x={-w / 2 + 10} y={-36} width={w - 20} height={72} rx={6} fill="none" stroke={color} strokeWidth={3} />
    <text x={0} y={20} textAnchor="middle" fontFamily={FONTS.comic} fontSize={56} fill={color} style={{ letterSpacing: 2 }}>
      {text}
    </text>
  </g>
);

/** Certificate sheet with a seal and hash lines. */
export const CertDoc: React.FC<Place & { seal?: string; lines?: number }> = ({ seal = C.emerald, lines = 4, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <rect x={-100} y={-128} width={200} height={256} rx={10} fill={PAPER} stroke={INK} strokeWidth={SW} />
    <text x={0} y={-86} textAnchor="middle" fontFamily={FONTS.comic} fontSize={30} fill={INK}>
      CERTIFICATE
    </text>
    {Array.from({ length: lines }).map((_, i) => (
      <rect key={i} x={-74} y={-60 + i * 26} width={i % 2 ? 110 : 148} height={10} rx={5} fill="#c9c2b2" />
    ))}
    <text x={-74} y={70} fontFamily={FONTS.mono} fontSize={16} fontWeight={700} fill={INK}>
      runHash 0x69af…
    </text>
    <g transform="translate(58 96)">
      <path d="M-14 10 L-22 44 L0 32 L22 44 L14 10" fill={seal} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <circle r={28} fill={seal} stroke={INK} strokeWidth={5} />
      <path d="M-11 0 l8 8 l15 -16" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </g>
);

/** The ZA monogram as ink strokes (usable inside an svg <g>). */
export const ZaGlyph: React.FC<{ color?: string; w?: number }> = ({ color = C.emerald, w = 7 }) => (
  <g fill="none" stroke={color} strokeWidth={w} strokeLinejoin="miter" strokeLinecap="square">
    <path d="M-28 -16 H0 L-26 16 H-2" />
    <path d="M2 16 L15 -16 L28 16 M8 6 H22" />
  </g>
);

/** iNFT trading card: frame, ZA art, token number. */
export const NftCard: React.FC<Place & { id?: string; shine?: number }> = ({ id = "#1", shine = 0, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <rect x={-96} y={-132} width={192} height={264} rx={18} fill="#1d1a33" stroke={INK} strokeWidth={SW} />
    <rect x={-80} y={-116} width={160} height={150} rx={10} fill={C.violet} stroke={INK} strokeWidth={4} />
    <g transform="translate(0 -41) scale(1.7)">
      <circle r={34} fill="#0a0a0f" stroke={INK} strokeWidth={3} />
      <ZaGlyph color={C.emerald} w={6} />
    </g>
    <text x={0} y={80} textAnchor="middle" fontFamily={FONTS.comic} fontSize={40} fill={C.emerald}>
      iNFT {id}
    </text>
    <text x={0} y={112} textAnchor="middle" fontFamily={FONTS.mono} fontSize={16} fontWeight={700} fill={PAPER}>
      ERC-7857
    </text>
    {shine > 0 && shine < 1 ? (
      <path d={`M${-120 + shine * 240} -140 l40 0 l-60 280 l-40 0 z`} fill="#fff" opacity={0.35} />
    ) : null}
  </g>
);

/** A hash-chain block ("epoch" box) with a label and short hash. */
export const HashBlock: React.FC<Place & { label: string; hash: string; fill?: string; glow?: boolean }> = ({ label, hash, fill = PAPER, glow = false, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    {glow ? <rect x={-170} y={-96} width={340} height={192} rx={22} fill={C.emerald} opacity={0.35} /> : null}
    <rect x={-150} y={-80} width={300} height={160} rx={16} fill={fill} stroke={INK} strokeWidth={SW} />
    <rect x={-150} y={-80} width={300} height={50} rx={16} fill={INK} />
    <text x={0} y={-45} textAnchor="middle" fontFamily={FONTS.comic} fontSize={34} fill={fill}>
      {label}
    </text>
    <text x={0} y={30} textAnchor="middle" fontFamily={FONTS.mono} fontSize={24} fontWeight={700} fill={INK}>
      {hash}
    </text>
  </g>
);

/** Chain link (two interlocking rounded rects). */
export const ChainLink: React.FC<Place & { color?: string }> = ({ color = C.gold, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1} fill="none">
    <rect x={-44} y={-18} width={56} height={36} rx={18} stroke={INK} strokeWidth={14} />
    <rect x={-44} y={-18} width={56} height={36} rx={18} stroke={color} strokeWidth={7} />
    <rect x={-12} y={-18} width={56} height={36} rx={18} stroke={INK} strokeWidth={14} />
    <rect x={-12} y={-18} width={56} height={36} rx={18} stroke={color} strokeWidth={7} />
  </g>
);

/** Trophy cup. */
export const Trophy: React.FC<Place & { fill?: string }> = ({ fill = C.gold, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <path d="M-60 -70 q-50 0 -40 40 q8 30 44 34" fill="none" stroke={INK} strokeWidth={10} />
    <path d="M60 -70 q50 0 40 40 q-8 30 -44 34" fill="none" stroke={INK} strokeWidth={10} />
    <path d="M-62 -84 H62 Q60 10 0 30 Q-60 10 -62 -84 Z" fill={fill} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    <rect x={-12} y={28} width={24} height={34} fill={fill} stroke={INK} strokeWidth={5} />
    <rect x={-50} y={60} width={100} height={26} rx={6} fill={INK} />
    <path d="M-30 -66 q-4 40 14 70" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" opacity={0.6} />
  </g>
);

/** Candlestick mini-chart (live market). `n` visible candles. */
export const Candles: React.FC<Place & { n?: number }> = ({ n = 8, ...pl }) => {
  const data = [
    [10, 40, 0, 50], [36, 20, 14, 46], [20, 30, 10, 38], [30, 6, -4, 40], [6, 18, -8, 26], [18, -10, -20, 24], [-10, 2, -22, 8], [2, -26, -34, 8],
  ];
  return (
    <g transform={T(pl)} opacity={pl.opacity ?? 1}>
      {data.slice(0, n).map(([o, c, hi, lo], i) => {
        const up = c! < o!;
        const x = -105 + i * 30;
        return (
          <g key={i}>
            <line x1={x} y1={hi} x2={x} y2={lo} stroke={INK} strokeWidth={4} />
            <rect x={x - 10} y={Math.min(o!, c!)} width={20} height={Math.max(6, Math.abs(c! - o!))} fill={up ? C.emerald : C.rose} stroke={INK} strokeWidth={4} />
          </g>
        );
      })}
    </g>
  );
};

/** Oracle gatekeeper: a shield with a check or a cross. */
export const Shield: React.FC<Place & { fill?: string; mark?: "check" | "cross"; label?: string }> = ({ fill = C.violet, mark = "check", label, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <path d="M0 -100 L80 -70 V0 Q80 70 0 104 Q-80 70 -80 0 V-70 Z" fill={fill} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    {mark === "check" ? (
      <path d="M-34 0 l24 26 l46 -52" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <path d="M-30 -30 L30 30 M30 -30 L-30 30" stroke={INK} strokeWidth={14} strokeLinecap="round" />
    )}
    {label ? (
      <text x={0} y={80} textAnchor="middle" fontFamily={FONTS.comic} fontSize={26} fill={INK}>
        {label}
      </text>
    ) : null}
  </g>
);
