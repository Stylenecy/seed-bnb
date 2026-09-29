import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, INK, PAPER } from "../../kit";
import { BALL_COLORS, C, F } from "./theme";

/**
 * BINGOChain comic props. SVG <g> pieces follow kit/comicArt conventions
 * (designed around (0,0), placed with x/y/s/rot, thick ink outline); the
 * HTML <PopBall> is the beat-popping number ball used all over the video.
 */
type Place = { x: number; y: number; s?: number; rot?: number; opacity?: number };
const T = ({ x, y, s = 1, rot = 0 }: Place) => `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot}) scale(${s})`;
const SW = 6;

/** Column colour for a bingo number 1–25 (5 columns of 5, B-I-N-G-O). */
export const ballColor = (n: number) => BALL_COLORS[Math.min(4, Math.floor((n - 1) / 5))]!;

/** A glossy bingo ball (SVG, radius 50 at s=1). `label` = number or letter. */
export const BallSvg: React.FC<Place & { label: string | number; color?: string; textColor?: string }> = ({
  label,
  color,
  textColor = INK,
  ...pl
}) => {
  const fill = color ?? (typeof label === "number" ? ballColor(label) : C.neon);
  const str = String(label);
  return (
    <g transform={T(pl)} opacity={pl.opacity ?? 1}>
      <circle cx={6} cy={8} r={50} fill={INK} />
      <circle cx={0} cy={0} r={50} fill={fill} stroke={INK} strokeWidth={SW} />
      <path d="M-44 10 A46 46 0 0 0 44 10" fill="none" stroke={INK} strokeOpacity={0.18} strokeWidth={12} />
      <circle cx={0} cy={0} r={29} fill={PAPER} stroke={INK} strokeWidth={4} />
      <ellipse cx={-20} cy={-24} rx={14} ry={8} fill="#fff" opacity={0.6} transform="rotate(-35 -20 -24)" />
      <text
        x={0}
        y={str.length > 1 ? 11 : 12}
        textAnchor="middle"
        fontFamily={F.display}
        fontSize={str.length > 1 ? 30 : 34}
        fill={textColor}
      >
        {str}
      </text>
    </g>
  );
};

/**
 * HTML ball that DROPS + POPS on LOCAL frame `at` (squash on landing, spin
 * settle). (x, y) = centre in the parent px box; `size` = diameter.
 */
export const PopBall: React.FC<{
  at: number;
  x: number;
  y: number;
  size?: number;
  label: string | number;
  color?: string;
  rot?: number;
  drop?: number;
  exitAt?: number;
  punch?: number;
  glow?: string;
}> = ({ at, x, y, size = 120, label, color, rot = 0, drop = 140, exitAt, punch = 1, glow }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps, config: { damping: 9, stiffness: 230, mass: 0.6 } });
  const fall = interpolate(f, [at, at + 5], [-drop, 0], { ...clamp, easing: (t) => t * t });
  const land = f - at - 5;
  const squash = land >= 0 && land < 8 ? 1 + 0.16 * Math.exp(-land / 2.2) * Math.cos(land * 1.3) : 1;
  const out = exitAt !== undefined ? interpolate(f, [exitAt, exitAt + 8], [1, 0], clamp) : 1;
  const sc = interpolate(p, [0, 1], [0.35, 1]) * punch;
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        transform: `translateY(${fall}px) scale(${sc * squash}, ${sc / squash}) rotate(${rot + (1 - p) * -60}deg)`,
        transformOrigin: "50% 90%",
        opacity: out * interpolate(f, [at, at + 2], [0, 1], clamp),
        filter: glow ? `drop-shadow(0 0 22px ${glow})` : undefined,
      }}
    >
      <svg width={size} height={size} viewBox="-60 -60 124 124" style={{ overflow: "visible" }}>
        <BallSvg x={0} y={0} label={label} color={color} />
      </svg>
    </div>
  );
};

/**
 * 5×5 board (SVG). `marked` numbers glow neon; `hidden` shows the sealed
 * state (cells blank + "?"); `win` = row index to outline as the BINGO line.
 */
export const Board: React.FC<
  Place & { nums: readonly number[]; marked?: readonly number[]; hidden?: number; cell?: number; win?: number; winP?: number; light?: boolean }
