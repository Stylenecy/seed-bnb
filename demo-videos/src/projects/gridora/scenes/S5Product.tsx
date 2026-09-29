import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BnbBadge, Camera, clamp, Cursor, fadeUp, Glass, Halftone, InkFrame, PremiumBg, Pulse, Sfx, useSceneClock } from "../../../kit";
import type { CamKey, CursorKey } from "../../../kit";
import { C, F, SCREEN, SHOT_W } from "../theme";
import { BAR } from "../timeline";
import { RealTag, Shot } from "../ui";

/**
 * S5 · PRODUCT (bars 20–24, DROP). The REAL Gridora verifier (frontend/web, next start),
 * server-reading BNB Chain with viem — no wallet connect, no backend. One screen per bar,
 * camera moves on the beats:
 *   20 mainnet hero: live on bnb chain · agent #140004 (b1) → stats (b2) → +18.77% (b3)
 *   21 mainnet tape: 38 journaled trades · +278 (b1) · -259 (b2) · click bscscan (b3)
 *   22 mainnet proof: identityregistry (b1) · tradejournal (b2) · strategyledger (b3)
 *   23 (break) the same frontend pointed at the BSC TESTNET deploy: the +85 bps trade (b1) → 0x979e… (b2)
 */
const W = 1380;
const FX = (1920 - W) / 2;
const FY = 112;
const BAR_H = Math.round(W * 0.03);
const K = (W - 3) / SHOT_W;
const at = (sx: number, sy: number) => ({ x: FX + 1.5 + sx * K, y: FY + 1.5 + BAR_H + sy * K });

const P = {
  live: at(590, 205),
  stats: at(960, 790),
  pnl: at(1050, 790),
  row35: at(760, 383),
  row34: at(760, 440),
  scan37: at(1560, 270),
  idReg: at(1250, 350),
  journal: at(1250, 500),
  ledger: at(1250, 650),
  tRow: at(760, 402),
  tProof: at(1250, 694),
};
const CENTER = { x: 960, y: 560 };
const key = (frame: number, pt: { x: number; y: number }, scale: number): CamKey => ({ frame, x: pt.x, y: pt.y, scale });

