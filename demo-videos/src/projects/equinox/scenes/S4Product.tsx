import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Camera, clamp, Cursor, fadeUp, Glass, Halftone, InkFrame, PremiumBg, Pulse, Sfx, useSceneClock } from "../../../kit";
import type { CamKey, CursorKey } from "../../../kit";
import { C, F, SCREEN } from "../theme";
import { BAR } from "../timeline";
import { MockTag, Shot } from "../ui";

/**
 * S4 · PRODUCT (bars 12–19) — DROP 2. The REAL Equinox frontend (next build
 * with frontend/.env.bsc-testnet, next start :3230), captured headless. The
 * frontend is MOCK DATA ONLY, so the "UI PREVIEW · MOCK DATA" tag stays up
 * for the whole scene. Per bar:
 *   12 landing "Three concepts" → zoom on "Shadow wallet, spendable" (b2)
 *   13 onboarding: click BNB (b1) → Continue (b3)
 *   14 dashboard: collateral b1 → debt b2 → shadow wallet b3
 *   15 health-factor gauge zoom
 *   16 activity feed: "Defense triggered" row
 *   17 withdraw from the shadow wallet: zoom b1, click Withdraw b2
 *   18 pull back + "contracts live, UI wiring next" caption
 */
const W = 1440;
const FX = (1920 - W) / 2;
const FY = 150;
const BAR_H = Math.round(W * 0.032);
const K = (W - 3) / 1920;
const at = (sx: number, sy: number) => ({ x: FX + 1.5 + sx * K, y: FY + 1.5 + BAR_H + sy * K });

const P = {
  shadowCard: at(1410, 560),
  bnb: at(674, 420),
  cont: at(1456, 796),
  coll: at(675, 385),
  debt: at(1094, 388),
  shadow: at(1512, 390),
  gauge: at(709, 720),
  defense: at(1000, 782),
  defenseIcon: at(518, 782),
  amount: at(1000, 420),
  withdrawBtn: at(1008, 570),
};
const CENTER = { x: 960, y: 560 };
const key = (frame: number, pt: { x: number; y: number }, scale: number): CamKey => ({ frame, x: pt.x, y: pt.y, scale });

