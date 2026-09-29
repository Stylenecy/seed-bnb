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
import { CoinDot, CoinVariant } from "../lib/comicFx";
import { COLORS, RADIUS, SHADOW_CARD } from "../lib/tokens";
import { FONT_DISPLAY, FONT_SANS } from "../lib/fonts";
import { barC, beatC } from "../lib/beat";
import { BnbMark } from "../lib/BnbMark";

/**
 * S5b · UNDER THE HOOD — the money flow AND who can touch what on BNB Chain, in
 * one code-drawn, comic-styled explainer (same house style as S4cMechanism:
 * ink-framed panels, halftone overlay, hand-wobbled ink strokes, Bangers
 * `ComicText` labels, brand palette). Two stages:
 *
 *  STAGE 1 — THE FLOW (bars 23→27): four party nodes (YOU · LENDING POOL ·
 *  SHADOW VAULT[dashed=yours] · GUARD AGENT[eye]). One flow per bar draws an
 *  ink arrow with coin dots + a tag:
 *    bar 23  YOU → LOCK          "COLLATERAL LOCKS."   (DROP-2 flash lands 1 bar in)
 *    bar 24  POOL → YOU          "THE POOL LENDS."     (cream coins)
 *    bar 25  YOU → SHADOW VAULT  "YOU STOCK THE VAULT."
 *    bar 26  VAULT → LOCK/loan   "RESCUES REPAY FROM HERE." + the guard eye pulses
 *
 *  STAGE 2 — WHO CAN TOUCH WHAT (bars 27→33): the flow eases back to the left;
 *  the Solidity CerminRWA contract (BSC) appears and four STATE cards rise (one
 *  per bar 27–30) — LOAN · SHADOW VAULT · GUARD POLICY · RESCUE EVENT — each
 *  with badges naming who the contract lets act on it:
 *    LOAN         → YOU · POOL · AGENT
 *    SHADOW VAULT → YOU · AGENT   (POOL struck through, terracotta)
 *    GUARD POLICY → YOU · AGENT   (POOL struck)
 *    RESCUE EVENT → YOU · AGENT   (POOL struck)
 *  bars 31–32: headline "GUARD REPAYS ONLY BELOW YOUR TRIGGER." + a calm subline
 *  naming the on-chain check (guardRepay reverts otherwise; the pool has no
 *  call into your vault — its only calls are createOffer / withdrawOffer /
 *  lastResortDefault).
 *
 * Window barC(23)=2876 → barC(33)=3439 (10 bars). Pulse intensity 0.5, shake 0
 * (readability first). SFX: whoosh in, click per flow-arrow / card, no riser.
 */
const S = barC(23);
/** Local frame of bar k (bar 23 = local 0). */
const bC = (k: number): number => barC(k) - S;
/** Local frame of part-C beat k (bar 23 = beat 92). */
const beat = (n: number): number => beatC(92 + n) - S;

const clampBoth = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Stage 2 begins on bar 27 — the flow diagram recedes and the coin streams
 *  stop (the arrows freeze into a dim legend). */
const STAGE2 = bC(27);

/** Coin stream cadence — a coin every ~7f, a full traversal in ~34f. */
const COIN_PERIOD = 34;
const N_COINS = 5;

type Pt = { x: number; y: number };

/* ---------------------------------------------------- diagram node geometry */

const YOU: Pt = { x: 360, y: 400 };
const POOL: Pt = { x: 980, y: 400 };
const LOCK: Pt = { x: 670, y: 400 };
const VAULT: Pt = { x: 670, y: 770 };
const AGENT: Pt = { x: 1520, y: 440 };

const CARD_W = 300;
const POOL_W = 330;
const CARD_H = 158;

/* ----------------------------------------------- quadratic-bezier flow paths */

const qbez = (p0: Pt, c: Pt, p1: Pt, t: number): Pt => ({
  x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * c.x + t * t * p1.x,
  y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * c.y + t * t * p1.y,
});

/** A hand-drawn wobble along the path parameter, tapered to 0 at both ends. */
const wob = (t: number): number => Math.sin(t * 22) * 2.2 * Math.sin(Math.PI * t);

const bezPolyline = (p0: Pt, c: Pt, p1: Pt, prog: number, n = 46): string => {
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * prog;
    const q = qbez(p0, c, p1, t);
    pts.push(`${(q.x).toFixed(1)},${(q.y + wob(t)).toFixed(1)}`);
  }
  return pts.join(" ");
};

