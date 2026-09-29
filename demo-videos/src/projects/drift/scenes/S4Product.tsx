import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Camera, clamp, Cursor, fadeUp, Glass, Halftone, InkFrame, PremiumBg, Pulse, Sfx, useSceneClock } from "../../../kit";
import type { CamKey, CursorKey } from "../../../kit";
import { C, CHAIN, F, SCREEN, SHOT_W, short } from "../theme";
import { BAR } from "../timeline";
import { RealTag, Shot } from "../ui";

/**
 * S4 · PRODUCT (bars 36–40). The REAL DRIFT web cockpit (next build with
 * NEXT_PUBLIC_TRADER_URL → the real Python engine on :3240, next start :3241,
 * auth off), captured headless. One screen per bar, camera moves on beats:
 *   36 landing (zoomed on the CTA) → click "Open cockpit" on b3
 *   37 Markets: live Bybit chart (b1) → market list (b2) → deploy card (b3)
 *   38 Research: auto-research leaderboard → ROBUST (b1) → OOS stats (b2) → train/test curve (b3)
 *   39 (dip bar) Bots: the MacroGuard banner, read live from BSC testnet (b1 zoom, b2 regime + address)
 */
const W = 1380;
const FX = (1920 - W) / 2;
const FY = 104;
const BAR_H = Math.round(W * 0.03);
const K = (W - 3) / SHOT_W;
const at = (sx: number, sy: number) => ({ x: FX + 1.5 + sx * K, y: FY + 1.5 + BAR_H + sy * K });

const P = {
  landing: at(960, 860),
  cta: at(857, 856),
  chart: at(1290, 460),
  list: at(620, 470),
  deploy: at(1290, 850),
  robust: at(1150, 615),
  oos: at(1100, 705),
  curve: at(1100, 900),
  banner: at(1000, 214),
  regime: at(1330, 214),
  addr: at(1690, 214),
};
const CENTER = { x: 960, y: 560 };
const key = (frame: number, pt: { x: number; y: number }, scale: number): CamKey => ({ frame, x: pt.x, y: pt.y, scale });