export const S5Product: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.product; // 20

  const SHOTS = [
    { f: 0, src: SCREEN.mainHero, url: "localhost:3310/", net: "BSC mainnet", cap: "38 trades journaled on BSC mainnet: 58% win rate, +18.77% net." },
    { f: b(k + 1), src: SCREEN.mainTape, url: "localhost:3310/#tape", net: "BSC mainnet", cap: "The tape: every row is a real TradeJournal event. Click it, check it." },
    { f: b(k + 2), src: SCREEN.mainProof, url: "localhost:3310/#proof", net: "BSC mainnet", cap: "Three contracts: identity, journal, strategy ledger." },
    { f: b(k + 3), src: SCREEN.testTape, url: "localhost:3311/#tape", net: "BSC testnet", cap: "Same frontend, testnet deploy: agent #1, one trade, +85 bps." },
  ];
  let shot = SHOTS[0]!;
  for (const s of SHOTS) if (frame >= s.f) shot = s;
  const swapFlash = SHOTS.slice(1).reduce((m, s) => (frame >= s.f ? Math.max(m, interpolate(frame, [s.f, s.f + 3], [0.35, 0], clamp)) : m), 0);

  const cam: CamKey[] = [key(0, CENTER, 1)];
  const cut = (t: number, pt: { x: number; y: number }, scale: number) => cam.push(key(t - 1, cam[cam.length - 1]!, cam[cam.length - 1]!.scale), key(t, pt, scale));
  const move = (t: number, pt: { x: number; y: number }, scale: number, dur = 7) => {
    const last = cam[cam.length - 1]!;
    if (t > last.frame) cam.push(key(t, last, last.scale));
    cam.push(key(t + dur, pt, scale));
  };
  move(b(k, 1), P.live, 2.2);
  move(b(k, 2), P.stats, 1.5);
  move(b(k, 3), P.pnl, 2.3);
  cut(b(k + 1), CENTER, 1.05);
  move(b(k + 1, 1), P.row35, 1.9);
  move(b(k + 1, 2), P.row34, 1.9);
  move(b(k + 1, 3), P.scan37, 1.8);
  cut(b(k + 2), CENTER, 1);
  move(b(k + 2, 1), P.idReg, 1.45);
  move(b(k + 2, 2), P.journal, 1.45);
  move(b(k + 2, 3), P.ledger, 1.45);
  cut(b(k + 3), CENTER, 1);
  move(b(k + 3, 1), P.tRow, 1.9);
  move(b(k + 3, 2), P.tProof, 1.45);

  const cursor: CursorKey[] = [
    { frame: 0, x: at(1500, 560).x, y: at(1500, 560).y },
    { frame: b(k, 2) - 4, x: at(1100, 800).x, y: at(1100, 800).y },
    { frame: b(k + 1, 1) - 4, x: at(760, 383).x, y: at(760, 383).y },
    { frame: b(k + 1, 3) - 5, x: P.scan37.x, y: P.scan37.y, click: true, clickDelay: 5 },
    { frame: b(k + 2, 1) - 4, x: at(1480, 350).x, y: at(1480, 350).y },
    { frame: b(k + 2, 3) - 4, x: at(1480, 650).x, y: at(1480, 650).y },
    { frame: b(k + 3, 1) - 4, x: at(790, 402).x, y: at(790, 402).y },
    { frame: b(k + 3, 2) - 4, x: at(1480, 694).x, y: at(1480, 694).y },
  ];

  const ring = (on: boolean, x: number, y: number, w: number, h: number, t: number) =>
    on ? <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 14, border: `4px solid ${C.coral}`, boxShadow: "0 0 30px rgba(217,119,87,0.6)", opacity: interpolate(frame, [t, t + 4], [0, 1], clamp) }} /> : null;

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(217,119,87,0.24)" glowB="rgba(240,185,11,0.08)" glow="top" floor={0.3} grid={0.4} />
      <Halftone opacity={0.03} gap={22} />

      <Pulse intensity={0.35} shake={0} glow={false}>
        <Camera keyframes={cam}>
          <div style={{ position: "absolute", left: FX, top: FY, width: W }}>
            <Shot src={shot.src} w={W} url={shot.url}>
              {shot.src === SCREEN.mainHero ? ring(frame >= b(k, 3), 962, 735, 276, 100, b(k, 3)) : null}
              {shot.src === SCREEN.mainTape ? ring(frame >= b(k + 1, 1), 712, 368, 120, 34, b(k + 1, 1)) : null}
              {shot.src === SCREEN.mainTape ? ring(frame >= b(k + 1, 2), 712, 425, 120, 34, b(k + 1, 2)) : null}
              {shot.src === SCREEN.mainProof ? ring(frame >= b(k + 2, 1), 862, 290, 770, 120, b(k + 2, 1)) : null}
              {shot.src === SCREEN.testTape ? ring(frame >= b(k + 3, 1), 704, 386, 112, 34, b(k + 3, 1)) : null}
            </Shot>
            <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: swapFlash, borderRadius: 18, pointerEvents: "none" }} />
          </div>
          <Cursor keyframes={cursor} rippleColor={C.coral} />
        </Camera>
      </Pulse>

      <div style={{ position: "absolute", left: FX - 10, top: 40, display: "flex", alignItems: "center", gap: 18 }}>
        <RealTag at={0} label={`gridora verifier · viem reads from ${shot.net}`} />
      </div>
      <div style={{ position: "absolute", right: FX - 10, top: 40 }}>
        <BnbBadge key={shot.net} label={shot.net === "BSC mainnet" ? "BSC MAINNET · 56" : "BSC TESTNET · 97"} at={shot.net === "BSC mainnet" ? 0 : b(k + 3)} size={26} live variant="dark" />
      </div>

      <div key={shot.f} style={{ position: "absolute", left: 0, right: 0, bottom: 46, display: "flex", justifyContent: "center", ...fadeUp(frame, shot.f, 8, 18) }}>
        <Glass radius={18} glow={0.3} glowColor="rgba(217,119,87,0.4)" fill="rgba(14,12,11,0.95)" innerStyle={{ padding: "16px 30px" }}>
          <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 34, color: C.text }}>{shot.cap}</div>
        </Glass>
      </div>

      <InkFrame inset={22} width={4} opacity={0.55} color={C.cream} />

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
      <Sfx name="chime" at={b(k, 3)} volume={0.45} />
      <Sfx name="chime" at={b(k + 3, 1)} volume={0.45} />
    </AbsoluteFill>
  );
};
