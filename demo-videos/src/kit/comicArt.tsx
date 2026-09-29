import React from "react";
import { FONTS } from "./fonts";
import { BNB_GOLD, INK, PAPER } from "./tokens";

/**
 * comicArt — bold vector comic "actors" and props, drawn as SVG <g> groups
 * (place inside an <svg viewBox="0 0 1920 1080">). Each is designed around
 * (0,0) in a ~200px box; position with x/y, size with s, tilt with rot.
 * Style: flat fills + thick ink outline + one hard highlight. No stock/AI art.
 */

type Place = { x: number; y: number; s?: number; rot?: number; opacity?: number };
const T = ({ x, y, s = 1, rot = 0 }: Place) => `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot}) scale(${s})`;
const SW = 6; // ink stroke

/* ------------------------------------------------------------------ Person */

export type Mood = "happy" | "sad" | "shock" | "neutral" | "wink";
export type Pose = "stand" | "cheer" | "slump" | "point" | "hold";

const Face: React.FC<{ mood: Mood; cx: number; cy: number }> = ({ mood, cx, cy }) => (
  <g>
    {mood === "wink" ? (
      <path d={`M${cx - 20} ${cy - 6} q7 -6 14 0`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
    ) : (
      <circle cx={cx - 13} cy={cy - 6} r={mood === "shock" ? 6 : 5} fill={INK} />
    )}
    <circle cx={cx + 13} cy={cy - 6} r={mood === "shock" ? 6 : 5} fill={INK} />
    {mood === "happy" || mood === "wink" ? (
      <path d={`M${cx - 14} ${cy + 9} q14 14 28 0`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
    ) : mood === "sad" ? (
      <path d={`M${cx - 12} ${cy + 16} q12 -11 24 0`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
    ) : mood === "shock" ? (
      <ellipse cx={cx} cy={cy + 14} rx={7} ry={9} fill={INK} />
    ) : (
      <path d={`M${cx - 10} ${cy + 12} h20`} stroke={INK} strokeWidth={5} strokeLinecap="round" />
    )}
    {mood === "sad" ? <path d={`M${cx + 24} ${cy - 18} q6 10 0 14 q-6 -4 0 -14z`} fill="#7FD3FF" stroke={INK} strokeWidth={2.5} /> : null}
  </g>
);

/** A chunky comic person. `body` = shirt colour, `skin` = head fill. */
export const Person: React.FC<
  Place & { body?: string; skin?: string; hair?: string; mood?: Mood; pose?: Pose; wave?: number; children?: React.ReactNode }
> = ({ body = "#E8457E", skin = "#FFD9B8", hair = INK, mood = "neutral", pose = "stand", wave = 0, children, ...pl }) => {
  const slump = pose === "slump";
  const headY = slump ? -70 : -84;
  const headX = slump ? 8 : 0;
  // arm endpoints (shoulders at ±38,-30)
  const arms: Record<Pose, [number, number, number, number]> = {
    stand: [-58, 30, 58, 30],
    cheer: [-66, -96 + wave, 66, -96 - wave],
    slump: [-40, 44, 40, 44],
    point: [-58, 30, 96, -34 + wave],
    hold: [-34, 10, 34, 10],
  };
  const [lx, ly, rx, ry] = arms[pose];
  return (
    <g transform={T(pl)} opacity={pl.opacity ?? 1}>
      {/* legs */}
      <path d="M-20 60 L-24 112 M20 60 L24 112" stroke={INK} strokeWidth={16} strokeLinecap="round" />
      {/* torso */}
      <path
        d={slump ? "M-40 -30 Q0 -46 44 -26 L36 66 Q0 76 -36 66 Z" : "M-42 -40 Q0 -54 42 -40 L36 66 Q0 76 -36 66 Z"}
        fill={body}
        stroke={INK}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path d="M-26 -30 Q-30 10 -24 50" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={7} fill="none" strokeLinecap="round" />
      {/* arms in front of the torso (ink under, colour over); hands drawn after props */}
      <path d={`M-36 -28 L${lx} ${ly} M36 -28 L${rx} ${ry}`} stroke={INK} strokeWidth={22} strokeLinecap="round" />
      <path d={`M-36 -28 L${lx} ${ly} M36 -28 L${rx} ${ry}`} stroke={body} strokeWidth={11} strokeLinecap="round" />
      {/* head */}
      <g transform={slump ? `rotate(14 ${headX} ${headY})` : undefined}>
        <circle cx={headX} cy={headY} r={40} fill={skin} stroke={INK} strokeWidth={SW} />
        <path d={`M${headX - 40} ${headY - 6} Q${headX - 36} ${headY - 50} ${headX} ${headY - 44} Q${headX + 40} ${headY - 48} ${headX + 40} ${headY - 8} Q${headX + 20} ${headY - 30} ${headX - 40} ${headY - 6}Z`} fill={hair} stroke={INK} strokeWidth={4} />
        <Face mood={mood} cx={headX} cy={headY + 8} />
      </g>
      {children}
      <circle cx={lx} cy={ly} r={10} fill={skin} stroke={INK} strokeWidth={4} />
      <circle cx={rx} cy={ry} r={10} fill={skin} stroke={INK} strokeWidth={4} />
    </g>
  );
};

/* ------------------------------------------------------------------- Phone */

export const Phone: React.FC<Place & { screen?: string; label?: string; labelColor?: string; w?: number; h?: number }> = ({
  screen = "#141414",
  label,
  labelColor = PAPER,
  w = 84,
  h = 150,
  ...pl
}) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={16} fill="#26262a" stroke={INK} strokeWidth={SW} />
    <rect x={-w / 2 + 8} y={-h / 2 + 14} width={w - 16} height={h - 28} rx={8} fill={screen} />
    <rect x={-12} y={-h / 2 + 5} width={24} height={5} rx={3} fill={INK} />
    {label ? (
      <text x={0} y={8} textAnchor="middle" fontFamily={FONTS.comic} fontSize={w * 0.36} fill={labelColor}>
        {label}
      </text>
    ) : null}
  </g>
);

/* ------------------------------------------------------------------- Vault */

/** Pool / vault: a heavy safe with a spinning dial (`dial` deg). */
export const Vault: React.FC<Place & { fill?: string; dial?: number; label?: string; open?: number }> = ({
  fill = "#3A3F4B",
  dial = 0,
  label,
  open = 0,
  ...pl
}) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <rect x={-92} y={-86} width={184} height={172} rx={18} fill={fill} stroke={INK} strokeWidth={SW} />
    <rect x={-78} y={-72} width={156} height={144} rx={12} fill="none" stroke="#ffffff" strokeOpacity={0.18} strokeWidth={4} />
    <rect x={-92} y={86} width={36} height={16} rx={4} fill={INK} />
    <rect x={56} y={86} width={36} height={16} rx={4} fill={INK} />
    <g transform={`rotate(${dial})`}>
      <circle r={44} fill="#C9CED8" stroke={INK} strokeWidth={SW} />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <line key={a} x1={0} y1={0} x2={Math.cos((a * Math.PI) / 180) * 36} y2={Math.sin((a * Math.PI) / 180) * 36} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      ))}
      <circle r={12} fill={BNB_GOLD} stroke={INK} strokeWidth={4} />
    </g>
    {open > 0 ? (
      <rect x={-92} y={-86} width={184 * (1 - open)} height={172} rx={18} fill={fill} stroke={INK} strokeWidth={SW} opacity={0.9} />
    ) : null}
    {label ? (
      <g>
        <rect x={-86} y={-128} width={172} height={36} rx={6} fill={PAPER} stroke={INK} strokeWidth={4} />
        <text x={0} y={-101} textAnchor="middle" fontFamily={FONTS.comic} fontSize={26} fill={INK}>
          {label}
        </text>
      </g>
    ) : null}
  </g>
);

