import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Camera, clamp, Cursor, fadeUp, Glass, Halftone, InkFrame, Pulse, Sfx, useSceneClock } from "../../../kit";
import type { CamKey, CursorKey } from "../../../kit";
import { InkNight } from "../art";
import { C, F, SCREEN } from "../theme";
import { BAR } from "../timeline";
import { RealTag, Ring, Shot } from "../ui";

/**
 * S4 · PRODUCT (bars 48–52). The REAL MUSASHI frontend (`next start` with
 * .env.bsc-testnet) + the REAL Go daemon, reading LIVE BSC-testnet state.
 *   48  /                      b1 zoom title · b2 "Built on BNB Chain" · b3 click Open Dashboard
 *   49  / #pipeline            b1 gates 1–4 · b2 gates 5–7 · b3 pull back
 *   50  /dashboard             b1 STRIKES 1 · b2 W/L 1/0 · b3 TOTAL RETURN +25.0%
 *   51  /dashboard · Ledger    b1 strike #0 row · b2 4/4 STRONG · b3 +25.00%
 */
const W = 1440;
const FX = (1920 - W) / 2;
const FY = 150;
const BAR_H = Math.round(W * 0.032);
const K = (W - 3) / 1920;
const at = (sx: number, sy: number) => ({ x: FX + 1.5 + sx * K, y: FY + 1.5 + BAR_H + sy * K });
const CENTER = { x: 960, y: 560 };
const key = (frame: number, pt: { x: number; y: number }, scale: number): CamKey => ({ frame, x: pt.x, y: pt.y, scale });