type FlowSpec = {
  id: string;
  p0: Pt;
  c: Pt;
  p1: Pt;
  color: string;
  dashed: boolean;
  at: number;
  variant: CoinVariant;
};

const FLOWS: FlowSpec[] = [
  { id: "f23", p0: YOU, c: { x: 515, y: 400 }, p1: LOCK, color: COLORS.gold, dashed: false, at: bC(23) + 6, variant: "gold" },
  { id: "f24", p0: POOL, c: { x: 670, y: 268 }, p1: YOU, color: COLORS.goldSoft, dashed: false, at: bC(24), variant: "cream" },
  { id: "f25", p0: YOU, c: { x: 398, y: 606 }, p1: VAULT, color: COLORS.gold, dashed: false, at: bC(25), variant: "gold" },
  { id: "f26", p0: VAULT, c: { x: 748, y: 588 }, p1: LOCK, color: COLORS.gold, dashed: true, at: bC(26), variant: "gold" },
];

/** The destination absorb pulse (0..1) for a flow at a frame — peaks each time
 *  a coin reaches the far node (arrivals tile N per COIN_PERIOD). Used to give
 *  receiving NODE CARDS a tiny scale bump on each coin arrival. */
const flowAbsorb = (spec: FlowSpec, frame: number): number => {
  const coinStart = spec.at + 8;
  if (frame < coinStart || frame >= STAGE2) return 0;
  const base = (frame - coinStart) / COIN_PERIOD;
  if (base <= 0) return 0;
  const ap = ((base * N_COINS) % 1 + 1) % 1;
  return Math.exp(-ap * 3.4);
};

/** One flow arrow: ink path revealed L→R on its bar, an arrowhead, and a
 *  CONTINUOUS looping stream of coins riding it while the flow is active — each
 *  coin pops into being at the source, bobs along the path, and squashes into
 *  the destination; the destination shows a small absorb ring on each arrival.
 *  Drawn behind the node cards so coins emerge from / vanish into card edges. */
const Flow: React.FC<FlowSpec> = ({ p0, c, p1, color, dashed, at, variant }) => {
  const frame = useCurrentFrame();
  const prog = interpolate(frame, [at, at + 18], [0, 1], clampBoth);
  if (prog <= 0.001) return null;
  const points = bezPolyline(p0, c, p1, prog);

  // Arrowhead at the current front, angled along the local tangent.
  const tHead = Math.max(prog - 0.02, 0);
  const head = qbez(p0, c, p1, prog);
  const back = qbez(p0, c, p1, tHead);
  const ang = Math.atan2(head.y - back.y, head.x - back.x);
  const headOp = interpolate(prog, [0.8, 1], [0, 1], clampBoth);
  const ah = 15;

  // Continuous coin stream while the flow is active.
  const coinStart = at + 8;
  const streaming = frame >= coinStart && frame < STAGE2;
  const base = (frame - coinStart) / COIN_PERIOD;
  const coins: React.ReactNode[] = [];
  let absorb = 0;
  if (streaming && base > 0) {
    for (let i = 0; i < N_COINS; i++) {
      if (base - i / N_COINS < 0) continue; // coin not yet born at the source
      const t = ((base - i / N_COINS) % 1 + 1) % 1;
      const q = qbez(p0, c, p1, t);
      const bob = Math.sin(frame * 0.35 + i * 1.7) * 1.8;
      const op = interpolate(t, [0, 0.06, 0.88, 1], [0, 1, 1, 0], clampBoth);
      const pop = interpolate(t, [0, 0.09], [0.4, 1], clampBoth);
      const squash = interpolate(t, [0.84, 1], [0, 1], clampBoth);
      coins.push(
        <CoinDot
          key={i}
          cx={q.x}
          cy={q.y + wob(t) + bob}
          r={9}
          variant={variant}
          opacity={op}
          scaleX={pop * (1 + squash * 0.5)}
          scaleY={pop * (1 - squash * 0.55)}
        />,
      );
    }
    const ap = ((base * N_COINS) % 1 + 1) % 1;
    absorb = Math.exp(-ap * 3.4);
  }

  return (
    <g>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashed ? "15 12" : undefined}
        opacity={0.92}
      />
      <g opacity={headOp} transform={`translate(${head.x} ${head.y}) rotate(${(ang * 180) / Math.PI})`}>
        <polygon points={`0,0 ${-ah},${-ah * 0.62} ${-ah},${ah * 0.62}`} fill={color} />
      </g>
      {/* destination absorb ring on each arrival (visible for the lock; node
          cards get their own scale bump via flowAbsorb) */}
      {absorb > 0.02 ? (
        <circle cx={p1.x} cy={p1.y} r={8 + absorb * 20} fill="none" stroke={color} strokeWidth={3} opacity={absorb * 0.5} />
      ) : null}
      {coins}
    </g>
  );
};

