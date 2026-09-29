import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  Camera,
  clamp,
  CoinDot,
  ComicText,
  Cursor,
  fadeUp,
  Glass,
  Halftone,
  INK,
  PhoneFrame,
  PremiumBg,
  Pulse,
  Sfx,
  SpeedBurst,
  useSceneClock,
} from "../../../kit";
import type { CamKey, CursorKey } from "../../../kit";
import { C, F, SCREEN } from "../theme";
import { BAR } from "../timeline";

/**
 * S4 · PRODUCT (bars 12–20) — the REAL iUSD Pay app (vite build --mode
 * bsc-testnet, live pool/token addresses), captured headless at 430×932 @2x.
 * One screen beat per bar, clicks landing on beat 3 / downbeats:
 *   12  sign-in (wallet connected) — cursor taps SIGN IN on b3
 *   13  "WOW, you got a cool USDT payment Card!" — camera onto the card
 *   14  dashboard — cursor taps Transfer on b3
 *   15  (break) transfer form: 10 USDT → @calmlark, camera drifts to the form
 *   16  DROP: zoom onto "Fee: 0.0500 USDT" (0.5%)
 *   17  tap "Send 10 USDT" on the downbeat → "SENT!"
 *   18  settings: Auto-Claim ON — zoom on the toggle
 *   19  (break) pull back: on-chain result card (from VERIFY-BNB.md)
 */

// Phone geometry (content px). Screenshot = 860×1864.
const PHONE_W = 440;
const PHONE_X = 300;
const PHONE_Y = 80;
const BEZEL = Math.round(PHONE_W * 0.035);
const SCR_W = PHONE_W - BEZEL * 2 - 3;
const S = SCR_W / 860;
const OX = PHONE_X + 1.5 + BEZEL;
const OY = PHONE_Y + 1.5 + BEZEL;
/** Screenshot px → content px. */
const at = (sx: number, sy: number) => ({ x: OX + sx * S, y: OY + sy * S });

const P = {
  signIn: at(430, 1075),
  card: at(430, 990),
  transferTile: at(152, 924),
  amount: at(200, 362),
  fee: at(135, 653),
  send: at(560, 800),
  toggle: at(742, 748),
};

type Shot = { bar: number; src: string };

/** Camera key that zooms to `scale` and parks content point `pt` at screen (sx, sy) — keeps the phone left of the copy column. */
const camAt = (frame: number, pt: { x: number; y: number }, scale: number, sx = 600, sy = 540): CamKey => ({
  frame,
  x: pt.x + (960 - sx) / scale,
  y: pt.y + (540 - sy) / scale,
  scale,
});

