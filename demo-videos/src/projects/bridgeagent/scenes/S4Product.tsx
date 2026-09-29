import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Camera, clamp, Cursor, fadeUp, Glass, Halftone, InkFrame, PremiumBg, Pulse, Sfx, useSceneClock } from "../../../kit";
import type { CamKey, CursorKey } from "../../../kit";
import { C, F, SCREEN, SHOT_W } from "../theme";
import { BAR } from "../timeline";
import { RealTag, Shot } from "../ui";

/**
 * S4 · PRODUCT (bars 24–28, phrase downbeat). The REAL BridgeAgent status page
 * (next start :3290, web/.env.bsc-testnet) — every value on it is an SSR read
 * of the live BSC-testnet contracts. One screen per bar, camera moves on beats:
 *   24 hero: headline (b1) → LIVE · BSC TESTNET (b2) → identity section (b3)
 *   25 agent: "#1" (b1) → owner (b2) → registry + journal (b3)
 *   26 ledger: stats (b1) → 2 trades (b2) → click trade #1 (b3)
 *   27 record: PnL (bps) 150 on-chain (b1) → trade #2 +0.75% (b2) → trade hash (b3)
 */
const W = 1380;
const FX = (1920 - W) / 2;
const FY = 104;
const BAR_H = Math.round(W * 0.03);
const K = (W - 3) / SHOT_W;
const at = (sx: number, sy: number) => ({ x: FX + 1.5 + sx * K, y: FY + 1.5 + BAR_H + sy * K });

const P = {
  headline: at(760, 290),
  live: at(1400, 60),
  ident: at(700, 760),
  num: at(1490, 240),
  owner: at(560, 300),
  addrs: at(700, 350),
  stats: at(900, 260),
  rows: at(960, 800),
  row1: at(900, 754),
  bps: at(1300, 900),
  row2: at(1300, 1060),
  hash: at(1400, 850),
};
const CENTER = { x: 960, y: 560 };
const key = (frame: number, pt: { x: number; y: number }, scale: number): CamKey => ({ frame, x: pt.x, y: pt.y, scale });

