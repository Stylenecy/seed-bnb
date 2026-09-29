import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { BNB_GOLD, clamp, FONTS, INK, PAPER } from "../../kit";
import { C, F } from "./theme";

/** Code-drawn comic props for Gridora (SVG <g>, positioned in the parent svg). */
type Place = { x: number; y: number; s?: number; rot?: number };
const T = ({ x, y, s = 1, rot = 0 }: Place) => `translate(${x}, ${y}) rotate(${rot}) scale(${s})`;

/** A clipboard "PLAN" card. `scribble` 0..1 scratches the lines out and scrawls a new plan. */
export const PlanCard: React.FC<Place & { lines: string[]; scribble?: number; newLine?: string }> = ({ lines, scribble = 0, newLine, ...pl }) => (
  <g transform={T(pl)}>
    <rect x={-130} y={-160} width={260} height={320} rx={16} fill="#c8844f" stroke={INK} strokeWidth={8} />
    <rect x={-112} y={-130} width={224} height={274} rx={6} fill={PAPER} stroke={INK} strokeWidth={5} />
    <rect x={-50} y={-176} width={100} height={40} rx={10} fill="#9aa3b5" stroke={INK} strokeWidth={6} />
    <text x={0} y={-88} textAnchor="middle" fontFamily={FONTS.comic} fontSize={46} fill={INK}>
      THE PLAN
    </text>
    {lines.map((l, i) => (
      <text key={i} x={-94} y={-36 + i * 44} fontFamily={FONTS.mono} fontWeight={700} fontSize={26} fill={INK}>
        {l}
      </text>
    ))}
    {scribble > 0
      ? lines.map((_, i) => {
          const p = interpolate(scribble, [i * 0.2, i * 0.2 + 0.35], [0, 1], clamp);
          const d = `M-100 ${-44 + i * 44} q20 -14 40 0 t40 0 t40 0 t40 0 t40 0`;
          return <path key={`s${i}`} d={d} stroke={C.neg} strokeWidth={8} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />;
        })
      : null}
    {newLine && scribble > 0.7 ? (
      <text x={0} y={122} textAnchor="middle" fontFamily={FONTS.comic} fontSize={40} fill={C.neg} transform="rotate(-6 0 122)" opacity={interpolate(scribble, [0.7, 0.85], [0, 1], clamp)}>
        {newLine}
      </text>
    ) : null}
  </g>
);

/** A chunky pencil with an eraser end (for "editing the plan after the fact"). */
export const Pencil: React.FC<Place> = (pl) => (
  <g transform={T(pl)}>
    <rect x={-18} y={-150} width={36} height={220} fill={BNB_GOLD} stroke={INK} strokeWidth={6} />
    <rect x={-18} y={-186} width={36} height={40} rx={8} fill="#f49ac1" stroke={INK} strokeWidth={6} />
    <rect x={-20} y={-152} width={40} height={16} fill="#9aa3b5" stroke={INK} strokeWidth={5} />
    <path d="M-18 70 L0 118 L18 70 Z" fill="#f2d2a9" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-6 100 L0 118 L6 100 Z" fill={INK} />
  </g>
);

/** A price chart panel: a line that runs flat then dumps. `p` draws it, `crash` 0..1 drops the tail. */
export const DumpChart: React.FC<Place & { p: number; label?: string }> = ({ p, label, ...pl }) => {
  const pts = Array.from({ length: 30 }, (_, i) => {
    const t = i / 29;
    const wob = Math.sin(t * 22) * 14;
    const dump = t > 0.55 ? Math.pow((t - 0.55) / 0.45, 1.4) * 170 : 0;
    return [-130 + t * 260, -30 + wob + dump] as const;
  });
  const n = Math.max(2, Math.round(p * pts.length));
  const d = pts.slice(0, n).map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");
  return (
    <g transform={T(pl)}>
      <rect x={-160} y={-150} width={320} height={300} rx={18} fill="#fff7f2" stroke={INK} strokeWidth={8} />
      <rect x={-160} y={-150} width={320} height={44} rx={18} fill={INK} />
      <circle cx={-134} cy={-128} r={6} fill="#ff5f57" />
      <circle cx={-116} cy={-128} r={6} fill="#febc2e" />
      <circle cx={-98} cy={-128} r={6} fill="#28c840" />
      {[-60, -10, 40, 90].map((y) => (
        <line key={y} x1={-140} x2={140} y1={y} y2={y} stroke={INK} strokeOpacity={0.12} strokeWidth={3} />
      ))}
      <path d={d} stroke={INK} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={C.neg} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {label ? (
        <text x={60} y={-60} textAnchor="middle" fontFamily={FONTS.comic} fontSize={54} fill={C.neg} stroke={INK} strokeWidth={6} paintOrder="stroke">
          {label}
        </text>
      ) : null}
    </g>
  );
};