/* ------------------------------------------------------------- a small lock */

const LockIcon: React.FC<{ appearAt: number; clickAt: number }> = ({ appearAt, clickAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - appearAt, fps, config: { damping: 13, stiffness: 180, mass: 0.7 } });
  const op = interpolate(p, [0, 0.35], [0, 1], clampBoth);
  if (op <= 0.001) return null;

  // The lock waits OPEN (shackle lifted) then CLICKS SHUT when the collateral
  // coin arrives — the shackle seats, the body snaps, a 1-frame gold glint.
  const shut = frame < clickAt ? 0 : spring({ frame: frame - clickAt, fps, config: { damping: 9, stiffness: 240, mass: 0.6 } });
  const gap = (1 - shut) * 10; // shackle floats above the body while open
  const snap = interpolate(frame - clickAt, [0, 3, 9], [0, 0.16, 0], clampBoth);
  const glint = interpolate(frame - clickAt, [-1, 0, 2, 6], [0, 1, 0.5, 0], clampBoth);
  const { x, y } = LOCK;
  return (
    <g opacity={op} transform={`translate(${x} ${y}) scale(${0.7 + p * 0.3})`}>
      {/* shackle — lifts open, seats shut */}
      <g transform={`translate(0 ${-gap})`}>
        <path d="M -18 -8 A 18 18 0 0 1 18 -8 L 18 2 L 11 2 L 11 -8 A 11 11 0 0 0 -11 -8 L -11 2 L -18 2 Z" fill={COLORS.gold} />
      </g>
      {/* body (snaps on the click) */}
      <g transform={`scale(${1 + snap})`} style={{ transformOrigin: "0 0" }}>
        <rect x={-26} y={0} width={52} height={44} rx={8} fill={COLORS.goldSoft} stroke={COLORS.onGold} strokeWidth={2} />
        <circle cx={0} cy={20} r={5} fill={COLORS.onGold} />
        <rect x={-2.4} y={20} width={4.8} height={13} rx={2} fill={COLORS.onGold} />
      </g>
      {glint > 0.02 ? <circle cx={0} cy={8} r={42} fill={COLORS.goldSoft} opacity={glint * 0.7} /> : null}
    </g>
  );
};

/* ------------------------------------------------------------- an eye glyph */

const EyeGlyph: React.FC<{ size?: number; color: string; strokeW?: number }> = ({
  size = 26,
  color,
  strokeW = 2.6,
}) => (
  <svg width={size} height={size * 0.72} viewBox="0 0 28 20" style={{ display: "block", flexShrink: 0 }}>
    <path d="M2 10 Q14 -3 26 10 Q14 23 2 10 Z" fill="none" stroke={color} strokeWidth={strokeW} strokeLinejoin="round" />
    <circle cx={14} cy={10} r={4.4} fill={color} />
  </svg>
);

/* --------------------------------------------------------- party node cards */

const NodeCard: React.FC<{
  center: Pt;
  w: number;
  h: number;
  label: string;
  sub: string;
  dashed?: boolean;
  appearAt: number;
  /** 0..1 arrival pulse — a tiny scale bump each time a coin lands here. */
  absorb?: number;
}> = ({ center, w, h, label, sub, dashed = false, appearAt, absorb = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - appearAt, fps, config: { damping: 15, stiffness: 160, mass: 0.8 } });
  const op = interpolate(p, [0, 0.3], [0, 1], clampBoth);
  return (
    <div
      style={{
        position: "absolute",
        left: center.x - w / 2,
        top: center.y - h / 2,
        width: w,
        height: h,
        opacity: op,
        transform: `scale(${0.86 + p * 0.14 + absorb * 0.045})`,
        transformOrigin: "50% 50%",
        background: COLORS.sunken,
        border: `4px ${dashed ? "dashed" : "solid"} ${dashed ? COLORS.gold : COLORS.text}`,
        borderRadius: RADIUS,
        boxShadow: SHADOW_CARD,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 40, color: dashed ? COLORS.goldSoft : COLORS.text, lineHeight: 1 }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 21, letterSpacing: "0.16em", textTransform: "uppercase", color: dashed ? COLORS.gold : COLORS.faint }}>
        {sub}
      </div>
    </div>
  );
};

