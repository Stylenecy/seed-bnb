import React from "react";
import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Camera, CamKey } from "../lib/Camera";
import { Sfx } from "../lib/ui";
import { Pulse } from "../lib/Pulse";
import { Callout, CalloutSpec } from "../lib/Callout";
import { COLORS } from "../lib/tokens";
import { FONT_DISPLAY, FONT_SANS } from "../lib/fonts";
import { barA, SEAM_FRAME } from "../lib/beat";

/**
 * S4a · The product — ONE CONTINUOUS, UNCUT screen recording.
 *
 * BNB Chain version: the footage is a capture of the BNB frontend driving the
 * backend + Guard Agent against the REAL BSC testnet (chain 97, CerminRWA
 * 0x8651…64F2). Runs bar 16 → bar 37. The whole user journey plays as a SINGLE
 * `<OffthreadVideo>` at playbackRate 1.0 — sign-in → claim faucet → borrow →
 * strategy + Coupon Sweep → fund the Shadow Vault → crash the market →
 * automatic rescue back to green. One continuous take; the only edit (baked
 * into journey.mp4) speed-ramps the idle waits for block confirmations
 * (faucet mint, borrow's 4 txs, vault top-up, the oracle move, the guard's
 * repay) and drops two sub-second frontend flashes (a pre-sync placeholder
 * dashboard, a stale "you already have a loan" card) — every click and
 * on-screen number is real.
 *
 * The only motion layered on top is ONE slow, spring-eased camera rig that
 * drifts between zoom levels 1.0–1.18 to follow the action, plus beat-popped
 * comic callouts placed in the UI's empty space beside each step (they ride
 * inside the camera, pointing at the control they name) and two Cermin product
 * toasts. Footage stays pump/shake/flash-free.
 */

const JOURNEY = staticFile("video/journey.mp4");
const VW = 1920;
const VH = 1080;

const S = barA(16); // 907 — scene starts a bar later (SAVED panel breathes); the
// footage trim compensates, so every recorded moment keeps its absolute time
const lb = (k: number): number => barA(k) - S; // local frame of bar k
const DUR = SEAM_FRAME - S; // 1181 frames

// BSC testnet take (journey.mp4 = 1184 frames, already cut to start as Connect
// fades in) — consumed 0→1181 at rate 1.0.
const SRC_TRIM = 0;

// --- Full-bleed coverage guard (full-frame video variant) ------------------
// The recording already fills the whole 1920×1080 viewport at scale 1, so the
// camera's only job is to keep the focus point far enough from the edges that a
// zoomed frame never exposes black. Clamping every keyframe keeps the whole
// eased path full-bleed (each edge constraint is concave along a segment).
const COVER_PAD = 6;
const coverVidKey = (k: CamKey): CamKey => {
  const scale = Math.max(k.scale, 1);
  const halfW = (VW / 2 + COVER_PAD) / scale;
  const halfH = (VH / 2 + COVER_PAD) / scale;
  const clamp = (v: number, lo: number, hi: number) =>
    lo <= hi ? Math.min(Math.max(v, lo), hi) : (lo + hi) / 2;
  return {
    frame: k.frame,
    scale,
    x: clamp(k.x, halfW, VW - halfW),
    y: clamp(k.y, halfH, VH - halfH),
  };
};
const coverVid = (keys: CamKey[]): CamKey[] => keys.map(coverVidKey);

/**
 * ONE continuous camera rig for the whole take. Every move is ≥ 1.5s and eased
 * (the Camera interpolates keyframes with an inOut-cubic, so nothing snaps).
 * Focus points lean toward the on-screen action — the launch button, the typed
 * name, the amount slider, the strategy cards, the Coupon Sweep toggle, Confirm,
 * the dashboard ring, the vault, the crashing price, the GREEN 147.6% ring, the
 * fresh note — but stay gentle (scale ≤ 1.15) and full-bleed (coverVid clamps).
 */