/** A wax seal with a "#" (the config hash, committed). `press` 0..1 stamps it down. */
export const HashSeal: React.FC<Place & { press?: number; label?: string }> = ({ press = 1, label = "0xb835…", ...pl }) => (
  <g transform={T(pl)}>
    <g transform={`translate(0 ${(1 - press) * -90}) scale(${1 + (1 - press) * 0.3})`} opacity={interpolate(press, [0, 0.2], [0, 1], clamp)}>
      <path d="M0 -96 L22 -76 L50 -84 L58 -56 L86 -46 L78 -18 L96 0 L78 18 L86 46 L58 56 L50 84 L22 76 L0 96 L-22 76 L-50 84 L-58 56 L-86 46 L-78 18 L-96 0 L-78 -18 L-86 -46 L-58 -56 L-50 -84 L-22 -76 Z" fill={C.clay} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <circle r={62} fill={C.coral} stroke={INK} strokeWidth={5} />
      <text y={30} textAnchor="middle" fontFamily={FONTS.comic} fontSize={96} fill={C.cream} stroke={INK} strokeWidth={5} paintOrder="stroke">
        #
      </text>
    </g>
    <text y={138} textAnchor="middle" fontFamily={FONTS.mono} fontWeight={700} fontSize={24} fill={INK} opacity={press}>
      {label}
    </text>
  </g>
);

/** A shield with a key: TWAK signs locally, keys never leave the machine. */
export const KeyShield: React.FC<Place & { glow?: number }> = ({ glow = 0, ...pl }) => (
  <g transform={T(pl)}>
    {glow > 0 ? <circle r={140} fill={C.volt} opacity={0.25 * glow} /> : null}
    <path d="M0 -120 L100 -84 Q104 40 0 120 Q-104 40 -100 -84 Z" fill="#3375BB" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
    <g transform="translate(-6 6) rotate(-30)">
      <circle cx={-34} cy={0} r={30} fill={BNB_GOLD} stroke={INK} strokeWidth={7} />
      <circle cx={-34} cy={0} r={10} fill="#3375BB" stroke={INK} strokeWidth={4} />
      <rect x={-6} y={-10} width={90} height={20} rx={6} fill={BNB_GOLD} stroke={INK} strokeWidth={6} />
      <rect x={52} y={6} width={12} height={22} fill={BNB_GOLD} stroke={INK} strokeWidth={5} />
      <rect x={70} y={6} width={12} height={16} fill={BNB_GOLD} stroke={INK} strokeWidth={5} />
    </g>
  </g>
);

/** An open journal book; `rows` of `total` lines are written in (PnL chips). */
export const JournalBook: React.FC<Place & { rows?: number; total?: number; chip?: string }> = ({ rows = 0, total = 4, chip = "+85", ...pl }) => (
  <g transform={T(pl)}>
    <path d="M-170 -110 Q-85 -135 0 -110 L0 120 Q-85 95 -170 120 Z" fill={PAPER} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <path d="M170 -110 Q85 -135 0 -110 L0 120 Q85 95 170 120 Z" fill="#ece3cf" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    {Array.from({ length: total }, (_, i) => (
      <g key={i}>
        <line x1={-150} y1={-70 + i * 44} x2={-20} y2={-70 + i * 44} stroke={INK} strokeWidth={3} opacity={0.3} />
        <line x1={20} y1={-70 + i * 44} x2={150} y2={-70 + i * 44} stroke={INK} strokeWidth={3} opacity={0.3} />
        {i < rows ? <rect x={-150} y={-88 + i * 44} width={96 + (i % 2) * 24} height={12} rx={6} fill={C.coral} /> : null}
        {i < rows ? (
          <g>
            <rect x={30} y={-96} width={96} height={30} rx={15} fill={C.volt} stroke={INK} strokeWidth={4} transform={`translate(0 ${i * 44})`} />
            <text x={78} y={-73 + i * 44} textAnchor="middle" fontFamily={FONTS.mono} fontWeight={800} fontSize={20} fill={INK}>
              {chip}
            </text>
          </g>
        ) : null}
      </g>
    ))}
  </g>
);