/** The GUARD AGENT — a small gold eye node that watches (pulses on bar 26). */
const AgentEye: React.FC<{ appearAt: number; watchAt: number }> = ({ appearAt, watchAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - appearAt, fps, config: { damping: 15, stiffness: 150 } });
  const op = interpolate(p, [0, 0.3], [0, 1], clampBoth);
  const watch = frame >= watchAt ? 0.5 + 0.5 * Math.sin((frame - watchAt) / 4) : 0.2;
  const r = 92;
  const { x, y } = AGENT;
  return (
    <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2 + 46, opacity: op, transform: `scale(${0.86 + p * 0.14})`, transformOrigin: "50% 40%" }}>
      <svg width={r * 2} height={r * 2} viewBox={`0 0 ${r * 2} ${r * 2}`}>
        {/* watch pulse ring */}
        <circle cx={r} cy={r} r={r - 6} fill="none" stroke={COLORS.gold} strokeWidth={3} opacity={0.25 + 0.5 * watch} />
        <circle cx={r} cy={r} r={r - 6} fill={COLORS.sunken} />
        <circle cx={r} cy={r} r={r + 4 * watch} fill="none" stroke={COLORS.goldSoft} strokeWidth={2} opacity={0.55 * watch} />
        {/* eye */}
        <g transform={`translate(${r} ${r})`}>
          <path d="M -52 0 Q 0 -40 52 0 Q 0 40 -52 0 Z" fill="none" stroke={COLORS.gold} strokeWidth={5} strokeLinejoin="round" />
          <circle cx={0} cy={0} r={17} fill={COLORS.gold} />
          <circle cx={0} cy={0} r={7} fill={COLORS.onGold} />
        </g>
      </svg>
      <div style={{ textAlign: "center", marginTop: 4, fontFamily: FONT_SANS, fontWeight: 600, fontSize: 22, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.gold }}>
        Guard Agent
      </div>
    </div>
  );
};

/* -------------------------------------------------- stage-2 contract cards */

type Badge = { name: string; struck: boolean };

/** Contract-card geometry, SHARED with the packet layer so a packet lands
 *  exactly on its badge. Slot x is measured from the card's left edge (incl.
 *  the 26px content padding); badge centre y is measured from the card top. */
const CARD_PAD_X = 26;
const CARD_CONTENT_W = 548 - CARD_PAD_X * 2; // 496
const SLOT_REL_X = [0, 1, 2].map((j) => CARD_PAD_X + CARD_CONTENT_W * ((j + 0.5) / 3)); // 108.7 · 274 · 439.3
const BADGE_Y_OFF = 101;

const EyeBadge: React.FC<{ badge: Badge; slotX: number; landAt?: number }> = ({ badge, slotX, landAt }) => {
  const frame = useCurrentFrame();
  const color = badge.struck ? COLORS.terracotta : COLORS.gold;
  // A tiny absorb pop when this badge's contract packet lands (non-struck only).
  const bump = landAt === undefined ? 0 : interpolate(frame - landAt, [0, 3, 12], [0, 0.14, 0], clampBoth);
  return (
    <div
      style={{
        position: "absolute",
        left: slotX,
        top: "50%",
        transform: `translate(-50%, -50%) scale(${1 + bump})`,
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        padding: "8px 16px",
        borderRadius: 999,
        whiteSpace: "nowrap",
        background: COLORS.raised,
        border: `2px solid ${badge.struck ? COLORS.terracottaDim : COLORS.hairlineStrong}`,
        opacity: badge.struck ? 0.62 : 1,
      }}
    >
      <EyeGlyph size={24} color={color} />
      <span style={{ fontFamily: FONT_SANS, fontWeight: 600, fontSize: 25, color: badge.struck ? COLORS.muted : COLORS.text }}>
        {badge.name}
      </span>
      {badge.struck ? (
        <span
          style={{
            position: "absolute",
            left: 8,
            right: 8,
            top: "52%",
            height: 3,
            background: COLORS.terracotta,
            transform: "rotate(-4deg)",
            borderRadius: 2,
          }}
        />
      ) : null}
    </div>
  );
};