export const S4Product: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.product; // 12

  const SHOTS = [
    { f: 0, src: SCREEN.concepts, url: "localhost:3230/", app: false },
    { f: b(k + 1), src: SCREEN.onboarding, url: "localhost:3230/onboarding", app: false },
    { f: b(k + 2), src: SCREEN.dashboard, url: "localhost:3230/dashboard", app: true },
    { f: b(k + 4), src: SCREEN.activity, url: "localhost:3230/dashboard", app: true },
    { f: b(k + 5), src: SCREEN.withdraw, url: "localhost:3230/withdraw", app: true },
  ];
  let shot = SHOTS[0]!;
  for (const s of SHOTS) if (frame >= s.f) shot = s;
  const swapFlash = SHOTS.slice(1).reduce((m, s) => (frame >= s.f ? Math.max(m, interpolate(frame, [s.f, s.f + 3], [0.45, 0], clamp)) : m), 0);

  // Each move starts ON a beat and lands 7 frames later, then holds.
  const cam: CamKey[] = [key(0, CENTER, 1)];
  const cut = (t: number, pt: { x: number; y: number }, scale: number) => cam.push(key(t - 1, cam[cam.length - 1]!, cam[cam.length - 1]!.scale), key(t, pt, scale));
  const move = (t: number, pt: { x: number; y: number }, scale: number, dur = 7) => {
    const last = cam[cam.length - 1]!;
    if (t > last.frame) cam.push(key(t, last, last.scale));
    cam.push(key(t + dur, pt, scale));
  };
  move(b(k, 2), P.shadowCard, 1.55);
  cut(b(k + 1), CENTER, 1);
  cut(b(k + 2), CENTER, 1);
  move(b(k + 2, 1), P.coll, 1.7);
  move(b(k + 2, 2), P.debt, 1.7);
  move(b(k + 2, 3), P.shadow, 1.7);
  move(b(k + 3), P.gauge, 2.0, 10);
  cut(b(k + 4), CENTER, 1);
  move(b(k + 4, 1), P.defense, 1.55);
  cut(b(k + 5), CENTER, 1);
  move(b(k + 5, 1), P.amount, 1.5);
  move(b(k + 6), CENTER, 0.86, 12);

  const cursor: CursorKey[] = [
    { frame: 0, x: 1500, y: 960 },
    { frame: b(k, 1), x: P.shadowCard.x - 40, y: P.shadowCard.y + 40 },
    { frame: b(k + 1) - 2, x: P.bnb.x + 80, y: P.bnb.y + 90 },
    { frame: b(k + 1, 1) - 6, x: P.bnb.x, y: P.bnb.y, click: true, clickDelay: 6 },
    { frame: b(k + 1, 3) - 6, x: P.cont.x, y: P.cont.y, click: true, clickDelay: 6 },
    { frame: b(k + 2, 3) - 4, x: P.shadow.x + 60, y: P.shadow.y + 50 },
    { frame: b(k + 4, 1) - 4, x: P.defenseIcon.x + 20, y: P.defenseIcon.y + 10 },
    { frame: b(k + 5, 2) - 6, x: P.withdrawBtn.x, y: P.withdrawBtn.y, click: true, clickDelay: 6 },
    { frame: b(k + 6, 1), x: 1560, y: 900 },
  ];

  const route = shot.url.replace("localhost:3230", "") || "/";

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(145,129,245,0.2)" glowB="rgba(228,243,61,0.08)" glow="top" floor={0.3} grid={0.4} />
      <Halftone opacity={0.03} gap={22} />

      <Pulse intensity={0.35} shake={0} glow={false}>
        <Camera keyframes={cam}>
          <div style={{ position: "absolute", left: FX, top: FY, width: W }}>
            <Shot src={shot.src} w={W} url={shot.url} redactHeader={shot.app} />
            <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: swapFlash, borderRadius: 18, pointerEvents: "none" }} />
          </div>
          <Cursor keyframes={cursor} hideAfter={b(k + 6, 2)} rippleColor={C.lime} />
        </Camera>
      </Pulse>

      {/* Fixed chrome: the mock-data label never leaves the screen. */}
      <div style={{ position: "absolute", left: FX - 10, top: 56, display: "flex", alignItems: "center", gap: 18, padding: "8px 26px 8px 8px", borderRadius: 999, background: "rgba(8,9,11,0.9)" }}>
        <MockTag at={0} size={22} />
        <div style={{ fontFamily: F.mono, fontSize: 22, color: C.textMuted }}>real Equinox frontend · {route}</div>
      </div>

      {frame >= b(k + 6, 1) ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, display: "flex", justifyContent: "center", ...fadeUp(frame, b(k + 6, 1), 10, 24) }}>
          <Glass radius={20} glow={0.35} glowColor="rgba(228,243,61,0.35)" fill="rgba(14,14,16,0.92)" innerStyle={{ padding: "20px 34px" }}>
            <div style={{ fontFamily: F.sans, fontSize: 36, color: C.text, display: "flex", gap: 22, alignItems: "center" }}>
              <span style={{ color: C.lime, fontWeight: 700 }}>Contracts: live on BSC testnet.</span>
              <span style={{ color: C.textMuted }}>UI: preview on mock data, chain wiring next.</span>
            </div>
          </Glass>
        </div>
      ) : null}

      <InkFrame inset={22} width={4} opacity={0.55} color="#f4efe4" />

      <Sfx name="tick" at={b(k, 2)} volume={0.5} />
      <Sfx name="whoosh" at={b(k + 1)} volume={0.35} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.6} />
      <Sfx name="tick" at={b(k + 1, 3)} volume={0.6} />
      <Sfx name="whoosh" at={b(k + 2)} volume={0.35} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`d${i}`} name="tick" at={b(k + 2, i)} volume={0.45} />
      ))}
      <Sfx name="tick" at={b(k + 3, 1)} volume={0.5} />
      <Sfx name="whoosh" at={b(k + 4)} volume={0.35} />
      <Sfx name="whoosh" at={b(k + 5)} volume={0.35} />
      <Sfx name="tick" at={b(k + 5, 2)} volume={0.6} />
      <Sfx name="chime" at={b(k + 6, 1)} volume={0.45} />
    </AbsoluteFill>
  );
};