/** Rubber stamp (HTML) that slams on at local frame `at`. */
export const Stamp: React.FC<{ at: number; text: string; x: number; y: number; rot: number; color?: string; size?: number }> = ({ at, text, x, y, rot, color = C.neg, size = 60 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const p = interpolate(f, [at, at + 5], [1.8, 1], clamp);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${p})`, padding: "6px 22px", border: `7px solid ${color}`, color, fontFamily: F.comic, fontSize: size, letterSpacing: "0.06em", background: "rgba(255,255,255,0.8)", opacity: interpolate(f, [at, at + 3], [0, 1], clamp), whiteSpace: "nowrap" }}>
      {text}
    </div>
  );
};

/* ------------------------------------------------------------ the grid ladder */

/** Deterministic oscillating price path used by the ladder illustrations. */
export const pricePath = (n: number, seed = 1) =>
  Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return Math.sin(t * Math.PI * 2 * 3.2 + seed) * 0.62 + Math.sin(t * Math.PI * 2 * 7.1 + seed * 2) * 0.22 + Math.sin(t * 31 + seed) * 0.06;
  });

/**
 * A mini grid ladder (SVG <g>, comic ink): SELL rungs above mid, BUY rungs below,
 * a price line drawn to `p`; rungs it crosses light up.
 */
export const MiniLadder: React.FC<Place & { p: number; w?: number; h?: number; levels?: number }> = ({ p, w = 300, h = 300, levels = 6, ...pl }) => {
  const N = 90;
  const path = pricePath(N, 0.4);
  const head = Math.max(1, Math.floor(p * (N - 1)));
  const yOf = (v: number) => -v * (h / 2) * 0.82;
  const xOf = (i: number) => -w / 2 + (i / (N - 1)) * w;
  const rungs = Array.from({ length: levels }, (_, i) => (i - (levels - 1) / 2) / ((levels - 1) / 2)); // -1..1
  const d = path.slice(0, head + 1).map((v, i) => `${i ? "L" : "M"}${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}`).join(" ");
  return (
    <g transform={T(pl)}>
      <rect x={-w / 2 - 24} y={-h / 2 - 24} width={w + 48} height={h + 48} rx={16} fill="#fff7f2" stroke={INK} strokeWidth={7} />
      {rungs.map((r, i) => {
        const y = yOf(r * 0.78);
        const hit = path.slice(0, head + 1).some((v, j) => j > 0 && (path[j - 1]! - r * 0.78) * (v - r * 0.78) <= 0);
        const col = r > 0 ? C.clay : C.lime;
        return (
          <g key={i}>
            <line x1={-w / 2} x2={w / 2} y1={y} y2={y} stroke={col} strokeWidth={hit ? 6 : 4} strokeDasharray="10 8" opacity={hit ? 1 : 0.55} />
            <text x={w / 2 + 8} y={y + 7} fontFamily={FONTS.comic} fontSize={20} fill={col}>
              {r > 0 ? "S" : "B"}
            </text>
          </g>
        );
      })}
      <line x1={-w / 2} x2={w / 2} y1={0} y2={0} stroke={INK} strokeWidth={3} opacity={0.5} />
      <path d={d} stroke={INK} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={C.coral} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xOf(head)} cy={yOf(path[head]!)} r={11} fill={C.volt} stroke={INK} strokeWidth={4} />
    </g>
  );
};

/** Soulbound ERC-8004 identity card (non-transferable: a chained padlock). */
export const SoulCard: React.FC<Place & { id?: string; shine?: number }> = ({ id = "#1", shine = 0, ...pl }) => (
  <g transform={T(pl)}>
    <rect x={-160} y={-105} width={320} height={210} rx={22} fill="#2a1a13" stroke={INK} strokeWidth={9} />
    <rect x={-160} y={-105} width={320} height={210} rx={22} fill="none" stroke={BNB_GOLD} strokeWidth={4} opacity={0.9} />
    <g transform="translate(-92 -22) scale(0.13) translate(-512 -512)">
      <path d="M 741.8 704.8 A 300 300 0 1 1 741.8 319.2" fill="none" stroke={C.coral} strokeWidth={128} strokeLinecap="round" />
      <rect x={506} y={448} width={308} height={128} rx={64} fill={C.coral} />
    </g>
    <text x={60} y={22} textAnchor="middle" fontFamily={FONTS.comic} fontSize={100} fill={PAPER} stroke={INK} strokeWidth={6} paintOrder="stroke">
      {id}
    </text>
    <text x={0} y={82} textAnchor="middle" fontFamily={FONTS.mono} fontWeight={700} fontSize={22} fill={C.coralHi} letterSpacing={3}>
      ERC-8004 · SOULBOUND
    </text>
    <g transform="translate(130 -96)">
      <path d="M-14 -4 v-12 a14 14 0 0 1 28 0 v12" fill="none" stroke={INK} strokeWidth={7} />
      <rect x={-20} y={-6} width={40} height={32} rx={6} fill={BNB_GOLD} stroke={INK} strokeWidth={5} />
    </g>
    {shine > 0 ? <path d={`M${-220 + shine * 440} -105 l60 0 l-60 210 l-60 0 Z`} fill="#fff" opacity={0.22} /> : null}
  </g>
);