const ContractCard: React.FC<{
  title: string;
  badges: Badge[];
  appearAt: number;
  left: number;
  top: number;
  width: number;
  landAts: (number | undefined)[];
}> = ({ title, badges, appearAt, left, top, width, landAts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - appearAt, fps, config: { damping: 16, stiffness: 150, mass: 0.8 } });
  const op = interpolate(p, [0, 0.3], [0, 1], clampBoth);
  const priv = badges.some((b) => b.struck);
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        opacity: op,
        transform: `translateY(${(1 - p) * 26}px) scale(${0.97 + p * 0.03})`,
        background: COLORS.raised,
        border: `3px solid ${priv ? COLORS.gold : COLORS.hairlineStrong}`,
        borderStyle: priv ? "dashed" : "solid",
        borderRadius: RADIUS,
        boxShadow: SHADOW_CARD,
        padding: "22px 26px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span style={{ width: 12, height: 12, borderRadius: 3, background: priv ? COLORS.gold : COLORS.muted, flexShrink: 0 }} />
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 34, color: COLORS.text, lineHeight: 1 }}>{title}</span>
        {priv ? (
          <span style={{ marginLeft: "auto", fontFamily: FONT_SANS, fontWeight: 600, fontSize: 16, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.gold }}>
            pool-proof
          </span>
        ) : null}
      </div>
      {/* badges at fixed 3-slot positions (relative to the card's padding box)
          so the flying contract packets can aim true */}
      <div style={{ position: "relative", height: 58 }}>
        {badges.map((bdg, j) => (
          <EyeBadge key={bdg.name} badge={bdg} slotX={SLOT_REL_X[j]! - CARD_PAD_X} landAt={landAts[j]} />
        ))}
      </div>
    </div>
  );
};

const YP: Badge = { name: "You", struck: false };
const AG: Badge = { name: "Agent", struck: false };
const POOL_OK: Badge = { name: "Pool", struck: false };
const POOL_NO: Badge = { name: "Pool", struck: true };

const CONTRACTS: { title: string; badges: Badge[] }[] = [
  { title: "Loan", badges: [YP, POOL_OK, AG] },
  { title: "Shadow Vault", badges: [YP, AG, POOL_NO] },
  { title: "Guard Policy", badges: [YP, AG, POOL_NO] },
  { title: "Rescue Event", badges: [YP, AG, POOL_NO] },
];

/* ---------------------------- stage-2 layout (module scope: shared with the
   packet layer so packets land exactly on their badges) --------------------- */

const CARD_W2 = 548;
const CARD_POS: Pt[] = [
  { x: 770, y: 244 },
  { x: 1338, y: 244 },
  { x: 770, y: 486 },
  { x: 1338, y: 486 },
];
const CARD_BAR = [bC(27), bC(28), bC(29), bC(30)];

/** The central CerminRWA node (Solidity on BSC) — access packets fly FROM it
 *  to the parties it lets act on each piece of state. */
const LEDGER: Pt = { x: 1328, y: 178 };

type PacketSpec = {
  key: string;
  target: Pt;
  start: number;
  arrive: number;
  struck: boolean;
  deflect: Pt;
};

/** One flying packet per (card, badge): FROM the ledger TO the receiving badge.
 *  A struck (pool-on-private) packet only travels 72% of the way, then hits the
 *  X and dissolves. */
const PACKETS: PacketSpec[] = CONTRACTS.flatMap((cardc, i) =>
  cardc.badges.map((bdg, j) => {
    const target: Pt = { x: CARD_POS[i]!.x + SLOT_REL_X[j]!, y: CARD_POS[i]!.y + BADGE_Y_OFF };
    const start = CARD_BAR[i]! + 8 + j * 3;
    const arrive = start + (bdg.struck ? 10 : 14);
    const deflect: Pt = {
      x: LEDGER.x + (target.x - LEDGER.x) * 0.72,
      y: LEDGER.y + (target.y - LEDGER.y) * 0.72,
    };
    return { key: `${i}-${j}`, target, start, arrive, struck: bdg.struck, deflect };
  }),
);

/** Frames at which a private-card packet is deflected — one X stamp + one low
 *  click each (exactly 3, the three private contracts). */