const CAM: CamKey[] = [
  { frame: 0, x: 960, y: 600, scale: 1.1 }, // Connect fades in
  { frame: 40, x: 960, y: 640, scale: 1.13 }, // type "maya" — centre the input
  { frame: 110, x: 900, y: 470, scale: 1.1 }, // faucet → funded on BNB Chain
  { frame: 215, x: 960, y: 450, scale: 1.14 }, // amount slider drags live
  { frame: 345, x: 960, y: 520, scale: 1.08 }, // strategy cards
  { frame: 425, x: 960, y: 560, scale: 1.1 }, // Balanced expands
  { frame: 470, x: 1040, y: 760, scale: 1.13 }, // Coupon Sweep toggle (lower-right)
  { frame: 530, x: 960, y: 520, scale: 1.1 }, // review → Confirm → Done
  { frame: 630, x: 780, y: 420, scale: 1.12 }, // 166.7% ring
  { frame: 690, x: 770, y: 420, scale: 1.08 }, // Shadow Vault
  { frame: 735, x: 620, y: 580, scale: 1.14 }, // type 1500 → Add
  { frame: 840, x: 900, y: 560, scale: 1.06 }, // Simulate — ease wide
  { frame: 905, x: 780, y: 760, scale: 1.14 }, // drop 10%, run the rescue
  { frame: 990, x: 780, y: 500, scale: 1.1 }, // ring 126.7% — the agent works
  { frame: 1035, x: 780, y: 560, scale: 1.12 }, // 145.0% — the payoff
  { frame: 1100, x: 1000, y: 440, scale: 1.1 }, // Home
  { frame: 1150, x: 1250, y: 380, scale: 1.14 }, // the rescue note (right rail)
  { frame: 1181, x: 1100, y: 480, scale: 1.1 }, // settle to the seam
];

/* ----------------------------------------------------------- comic callouts */

/**
 * The demo no longer wears a uniform bottom subtitle bar. Instead each step
 * gets a COMIC CALLOUT — a small Bangers block (ComicText: ink outline + offset
 * shadow + spring squash-stretch pop) that lives IN the empty dark space of the
 * app UI, right beside the thing it describes, with a little ink-outlined
 * parchment/gold POINTER aiming at that UI element.
 *
 * Callouts are children of the <Camera>, so they sit in the footage's CONTENT
 * coordinate space (1920×1080 = the recorded frame) and track the UI as the
 * camera drifts — the pointer always aims true. Each `from`/`x`/`y` was chosen
 * against an extracted footage frame + the camera's visible window at that local
 * frame, so the block lands over dark UI (never the active control or cursor)
 * and stays fully on-screen at the 1.03–1.15 zoom.
 *
 * Timing is beat-aligned and retimed to the REAL footage step (the old captions
 * ran ~half a bar behind the recording): pop in on the step's bar, idle-float
 * ±3px, pop out ~half a bar before the next. Two deliberate gaps — the dashboard
 * ring reveal, and the live rescue — let the screen carry, unchanged. The
 * <Callout>/<Pointer> primitives live in ../lib/Callout.
 *
 * The nine callouts below are each parked in empty dark UI beside a step. Region
 * alternates (no two consecutive share a corner); pointer fill alternates
 * gold ⇄ parchment and variant tri ⇄ dash; `angle` aims each tail at its target
 * (see the trailing comment on each line).
 */
