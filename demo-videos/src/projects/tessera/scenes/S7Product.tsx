import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Camera, clamp, Cursor, fadeUp, Glass, Halftone, InkFrame, PremiumBg, Pulse, Sfx, useSceneClock } from "../../../kit";
import type { CamKey, CursorKey } from "../../../kit";
import { C, F, SCREEN, SHOT_W } from "../theme";
import { BAR } from "../timeline";
import { RealTag, Shot } from "../ui";

/**
 * S7 · PRODUCT (bars 40–44, phrase DROP on 40, zoom punch-in). The REAL Tessera
 * Next.js frontend (next build → next start :3301, API → the Go backend :3300),
 * captured headless (scripts/tessera/capture.mjs). One screen per bar:
 *   40 landing: headline (b1) → CTA (b2/b3)
 *   41 features: "On-chain reconnaissance" (b1) → "BNB Chain + 10 EVM chains" (b2/b3)
 *   42 /dashboard: modes (b1) → address field click (b2)
 *   43 /dashboard with the hot wallet pasted (b1) → Run agent (b2) + honest note (b3)
 */
const W = 1380;
const FX = (1920 - W) / 2;
const FY = 104;
const BAR_H = Math.round(W * 0.03);
const K = (W - 3) / SHOT_W;
const at = (sx: number, sy: number) => ({ x: FX + 1.5 + sx * K, y: FY + 1.5 + BAR_H + sy * K });

const P = {
  head: at(650, 300),
  cta: at(393, 583),
  recon: at(620, 410),
  chip: at(1318, 1135),
  modes: at(630, 260),
  input: at(765, 407),
  addr: at(760, 420),
  run: at(640, 470),
};
const CENTER = { x: 960, y: 560 };
const key = (frame: number, pt: { x: number; y: number }, scale: number): CamKey => ({ frame, x: pt.x, y: pt.y, scale });

export const S7Product: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.product; // 40

  const SHOTS = [
    { f: 0, src: SCREEN.landing, url: "localhost:3301/", cap: "Evidence over narrative — every figure traced to a tool call." },
    { f: b(k + 1), src: SCREEN.features, url: "localhost:3301/#features", cap: "On-chain reconnaissance: BNB Chain first, + 10 EVM chains." },
    { f: b(k + 2), src: SCREEN.dashboard, url: "localhost:3301/dashboard", cap: "The console: analyze a project, evaluate a proposal, explore an epoch." },
    { f: b(k + 3), src: SCREEN.dashAddr, url: "localhost:3301/dashboard", cap: "Paste any address — the agent's scan_chain tool does the rest." },
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
  move(b(k, 1), P.head, 1.75);
  move(b(k, 2), P.cta, 2.1);
  cut(b(k + 1), CENTER, 1);
  move(b(k + 1, 1), P.recon, 1.8);
  move(b(k + 1, 2), P.chip, 2.1);
  cut(b(k + 2), CENTER, 1);
  move(b(k + 2, 1), P.modes, 1.7);
  move(b(k + 2, 2), P.input, 1.8);
  cut(b(k + 3), P.addr, 1.5);
  move(b(k + 3, 1), P.addr, 2.0);
  move(b(k + 3, 2), P.run, 2.1);

  const cursor: CursorKey[] = [
    { frame: 0, x: P.cta.x + 240, y: P.cta.y + 160 },
    { frame: b(k, 3) - 6, x: P.cta.x, y: P.cta.y, click: true, clickDelay: 6 },
    { frame: b(k + 1, 2) - 4, x: P.chip.x + 60, y: P.chip.y, click: true, clickDelay: 4 },
    { frame: b(k + 2, 2) - 4, x: P.input.x, y: P.input.y, click: true, clickDelay: 4 },
    { frame: b(k + 3, 2) - 4, x: at(398, 480).x, y: at(398, 480).y },
    { frame: b(k + 3, 3) - 4, x: at(398, 480).x, y: at(398, 480).y, click: true, clickDelay: 4 },
  ];

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(232,99,58,0.2)" glowB="rgba(240,185,11,0.08)" glow="top" floor={0.3} grid={0.4} />
      <Halftone opacity={0.03} gap={22} />

      <Pulse intensity={0.35} shake={0} glow={false}>
        <Camera keyframes={cam}>
          <div style={{ position: "absolute", left: FX, top: FY, width: W }}>
            <Shot src={shot.src} w={W} url={shot.url}>
              {frame >= b(k + 1, 2) && frame < b(k + 2) ? (
                <div style={{ position: "absolute", left: 1186, top: 1110, width: 266, height: 52, borderRadius: 999, border: `3px solid ${C.gold}`, boxShadow: "0 0 30px rgba(240,185,11,0.6)", opacity: interpolate(frame, [b(k + 1, 2), b(k + 1, 2) + 4], [0, 1], clamp) }} />
              ) : null}
            </Shot>
            <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: swapFlash, borderRadius: 18, pointerEvents: "none" }} />
          </div>
          <Cursor keyframes={cursor} rippleColor={C.ember} />
        </Camera>
      </Pulse>

      <div style={{ position: "absolute", left: FX - 10, top: 40 }}>
        <RealTag at={0} label={`Tessera frontend · ${shot.url.replace("localhost:3301", "") || "/"}`} />
      </div>

      <div key={shot.f} style={{ position: "absolute", left: 0, right: 0, bottom: 46, display: "flex", justifyContent: "center", ...fadeUp(frame, shot.f, 8, 18) }}>
        <Glass radius={18} glow={0.3} glowColor="rgba(232,99,58,0.35)" fill="rgba(10,12,14,0.94)" innerStyle={{ padding: "16px 30px" }}>
          <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 34, color: C.bone }}>{shot.cap}</div>
        </Glass>
      </div>

      {frame >= b(k + 3, 3) ? (
        <div style={{ position: "absolute", right: FX - 10, top: 44, fontFamily: F.mono, fontSize: 19, color: C.boneDim, textAlign: "right", lineHeight: 1.45, background: "rgba(7,9,10,0.92)", padding: "10px 16px", borderRadius: 12, border: `1px solid ${C.lineBright}`, ...fadeUp(frame, b(k + 3, 3), 8, 10) }}>
          Agent runs need ANTHROPIC_API_KEY or HERMES_*
          <br />
          (deliberately unset for this capture)
        </div>
      ) : null}

      <InkFrame inset={22} width={4} opacity={0.55} color="#f4efe4" />

      <Sfx name="tick" at={b(k, 1)} volume={0.4} />
      <Sfx name="tick" at={b(k, 3)} volume={0.6} />
      <Sfx name="whoosh" at={b(k + 1)} volume={0.35} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.4} />
      <Sfx name="chime" at={b(k + 1, 2)} volume={0.45} />
      <Sfx name="whoosh" at={b(k + 2)} volume={0.35} />
      <Sfx name="tick" at={b(k + 2, 1)} volume={0.4} />
      <Sfx name="tick" at={b(k + 2, 2)} volume={0.5} />
      <Sfx name="whoosh" at={b(k + 3)} volume={0.35} />
      <Sfx name="tick" at={b(k + 3, 2)} volume={0.4} />
      <Sfx name="tick" at={b(k + 3, 3)} volume={0.5} />
    </AbsoluteFill>
  );
};