export const S4Product: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.product; // 24

  const SHOTS = [
    { f: 0, src: SCREEN.hero, cap: "The public status page: server-rendered straight from BSC." },
    { f: b(k + 1), src: SCREEN.agent, cap: "Agent #1: an ERC-8004 identity, owned by the agent wallet." },
    { f: b(k + 2), src: SCREEN.trades, cap: "An append-only ledger: 2 trades read from the TradeJournal." },
    { f: b(k + 3), src: SCREEN.tradeOpen, cap: "The on-chain record: pnlBps 150, closedAt, agent #1." },
  ];
  let shot = SHOTS[0]!;
  for (const s of SHOTS) if (frame >= s.f) shot = s;
  const swapFlash = SHOTS.slice(1).reduce((m, s) => (frame >= s.f ? Math.max(m, interpolate(frame, [s.f, s.f + 3], [0.35, 0], clamp)) : m), 0);

  const cam: CamKey[] = [key(0, P.headline, 1.9)];
  const cut = (t: number, pt: { x: number; y: number }, scale: number) => cam.push(key(t - 1, cam[cam.length - 1]!, cam[cam.length - 1]!.scale), key(t, pt, scale));
  const move = (t: number, pt: { x: number; y: number }, scale: number, dur = 7) => {
    const last = cam[cam.length - 1]!;
    if (t > last.frame) cam.push(key(t, last, last.scale));
    cam.push(key(t + dur, pt, scale));
  };
  move(b(k, 1), P.headline, 1.6, 10);
  move(b(k, 2), P.live, 2.6);
  move(b(k, 3), P.ident, 1.5);
  cut(b(k + 1), CENTER, 1);
  move(b(k + 1, 1), P.num, 2.2);
  move(b(k + 1, 2), P.owner, 2.2);
  move(b(k + 1, 3), P.addrs, 1.8);
  cut(b(k + 2), CENTER, 1);
  move(b(k + 2, 1), P.stats, 1.6);
  move(b(k + 2, 2), P.rows, 1.8);
  move(b(k + 2, 3), P.row1, 1.9);
  cut(b(k + 3), P.row1, 1.4);
  move(b(k + 3, 1), P.bps, 2.1);
  move(b(k + 3, 2), P.row2, 1.9);
  move(b(k + 3, 3), P.hash, 2.2);

  const cursor: CursorKey[] = [
    { frame: 0, x: at(1500, 500).x, y: at(1500, 500).y },
    { frame: b(k, 2) - 4, x: P.live.x, y: P.live.y },
    { frame: b(k + 1, 2) - 4, x: at(440, 272).x, y: at(440, 272).y },
    { frame: b(k + 2, 3) - 5, x: at(880, 754).x, y: at(880, 754).y, click: true, clickDelay: 5 },
    { frame: b(k + 3, 1) - 4, x: at(1560, 896).x, y: at(1560, 896).y },
    { frame: b(k + 3, 3) - 4, x: at(1560, 852).x, y: at(1560, 852).y },
  ];

  const ring = (on: boolean, x: number, y: number, w: number, h: number, t: number) =>
    on ? <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 10, border: `3px solid ${C.gold}`, boxShadow: "0 0 30px rgba(240,185,11,0.6)", opacity: interpolate(frame, [t, t + 4], [0, 1], clamp) }} /> : null;

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(105,147,120,0.26)" glowB="rgba(240,185,11,0.08)" glow="top" floor={0.3} grid={0.4} />
      <Halftone opacity={0.03} gap={22} />

      <Pulse intensity={0.35} shake={0} glow={false}>
        <Camera keyframes={cam}>
          <div style={{ position: "absolute", left: FX, top: FY, width: W }}>
            <Shot src={shot.src} w={W} url="localhost:3290/">
              {shot.src === SCREEN.hero ? ring(frame >= b(k, 2), 1190, 16, 430, 44, b(k, 2)) : null}
              {shot.src === SCREEN.agent ? ring(frame >= b(k + 1, 1), 1380, 100, 240, 270, b(k + 1, 1)) : null}
              {shot.src === SCREEN.tradeOpen ? ring(frame >= b(k + 3, 1), 975, 875, 640, 44, b(k + 3, 1)) : null}
            </Shot>
            <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: swapFlash, borderRadius: 18, pointerEvents: "none" }} />
          </div>
          <Cursor keyframes={cursor} rippleColor={C.mossHi} />
        </Camera>
      </Pulse>

      <div style={{ position: "absolute", left: FX - 10, top: 40 }}>
        <RealTag at={0} label="BridgeAgent status page · live reads from BSC testnet" />
      </div>

      <div key={shot.f} style={{ position: "absolute", left: 0, right: 0, bottom: 46, display: "flex", justifyContent: "center", ...fadeUp(frame, shot.f, 8, 18) }}>
        <Glass radius={18} glow={0.3} glowColor="rgba(105,147,120,0.4)" fill="rgba(9,17,13,0.95)" innerStyle={{ padding: "16px 30px" }}>
          <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 34, color: C.text }}>{shot.cap}</div>
        </Glass>
      </div>

      <InkFrame inset={22} width={4} opacity={0.55} color="#f4efe4" />

      {[1, 2, 3].map((i) => (
        <Sfx key={`h${i}`} name="tick" at={b(k, i)} volume={0.4} />
      ))}
      {[1, 2, 3].map((bar) => (
        <React.Fragment key={bar}>
          <Sfx name="whoosh" at={b(k + bar)} volume={0.35} />
          {[1, 2, 3].map((i) => (
            <Sfx key={`t${bar}${i}`} name="tick" at={b(k + bar, i)} volume={0.4} />
          ))}
        </React.Fragment>
      ))}
      <Sfx name="chime" at={b(k + 3, 1)} volume={0.45} />
    </AbsoluteFill>
  );
};