const CALLOUTS: CalloutSpec[] = [
  // 1 · right of the Connect card → the name input (left-down).
  { text: "YOUR NAME =\nA REAL ON-CHAIN ADDRESS.", from: 14, out: 88, tx: 1450, ty: 580, size: 44, rotate: 3, skewX: 2, textFill: COLORS.text, px: 1215, py: 680, angle: 168, ptrFill: COLORS.goldSoft, variant: "dash", ptrSkew: 5 },
  // 2 · right rail under the notes → the "Confirmed on BNB Chain" stamp (left).
  { text: "FUNDED.\nON-CHAIN.", from: 162, out: 198, tx: 1340, ty: 580, size: 50, rotate: -3, skewX: -2, textFill: COLORS.goldSoft, px: 1185, py: 505, angle: 188, ptrFill: COLORS.gold, variant: "tri", ptrSkew: -3 },
  // 3 · right of the borrow wizard → the amount (left).
  { text: "BORROW IN\n3 STEPS.", from: lb(20), out: 330, tx: 1490, ty: 420, size: 48, rotate: 4, skewX: 3, textFill: COLORS.text, px: 1330, py: 430, angle: 178, ptrFill: COLORS.goldSoft, variant: "dash", ptrSkew: 4 },
  // 4 · left of the strategy cards → the cards (right).
  { text: "A STRATEGY —\nNOT A PERCENTAGE.", from: 345, out: 452, tx: 370, ty: 480, size: 44, rotate: -3, skewX: -2, textFill: COLORS.goldSoft, px: 575, py: 510, angle: 4, ptrFill: COLORS.gold, variant: "tri", ptrSkew: -3 },
  // 5 · right of the Coupon Sweep toggle → the switch (left).
  { text: "COUPON\nSWEEP ON.", from: 462, out: 508, tx: 1530, ty: 800, size: 46, rotate: 5, skewX: 3, textFill: COLORS.text, px: 1345, py: 850, angle: 172, ptrFill: COLORS.goldSoft, variant: "dash", ptrSkew: 5 },
  // 6 · below the vault top-up → the Add-funds field (up).
  { text: "FUND YOUR\nSHADOW VAULT.", from: lb(28), out: 790, tx: 600, ty: 840, size: 48, rotate: -3, skewX: -2, textFill: COLORS.goldSoft, px: 565, py: 760, angle: -82, ptrFill: COLORS.gold, variant: "tri", ptrSkew: -3 },
  // 7 · empty lower-right during the price drag → the simulator (left).
  { text: "NOW CRASH\nTHE MARKET.", from: lb(31), out: 948, tx: 1340, ty: 820, size: 48, rotate: 4, skewX: 3, textFill: COLORS.text, px: 1170, py: 850, angle: 176, ptrFill: COLORS.goldSoft, variant: "dash", ptrSkew: 4 },
  // 8 · lower-right as the ring greens → the stats row (outstanding 5,241.38).
  { text: "AUTO-REPAID\n$758.62.", from: 1030, out: 1092, tx: 1340, ty: 850, size: 50, rotate: -3, skewX: -2, textFill: COLORS.goldSoft, px: 1165, py: 915, angle: 163, ptrFill: COLORS.gold, variant: "tri", ptrSkew: -3 },
  // 9 · under the notes feed → the fresh rescue note (straight up).
  { text: "RESCUED.\nBACK TO GREEN.", from: 1104, out: 1178, tx: 1340, ty: 600, size: 46, rotate: 3, skewX: 2, textFill: COLORS.text, px: 1330, py: 520, angle: -90, ptrFill: COLORS.goldSoft, variant: "dash", ptrSkew: 4 },
];

/* ----------------------------------------------------------------- toast */