export const S4Product: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.product; // 36

  const SHOTS = [
    { f: 0, src: SCREEN.landing, url: "localhost:3241/", cap: "DRIFT — honest, bounded, on the record." },
    { f: b(k + 1), src: SCREEN.markets, url: "localhost:3241/dashboard", cap: "Live Bybit markets, straight from the engine." },
    { f: b(k + 2), src: SCREEN.research, url: "localhost:3241/dashboard/backtest", cap: "Auto-research: optimise on 70%, prove it on the unseen 30%." },
    { f: b(k + 3), src: SCREEN.guard, url: "localhost:3241/dashboard/bots", cap: "Bots trade under MacroGuard, read live from BNB Chain." },
  ];
  let shot = SHOTS[0]!;
  for (const s of SHOTS) if (frame >= s.f) shot = s;
  const swapFlash = SHOTS.slice(1).reduce((m, s) => (frame >= s.f ? Math.max(m, interpolate(frame, [s.f, s.f + 3], [0.4, 0], clamp)) : m), 0);

  const cam: CamKey[] = [key(0, P.landing, 2.1)];
  const cut = (t: number, pt: { x: number; y: number }, scale: number) => cam.push(key(t - 1, cam[cam.length - 1]!, cam[cam.length - 1]!.scale), key(t, pt, scale));
  const move = (t: number, pt: { x: number; y: number }, scale: number, dur = 7) => {
    const last = cam[cam.length - 1]!;
    if (t > last.frame) cam.push(key(t, last, last.scale));
    cam.push(key(t + dur, pt, scale));
  };
  move(b(k, 1), P.landing, 2.2, 14);
  move(b(k, 2), P.cta, 2.4);
  cut(b(k + 1), CENTER, 1);
  move(b(k + 1, 1), P.chart, 1.55);
  move(b(k + 1, 2), P.list, 1.8);
  move(b(k + 1, 3), P.deploy, 1.6);
  cut(b(k + 2), CENTER, 1);
  move(b(k + 2, 1), P.robust, 1.75);
  move(b(k + 2, 2), P.oos, 1.75);
  move(b(k + 2, 3), P.curve, 1.5);
  cut(b(k + 3), CENTER, 1);
  move(b(k + 3, 1), P.banner, 1.4, 8);
  move(b(k + 3, 2), P.regime, 2.0);
  move(b(k + 3, 3), at(1560, 214), 2.0);

  const cursor: CursorKey[] = [
    { frame: 0, x: P.cta.x + 200, y: P.cta.y + 120 },
    { frame: b(k, 3) - 6, x: P.cta.x, y: P.cta.y, click: true, clickDelay: 6 },
    { frame: b(k + 1, 2) - 4, x: at(560, 484).x, y: at(560, 484).y, click: true, clickDelay: 4 },
    { frame: b(k + 2) - 4, x: at(1657, 309).x, y: at(1657, 309).y },
    { frame: b(k + 2, 1) - 4, x: at(1650, 615).x, y: at(1650, 615).y },
    { frame: b(k + 3, 3) - 4, x: at(1690, 214).x, y: at(1690, 214).y, click: true, clickDelay: 4 },
  ];

  const glowBanner = frame >= b(k + 3, 1) ? 0.5 + 0.5 * Math.sin((frame - b(k + 3, 1)) / 3) : 0;

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(154,168,240,0.22)" glowB="rgba(240,185,11,0.08)" glow="top" floor={0.3} grid={0.4} />
      <Halftone opacity={0.03} gap={22} />

      <Pulse intensity={0.35} shake={0} glow={false}>
        <Camera keyframes={cam}>
          <div style={{ position: "absolute", left: FX, top: FY, width: W }}>
            <Shot src={shot.src} w={W} url={shot.url}>
              {frame >= b(k + 3, 1) ? (
                <div style={{ position: "absolute", left: 440, top: 184, width: 1328, height: 60, borderRadius: 10, border: `3px solid ${C.gold}`, boxShadow: `0 0 ${20 + 30 * glowBanner}px rgba(240,185,11,0.6)`, opacity: interpolate(frame, [b(k + 3, 1), b(k + 3, 1) + 4], [0, 1], clamp) }} />
              ) : null}
            </Shot>
            <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: swapFlash, borderRadius: 18, pointerEvents: "none" }} />
          </div>
          <Cursor keyframes={cursor} rippleColor={C.peri} />
        </Camera>
      </Pulse>

      <div style={{ position: "absolute", left: FX - 10, top: 40 }}>
        <RealTag at={0} label={`DRIFT web cockpit · ${shot.url.replace("localhost:3241", "") || "/"}`} />
      </div>

      <div key={shot.f} style={{ position: "absolute", left: 0, right: 0, bottom: 46, display: "flex", justifyContent: "center", ...fadeUp(frame, shot.f, 8, 18) }}>
        <Glass radius={18} glow={0.3} glowColor="rgba(154,168,240,0.35)" fill="rgba(11,12,15,0.94)" innerStyle={{ padding: "16px 30px" }}>
          <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 34, color: C.text }}>{shot.cap}</div>
        </Glass>
      </div>

      {frame >= b(k + 3, 2) ? (
        <div style={{ position: "absolute", right: FX - 10, top: 44, fontFamily: F.mono, fontSize: 19, color: C.textMuted, textAlign: "right", lineHeight: 1.45, ...fadeUp(frame, b(k + 3, 2), 8, 10) }}>
          /chain + /regime read live from MacroGuard {short(CHAIN.guard)}
          <br />
          Bybit link stubbed for this capture (no testnet keys)
        </div>
      ) : null}

      <InkFrame inset={22} width={4} opacity={0.55} color="#f4efe4" />

      <Sfx name="tick" at={b(k, 3)} volume={0.6} />
      <Sfx name="whoosh" at={b(k + 1)} volume={0.35} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`m${i}`} name="tick" at={b(k + 1, i)} volume={0.4} />
      ))}
      <Sfx name="whoosh" at={b(k + 2)} volume={0.35} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`r${i}`} name="tick" at={b(k + 2, i)} volume={0.4} />
      ))}
      <Sfx name="whoosh" at={b(k + 3)} volume={0.35} />
      <Sfx name="chime" at={b(k + 3, 1)} volume={0.45} />
      <Sfx name="tick" at={b(k + 3, 3)} volume={0.5} />
    </AbsoluteFill>
  );
};
