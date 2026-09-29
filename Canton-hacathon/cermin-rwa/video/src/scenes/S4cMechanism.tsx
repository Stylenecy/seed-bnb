import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Atmosphere, Sfx } from "../lib/ui";
import { Pulse } from "../lib/Pulse";
import { ComicText } from "../lib/ComicText";
import { COLORS } from "../lib/tokens";
import { FONT_SANS } from "../lib/fonts";
import { barB, beatB } from "../lib/beat";

/**
 * S4c · THE MECHANISM — a code-drawn, comic-styled animated chart that states
 * the whole anti-liquidation trick in one picture: a falling PRICE line, an
 * AMBER "MY DEFENSE LINE" it keeps bouncing off (auto-repay), and a TERRACOTTA
 * "LIQUIDATION" line far below that it NEVER gets near. Every rescue makes the
 * system SAFER — the defense line steps DOWN a notch because repaying shrinks
 * the loan, so the breach price drops.
 *
 * Not a generated image — precision is the point. Comic identity comes from
 * ink-weight strokes, a thick framed panel, a halftone dot overlay, a small
 * hand-drawn sine wobble on the lines and Bangers (`ComicText`) labels.
 *
 * Window barB(16)→barB(22) (6 bars). Local grid (S = barB(16), one beat 14.06f):
 *   bar 16  0→56     panel + ink axes draw; the two dashed lines draw L→R;
 *                    "MY DEFENSE LINE" (amber) + "LIQUIDATION" (terracotta) tags pop
 *   bar 17  56→112   gold price line animates in from the left, wandering down
 *   bar 18  112      TOUCH 1 → flash + "AUTO-REPAY!" + coin burst + bounce, and
 *                    the DEFENSE LINE STEPS DOWN ("DEBT ↓")
 *   bar 19  169      price wanders down again
 *   bar 20  225      TOUCH 2 → same beat; defense steps down again, liquidation
 *                    line unmoved and now even further below
 *   bar 21  281→337  camera eases wider; a bracket highlights the untouched gap;
 *                    "NEVER. EVEN. CLOSE." + a calm caption. Hold to the cut.
 */
const S = barB(16);
/** kth beat into the scene (bar 16 = part-B beat 64). */
const beat = (n: number): number => beatB(64 + n) - S;

// Touch / step frames (bar downbeats).
const T1 = beat(8); // bar 18 · 112
const T2 = beat(16); // bar 20 · 225
const BAR21 = beat(20); // 281

const clampBoth = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* -------------------------------------------------- chart coordinate system */

// SVG authoring box (scaled by CSS to fill the content panel below).
const VBW = 1520;
const VBH = 660;
// Plot bounds inside the box.
const PL = 150;
const PR = 1360;
const PT = 80;
const PB = 560;
// Where the SVG panel sits in 1920×1080 content space (kept ~proportional).
const PANEL_X = 160;
const PANEL_Y = 200;
const PANEL_W = 1600;
const PANEL_H = 695;

// Normalized price levels (0 = plot bottom, 1 = plot top).
const VLIQ = 0.13; // liquidation — near the floor
const VDEF0 = 0.68; // defense, before any rescue
const VDEF1 = 0.55; // after rescue 1
const VDEF2 = 0.42; // after rescue 2

const pxAt = (t: number): number => PL + t * (PR - PL);
const pyAt = (v: number): number => PB - v * (PB - PT);
const toContentX = (sx: number): number => PANEL_X + (sx / VBW) * PANEL_W;
const toContentY = (sy: number): number => PANEL_Y + (sy / VBH) * PANEL_H;

// Contact points where the price touches the (then-current) defense line.
const C1X = pxAt(0.3);
const C1Y = pyAt(VDEF0);
const C2X = pxAt(0.66);
const C2Y = pyAt(VDEF1);

const smoothstep = (a: number, b: number, x: number): number => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

