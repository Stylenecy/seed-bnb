import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, ComicText, Glass, Halftone, INK, InkFrame, Pulse, Sfx, useSceneClock } from "../../../kit";
import { InkNight, Kanji } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S8 · LIVE STACK (bars 60–62) — whip. The real processes used for the
 * captures: the Go daemon `musashi-core serve` (read-only, BSC testnet env)
 * and the Next.js frontend proxying it. Responses are what they returned.
 *   60  daemon card b0 · /healthz b1 · /v1/status b2 · /v1/history b3
 *   61  frontend card b0 · / + /dashboard b1 · /api/status b2 · /api/gates b3 + "SERVED!"
 */
type Line = { at: number; cmd: string; out?: string; ok?: boolean };

const Term: React.FC<{ at: number; x: number; title: string; kanji: string; lines: Line[]; accent: string }> = ({ at, x, title, kanji, lines, accent }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps, config: { damping: 14, stiffness: 170, mass: 0.8 } });
  return (
    <div style={{ position: "absolute", left: x, top: 190, width: 830, transform: `translateY(${(1 - p) * 80}px) scale(${0.94 + 0.06 * p})`, opacity: interpolate(p, [0, 0.3], [0, 1], clamp) }}>
      <Glass radius={22} glow={0.4} glowColor={`${accent}66`} fill="rgba(10,8,6,0.94)">
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 26px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span key={c} style={{ width: 14, height: 14, borderRadius: 99, background: c, opacity: 0.85 }} />
          ))}
          <span style={{ marginLeft: 10, fontFamily: F.sans, fontWeight: 700, fontSize: 28, color: C.text }}>{title}</span>
          <span style={{ marginLeft: "auto" }}>
            <Kanji text={kanji} size={54} color={accent} />
          </span>
        </div>
        <div style={{ padding: "18px 26px 26px", minHeight: 560 }}>
          {lines.map((l, i) =>
            f >= l.at ? (
              <div key={i} style={{ marginBottom: 30, opacity: interpolate(f, [l.at, l.at + 5], [0, 1], clamp), transform: `translateX(${interpolate(f, [l.at, l.at + 6], [-16, 0], clamp)}px)` }}>
                <div style={{ fontFamily: F.mono, fontSize: 30, color: C.amberHi }}>{l.cmd}</div>
                {l.out ? <div style={{ fontFamily: F.mono, fontSize: 26, color: l.ok === false ? C.rose : C.green, marginTop: 4, paddingLeft: 20 }}>{l.out}</div> : null}
              </div>
            ) : null,
          )}
        </div>
      </Glass>
    </div>
  );
};

export const S8Stack: React.FC = () => {
  const frame = useCurrentFrame();
  const { b } = useSceneClock();
  const k = BAR.stack; // 60

  return (
    <AbsoluteFill>
      <InkNight glow={1} />
      <Halftone opacity={0.035} gap={22} color={C.amber} />
      <Pulse intensity={0.6} shake={0.2} glow={false}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center", fontFamily: F.display, fontWeight: 600, fontSize: 64, color: C.washi, opacity: interpolate(frame, [0, 8], [0, 1], clamp) }}>
          Engine + dashboard, <i style={{ color: C.amberHi }}>reading the live chain</i>
        </div>
        <Term
          at={b(k)}
          x={100}
          title="Go daemon · musashi-core serve"
          kanji="心"
          accent={C.amberHi}
          lines={[
            { at: b(k), cmd: "$ musashi-core serve   # read-only, no key" },
            { at: b(k, 1), cmd: "GET /healthz", out: `{"status":"ok","mode":"read-only"}` },
            { at: b(k, 2), cmd: "GET /v1/status", out: "strike_count 1 · wins 1 · losses 0 · +2500 bps" },
            { at: b(k, 3), cmd: "GET /v1/history", out: "strike 0 · USDT 0x55d3…7955 · conv 4 · +2500" },
          ]}
        />
        <Term
          at={b(k + 1)}
          x={990}
          title="Next.js frontend · next start"
          kanji="眼"
          accent={C.blue}
          lines={[
            { at: b(k + 1), cmd: "$ next start   # .env.bsc-testnet" },
            { at: b(k + 1, 1), cmd: "GET /  ·  GET /dashboard", out: "200 · 200" },
            { at: b(k + 1, 2), cmd: "GET /api/status   → daemon", out: "200 · live reputation from ConvictionLog" },
            { at: b(k + 1, 3), cmd: "GET /api/gates?token=CAKE&chain=56", out: "FAIL at gate 1 · mintable", ok: false },
          ]}
        />
      </Pulse>
      <ComicText text="SERVED!" from={b(k + 1, 3)} x={960} y={960} size={110} rotate={-5} fill={C.amberHi} variant="onomatopoeia" echoColor={INK} />
      <InkFrame inset={22} width={4} opacity={0.6} color={C.washi} />
      <Sfx name="impact" at={b(k)} volume={0.7} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`a${i}`} name="tick" at={b(k, i)} volume={0.55} />
      ))}
      <Sfx name="impact" at={b(k + 1)} volume={0.7} />
      {[1, 2].map((i) => (
        <Sfx key={`b${i}`} name="tick" at={b(k + 1, i)} volume={0.55} />
      ))}
      <Sfx name="impact" at={b(k + 1, 3)} volume={0.75} />
    </AbsoluteFill>
  );
};