export const S4Product: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.product; // 12

  const SHOTS: Shot[] = [
    { bar: k, src: SCREEN.signin },
    { bar: k + 1, src: SCREEN.card },
    { bar: k + 2, src: SCREEN.dashboard },
    { bar: k + 3, src: SCREEN.transfer },
    { bar: k + 6, src: SCREEN.settings },
  ];
  let shot = SHOTS[0]!;
  for (const s of SHOTS) if (frame >= b(s.bar)) shot = s;
  // A 3-frame white pop whenever the screen swaps.
  const swapFlash = SHOTS.slice(1).reduce(
    (m, s) => (frame >= b(s.bar) ? Math.max(m, interpolate(frame, [b(s.bar), b(s.bar) + 3], [0.55, 0], clamp)) : m),
    0,
  );

  const center = { x: 960, y: 540 };
  const cam: CamKey[] = [
    { frame: 0, ...center, scale: 1 },
    { frame: b(k, 2), ...center, scale: 1 },
    camAt(b(k, 3), P.signIn, 1.12, 640, 600),
    camAt(b(k + 1), P.card, 1.3, 600, 520),
    camAt(b(k + 1, 3), P.card, 1.34, 600, 520),
    { frame: b(k + 2), ...center, scale: 1 },
    { frame: b(k + 2, 2), ...center, scale: 1 },
    camAt(b(k + 2, 3), P.transferTile, 1.12, 560, 560),
    { frame: b(k + 3), ...center, scale: 1 },
    camAt(b(k + 4), P.amount, 1.3, 560, 420),
    camAt(b(k + 4, 1), P.fee, 1.5, 470, 540),
    camAt(b(k + 4, 3), P.fee, 1.5, 470, 540),
    camAt(b(k + 5), P.send, 1.4, 520, 560),
    camAt(b(k + 5, 3), P.send, 1.34, 520, 560),
    camAt(b(k + 6), P.toggle, 1.25, 640, 540),
    camAt(b(k + 6, 1), P.toggle, 1.55, 640, 540),
    camAt(b(k + 6, 3), P.toggle, 1.55, 640, 540),
    { frame: b(k + 7), ...center, scale: 1 },
  ];

  const cursor: CursorKey[] = [
    { frame: 0, x: 900, y: 760 },
    { frame: b(k, 2) - 4, x: P.signIn.x + 30, y: P.signIn.y + 6, click: true, clickDelay: b(k, 3) - (b(k, 2) - 4) },
    { frame: b(k + 1, 1), x: P.card.x + 150, y: P.card.y + 160 },
    { frame: b(k + 2, 2) - 4, x: P.transferTile.x, y: P.transferTile.y, click: true, clickDelay: b(k + 2, 3) - (b(k + 2, 2) - 4) },
    { frame: b(k + 3, 2), x: P.amount.x + 10, y: P.amount.y + 10 },
    { frame: b(k + 4, 3) - 4, x: P.send.x, y: P.send.y, click: true, clickDelay: b(k + 5) - (b(k + 4, 3) - 4) },
    { frame: b(k + 6), x: P.toggle.x - 60, y: P.toggle.y + 60 },
    { frame: b(k + 6, 1), x: P.toggle.x + 6, y: P.toggle.y + 8 },
  ];

  // Right-hand copy, one card per screen beat.
  const COPY: { from: number; to: number; kicker: string; head: React.ReactNode; sub?: string }[] = [
    { from: b(k), to: b(k + 1), kicker: "01 · Connect", head: <>Sign in with any <i style={{ color: C.yellow }}>BNB wallet</i></>, sub: "One EIP-191 signature. No seed phrase in the app." },
    { from: b(k + 1), to: b(k + 2), kicker: "02 · Register", head: <>Get your <i style={{ color: C.yellow }}>pay card</i></>, sub: "A nickname and ID that friends can pay." },
    { from: b(k + 2), to: b(k + 3), kicker: "03 · Home", head: <>Transfer · Request · <i style={{ color: C.yellow }}>Gift</i></>, sub: "A payments app, not a block explorer." },
    { from: b(k + 3), to: b(k + 5), kicker: "04 · Send", head: <>10 USDT to <i style={{ color: C.yellow }}>@calmlark</i></>, sub: "The 0.5% fee is shown up front." },
    { from: b(k + 6), to: b(k + 7), kicker: "05 · Auto-claim", head: <>Auto-claim is <i style={{ color: C.green }}>on</i></>, sub: "A relayer claims for your friend and pays the gas." },
  ];

  const resultAt = b(k + 7);

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(236,211,94,0.16)" glowB="rgba(232,69,126,0.18)" glow="left" floor={0.4} />
      <Halftone opacity={0.04} gap={20} />

      <Camera keyframes={cam}>
        <Pulse intensity={0.5} shake={0} glow={false}>
          <AbsoluteFill>
            <div style={{ position: "absolute", left: PHONE_X, top: PHONE_Y }}>
              <PhoneFrame src={shot.src} width={PHONE_W} glow={0.55} glowColor="rgba(236,211,94,0.35)">
                <AbsoluteFill style={{ background: "#fff", opacity: swapFlash }} />
              </PhoneFrame>
            </div>

            {/* Fee highlight ring (bar 16 drop). */}
            {frame >= b(k + 4, 1) && frame < b(k + 6) ? (
              <div
                style={{
                  position: "absolute",
                  left: P.fee.x - 58,
                  top: P.fee.y - 17,
                  width: 116,
                  height: 34,
                  borderRadius: 10,
                  border: `3px solid ${C.yellow}`,
                  boxShadow: `0 0 24px ${C.yellow}`,
                  transform: `scale(${interpolate(frame, [b(k + 4, 1), b(k + 4, 1) + 6], [1.4, 1], clamp)})`,
                  opacity: interpolate(frame, [b(k + 4, 1), b(k + 4, 1) + 4], [0, 1], clamp),
                }}
              />
            ) : null}
            {/* Auto-claim highlight ring (bar 18). */}
            {frame >= b(k + 6, 1) && frame < b(k + 7) ? (
              <div
                style={{
                  position: "absolute",
                  left: P.toggle.x - 30,
                  top: P.toggle.y - 20,
                  width: 60,
                  height: 40,
                  borderRadius: 999,
                  border: `3px solid ${C.green}`,
                  boxShadow: `0 0 26px ${C.green}`,
                  transform: `scale(${interpolate(frame, [b(k + 6, 1), b(k + 6, 1) + 6], [1.6, 1], clamp)})`,
                }}
              />
            ) : null}

            {/* Coin flies off the phone on SEND (bar 17 downbeat → b2). */}
            {frame >= b(k + 5) && frame < b(k + 6)
              ? (() => {
                  const t = interpolate(frame, [b(k + 5), b(k + 5, 2)], [0, 1], clamp);
                  return (
                    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                      <CoinDot cx={P.send.x + t * 700} cy={P.send.y - Math.sin(t * Math.PI) * 260} r={34 - t * 8} label="10" rotate={t * 360} opacity={1 - t * 0.3} />
                    </svg>
                  );
                })()
              : null}

            <Cursor keyframes={cursor} size={38} hideAfter={b(k + 7)} />
          </AbsoluteFill>
        </Pulse>
      </Camera>

      {/* Copy column (outside the camera so it stays put). */}
      {COPY.map((c, i) =>
        frame >= c.from && frame < c.to ? (
          <div key={i} style={{ position: "absolute", left: 1080, top: 330, width: 760, ...fadeUp(frame, c.from, 10, 30) }}>
            <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 22, letterSpacing: "0.22em", textTransform: "uppercase", color: C.yellow }}>{c.kicker}</div>
            <div style={{ fontFamily: F.display, fontWeight: 500, fontSize: 84, lineHeight: 1.02, color: C.text, marginTop: 14, letterSpacing: "-0.01em" }}>{c.head}</div>
            {c.sub ? <div style={{ fontFamily: F.sans, fontSize: 30, color: C.textDim, marginTop: 20, lineHeight: 1.35 }}>{c.sub}</div> : null}
          </div>
        ) : null,
      )}

      {/* Comic lettering on the beats. */}
      <ComicText text="NEW CARD!" from={b(k + 1, 1)} x={1320} y={760} size={96} rotate={-6} fill={C.yellow} variant="onomatopoeia" echoColor={C.pink} exitAt={b(k + 2) - 4} />
      <ComicText text="0.5% FEE" from={b(k + 4, 1)} x={1360} y={770} size={104} rotate={5} fill="#fff" variant="onomatopoeia" echoColor={C.yellow} exitAt={b(k + 5) - 4} />
      <SpeedBurst cx={1400} cy={540} from={b(k + 5)} count={16} inner={120} spread={360} color={C.yellow} opacity={0.55} seed="sent" fade />
      <ComicText text="SENT!" from={b(k + 5)} x={1400} y={540} size={170} rotate={-7} skewX={-6} fill={C.yellow} variant="onomatopoeia" echoColor={C.pink} exitAt={b(k + 6) - 4} />

      {/* Bar 19 (break): the on-chain result, straight from VERIFY-BNB.md. */}
      {frame >= resultAt ? (
        <div style={{ position: "absolute", left: 1060, top: 290, width: 780, ...fadeUp(frame, resultAt, 10, 40) }}>
          <Glass radius={26} glow={0.5} glowColor="rgba(52,199,89,0.35)" fill="rgba(16,16,18,0.85)" innerStyle={{ padding: "30px 36px" }}>
            <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 20, letterSpacing: "0.22em", color: C.green }}>ON-CHAIN RESULT · BSC TESTNET</div>
            <div style={{ fontFamily: F.display, fontSize: 54, color: C.text, marginTop: 12, whiteSpace: "nowrap" }}>
              Friend receives <span style={{ color: C.green }}>9.95 USDT</span>
            </div>
            {[
              <>relayer <span style={{ fontFamily: F.mono, color: C.text }}>sponsorClaim</span> ~16 s after the deposit</>,
              <>0.05 USDT fee (0.5%) → treasury</>,
              <>the recipient's wallet held no gas</>,
            ].map((line, i) => (
              <div key={i} style={{ fontFamily: F.sans, fontSize: 28, color: C.textDim, marginTop: i === 0 ? 18 : 8, ...fadeUp(frame, resultAt + 4 + i * 4, 10, 12) }}>
                <span style={{ color: C.green }}>✓ </span>
                {line}
              </div>
            ))}
          </Glass>
        </div>
      ) : null}
      <ComicText text="AUTO-CLAIMED!" from={b(k + 7, 2)} x={1450} y={740} size={104} rotate={-4} fill={C.green} variant="onomatopoeia" echoColor={INK} />

      {/* SFX on the clicks, swaps and slams. */}
      <Sfx name="tick" at={b(k, 3)} volume={0.7} />
      <Sfx name="whoosh" at={b(k + 1)} volume={0.45} />
      <Sfx name="chime" at={b(k + 1, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k + 2, 3)} volume={0.7} />
      <Sfx name="whoosh" at={b(k + 3)} volume={0.45} />
      <Sfx name="impact" at={b(k + 4, 1)} volume={0.6} />
      <Sfx name="tick" at={b(k + 5)} volume={0.7} />
      <Sfx name="impact" at={b(k + 5)} volume={0.8} />
      <Sfx name="whoosh" at={b(k + 6)} volume={0.45} />
      <Sfx name="tick" at={b(k + 6, 1)} volume={0.6} />
      <Sfx name="chime" at={b(k + 7)} volume={0.6} />
      <Sfx name="impact" at={b(k + 7, 2)} volume={0.6} />
    </AbsoluteFill>
  );
};
