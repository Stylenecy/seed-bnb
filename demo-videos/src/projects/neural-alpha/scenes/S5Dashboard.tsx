import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Camera, clamp, Cursor, fadeUp, Glass, Halftone, InkFrame, PremiumBg, Pulse, Sfx, useSceneClock } from "../../../kit";
import type { CamKey, CursorKey } from "../../../kit";
import { C, F, SCREEN, SHOT_W } from "../theme";
import { BAR } from "../timeline";
import { PaperTag, RealTag, Shot } from "../ui";

/**
 * S5 · DASHBOARD (bars 16–20, DROP on 16, zoom punch-in). The REAL Neural Alpha
 * Next.js dashboard (next start :3321) proxying to the SAME paper run (agent
 * :3320, paused after cycle 8). One screen per bar:
 *   16 overview: header "Cycle #8" (b1) → portfolio $1,000.16 (b2) → allocation (b3)
 *   17 trades + Agent Brain: 3 paper buys (b1) → plain-language decisions (b2)
 *   18 positions + wallet: SL/TP bands (b1) → wallet "PAPER MODE" badge (b2) → risk guards (b3)
 *   19 (break) signal monitor: live Binance BSC price column (b1) → RSI/MACD/BB (b2)
 * Shot coords are in the 1920×1200 capture space.
 */
const W = 1380;
const FX = (1920 - W) / 2;
const FY = 104;
const BAR_H = Math.round(W * 0.03);
const K = (W - 3) / SHOT_W;
const at = (sx: number, sy: number) => ({ x: FX + 1.5 + sx * K, y: FY + 1.5 + BAR_H + sy * K });

const P = {
  cycle: at(560, 36),
  value: at(200, 350),
  alloc: at(1300, 560),
  trades: at(420, 330),
  brain: at(1360, 300),
  pos: at(900, 200),
  paper: at(876, 458),
  guards: at(1400, 620),
  live: at(420, 330),
  ind: at(900, 330),
};
const CENTER = { x: 960, y: 560 };
const key = (frame: number, pt: { x: number; y: number }, scale: number): CamKey => ({ frame, x: pt.x, y: pt.y, scale });

