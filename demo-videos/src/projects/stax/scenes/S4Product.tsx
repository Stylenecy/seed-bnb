import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  Camera,
  clamp,
  ComicText,
  Cursor,
  fadeUp,
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
 * S4 · PRODUCT (bars 9–13) — the REAL Stax web app (next build with
 * web/.env.bsc-testnet), /demo route = the real LiteApp screens on the app's
 * own demo data. Captured headless at 430×932 @2x.
 *   9   home — cursor taps "Invest with Vera" on b3
 *   10  "Vera is building your plan" → plan lands on b2
 *   11  LIFT: zoom onto the fee line (b1), tap Invest on b3
 *   12  "Securing your investment" → "You're invested." on b2
 */
const PHONE_W = 440;
const PHONE_X = 300;
const PHONE_Y = 80;
const BEZEL = Math.round(PHONE_W * 0.035);
const SCR_W = PHONE_W - BEZEL * 2 - 3;
const S = SCR_W / 860;
const OX = PHONE_X + 1.5 + BEZEL;
const OY = PHONE_Y + 1.5 + BEZEL;
const at = (sx: number, sy: number) => ({ x: OX + sx * S, y: OY + sy * S });

const P = {
  investVera: at(400, 710),
  planTop: at(430, 968),
  fee: at(430, 1668),
  invest: at(430, 1767),
  success: at(430, 396),
  recorded: at(430, 1312),
};

const camAt = (frame: number, pt: { x: number; y: number }, scale: number, sx = 600, sy = 540): CamKey => ({
  frame,
  x: pt.x + (960 - sx) / scale,
  y: pt.y + (540 - sy) / scale,
  scale,
});