const STAMP_FRAMES = PACKETS.filter((p) => p.struck).map((p) => p.arrive);

/** Absorb-pop timing for each receiving (non-struck) badge, by card then slot. */
const LAND_ATS: (number | undefined)[][] = CONTRACTS.map((c, i) =>
  c.badges.map((bdg, j) => (bdg.struck ? undefined : CARD_BAR[i]! + 8 + j * 3 + 14)),
);

const LedgerNode: React.FC<{ appearAt: number }> = ({ appearAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - appearAt, fps, config: { damping: 15, stiffness: 150, mass: 0.8 } });
  const op = interpolate(p, [0, 0.3], [0, 1], clampBoth);
  if (op <= 0.001) return null;
  const W = 330;
  const H = 78;
  return (
    <div
      style={{
        position: "absolute",
        left: LEDGER.x - W / 2,
        top: LEDGER.y - H / 2,
        width: W,
        height: H,
        opacity: op,
        transform: `scale(${0.85 + p * 0.15})`,
        transformOrigin: "50% 50%",
        background: COLORS.sunken,
        border: `4px solid ${COLORS.text}`,
        borderRadius: 14,
        boxShadow: SHADOW_CARD,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}
    >
      <BnbMark size={36} />
      <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 34, color: COLORS.text, letterSpacing: "0.02em" }}>CerminRWA</span>
    </div>
  );
};