export const S5Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.dash; // 16

  const SHOTS = [
    { f: 0, src: SCREEN.overview, url: "localhost:3321/", cap: "Same run, live in the dashboard: NAV $1,000.16 after 8 paper cycles." },
    { f: b(k + 1), src: SCREEN.trades, url: "localhost:3321/#trades", cap: "3 paper buys — AAVE · STG · NXPC — and the Agent Brain explaining each cycle." },
    { f: b(k + 2), src: SCREEN.positions, url: "localhost:3321/#positions", cap: "Positions with stop-loss / take-profit bands. Wallet panel: PAPER MODE." },
    { f: b(k + 3), src: SCREEN.signals, url: "localhost:3321/#signals", cap: "Signal Monitor: live Binance BSC prices + RSI · MACD · BB · VWAP per token." },
  ];
  let shot = SHOTS[0]!;
  for (const s of SHOTS) if (frame >= s.f) shot = s;
  const swapFlash = SHOTS.slice(1).reduce((m, s) => (frame >= s.f ? Math.max(m, interpolate(frame, [s.f, s.f + 3], [0.4, 0], clamp)) : m), 0);

  const cam: CamKey[] = [key(0, CENTER, 1)];
  const cut = (t: number, pt: { x: number; y: number }, scale: number) => cam.push(key(t - 1, cam[cam.length - 1]!, cam[cam.length - 1]!.scale), key(t, pt, scale));
  const move = (t: number, pt: { x: number; y: number }, scale: number, dur = 7) => {
    const last = cam[cam.length - 1]!;
    if (t > last.frame) cam.push(key(t, last, last.scale));
    cam.push(key(t + dur, pt, scale));
  };
  move(b(k, 1), P.cycle, 1.9);
  move(b(k, 2), P.value, 1.9);
  move(b(k, 3), P.alloc, 1.7);
  cut(b(k + 1), CENTER, 1);
  move(b(k + 1, 1), P.trades, 1.8);
  move(b(k + 1, 2), P.brain, 1.7);
  cut(b(k + 2), CENTER, 1);
  move(b(k + 2, 1), P.pos, 1.6);
  move(b(k + 2, 2), P.paper, 2.1);
  move(b(k + 2, 3), P.guards, 1.7);
  cut(b(k + 3), CENTER, 1);
  move(b(k + 3, 1), P.live, 1.8);
  move(b(k + 3, 2), P.ind, 1.6);
  move(b(k + 3, 3), CENTER, 1.05);

  const cursor: CursorKey[] = [
    { frame: 0, x: P.value.x + 260, y: P.value.y + 200 },
    { frame: b(k, 2) - 4, x: P.value.x, y: P.value.y, click: true, clickDelay: 4 },
    { frame: b(k + 1, 1) - 4, x: P.trades.x, y: P.trades.y, click: true, clickDelay: 4 },
    { frame: b(k + 2, 2) - 4, x: P.paper.x, y: P.paper.y, click: true, clickDelay: 4 },
    { frame: b(k + 3, 1) - 4, x: P.live.x, y: P.live.y, click: true, clickDelay: 4 },
  ];

  return (
    <AbsoluteFill>
      <PremiumBg base={C.void} glowA="rgba(14,203,129,0.2)" glowB="rgba(240,185,11,0.08)" glow="top" floor={0.3} grid={0.4} />
      <Halftone opacity={0.03} gap={22} />

      <Pulse intensity={0.35} shake={0} glow={false}>
        <Camera keyframes={cam}>
          <div style={{ position: "absolute", left: FX, top: FY, width: W }}>
            <Shot src={shot.src} w={W} url={shot.url}>
              {frame >= b(k + 2, 2) && frame < b(k + 3) ? (
                <div style={{ position: "absolute", left: 826, top: 441, width: 122, height: 36, borderRadius: 8, border: `3px solid ${C.gold}`, boxShadow: "0 0 30px rgba(240,185,11,0.7)", opacity: interpolate(frame, [b(k + 2, 2), b(k + 2, 2) + 4], [0, 1], clamp) }} />
              ) : null}
            </Shot>
            <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: swapFlash, borderRadius: 18, pointerEvents: "none" }} />
          </div>
          <Cursor keyframes={cursor} rippleColor={C.neon} />
        </Camera>
      </Pulse>

      <div style={{ position: "absolute", left: FX - 10, top: 40 }}>
        <RealTag at={0} label={`Neural Alpha dashboard · ${shot.url.replace("localhost:3321", "") || "/"}`} />
      </div>
      <div style={{ position: "absolute", right: FX - 10, top: 44 }}>
        <PaperTag at={0} size={18} label="PAPER MODE · paused after cycle #8" />
      </div>

      <div key={shot.f} style={{ position: "absolute", left: 0, right: 0, bottom: 46, display: "flex", justifyContent: "center", ...fadeUp(frame, shot.f, 8, 18) }}>
        <Glass radius={18} glow={0.3} glowColor="rgba(14,203,129,0.35)" fill="rgba(8,10,12,0.94)" innerStyle={{ padding: "16px 30px" }}>
          <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 33, color: C.text }}>{shot.cap}</div>
        </Glass>
      </div>

      <InkFrame inset={22} width={4} opacity={0.55} color="#f4efe4" />

      <Sfx name="tick" at={b(k, 1)} volume={0.4} />
      <Sfx name="tick" at={b(k, 2)} volume={0.55} />
      <Sfx name="tick" at={b(k, 3)} volume={0.4} />
      <Sfx name="whoosh" at={b(k + 1)} volume={0.35} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k + 1, 2)} volume={0.4} />
      <Sfx name="whoosh" at={b(k + 2)} volume={0.35} />
      <Sfx name="tick" at={b(k + 2, 1)} volume={0.4} />
      <Sfx name="chime" at={b(k + 2, 2)} volume={0.45} />
      <Sfx name="tick" at={b(k + 2, 3)} volume={0.4} />
      <Sfx name="whoosh" at={b(k + 3)} volume={0.35} />
      <Sfx name="tick" at={b(k + 3, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k + 3, 2)} volume={0.4} />
    </AbsoluteFill>
  );
};