// Price path anchors (x-fraction, v). The touch anchors sit EXACTLY on the
// defense levels so each contact is clean; a tapered sine adds hand-drawn wander.
const PRICE_ANCHORS: [number, number][] = [
  [0.0, 0.94],
  [0.3, VDEF0], // touch 1
  [0.42, 0.82], // bounce 1
  [0.66, VDEF1], // touch 2
  [0.78, 0.7], // bounce 2
  [1.0, 0.66],
];

const priceBaseV = (t: number): number => {
  for (let i = 1; i < PRICE_ANCHORS.length; i++) {
    const a = PRICE_ANCHORS[i - 1]!;
    const b = PRICE_ANCHORS[i]!;
    if (t <= b[0]) return a[1] + (b[1] - a[1]) * smoothstep(a[0], b[0], t);
  }
  return PRICE_ANCHORS[PRICE_ANCHORS.length - 1]![1];
};

const touchTaper = (t: number): number =>
  Math.min(Math.min(Math.abs(t - 0.3), Math.abs(t - 0.66)) / 0.05, 1);

const priceV = (t: number): number =>
  priceBaseV(t) + Math.sin(t * 46) * 0.014 * touchTaper(t);

// Slight hand-drawn wobble along a horizontal line.
const lineWob = (x: number): number => Math.sin(x * 0.028) * 2.4;

const hLinePath = (py: number, x1: number, x2: number): string => {
  let d = `M ${x1.toFixed(1)} ${(py + lineWob(x1)).toFixed(1)}`;
  for (let x = x1 + 22; x < x2; x += 22) {
    d += ` L ${x.toFixed(1)} ${(py + lineWob(x)).toFixed(1)}`;
  }
  d += ` L ${x2.toFixed(1)} ${(py + lineWob(x2)).toFixed(1)}`;
  return d;
};

/** Current defense level: a clean two-step drop, each eased over ~12 frames. */
const defenseV = (f: number): number => {
  if (f < T1) return VDEF0;
  if (f < T2)
    return interpolate(f, [T1, T1 + 12], [VDEF0, VDEF1], {
      ...clampBoth,
      easing: Easing.out(Easing.cubic),
    });
  return interpolate(f, [T2, T2 + 12], [VDEF1, VDEF2], {
    ...clampBoth,
    easing: Easing.out(Easing.cubic),
  });
};

/* --------------------------------------------------------- comic SVG pieces */

/** A localized parchment flash + expanding ring at a defense-touch. */
const ContactFlash: React.FC<{ cx: number; cy: number; at: number }> = ({
  cx,
  cy,
  at,
}) => {
  const frame = useCurrentFrame();
  if (frame < at - 1) return null; // nothing before the touch
  const op = interpolate(frame, [at - 1, at, at + 3, at + 8], [0, 0.95, 0.4, 0], clampBoth);
  const r = interpolate(frame, [at, at + 8], [10, 60], clampBoth);
  const ringR = interpolate(frame, [at, at + 13], [6, 92], clampBoth);
  const ringOp = interpolate(frame, [at, at + 13], [0.9, 0], clampBoth);
  if (op <= 0.001 && ringOp <= 0.001) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={COLORS.goldSoft} opacity={op} />
      <circle cx={cx} cy={cy} r={ringR} fill="none" stroke={COLORS.goldSoft} strokeWidth={4} opacity={ringOp} />
    </g>
  );
};

/** A small burst of gold coin dots fanning up-and-out from a contact. */
const CoinBurst: React.FC<{ cx: number; cy: number; at: number; n?: number }> = ({
  cx,
  cy,
  at,
  n = 8,
}) => {
  const frame = useCurrentFrame();
  const local = frame - at;
  if (local < 0 || local > 28) return null;
  const dots = [];
  for (let i = 0; i < n; i++) {
    const ang = -Math.PI / 2 + (i - (n - 1) / 2) * (Math.PI / (n + 1));
    const rr =
      interpolate(local, [0, 20], [0, 92], clampBoth) *
      (0.65 + random(`cb${at}-${i}`) * 0.7);
    const op = interpolate(local, [0, 4, 20, 28], [0, 1, 0.75, 0], clampBoth);
    const x = cx + Math.cos(ang) * rr;
    const y = cy + Math.sin(ang) * rr + interpolate(local, [0, 28], [0, 16], clampBoth);
    dots.push(<circle key={i} cx={x} cy={y} r={6.5} fill={COLORS.gold} opacity={op} />);
  }
  return <g>{dots}</g>;
};