export const S4Product: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.product; // 48

  const SHOTS = [
    { f: 0, src: SCREEN.landing, url: "localhost:3271/", cap: "Landing: MUSASHI 武蔵, conviction-weighted token intelligence" },
    { f: b(k + 1), src: SCREEN.pipeline, url: "localhost:3271/#pipeline", cap: "The 7-gate elimination pipeline: fail one gate and the token is out" },
    { f: b(k + 2), src: SCREEN.dashboard, url: "localhost:3271/dashboard", cap: "Dashboard: agent #0's reputation, read live from ConvictionLog on BSC testnet" },
    { f: b(k + 3), src: SCREEN.ledger, url: "localhost:3271/dashboard · Ledger", cap: "Strike ledger: strike #0, BSC USDT, convergence 4/4, outcome +25.00%" },
  ];
  let si = 0;
  SHOTS.forEach((s, i) => {
    if (frame >= s.f) si = i;
  });
  const shot = SHOTS[si]!;
  const swapFlash = SHOTS.slice(1).reduce((m, s) => (frame >= s.f ? Math.max(m, interpolate(frame, [s.f, s.f + 3], [0.35, 0], clamp)) : m), 0);

  const cam: CamKey[] = [key(0, CENTER, 1)];
  const cut = (t: number, pt: { x: number; y: number }, scale: number) => cam.push(key(t - 1, cam[cam.length - 1]!, cam[cam.length - 1]!.scale), key(t, pt, scale));
  const move = (t: number, pt: { x: number; y: number }, scale: number, dur = 8) => {
    const last = cam[cam.length - 1]!;
    if (t > last.frame) cam.push(key(t, last, last.scale));
    cam.push(key(t + dur, pt, scale));
  };
  // 48 landing
  move(b(k, 1), at(1000, 470), 1.55);
  move(b(k, 3), at(900, 640), 1.5);
  // 49 pipeline
  cut(b(k + 1), CENTER, 1);
  move(b(k + 1, 1), at(960, 413), 1.3);
  move(b(k + 1, 2), at(960, 692), 1.3);
  move(b(k + 1, 3), CENTER, 1.02, 10);
  // 50 dashboard reputation
  cut(b(k + 2), CENTER, 1);
  move(b(k + 2, 1), at(1420, 330), 1.75);
  // 51 ledger
  cut(b(k + 3), CENTER, 1);
  move(b(k + 3, 1), at(730, 440), 1.7);
  move(b(k + 3, 3), CENTER, 0.96, 12);

  const cursor: CursorKey[] = [
    { frame: 0, x: 1500, y: 960 },
    { frame: b(k, 2), x: at(900, 760).x, y: at(900, 760).y },
    { frame: b(k, 3) - 6, x: at(868, 712).x, y: at(868, 712).y, click: true, clickDelay: 6 },
    { frame: b(k + 2, 1), x: at(1300, 300).x, y: at(1300, 300).y },
    { frame: b(k + 3) - 2, x: at(815, 220).x, y: at(815, 220).y, click: true, clickDelay: 2 },
    { frame: b(k + 3, 1), x: at(700, 470).x, y: at(700, 470).y },
  ];

  return (
    <AbsoluteFill>
      <InkNight glow={1} />
      <Halftone opacity={0.03} gap={22} color={C.amber} />

      <Pulse intensity={0.35} shake={0} glow={false}>
        <Camera keyframes={cam}>
          <div style={{ position: "absolute", left: FX, top: FY, width: W }}>
            <Shot src={shot.src} w={W} url={shot.url}>
              {si === 0 ? (
                <>
                  <Ring x={784} y={314} w={156} h={30} at={b(k, 2)} until={b(k + 1)} color={C.gold} label="BUILT ON BNB CHAIN" />
                </>
              ) : null}
              {si === 1 ? (
                <>
                  <Ring x={384} y={278} w={1152} h={270} at={b(k + 1, 1)} until={b(k + 1, 2)} color={C.amberHi} label="GATES 1–4" below />
                  <Ring x={384} y={565} w={1152} h={255} at={b(k + 1, 2)} until={b(k + 1, 3)} color={C.amberHi} label="GATES 5–7" below />
                </>
              ) : null}
              {si === 2 ? (
                <>
                  <Ring x={1208} y={214} w={204} h={128} at={b(k + 2, 1)} color={C.amberHi} label="1 STRIKE" />
                  <Ring x={1430} y={214} w={206} h={128} at={b(k + 2, 2)} color={C.green} label="1 WIN · 0 LOSS" />
                  <Ring x={1430} y={358} w={206} h={104} at={b(k + 2, 3)} color={C.green} label="+25.0% = +2500 BPS" below />
                </>
              ) : null}
              {si === 3 ? (
                <>
                  <Ring x={314} y={432} w={832} h={50} at={b(k + 3, 1)} until={b(k + 3, 2)} color={C.amberHi} label="STRIKE #0 · FROM CONVICTIONLOG" />
                  <Ring x={591} y={445} w={97} h={24} at={b(k + 3, 2)} color={C.green} label="CONVERGENCE 4" />
                  <Ring x={909} y={445} w={79} h={24} at={b(k + 3, 3)} color={C.green} label="+25.00%" below />
                </>
              ) : null}
            </Shot>
            <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: swapFlash, borderRadius: 18, pointerEvents: "none" }} />
          </div>
          <Cursor keyframes={cursor} hideAfter={b(k + 3, 3)} rippleColor={C.amberHi} />
        </Camera>
      </Pulse>

      <div style={{ position: "absolute", left: FX - 10, top: 56, display: "flex", alignItems: "center", gap: 18, padding: "8px 26px 8px 8px", borderRadius: 999, background: "rgba(8,6,4,0.9)" }}>
        <RealTag at={0} size={22} />
        <div style={{ fontFamily: F.mono, fontSize: 22, color: C.textMuted }}>{shot.url.replace("localhost:3271", "")}</div>
      </div>

      <div key={si} style={{ position: "absolute", left: 0, right: 0, bottom: 52, display: "flex", justifyContent: "center", ...fadeUp(frame, shot.f + 2, 10, 20) }}>
        <Glass radius={18} glow={0.3} glowColor="rgba(217,119,6,0.35)" fill="rgba(12,9,6,0.94)" innerStyle={{ padding: "14px 30px" }}>
          <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 30, color: C.text }}>{shot.cap}</div>
        </Glass>
      </div>

      <InkFrame inset={22} width={4} opacity={0.55} color={C.washi} />

      <Sfx name="tick" at={b(k, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k, 2)} volume={0.55} />
      <Sfx name="tick" at={b(k, 3)} volume={0.6} />
      {[1, 2, 3].map((j) => (
        <React.Fragment key={j}>
          <Sfx name="whoosh" at={b(k + j)} volume={0.35} />
          <Sfx name="tick" at={b(k + j, 1)} volume={0.45} />
          <Sfx name="tick" at={b(k + j, 2)} volume={0.55} />
          <Sfx name="tick" at={b(k + j, 3)} volume={0.55} />
        </React.Fragment>
      ))}
      <Sfx name="chime" at={b(k + 2, 3)} volume={0.5} />
      <Sfx name="chime" at={b(k + 3, 3)} volume={0.5} />
    </AbsoluteFill>
  );
};