/* ------------------------------------------------------------------- Robot */

/** Relayer bot: boxy head, visor, antenna, little jet flame (`flame` 0..1). */
export const Robot: React.FC<Place & { fill?: string; visor?: string; flame?: number; mood?: "happy" | "neutral" }> = ({
  fill = "#9AA3B5",
  visor = "#5EF0FF",
  flame = 0,
  mood = "happy",
  ...pl
}) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    {flame > 0 ? (
      <path d={`M-26 70 Q0 ${110 + flame * 60} 26 70 Z`} fill={BNB_GOLD} stroke={INK} strokeWidth={4} />
    ) : null}
    <line x1={0} y1={-120} x2={0} y2={-92} stroke={INK} strokeWidth={6} />
    <circle cx={0} cy={-124} r={10} fill={BNB_GOLD} stroke={INK} strokeWidth={4} />
    <rect x={-64} y={-94} width={128} height={92} rx={22} fill={fill} stroke={INK} strokeWidth={SW} />
    <rect x={-46} y={-72} width={92} height={40} rx={16} fill={INK} />
    <rect x={-40} y={-66} width={80} height={28} rx={12} fill={visor} />
    {mood === "happy" ? (
      <>
        <path d="M-26 -50 q8 -9 16 0" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
        <path d="M10 -50 q8 -9 16 0" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      </>
    ) : (
      <>
        <circle cx={-18} cy={-52} r={6} fill={INK} />
        <circle cx={18} cy={-52} r={6} fill={INK} />
      </>
    )}
    <path d="M-50 4 L50 4 L42 72 L-42 72 Z" fill={fill} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    <circle cx={0} cy={36} r={16} fill={BNB_GOLD} stroke={INK} strokeWidth={4} />
    <path d="M-50 14 L-84 40 M50 14 L84 40" stroke={INK} strokeWidth={18} strokeLinecap="round" />
    <path d="M-50 14 L-84 40 M50 14 L84 40" stroke={fill} strokeWidth={9} strokeLinecap="round" />
  </g>
);