/* ------------------------------------------------------ content-space labels */

/** Small gold "DEBT ↓" flag popping at a rescue, tracking the new line level. */
const DebtTick: React.FC<{ x: number; y: number; at: number }> = ({ x, y, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 13, stiffness: 190, mass: 0.7 } });
  const op = interpolate(frame, [at, at + 6, at + 44, at + 56], [0, 1, 1, 0], clampBoth);
  if (op <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${0.7 + p * 0.3})`,
        opacity: op,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 15px",
        borderRadius: 999,
        background: COLORS.sunken,
        border: `1.5px solid ${COLORS.gold}`,
        fontFamily: FONT_SANS,
        fontWeight: 700,
        fontSize: 25,
        letterSpacing: "0.06em",
        color: COLORS.gold,
        whiteSpace: "nowrap",
      }}
    >
      DEBT ↓
    </div>
  );
};

export const S4cMechanism: React.FC = () => {
  const frame = useCurrentFrame();

  // Kicker + panel present on the hard-cut entry (non-zero base at frame 0).
  const kickerOp = interpolate(frame, [6, 22], [0, 1], clampBoth);

  // Axis draw-ons.
  const leftAxisY = interpolate(frame, [0, 13], [PT, PB], clampBoth);
  const botAxisX = interpolate(frame, [6, 20], [PL, PR], clampBoth);

  // Dashed reference lines draw left→right on bar 16.
  const defEndX = interpolate(frame, [14, 42], [PL, PR], clampBoth);
  const liqEndX = interpolate(frame, [24, 52], [PL, PR], clampBoth);
  const defV = defenseV(frame);
  const defY = pyAt(defV);
  const liqY = pyAt(VLIQ);

  // Gold price line reveals across bars 17–20, touching on the bar downbeats.
  const priceProg = interpolate(frame, [beat(4), T1, T2, BAR21], [0, 0.3, 0.66, 1], clampBoth);
  const pts: string[] = [];
  const N = 170;
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * priceProg;
    pts.push(`${pxAt(t).toFixed(1)},${pyAt(priceV(t)).toFixed(1)}`);
  }
  const pointsStr = pts.join(" ");
  const frontX = pxAt(priceProg);
  const frontY = pyAt(priceV(priceProg));
  const frontPulse = 0.5 + 0.5 * Math.sin(frame / 5);

  // Bar 21: ease the camera slightly wider + reveal the gap bracket.
  const camScale = interpolate(frame, [BAR21, BAR21 + 41], [1, 0.93], {
    ...clampBoth,
    easing: Easing.inOut(Easing.cubic),
  });
  const gapOp = interpolate(frame, [BAR21, BAR21 + 19], [0, 1], clampBoth);

  // Gap band + bracket geometry. Top edge = the FINAL defense level, so even
  // the lowest the defense floor ever drops to sits far above liquidation.
  const gapTop = pyAt(VDEF2);
  const gapBot = liqY;
  const bx = PR - 62;

  return (
    <Atmosphere>
      <Pulse sceneStart={S} intensity={0.5} shake={0}>
        <AbsoluteFill>
          {/* Kicker */}
          <div
            style={{
              position: "absolute",
              top: 128,
              width: "100%",
              textAlign: "center",
              opacity: kickerOp,
              fontFamily: FONT_SANS,
              fontWeight: 600,
              fontSize: 25,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: COLORS.faint,
            }}
          >
            The mechanism, in one chart
          </div>

          {/* Everything the "camera" frames scales together on bar 21. */}
          <AbsoluteFill style={{ transform: `scale(${camScale})`, transformOrigin: "50% 50%" }}>
            {/* The chart panel */}
            <div
              style={{
                position: "absolute",
                left: PANEL_X,
                top: PANEL_Y,
                width: PANEL_W,
                height: PANEL_H,
              }}
            >
              <svg width={PANEL_W} height={PANEL_H} viewBox={`0 0 ${VBW} ${VBH}`}>
                <defs>
                  <pattern id="halftone-s4c" width="16" height="16" patternUnits="userSpaceOnUse">
                    <circle cx="4" cy="4" r="1.5" fill={COLORS.text} />
                  </pattern>
                </defs>

                {/* Framed comic panel */}
                <rect
                  x={8}
                  y={8}
                  width={VBW - 16}
                  height={VBH - 16}
                  rx={12}
                  fill={COLORS.raised}
                  stroke={COLORS.text}
                  strokeWidth={5}
                />
                {/* Halftone texture over the plot (subtle) */}
                <rect x={PL} y={PT} width={PR - PL} height={PB - PT} fill="url(#halftone-s4c)" opacity={0.05} />

                {/* Ink axes (draw in) */}
                <line x1={PL} y1={PT} x2={PL} y2={leftAxisY} stroke={COLORS.text} strokeWidth={4} strokeLinecap="round" />
                <line x1={PL} y1={PB} x2={botAxisX} y2={PB} stroke={COLORS.text} strokeWidth={4} strokeLinecap="round" />
                <text x={PL - 66} y={(PT + PB) / 2} fill={COLORS.faint} fontFamily={FONT_SANS} fontSize={22} fontWeight={600} letterSpacing="0.18em" textAnchor="middle" transform={`rotate(-90 ${PL - 66} ${(PT + PB) / 2})`}>
                  PRICE
                </text>
                <text x={(PL + PR) / 2} y={PB + 42} fill={COLORS.faint} fontFamily={FONT_SANS} fontSize={22} fontWeight={600} letterSpacing="0.18em" textAnchor="middle">
                  TIME →
                </text>

                {/* Gap band the price never enters (bar 21) */}
                <rect
                  x={C1X}
                  y={gapTop}
                  width={PR - C1X}
                  height={gapBot - gapTop}
                  fill={COLORS.goldSoft}
                  opacity={gapOp * 0.07}
                />

                {/* LIQUIDATION line (terracotta, fixed, far below) */}
                <path
                  d={hLinePath(liqY, PL, liqEndX)}
                  fill="none"
                  stroke={COLORS.terracotta}
                  strokeWidth={4.5}
                  strokeDasharray="16 11"
                  strokeLinecap="round"
                />

                {/* DEFENSE line (amber, steps down after each rescue) */}
                <path
                  d={hLinePath(defY, PL, defEndX)}
                  fill="none"
                  stroke={COLORS.amber}
                  strokeWidth={4.5}
                  strokeDasharray="16 11"
                  strokeLinecap="round"
                />

                {/* Gap bracket (bar 21) */}
                <g opacity={gapOp}>
                  <line x1={bx} y1={gapTop + 9} x2={bx} y2={gapBot - 9} stroke={COLORS.goldSoft} strokeWidth={4} />
                  <polygon points={`${bx},${gapTop} ${bx - 8},${gapTop + 15} ${bx + 8},${gapTop + 15}`} fill={COLORS.goldSoft} />
                  <polygon points={`${bx},${gapBot} ${bx - 8},${gapBot - 15} ${bx + 8},${gapBot - 15}`} fill={COLORS.goldSoft} />
                </g>

                {/* PRICE line (gold, thick, ink-glow behind) */}
                {priceProg > 0.001 ? (
                  <>
                    <polyline points={pointsStr} fill="none" stroke={COLORS.gold} strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" opacity={0.16} />
                    <polyline points={pointsStr} fill="none" stroke={COLORS.gold} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
                    <circle cx={frontX} cy={frontY} r={9} fill={COLORS.goldSoft} stroke={COLORS.onGold} strokeWidth={2} opacity={0.85 + 0.15 * frontPulse} />
                  </>
                ) : null}

                {/* Touch effects */}
                <ContactFlash cx={C1X} cy={C1Y} at={T1} />
                <ContactFlash cx={C2X} cy={C2Y} at={T2} />
                <CoinBurst cx={C1X} cy={C1Y} at={T1} />
                <CoinBurst cx={C2X} cy={C2Y} at={T2} />
              </svg>
            </div>

            {/* --- content-space comic labels (overlay, scale with the camera) --- */}

            {/* MY DEFENSE LINE — amber, on the RIGHT end of the line (clear of
                the touches/onomatopoeia on the left), tracks the moving line */}
            <ComicText
              text={"My defense line"}
              from={40}
              x={toContentX(PR - 190)}
              y={toContentY(defY - 40)}
              size={46}
              rotate={-2}
              fill={COLORS.amber}
              stroke={3}
            />

            {/* LIQUIDATION — terracotta, above its line at the left, far below */}
            <ComicText
              text={"Liquidation"}
              from={52}
              x={toContentX(PL + 235)}
              y={toContentY(liqY - 44)}
              size={46}
              rotate={2}
              fill={COLORS.terracotta}
              stroke={3}
            />

            {/* AUTO-REPAY! onomatopoeia at each contact (fades before the next) */}
            <ComicText
              text={"Auto-repay!"}
              from={T1}
              exitAt={T1 + 40}
              x={toContentX(C1X)}
              y={toContentY(C1Y - 108)}
              size={68}
              rotate={-6}
              variant="onomatopoeia"
              fill={COLORS.goldSoft}
            />
            <ComicText
              text={"Auto-repay!"}
              from={T2}
              exitAt={T2 + 44}
              x={toContentX(C2X)}
              y={toContentY(C2Y - 108)}
              size={68}
              rotate={5}
              variant="onomatopoeia"
              fill={COLORS.goldSoft}
            />

            {/* DEBT ↓ flags — the killer detail: defense drops after each rescue */}
            <DebtTick x={toContentX(pxAt(0.5))} y={toContentY(pyAt(VDEF1) + 38)} at={T1 + 12} />
            <DebtTick x={toContentX(pxAt(0.82))} y={toContentY(pyAt(VDEF2) + 38)} at={T2 + 12} />

            {/* NEVER. EVEN. CLOSE. — centered in the untouched gap */}
            <ComicText
              text={"Never. Even. Close."}
              from={BAR21 + 9}
              x={toContentX((C1X + bx) / 2 - 20)}
              y={toContentY((gapTop + gapBot) / 2 + 6)}
              size={76}
              rotate={-3}
              fill={COLORS.goldSoft}
            />
          </AbsoluteFill>

          {/* Calm caption below the chart */}
          <div
            style={{
              position: "absolute",
              top: 952,
              width: "100%",
              textAlign: "center",
              opacity: interpolate(frame, [BAR21 + 24, BAR21 + 44], [0, 1], clampBoth),
              fontFamily: FONT_SANS,
              fontWeight: 500,
              fontSize: 31,
              color: COLORS.muted,
            }}
          >
            Repay a little, early, from your Shadow Vault — liquidation never gets a chance.
          </div>
        </AbsoluteFill>
      </Pulse>

      {/* whoosh in; click at each defense-touch; chime on each bounce-recovery;
          soft whoosh as the camera eases wider. No riser (music carries it). */}
      <Sfx type="whoosh" at={0} volume={0.4} />
      <Sfx type="click" at={T1} volume={0.42} />
      <Sfx type="chime" at={T1 + 6} volume={0.42} />
      <Sfx type="click" at={T2} volume={0.42} />
      <Sfx type="chime" at={T2 + 6} volume={0.42} />
      <Sfx type="whoosh" at={BAR21} volume={0.3} />
    </Atmosphere>
  );
};
