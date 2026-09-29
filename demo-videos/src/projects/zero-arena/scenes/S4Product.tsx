import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Camera, clamp, Cursor, fadeUp, Glass, Halftone, InkFrame, PremiumBg, Pulse, Sfx, useSceneClock } from "../../../kit";
import type { CamKey, CursorKey } from "../../../kit";
import { C, F, SCREEN } from "../theme";
import { BAR } from "../timeline";
import { RealTag, Ring, Shot } from "../ui";

/**
 * S4 · PRODUCT (bars 9–13). The REAL Zero Arena dashboard (zero-arena-fe,
 * next build + start with the BSC-testnet env), reading LIVE testnet state:
 * cert #1, iNFT #1, the LiveCertificate run and Season #1. One page per bar:
 *   9   /leaderboard            b1 podium zoom · b2 "CERT #1" ring · b3 click Inspect
 *   10  /agent/rsi-classic      b1 certificate card · b2 runHash · b3 storage root = placeholder
 *   11  /agent/…/live  (LIFT)   b1 hash-chain card · b2 genesis · b3 cumulative (2 epochs)
 *   12  /season/1               b1 "Settled" · b2 pool 0 left (paid + refunded) · b3 pull back
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
  const k = BAR.product; // 9

  const SHOTS = [
    { f: 0, src: SCREEN.leaderboard, url: "localhost:3251/leaderboard", cap: "Leaderboard: agent #1, read from AgentCertificate on BSC testnet" },
    { f: b(k + 1), src: SCREEN.agent, url: "localhost:3251/agent/rsi-classic", cap: "Agent page: on-chain certificate + iNFT #1 (smoke-test values)" },
    { f: b(k + 2), src: SCREEN.live, url: "localhost:3251/agent/rsi-classic/live", cap: "Live page: 2 epochs committed by the operator; hash chain on-chain" },
    { f: b(k + 3), src: SCREEN.season1, url: "localhost:3251/season/1", cap: "Season #1: settled; the pool was paid out, 0 left in the contract" },
  ];
  let si = 0;
  SHOTS.forEach((s, i) => {
    if (frame >= s.f) si = i;
  });
  const shot = SHOTS[si]!;
  const swapFlash = SHOTS.slice(1).reduce((m, s) => (frame >= s.f ? Math.max(m, interpolate(frame, [s.f, s.f + 3], [0.4, 0], clamp)) : m), 0);

  const cam: CamKey[] = [key(0, CENTER, 1)];
  const cut = (t: number, pt: { x: number; y: number }, scale: number) => cam.push(key(t - 1, cam[cam.length - 1]!, cam[cam.length - 1]!.scale), key(t, pt, scale));
  const move = (t: number, pt: { x: number; y: number }, scale: number, dur = 8) => {
    const last = cam[cam.length - 1]!;
    if (t > last.frame) cam.push(key(t, last, last.scale));
    cam.push(key(t + dur, pt, scale));
  };
  // bar 9 — leaderboard
  move(b(k, 1), at(960, 520), 1.55);
  move(b(k, 3), at(1150, 800), 1.45);
  // bar 10 — agent certificate
  cut(b(k + 1), CENTER, 1);
  move(b(k + 1, 1), at(700, 830), 1.75);
  // bar 11 — live hash chain
  cut(b(k + 2), CENTER, 1);
  move(b(k + 2, 1), at(760, 440), 1.7);
  move(b(k + 2, 3), at(1000, 430), 1.5);
  // bar 12 — season 1
  cut(b(k + 3), CENTER, 1);
  move(b(k + 3, 1), at(760, 190), 1.7);
  move(b(k + 3, 2), at(1320, 190), 1.7);
  move(b(k + 3, 3), CENTER, 0.94, 12);

  const cursor: CursorKey[] = [
    { frame: 0, x: 1500, y: 960 },
    { frame: b(k, 2) - 4, x: at(1526, 841).x + 60, y: at(1526, 841).y + 60 },
    { frame: b(k, 3) - 6, x: at(1526, 841).x, y: at(1526, 841).y, click: true, clickDelay: 6 },
    { frame: b(k + 1, 1), x: at(1421, 180).x, y: at(1421, 180).y + 40 },
    { frame: b(k + 2, 1), x: at(900, 560).x, y: at(900, 560).y },
    { frame: b(k + 3, 1), x: at(420, 175).x, y: at(420, 175).y },
  ];

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(52,211,153,0.2)" glowB="rgba(167,139,250,0.1)" glow="top" floor={0.3} grid={0.4} />
      <Halftone opacity={0.03} gap={22} />

      <Pulse intensity={0.35} shake={0} glow={false}>
        <Camera keyframes={cam}>
          <div style={{ position: "absolute", left: FX, top: FY, width: W }}>
            <Shot src={shot.src} w={W} url={shot.url}>
              {si === 0 ? <Ring x={762} y={300} w={396} h={396} at={b(k, 2)} until={b(k, 3) + 4} label="CERT #1 · FROM CHAIN" /> : null}
              {si === 1 ? (
                <>
                  <Ring x={420} y={784} w={520} h={24} at={b(k + 1, 2)} until={b(k + 1, 3)} label="RUNHASH · ANCHORED ON-CHAIN" />
                  <Ring x={420} y={836} w={520} h={24} at={b(k + 1, 3)} color={C.amber} below label="PLACEHOLDER ROOT · 0G UPLOAD SKIPPED" />
                </>
              ) : null}
              {si === 2 ? (
                <>
                  <Ring x={420} y={455} w={520} h={24} at={b(k + 2, 2)} until={b(k + 2, 3)} label="GENESIS = RUNHASH" />
                  <Ring x={420} y={481} w={520} h={24} at={b(k + 2, 3)} below label="CUMULATIVE · AFTER 2 EPOCHS" />
                  <Ring x={1250} y={240} w={262} h={82} at={b(k + 2, 3)} label="2 COMMITS" />
                </>
              ) : null}
              {si === 3 ? (
                <>
                  <Ring x={344} y={140} w={62} h={26} at={b(k + 3, 1)} label="SETTLED" />
                  <Ring x={1420} y={104} w={158} h={70} at={b(k + 3, 2)} color={C.gold} label="0 LEFT · PAID + REFUNDED" />
                </>
              ) : null}
            </Shot>
            <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: swapFlash, borderRadius: 18, pointerEvents: "none" }} />
          </div>
          <Cursor keyframes={cursor} hideAfter={b(k + 3, 3)} rippleColor={C.emerald} />
        </Camera>
      </Pulse>

      <div style={{ position: "absolute", left: FX - 10, top: 56, display: "flex", alignItems: "center", gap: 18, padding: "8px 26px 8px 8px", borderRadius: 999, background: "rgba(8,9,11,0.9)" }}>
        <RealTag at={0} size={22} />
        <div style={{ fontFamily: F.mono, fontSize: 22, color: C.textMuted }}>{shot.url.replace("localhost:3251", "") || "/"}</div>
      </div>

      <div key={si} style={{ position: "absolute", left: 0, right: 0, bottom: 52, display: "flex", justifyContent: "center", ...fadeUp(frame, shot.f + 2, 10, 20) }}>
        <Glass radius={18} glow={0.3} glowColor="rgba(52,211,153,0.3)" fill="rgba(12,12,16,0.94)" innerStyle={{ padding: "14px 30px" }}>
          <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 30, color: C.text }}>{shot.cap}</div>
        </Glass>
      </div>

      <InkFrame inset={22} width={4} opacity={0.55} color="#f4efe4" />

      <Sfx name="tick" at={b(k, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k, 2)} volume={0.55} />
      <Sfx name="tick" at={b(k, 3)} volume={0.6} />
      {[1, 2, 3].map((j) => (
        <React.Fragment key={j}>
          <Sfx name="whoosh" at={b(k + j)} volume={0.35} />
          <Sfx name="tick" at={b(k + j, 1)} volume={0.45} />
          <Sfx name="tick" at={b(k + j, 2)} volume={0.55} />
        </React.Fragment>
      ))}
      <Sfx name="impact" at={b(k + 2)} volume={0.6} />
      <Sfx name="tick" at={b(k + 1, 3)} volume={0.55} />
      <Sfx name="chime" at={b(k + 2, 3)} volume={0.5} />
      <Sfx name="chime" at={b(k + 3, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
