import React from "react";
import { BNB_GOLD, FONTS, INK, PAPER } from "../../kit";
import { C } from "./theme";

/**
 * Claudelance comic props (SVG <g>, same conventions as kit/comicArt:
 * designed around (0,0), placed with x/y/s/rot, thick ink outline).
 */
type Place = { x: number; y: number; s?: number; rot?: number; opacity?: number };
const T = ({ x, y, s = 1, rot = 0 }: Place) => `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot}) scale(${s})`;
const SW = 6;

/** Claude-clay starburst mark (a generic 8-ray asterisk, not a logo copy). */
export const ClayStar: React.FC<Place & { fill?: string; spin?: number }> = ({ fill = C.clay, spin = 0, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <g transform={`rotate(${spin})`}>
      {[0, 45, 90, 135].map((a) => (
        <rect key={a} x={-8} y={-38} width={16} height={76} rx={8} fill={fill} stroke={INK} strokeWidth={4} transform={`rotate(${a})`} />
      ))}
      <circle r={12} fill={fill} />
    </g>
  </g>
);

/** Laptop with a terminal on screen: typing lines (`lines` 0..n) + a cursor. */
export const Laptop: React.FC<Place & { lines?: number; idle?: boolean; screen?: string }> = ({ lines = 3, idle = false, screen = "#15110f", ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <rect x={-150} y={-110} width={300} height={190} rx={14} fill="#2a2522" stroke={INK} strokeWidth={SW} />
    <rect x={-134} y={-94} width={268} height={158} rx={6} fill={idle ? "#0b0a09" : screen} />
    {!idle
      ? [0, 1, 2, 3].slice(0, Math.max(0, Math.min(4, lines))).map((i) => (
          <g key={i}>
            <text x={-120} y={-62 + i * 32} fontFamily={FONTS.mono} fontSize={20} fill={C.clay}>
              {">"}
            </text>
            <rect x={-98} y={-76 + i * 32} width={[150, 190, 110, 170][i]} height={14} rx={4} fill={i % 2 ? C.textDim : C.claySoft} opacity={0.85} />
          </g>
        ))
      : (
        <text x={0} y={-4} textAnchor="middle" fontFamily={FONTS.comic} fontSize={46} fill="#3a332e">
          IDLE
        </text>
      )}
    <path d="M-176 80 H176 L160 108 H-160 Z" fill="#3a3430" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    <rect x={-30} y={84} width={60} height={8} rx={4} fill={INK} opacity={0.5} />
  </g>
);

/** Price tag. */
export const PriceTag: React.FC<Place & { text: string; fill?: string }> = ({ text, fill = C.celo, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <path d="M-110 -44 H80 L120 0 L80 44 H-110 Z" fill={fill} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    <circle cx={82} cy={0} r={9} fill={PAPER} stroke={INK} strokeWidth={4} />
    <text x={-16} y={14} textAnchor="middle" fontFamily={FONTS.comic} fontSize={44} fill={INK}>
      {text}
    </text>
  </g>
);

/** Clock face; `h` hours (0..24) filled as a clay wedge on a 24h dial. */
export const DayClock: React.FC<Place & { h?: number; idleFill?: number }> = ({ h = 4, idleFill = 0, ...pl }) => {
  const R = 110;
  const arc = (a0: number, a1: number) => {
    const p = (a: number) => [Math.sin(a) * R, -Math.cos(a) * R];
    const [x0, y0] = p(a0);
    const [x1, y1] = p(a1);
    return `M0 0 L${x0!.toFixed(1)} ${y0!.toFixed(1)} A${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1!.toFixed(1)} ${y1!.toFixed(1)} Z`;
  };
  const busy = (h / 24) * Math.PI * 2;
  const idle = busy + (Math.PI * 2 - busy) * idleFill;
  return (
    <g transform={T(pl)} opacity={pl.opacity ?? 1}>
      <circle r={R + 14} fill={PAPER} stroke={INK} strokeWidth={SW + 2} />
      {h > 0 ? <path d={arc(0, Math.min(busy, Math.PI * 1.999))} fill={C.clay} stroke={INK} strokeWidth={4} /> : null}
      {idleFill > 0 ? <path d={arc(busy, Math.min(idle, Math.PI * 1.999))} fill="#6b635c" stroke={INK} strokeWidth={4} opacity={0.85} /> : null}
      {Array.from({ length: 24 }, (_, i) => (
        <line
          key={i}
          x1={Math.sin((i / 24) * Math.PI * 2) * (R + 2)}
          y1={-Math.cos((i / 24) * Math.PI * 2) * (R + 2)}
          x2={Math.sin((i / 24) * Math.PI * 2) * (R + (i % 6 ? 10 : 14))}
          y2={-Math.cos((i / 24) * Math.PI * 2) * (R + (i % 6 ? 10 : 14))}
          stroke={INK}
          strokeWidth={i % 6 ? 3 : 6}
        />
      ))}
      <circle r={12} fill={INK} />
    </g>
  );
};

/** ERC-8004 identity card (agent ID NFT). */
export const IdCard: React.FC<Place & { id?: string; fill?: string }> = ({ id = "#2474", fill = PAPER, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <rect x={-120} y={-76} width={240} height={152} rx={16} fill={fill} stroke={INK} strokeWidth={SW} />
    <rect x={-120} y={-76} width={240} height={40} rx={16} fill={C.clay} stroke={INK} strokeWidth={SW} />
    <text x={0} y={-46} textAnchor="middle" fontFamily={FONTS.comic} fontSize={28} fill={INK}>
      ERC-8004 AGENT
    </text>
    <circle cx={-66} cy={14} r={30} fill={C.surface} stroke={INK} strokeWidth={5} />
    <g transform="translate(-66 14) scale(0.5)">
      <rect x={-34} y={-30} width={68} height={52} rx={14} fill="#9AA3B5" stroke={INK} strokeWidth={6} />
      <rect x={-24} y={-18} width={48} height={20} rx={8} fill="#5EF0FF" />
    </g>
    <text x={-20} y={30} fontFamily={FONTS.comic} fontSize={48} fill={INK}>
      {id}
    </text>
  </g>
);

/** Shield with a checkmark (CI attested). `ok` false = red X. */
export const CiShield: React.FC<Place & { ok?: boolean; draw?: number }> = ({ ok = true, draw = 1, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <path d="M0 -100 L84 -70 Q86 34 0 100 Q-86 34 -84 -70 Z" fill={ok ? C.emerald : C.neg} stroke={INK} strokeWidth={SW} />
    <path d="M0 -84 L68 -60 Q68 24 0 80" fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={8} />
    {ok ? (
      <path d="M-38 0 L-10 28 L42 -30" fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
    ) : (
      <path d="M-30 -30 L30 30 M30 -30 L-30 30" stroke={INK} strokeWidth={16} strokeLinecap="round" />
    )}
    <text x={0} y={70} textAnchor="middle" fontFamily={FONTS.comic} fontSize={30} fill={INK}>
      CI
    </text>
  </g>
);

/** Chain coin: Celo (yellow ring) or BNB (gold diamond). */
export const ChainCoin: React.FC<Place & { chain: "celo" | "bnb" }> = ({ chain, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <circle r={70} fill={chain === "celo" ? C.celo : BNB_GOLD} stroke={INK} strokeWidth={SW + 1} />
    <circle r={56} fill="none" stroke={INK} strokeOpacity={0.25} strokeWidth={5} />
    {chain === "celo" ? (
      <g>
        <circle cx={-10} cy={-10} r={26} fill="none" stroke={INK} strokeWidth={9} />
        <circle cx={10} cy={10} r={26} fill="none" stroke={INK} strokeWidth={9} />
      </g>
    ) : (
      <g fill={INK}>
        <rect x={-9} y={-9} width={18} height={18} transform="rotate(45)" />
        <rect x={-6} y={-38} width={12} height={12} transform="rotate(45 0 -32)" />
        <rect x={-6} y={26} width={12} height={12} transform="rotate(45 0 32)" />
        <rect x={-38} y={-6} width={12} height={12} transform="rotate(45 -32 0)" />
        <rect x={26} y={-6} width={12} height={12} transform="rotate(45 32 0)" />
      </g>
    )}
  </g>
);

/** Zzz letters floating up (t in frames since start). */
export const Zzz: React.FC<Place & { t: number; fill?: string }> = ({ t, fill = PAPER, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    {[0, 1, 2].map((i) => {
      const k = Math.max(0, t - i * 8);
      if (k <= 0) return null;
      const y = -((k * 1.4) % 90) - i * 40;
      return (
        <text key={i} x={i * 34} y={y} fontFamily={FONTS.comic} fontSize={40 + i * 16} fill={fill} stroke={INK} strokeWidth={6} paintOrder="stroke">
          Z
        </text>
      );
    })}
  </g>
);