/* ---------------------------------------------------------------- Envelope */

/** Sealed envelope with a padlock — the encrypted claim key. */
export const LockedEnvelope: React.FC<Place & { fill?: string; lock?: string }> = ({ fill = PAPER, lock = BNB_GOLD, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <rect x={-70} y={-46} width={140} height={92} rx={8} fill={fill} stroke={INK} strokeWidth={SW} />
    <path d="M-70 -46 L0 12 L70 -46" fill="none" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
    <g transform="translate(40 26)">
      <path d="M-14 -6 v-12 a14 14 0 0 1 28 0 v12" fill="none" stroke={INK} strokeWidth={7} />
      <rect x={-22} y={-8} width={44} height={36} rx={6} fill={lock} stroke={INK} strokeWidth={5} />
      <circle cx={0} cy={8} r={5} fill={INK} />
    </g>
  </g>
);

/* ----------------------------------------------------------------- GasPump */

/** Gas pump with a fuel gauge; `level` 0..1 swings the needle. */
export const GasPump: React.FC<Place & { fill?: string; level?: number; label?: string }> = ({
  fill = "#FF5A4E",
  level = 0,
  label,
  ...pl
}) => {
  const a = -150 + 120 * level; // needle angle
  return (
    <g transform={T(pl)} opacity={pl.opacity ?? 1}>
      <path d="M56 -40 q40 0 40 40 v60 q0 16 -14 16" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <rect x={-64} y={-100} width={124} height={196} rx={14} fill={fill} stroke={INK} strokeWidth={SW} />
      <rect x={-76} y={92} width={148} height={20} rx={6} fill={INK} />
      <circle cx={-2} cy={-36} r={40} fill={PAPER} stroke={INK} strokeWidth={5} />
      <path d="M-30 -30 A30 30 0 0 1 26 -30" fill="none" stroke="#FF5A4E" strokeWidth={6} />
      <line x1={-2} y1={-36} x2={-2 + Math.cos((a * Math.PI) / 180) * 30} y2={-36 + Math.sin((a * Math.PI) / 180) * 30} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <circle cx={-2} cy={-36} r={6} fill={INK} />
      {label ? (
        <text x={-2} y={48} textAnchor="middle" fontFamily={FONTS.comic} fontSize={34} fill={PAPER} stroke={INK} strokeWidth={5} paintOrder="stroke">
          {label}
        </text>
      ) : null}
    </g>
  );
};

/* ------------------------------------------------------------------ Wallet */

export const Wallet: React.FC<Place & { fill?: string; label?: string; labelColor?: string }> = ({
  fill = "#6E4A2E",
  label,
  labelColor = PAPER,
  ...pl
}) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <rect x={-80} y={-54} width={160} height={108} rx={16} fill={fill} stroke={INK} strokeWidth={SW} />
    <rect x={20} y={-22} width={70} height={44} rx={10} fill={fill} stroke={INK} strokeWidth={5} />
    <circle cx={44} cy={0} r={8} fill={BNB_GOLD} stroke={INK} strokeWidth={3} />
    {label ? (
      <text x={-28} y={12} textAnchor="middle" fontFamily={FONTS.comic} fontSize={34} fill={labelColor} stroke={INK} strokeWidth={5} paintOrder="stroke">
        {label}
      </text>
    ) : null}
  </g>
);

/* --------------------------------------------------------------- Treasury */

/** Small piggy-bank-ish treasury jar. */
export const Jar: React.FC<Place & { fill?: string; label?: string }> = ({ fill = "#7AE3A0", label, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <rect x={-40} y={-62} width={80} height={16} rx={5} fill={INK} />
    <path d="M-46 -46 h92 q14 0 14 22 v58 q0 26 -30 26 h-60 q-30 0 -30 -26 v-58 q0 -22 14 -22z" fill={fill} fillOpacity={0.85} stroke={INK} strokeWidth={SW} />
    <path d="M-40 -30 q-6 30 0 60" stroke="#fff" strokeOpacity={0.5} strokeWidth={7} fill="none" strokeLinecap="round" />
    {label ? (
      <text x={0} y={14} textAnchor="middle" fontFamily={FONTS.comic} fontSize={30} fill={INK}>
        {label}
      </text>
    ) : null}
  </g>
);

/* -------------------------------------------------------------- SweatDrops */

export const SweatDrops: React.FC<Place> = (pl) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    {[
      [0, 0, 1],
      [26, 18, 0.8],
      [-18, 26, 0.7],
    ].map(([dx, dy, k], i) => (
      <path key={i} d={`M${dx} ${dy} q${8 * k!} ${14 * k!} 0 ${20 * k!} q${-8 * k!} ${-6 * k!} 0 ${-20 * k!}z`} fill="#7FD3FF" stroke={INK} strokeWidth={3} />
    ))}
  </g>
);