/** A tiny parchment "contract packet" card gliding along its path. */
const Packet: React.FC<{ spec: PacketSpec }> = ({ spec }) => {
  const frame = useCurrentFrame();
  if (frame < spec.start) return null;
  const u = interpolate(frame, [spec.start, spec.arrive], [0, 1], clampBoth);
  const endU = spec.struck ? 0.72 : 1;
  const uu = u * endU;
  const x = LEDGER.x + (spec.target.x - LEDGER.x) * uu;
  const y = LEDGER.y + (spec.target.y - LEDGER.y) * uu;
  const ang = (Math.atan2(spec.target.y - LEDGER.y, spec.target.x - LEDGER.x) * 180) / Math.PI;
  let op: number;
  let sc: number;
  if (spec.struck) {
    op = interpolate(frame, [spec.start, spec.start + 3, spec.arrive - 1, spec.arrive], [0, 1, 1, 0], clampBoth);
    sc = 1;
  } else {
    op = interpolate(frame, [spec.start, spec.start + 3, spec.arrive, spec.arrive + 7], [0, 1, 1, 0], clampBoth);
    sc = interpolate(frame, [spec.arrive - 2, spec.arrive + 7], [1, 0.28], clampBoth);
  }
  if (op <= 0.01) return null;
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(ang * 0.14).toFixed(1)}) scale(${sc.toFixed(3)})`} opacity={op}>
      <rect x={-17} y={-12} width={34} height={24} rx={4} fill={COLORS.text} stroke={COLORS.onGold} strokeWidth={2} />
      <line x1={-10} y1={-4} x2={10} y2={-4} stroke={COLORS.onGold} strokeWidth={2} strokeLinecap="round" />
      <line x1={-10} y1={3} x2={6} y2={3} stroke={COLORS.onGold} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
};

/** The terracotta X that stamps in and deflects a pool-bound private packet. */
const XStamp: React.FC<{ at: Pt; from: number }> = ({ at, from }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < from) return null;
  const p = spring({ frame: frame - from, fps, config: { damping: 9, stiffness: 240, mass: 0.6 } });
  const sc = interpolate(p, [0, 1], [1.55, 1], clampBoth); // overshoot: slams big → settles
  const op = interpolate(frame - from, [0, 2, 50, 80], [0, 1, 1, 0.8], clampBoth);
  const rot = interpolate(p, [0, 1], [-18, -6], clampBoth);
  const s = 20;
  return (
    <g transform={`translate(${at.x} ${at.y}) rotate(${rot}) scale(${sc})`} opacity={op}>
      <circle r={27} fill={COLORS.terracottaDim} opacity={0.55} />
      <line x1={-s} y1={-s} x2={s} y2={s} stroke={COLORS.terracotta} strokeWidth={6} strokeLinecap="round" />
      <line x1={-s} y1={s} x2={s} y2={-s} stroke={COLORS.terracotta} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

/** The deflected packet dissolving into a puff of ink dots. */
const InkDissolve: React.FC<{ at: Pt; from: number; seed: string }> = ({ at, from, seed }) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  if (local < 0 || local > 26) return null;
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const ang = random(`${seed}-a-${i}`) * Math.PI * 2;
    const dist = interpolate(local, [0, 22], [0, 46], clampBoth) * (0.5 + random(`${seed}-d-${i}`) * 0.8);
    const op = interpolate(local, [0, 3, 22, 26], [0, 1, 0.7, 0], clampBoth);
    const x = at.x + Math.cos(ang) * dist;
    const y = at.y + Math.sin(ang) * dist + local * 0.55;
    dots.push(<circle key={i} cx={x} cy={y} r={interpolate(local, [0, 26], [4, 1.5], clampBoth)} fill={COLORS.faint} opacity={op} />);
  }
  return <g>{dots}</g>;
};

/** All the stage-2 packet traffic, in one content-space overlay (above cards). */
const PacketLayer: React.FC = () => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
    {PACKETS.map((p) => (
      <Packet key={p.key} spec={p} />
    ))}
    {PACKETS.filter((p) => p.struck).map((p) => (
      <React.Fragment key={`x-${p.key}`}>
        <InkDissolve at={p.deflect} from={p.arrive} seed={`diss-${p.key}`} />
        <XStamp at={p.deflect} from={p.arrive} />
      </React.Fragment>
    ))}
  </svg>
);

/* =========================================================================== */

export const S5bUnderHood: React.FC = () => {
  const frame = useCurrentFrame();

  // Title present on the hard-cut/slide entry (fades as stage 2 begins).
  const titleExit = bC(27);

  // Stage-2 progress: the flow diagram eases back to the upper-left; cards rise.
  const s2 = interpolate(frame, [bC(27), bC(27) + 26], [0, 1], {
    ...clampBoth,
    easing: Easing.inOut(Easing.cubic),
  });
  const diagScale = 1 - 0.54 * s2; // 1 → 0.46
  const diagTX = 44 * s2;
  const diagTY = 150 * s2;
  const diagOp = 1 - 0.46 * s2; // recedes to a legend, still legible

  const kickerOp = interpolate(frame, [bC(27) + 4, bC(27) + 22], [0, 1], clampBoth);

  // Per-node absorb pulses (coin arrivals): the pool LENDS to YOU (f24) and YOU
  // stocks the VAULT (f25), so those two cards bump on each landing coin.
  const youAbsorb = flowAbsorb(FLOWS[1]!, frame);
  const vaultAbsorb = flowAbsorb(FLOWS[2]!, frame);

  const headFrom = bC(31) + 2;
  const sublineOp = interpolate(frame, [bC(31) + 16, bC(31) + 34], [0, 1], clampBoth);

  return (
    <Atmosphere>
      <Pulse sceneStart={S} intensity={0.5} shake={0}>
        <AbsoluteFill>
          {/* Title — comic slam, top-center */}
          <ComicText
            text={"Under the hood."}
            from={4}
            exitAt={titleExit}
            x={960}
            y={140}
            size={70}
            rotate={-2}
            fill={COLORS.goldSoft}
          />

          {/* Stage-2 kicker */}
          <div
            style={{
              position: "absolute",
              top: 96,
              left: 770,
              width: 1116,
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
            Who can touch what · CerminRWA on BSC
          </div>

          {/* ---- THE FLOW DIAGRAM (eases back/left for stage 2) ---- */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: diagOp,
              transform: `translate(${diagTX}px, ${diagTY}px) scale(${diagScale})`,
              transformOrigin: "8% 34%",
            }}
          >
            {/* ink-framed comic panel behind the flow */}
            <div
              style={{
                position: "absolute",
                left: 120,
                top: 232,
                width: 1560,
                height: 690,
                background: COLORS.raised,
                border: `5px solid ${COLORS.text}`,
                borderRadius: 18,
                boxShadow: SHADOW_CARD,
              }}
            />

            {/* arrows + coins + lock, in content space (behind the node cards) */}
            <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
              <defs>
                <pattern id="halftone-s5b" width="16" height="16" patternUnits="userSpaceOnUse">
                  <circle cx="4" cy="4" r="1.5" fill={COLORS.text} />
                </pattern>
              </defs>
              <rect x={120} y={232} width={1560} height={690} fill="url(#halftone-s5b)" opacity={0.045} />
              {FLOWS.map((f) => (
                <Flow key={f.id} {...f} />
              ))}
              {/* the lock waits open, then CLICKS SHUT as the first collateral
                  coin lands (coinStart bC(23)+14 + one traversal ≈ +34) */}
              <LockIcon appearAt={bC(23) + 10} clickAt={bC(23) + 48} />
            </svg>

            {/* party node cards */}
            <NodeCard center={YOU} w={CARD_W} h={CARD_H} label="You" sub="borrower" appearAt={bC(23)} absorb={youAbsorb} />
            <NodeCard center={POOL} w={POOL_W} h={CARD_H} label="Lending Pool" sub="lender" appearAt={bC(23) + 3} />
            <NodeCard center={VAULT} w={POOL_W} h={CARD_H} label="Shadow Vault" sub="yours" dashed appearAt={bC(25) - 4} absorb={vaultAbsorb} />
            <AgentEye appearAt={bC(23) + 6} watchAt={bC(26)} />

            {/* flow tags — one per bar, popping near its flow */}
            <ComicText text={"Collateral locks."} from={bC(23) + 6} exitAt={bC(24) - 6} x={460} y={286} size={46} rotate={-3} fill={COLORS.gold} stroke={3} />
            <ComicText text={"The pool lends."} from={bC(24) + 2} exitAt={bC(25) - 6} x={670} y={556} size={46} rotate={2} fill={COLORS.goldSoft} stroke={3} />
            <ComicText text={"You stock the vault."} from={bC(25) + 2} exitAt={bC(26) - 6} x={318} y={660} size={44} rotate={-2} fill={COLORS.gold} stroke={3} />
            <ComicText text={"Rescues repay from here."} from={bC(26) + 2} exitAt={bC(27) - 2} x={1010} y={588} size={44} rotate={3} fill={COLORS.goldSoft} stroke={3} />
          </div>

          {/* ---- STAGE 2 · the CerminRWA contract grants access, per party ---- */}
          <LedgerNode appearAt={bC(27)} />
          {CONTRACTS.map((c, i) => (
            <ContractCard
              key={c.title}
              title={c.title}
              badges={c.badges}
              appearAt={CARD_BAR[i]!}
              left={CARD_POS[i]!.x}
              top={CARD_POS[i]!.y}
              width={CARD_W2}
              landAts={LAND_ATS[i]!}
            />
          ))}
          {/* contract packets fly ledger → party badges; the pool-bound private
              ones are DEFLECTED by a terracotta X (the money shot) */}
          <PacketLayer />

          {/* ---- headline + subline (bars 31–32) ---- */}
          <ComicText
            text={"Guard repays only\nbelow your trigger."}
            from={headFrom}
            x={960}
            y={806}
            size={66}
            rotate={-2}
            fill={COLORS.goldSoft}
          />
          <div
            style={{
              position: "absolute",
              top: 946,
              left: 360,
              width: 1200,
              textAlign: "center",
              opacity: sublineOp,
              fontFamily: FONT_SANS,
              fontWeight: 500,
              fontSize: 30,
              lineHeight: 1.3,
              color: COLORS.muted,
            }}
          >
            CerminRWA recomputes your Health Ratio on-chain — above the trigger, guardRepay reverts. The pool has no call into your vault.
          </div>
        </AbsoluteFill>
      </Pulse>

      {/* whoosh in; a click per flow-arrow and per contract card; a soft chime
          as the headline lands. No riser (the music's outro build carries it). */}
      <Sfx type="whoosh" at={0} volume={0.38} />
      <Sfx type="click" at={bC(23) + 6} volume={0.4} />
      <Sfx type="click" at={bC(24)} volume={0.4} />
      <Sfx type="click" at={bC(25)} volume={0.4} />
      <Sfx type="click" at={bC(26)} volume={0.4} />
      <Sfx type="click" at={bC(27)} volume={0.4} />
      <Sfx type="click" at={bC(28)} volume={0.4} />
      <Sfx type="click" at={bC(29)} volume={0.4} />
      <Sfx type="click" at={bC(30)} volume={0.4} />
      {/* the three deflection "thunks" — existing click at low volume, max 3 */}
      {STAMP_FRAMES.map((f, i) => (
        <Sfx key={`stamp-${i}`} type="click" at={f} volume={0.26} />
      ))}
      <Sfx type="chime" at={headFrom} volume={0.42} />
    </Atmosphere>
  );
};