> = ({ nums, marked = [], hidden = 0, cell = 56, win, winP = 0, light = false, ...pl }) => {
  const g = 8;
  const W = 5 * cell + 6 * g;
  return (
    <g transform={T(pl)} opacity={pl.opacity ?? 1}>
      <rect x={-W / 2 + 8} y={-W / 2 + 10} width={W} height={W} rx={16} fill={INK} />
      <rect x={-W / 2} y={-W / 2} width={W} height={W} rx={16} fill={light ? PAPER : C.card} stroke={INK} strokeWidth={SW} />
      {nums.map((n, i) => {
        const r = Math.floor(i / 5);
        const c = i % 5;
        const cx = -W / 2 + g + c * (cell + g);
        const cy = -W / 2 + g + r * (cell + g);
        const on = marked.includes(n);
        return (
          <g key={i}>
            <rect
              x={cx}
              y={cy}
              width={cell}
              height={cell}
              rx={10}
              fill={on ? C.neon : light ? "#e3e8f5" : C.surface}
              stroke={INK}
              strokeWidth={on ? 4 : 2.5}
            />
            <text
              x={cx + cell / 2}
              y={cy + cell / 2 + cell * 0.18}
              textAnchor="middle"
              fontFamily={F.display}
              fontSize={cell * 0.5}
              fill={on ? INK : light ? INK : C.text}
              opacity={1 - hidden}
            >
              {n}
            </text>
          </g>
        );
      })}
      {hidden > 0 ? (
        <g opacity={hidden}>
          {nums.map((_, i) => {
            const r = Math.floor(i / 5);
            const c = i % 5;
            const cx = -W / 2 + g + c * (cell + g);
            const cy = -W / 2 + g + r * (cell + g);
            return (
              <text key={i} x={cx + cell / 2} y={cy + cell / 2 + cell * 0.18} textAnchor="middle" fontFamily={F.comic} fontSize={cell * 0.55} fill={C.textDim}>
                ?
              </text>
            );
          })}
        </g>
      ) : null}
      {win !== undefined && winP > 0 ? (
        <rect
          x={-W / 2 + g - 7}
          y={-W / 2 + g + win * (cell + g) - 7}
          width={(5 * cell + 4 * g + 14) * winP}
          height={cell + 14}
          rx={14}
          fill="none"
          stroke={C.gold}
          strokeWidth={7}
        />
      ) : null}
    </g>
  );
};

/** Padlock (SVG). `shut` 0..1 drops the shackle. */
export const Padlock: React.FC<Place & { shut?: number; fill?: string }> = ({ shut = 1, fill = C.gold, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <path d={`M-30 ${-10 - (1 - shut) * 26} v-26 a30 30 0 0 1 60 0 v${26 + (1 - shut) * 8}`} fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" />
    <path d={`M-30 ${-10 - (1 - shut) * 26} v-26 a30 30 0 0 1 60 0 v${26 + (1 - shut) * 8}`} fill="none" stroke="#c9d2e3" strokeWidth={7} strokeLinecap="round" />
    <rect x={-50} y={-14} width={100} height={78} rx={14} fill={fill} stroke={INK} strokeWidth={SW} />
    <circle cx={0} cy={18} r={10} fill={INK} />
    <rect x={-4} y={20} width={8} height={24} rx={3} fill={INK} />
  </g>
);

/** "THE HOUSE": a shifty casino cabinet with a hidden draw drum. `look` −1..1 moves the eyes. */
export const House: React.FC<Place & { look?: number; grin?: number; spin?: number; sign?: string }> = ({
  look = 0,
  grin = 0,
  spin = 0,
  sign = "THE HOUSE",
  ...pl
}) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <rect x={-120} y={-150} width={240} height={330} rx={24} fill="#6b3fa0" stroke={INK} strokeWidth={SW} />
    <rect x={-140} y={-205} width={280} height={70} rx={14} fill={C.full} stroke={INK} strokeWidth={SW} />
    <text x={0} y={-157} textAnchor="middle" fontFamily={F.comic} fontSize={44} fill={INK}>
      {sign}
    </text>
    {/* visor + eyes */}
    <rect x={-92} y={-116} width={184} height={62} rx={30} fill={INK} />
    <circle cx={-40 + look * 18} cy={-85} r={13} fill="#ff4d6d" />
    <circle cx={40 + look * 18} cy={-85} r={13} fill="#ff4d6d" />
    {/* grin */}
    <path d={`M-58 -26 Q0 ${-26 + 30 * grin + 8} 58 -26`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
    {/* hidden drum */}
    <circle cx={0} cy={84} r={70} fill="#2a1848" stroke={INK} strokeWidth={SW} />
    <g transform={`rotate(${spin} 0 84)`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={Math.cos((i / 5) * Math.PI * 2) * 36} cy={84 + Math.sin((i / 5) * Math.PI * 2) * 36} r={15} fill={BALL_COLORS[i]} stroke={INK} strokeWidth={3} opacity={0.75} />
      ))}
    </g>
    <circle cx={0} cy={84} r={70} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="10 10" />
    <text x={0} y={102} textAnchor="middle" fontFamily={F.comic} fontSize={56} fill={C.text} stroke={INK} strokeWidth={2}>
      ?
    </text>
  </g>
);

/** Small "hash" tag (SVG): a paper ticket with a hex fingerprint. */
export const HashTag: React.FC<Place & { text: string }> = ({ text, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <rect x={-120} y={-30} width={240} height={60} rx={10} fill={PAPER} stroke={INK} strokeWidth={5} />
    <circle cx={-96} cy={0} r={8} fill={INK} />
    <text x={12} y={10} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={26} fill={INK}>
      {text}
    </text>
  </g>
);

/** Big check-mark stamp (SVG). `p` 0..1 draws it. */
export const Check: React.FC<Place & { p?: number; color?: string }> = ({ p = 1, color = C.neon, ...pl }) => (
  <g transform={T(pl)} opacity={pl.opacity ?? 1}>
    <circle cx={0} cy={0} r={62} fill={color} stroke={INK} strokeWidth={SW} />
    <path d="M-30 2 L-8 26 L34 -24" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
  </g>
);