export const S4Product: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.product; // 9

  const SHOTS = [
    { f: b(k), src: SCREEN.home },
    { f: b(k + 1), src: SCREEN.thinking },
    { f: b(k + 1, 2), src: SCREEN.plan },
    { f: b(k + 3), src: SCREEN.placing },
    { f: b(k + 3, 2), src: SCREEN.success },
  ];
  let shot = SHOTS[0]!;
  for (const s of SHOTS) if (frame >= s.f) shot = s;
  const swapFlash = SHOTS.slice(1).reduce(
    (m, s) => (frame >= s.f ? Math.max(m, interpolate(frame, [s.f, s.f + 3], [0.5, 0], clamp)) : m),
    0,
  );

  const center = { x: 960, y: 540 };
  const cam: CamKey[] = [
    { frame: 0, ...center, scale: 1 },
    { frame: b(k, 1), ...center, scale: 1 },
    camAt(b(k, 3), P.investVera, 1.3, 600, 520),
    { frame: b(k + 1), ...center, scale: 1 },
    { frame: b(k + 1, 2), ...center, scale: 1 },
    camAt(b(k + 1, 3), P.planTop, 1.15, 600, 480),
    camAt(b(k + 2), P.fee, 1.3, 560, 560),
    camAt(b(k + 2, 1), P.fee, 1.6, 520, 540),
    camAt(b(k + 2, 2), P.invest, 1.45, 560, 560),
    camAt(b(k + 2, 3), P.invest, 1.45, 560, 560),
    { frame: b(k + 3), ...center, scale: 1 },
    { frame: b(k + 3, 2), ...center, scale: 1 },
    camAt(b(k + 3, 3), P.recorded, 1.3, 600, 600),
    camAt(b(k + 4), P.recorded, 1.34, 600, 600),
  ];

  const cursor: CursorKey[] = [
    { frame: 0, x: 900, y: 800 },
    { frame: b(k, 2), x: P.investVera.x + 40, y: P.investVera.y + 6, click: true, clickDelay: b(k, 3) - b(k, 2) },
    { frame: b(k + 1, 3), x: P.planTop.x + 120, y: P.planTop.y + 60 },
    { frame: b(k + 2, 2), x: P.invest.x + 10, y: P.invest.y + 4, click: true, clickDelay: b(k + 2, 3) - b(k + 2, 2) },
    { frame: b(k + 3, 3), x: P.recorded.x + 100, y: P.recorded.y + 20 },
  ];

  const COPY: { from: number; to: number; kicker: string; head: React.ReactNode; sub?: string }[] = [
    { from: b(k), to: b(k + 1), kicker: "01 · Home", head: <>One button: <i style={{ color: C.sage }}>Invest with Vera</i></>, sub: "No stock picking, no order tickets." },
    { from: b(k + 1), to: b(k + 2), kicker: "02 · Vera plans", head: <>A goal becomes a <i style={{ color: C.sage }}>signed plan</i></>, sub: "Real, named companies and funds, with a reason for each." },
    { from: b(k + 2), to: b(k + 3), kicker: "03 · Review", head: <>Fee up front: <i style={{ color: C.terracotta }}>25 bps</i></>, sub: "Tap Invest. Gas is covered." },
    { from: b(k + 3), to: b(k + 4), kicker: "04 · Placed", head: <>You're <i style={{ color: C.sage }}>invested.</i></>, sub: "Vera records every plan on-chain, with a BscScan receipt." },
  ];

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(108,192,156,0.2)" glowB="rgba(236,171,126,0.14)" glow="left" floor={0.4} />
      <Halftone opacity={0.04} gap={20} />

      <Camera keyframes={cam}>
        <Pulse intensity={0.5} shake={0} glow={false}>
          <AbsoluteFill>
            <div style={{ position: "absolute", left: PHONE_X, top: PHONE_Y }}>
              <PhoneFrame src={shot.src} width={PHONE_W} glow={0.55} glowColor="rgba(108,192,156,0.4)">
                <AbsoluteFill style={{ background: "#fff", opacity: swapFlash }} />
              </PhoneFrame>
            </div>

            {frame >= b(k + 2, 1) && frame < b(k + 3) ? (
              <div
                style={{
                  position: "absolute",
                  left: P.fee.x - 105,
                  top: P.fee.y - 14,
                  width: 210,
                  height: 28,
                  borderRadius: 10,
                  border: `3px solid ${C.terracotta}`,
                  boxShadow: `0 0 24px ${C.terracotta}`,
                  transform: `scale(${interpolate(frame, [b(k + 2, 1), b(k + 2, 1) + 6], [1.4, 1], clamp)})`,
                  opacity: interpolate(frame, [b(k + 2, 1), b(k + 2, 1) + 4], [0, 1], clamp),
                }}
              />
            ) : null}

            <Cursor keyframes={cursor} size={38} hideAfter={b(k + 4)} />
          </AbsoluteFill>
        </Pulse>
      </Camera>

      {/* "real UI" label — the phone shows the app's own demo data */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 50,
          padding: "8px 16px",
          borderRadius: 999,
          border: `1.5px solid ${C.sage}88`,
          background: "rgba(12,15,18,0.7)",
          fontFamily: F.sans,
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: "0.14em",
          color: C.sageLight,
          textTransform: "uppercase",
        }}
      >
        ● Real Stax app · demo data
      </div>

      {COPY.map((c, i) =>
        frame >= c.from && frame < c.to ? (
          <div key={i} style={{ position: "absolute", left: 1080, top: 330, width: 760, ...fadeUp(frame, c.from, 10, 30) }}>
            <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 22, letterSpacing: "0.22em", textTransform: "uppercase", color: C.sage }}>{c.kicker}</div>
            <div style={{ fontFamily: F.display, fontWeight: 500, fontSize: 84, lineHeight: 1.02, color: C.text, marginTop: 14, letterSpacing: "-0.01em" }}>{c.head}</div>
            {c.sub ? <div style={{ fontFamily: F.sans, fontSize: 30, color: C.textDim, marginTop: 20, lineHeight: 1.35 }}>{c.sub}</div> : null}
          </div>
        ) : null,
      )}

      <ComicText text="THINKING…" from={b(k + 1)} x={1360} y={780} size={96} rotate={-6} fill={C.sageLight} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1, 2)} />
      <ComicText text="PLAN READY!" from={b(k + 1, 2)} x={1380} y={780} size={100} rotate={5} fill="#fff" variant="onomatopoeia" echoColor={C.sage} exitAt={b(k + 2) - 4} />
      <SpeedBurst cx={1420} cy={760} from={b(k + 3, 2)} count={16} inner={120} spread={360} color={C.sage} opacity={0.55} seed="inv" fade />
      <ComicText text="INVESTED!" from={b(k + 3, 2)} x={1420} y={780} size={150} rotate={-7} skewX={-6} fill={C.sageLight} variant="onomatopoeia" echoColor={C.terracotta} />

      <Sfx name="tick" at={b(k, 3)} volume={0.7} />
      <Sfx name="whoosh" at={b(k + 1)} volume={0.45} />
      <Sfx name="chime" at={b(k + 1, 2)} volume={0.5} />
      <Sfx name="impact" at={b(k + 2, 1)} volume={0.6} />
      <Sfx name="tick" at={b(k + 2, 3)} volume={0.7} />
      <Sfx name="whoosh" at={b(k + 3)} volume={0.45} />
      <Sfx name="impact" at={b(k + 3, 2)} volume={0.8} />
      <Sfx name="chime" at={b(k + 3, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