/** Small Cermin logo mark (gold ring + centered dot) for the toast header. */
const ToastMark: React.FC<{ size: number }> = ({ size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.3,
      background: COLORS.sunken,
      border: `1px solid ${COLORS.hairlineStrong}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
      <circle cx={12} cy={12} r={9} fill="none" stroke={COLORS.gold} strokeWidth={2} />
      <circle cx={12} cy={12} r={3.4} fill={COLORS.gold} />
    </svg>
  </div>
);

/**
 * A Cermin-styled product notification. Springs in from the top-right, holds,
 * then springs out — a real in-app toast, not a lower-third. `appearAt`/`dur`
 * are frames local to the S4a scene.
 */
const Toast: React.FC<{
  title: string;
  body: string;
  appearAt: number;
  dur: number;
  accent?: string;
}> = ({ title, body, appearAt, dur, accent = COLORS.gold }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const outAt = appearAt + dur;
  if (frame < appearAt - 2 || frame > outAt + 32) return null;

  const inP = spring({
    frame: frame - appearAt,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.85 },
  });
  const outP = spring({
    frame: frame - outAt,
    fps,
    config: { damping: 200, stiffness: 130 },
  });
  const x = interpolate(inP, [0, 1], [470, 0]) + interpolate(outP, [0, 1], [0, 500]);
  const op = Math.min(inP, 1 - outP);

  return (
    <div
      style={{
        position: "absolute",
        top: 46,
        right: 46,
        width: 452,
        transform: `translateX(${x}px)`,
        opacity: op,
        background: COLORS.raised,
        border: `1px solid ${COLORS.hairlineStrong}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 16,
        boxShadow: "0 24px 50px -20px rgba(0,0,0,0.75)",
        padding: "18px 22px",
        display: "flex",
        gap: 15,
        alignItems: "flex-start",
      }}
    >
      <ToastMark size={40} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 600,
              fontSize: 22,
              color: COLORS.text,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </span>
          <span style={{ fontFamily: FONT_SANS, fontSize: 15, color: COLORS.faint }}>
            · now
          </span>
        </div>
        <span
          style={{
            fontFamily: FONT_SANS,
            fontWeight: 400,
            fontSize: 20,
            lineHeight: 1.32,
            color: COLORS.muted,
          }}
        >
          {body}
        </span>
      </div>
    </div>
  );
};

/* Measured from the BSC testnet take (extracted frames of journey.mp4): the
   faucet / Confirm / "Drop price 10%" / "Run the rescue scenario" click
   ripples, and the frame the ring turns green at 145.0% after the Guard
   Agent's on-chain guardRepay. Other steps: type 13–32 · funded 158 · amount
   drag 233–306 · Aggressive 376 · Sweep 476 · Done 594 · dashboard 627 ·
   vault 681/1,500 at 791 · Simulate 834 · $0.90 914 · 126.7% 989 · Home 1097. */
const CLICK_FAUCET = 120;
const CLICK_CONFIRM = 556;
const CLICK_DROP = 874;
const CLICK_RESCUE = 953;
const GREEN_AT = 1024;

/* ------------------------------------------------------------------ scene */

export const S4Product: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.app }}>
      {/* Product footage stays PERFECTLY steady — no pump, no shake, no flicker:
          viewers must be able to follow every step (user requirement). */}
      <Pulse sceneStart={S} intensity={0} shake={0} glow={false}>
        {/* ONE camera rig over ONE continuous video — no inner cuts. The comic
            callouts ride INSIDE the camera in the footage's content space, so
            they track the UI (and their pointers keep aiming) as it drifts. */}
        <Camera keyframes={coverVid(CAM)}>
          <AbsoluteFill>
            <OffthreadVideo
              src={JOURNEY}
              muted
              playbackRate={1}
              trimBefore={SRC_TRIM}
              style={{ width: VW, height: VH, objectFit: "cover" }}
            />
          </AbsoluteFill>
          {CALLOUTS.map((c, i) => (
            <Callout key={i} {...c} />
          ))}
        </Camera>
      </Pulse>

      {/* Product notifications — screen-fixed overlays, spring in on a beat. */}
      <Toast
        title="Cermin-RWA"
        body="Guard Agent is watching your loan live on BSC testnet."
        appearAt={lb(26)}
        dur={90}
      />
      <Toast
        title="Cermin-RWA"
        body="I stepped in — repaid $758.62 from your Shadow Vault. You're back at 145.0%."
        appearAt={1034}
        dur={128}
        accent={COLORS.sage}
      />

      {/* Whoosh only at the scene's entry (the S4b seam carries the exit). Clicks
          align to the real gold ripples in the footage; chime as the ring greens. */}
      <Sfx type="whoosh" at={0} volume={0.4} />
      <Sfx type="click" at={CLICK_FAUCET} volume={0.4} />
      <Sfx type="click" at={CLICK_CONFIRM} volume={0.4} />
      <Sfx type="click" at={CLICK_DROP} volume={0.4} />
      <Sfx type="click" at={CLICK_RESCUE} volume={0.4} />
      <Sfx type="chime" at={GREEN_AT} volume={0.45} />
    </AbsoluteFill>
  );
};
