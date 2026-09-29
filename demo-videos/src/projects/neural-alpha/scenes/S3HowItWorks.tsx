import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ComicPanel, ComicText, Halftone, INK, InkArrow, InkFrame, PremiumBg, Pulse, Sfx, useBeatPunch, useSceneClock } from "../../../kit";
import { Antenna, Gauge, Shield, Toggle } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S3 · HOW IT WORKS (bars 7–12). Slides in on the bar-7 break (title + "EVERY
 * CYCLE."), then one comic step per bar, slam on the downbeat, detail on b2:
 *   8 (DROP) INGEST     live Binance Web3 BSC quotes + OHLCV, ClipX news, CMC
 *   9  SCORE            9 factors → a buy/sell score per token
 *   10 RISK GATE        drawdown cap, SL/TP, 3 positions, 149-token allowlist — code, not prompts
 *   11 EXECUTE          PAPER: simulated fill · LIVE: TWAK self-custody swap (OFF here)
 */
const PW = 404;
const PH = 600;
const PY = 300;
const GAP = 38;
const X0 = (1920 - (PW * 4 + GAP * 3)) / 2;
const px = (i: number) => X0 + i * (PW + GAP);

const Step: React.FC<{ n: number; title: string; sub: string; subAt: number; children: React.ReactNode }> = ({ n, title, sub, subAt, children }) => {
  const f = useCurrentFrame();
  return (
    <>
      <div style={{ position: "absolute", left: 22, top: 18, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 54, height: 54, borderRadius: 99, background: INK, color: C.neon, fontFamily: F.comic, fontSize: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</span>
        <span style={{ fontFamily: F.comic, fontSize: 42, color: INK, letterSpacing: "0.03em" }}>{title}</span>
      </div>
      <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`} style={{ position: "absolute", inset: 0 }}>
        {children}
      </svg>
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          bottom: 18,
          padding: "12px 16px",
          background: "#f4efe4",
          border: `4px solid ${INK}`,
          fontFamily: F.sans,
          fontWeight: 600,
          fontSize: 23,
          lineHeight: 1.25,
          color: INK,
          opacity: interpolate(f, [subAt, subAt + 5], [0, 1], clamp),
          transform: `translateY(${interpolate(f, [subAt, subAt + 7], [16, 0], clamp)}px)`,
        }}
      >
        {sub}
      </div>
    </>
  );
};

const FACTORS = ["RSI", "MACD", "EMA", "BB", "MOM", "VOL", "TURN", "F&G", "NEWS"];

export const S3HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.how; // 7
  const s = k + 1; // 8

  const punches = [0, 1, 2, 3].map((i) => useBeatPunch(beatsIn(s + i, s + i + 1), 0.025, 5)); // eslint-disable-line react-hooks/rules-of-hooks
  const title = interpolate(frame, [b(k), b(k) + 10], [0, 1], clamp);
  const ring = interpolate(frame, [b(s), b(s + 1)], [0, 4], clamp);
  const factorsShown = Math.floor(interpolate(frame, [b(s + 1), b(s + 1, 3)], [0, 9], clamp));
  const needle = interpolate(frame, [b(s + 1, 1), b(s + 1, 3)], [-0.2, 0.7], clamp);
  const lit = interpolate(frame, [b(s + 2, 1), b(s + 2, 1) + 4], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.void} glowA="rgba(14,203,129,0.16)" glowB="rgba(30,159,242,0.12)" glow="top" floor={0.35} grid={0.5} />
      <Halftone opacity={0.04} gap={20} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 92, textAlign: "center", opacity: title, transform: `translateY(${(1 - title) * 30}px)` }}>
        <div style={{ fontFamily: F.mono, fontSize: 26, letterSpacing: "0.3em", color: C.neon }}>HOW IT WORKS</div>
        <div style={{ fontFamily: F.display, fontSize: 80, color: C.text, marginTop: 2 }}>
          Read. Score. Gate. <i style={{ color: C.gold }}>Execute.</i>
        </div>
      </div>

      <Pulse intensity={1} shake={0.4}>
        <ComicPanel at={b(s)} x={px(0)} y={PY} w={PW} h={PH} rot={-1.4} bg="#DCEFFC" bg2="#1e9ff2" from="up" punch={punches[0]}>
          <Step n={1} title="INGEST" sub="Live Binance Web3 BSC quotes + OHLCV, ClipX news, CMC market data." subAt={b(s, 2)}>
            <Antenna x={202} y={300} s={1} p={ring} />
          </Step>
        </ComicPanel>

        <ComicPanel at={b(s + 1)} x={px(1)} y={PY + 14} w={PW} h={PH} rot={1.2} bg="#FFF1BF" bg2="#F0B90B" from="down" punch={punches[1]}>
          <Step n={2} title="SCORE" sub="9 factors blended into one buy / sell score per token." subAt={b(s + 1, 2)}>
            <Gauge x={202} y={250} s={1.05} v={needle} />
            {FACTORS.slice(0, factorsShown).map((f, i) => (
              <g key={f} transform={`translate(${46 + (i % 3) * 110} ${310 + Math.floor(i / 3) * 44})`}>
                <rect x={0} y={-26} width={96} height={36} rx={8} fill={i === 8 ? C.neon : "#f4efe4"} stroke={INK} strokeWidth={4} />
                <text x={48} y={0} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={18} fill={INK}>
                  {f}
                </text>
              </g>
            ))}
          </Step>
        </ComicPanel>

        <ComicPanel at={b(s + 2)} x={px(2)} y={PY - 6} w={PW} h={PH} rot={-1} bg="#D9F7EA" bg2="#0ecb81" from="down" punch={punches[2]}>
          <Step n={3} title="RISK GATE" sub="Drawdown cap · stop-loss / take-profit · max 3 positions · 149-token allowlist. In code." subAt={b(s + 2, 2)}>
            <Shield x={202} y={230} s={1} lit={lit} />
          </Step>
        </ComicPanel>

        <ComicPanel at={b(s + 3)} x={px(3)} y={PY + 8} w={PW} h={PH} rot={1.5} bg="#FFE9C2" bg2="#F0B90B" from="right" punch={punches[3]}>
          <Step n={4} title="EXECUTE" sub="Paper: simulated fill. Live: TWAK self-custody swap — OFF in this demo." subAt={b(s + 3, 2)}>
            <Toggle x={70} y={170} on={frame >= b(s + 3, 1)} label="PAPER" color={C.gold} />
            <Toggle x={70} y={280} on={false} label="LIVE" color={C.danger} />
            {frame >= b(s + 3, 1) ? (
              <text x={200} y={380} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={22} fill={INK}>
                tx: paper-1790361008136
              </text>
            ) : null}
          </Step>
        </ComicPanel>

        {[0, 1, 2].map((i) => (
          <InkArrow key={i} x1={px(i) + PW - 30} y1={PY + 110} x2={px(i + 1) + 40} y2={PY + 110} at={b(s + i + 1) - 4} dur={6} bend={-30} color={C.neon} width={6} />
        ))}
      </Pulse>

      <ComicText text="EVERY CYCLE." from={b(k, 2)} x={960} y={620} size={170} rotate={-4} fill={C.neon} variant="onomatopoeia" echoColor={INK} exitAt={b(s) - 2} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      <Sfx name="impact" at={b(k, 2)} volume={0.6} />
      {[0, 1, 2, 3].map((i) => (
        <React.Fragment key={i}>
          <Sfx name="impact" at={b(s + i)} volume={0.7} />
          <Sfx name="tick" at={b(s + i, 2)} volume={0.5} />
        </React.Fragment>
      ))}
      <Sfx name="tick" at={b(s + 2, 1)} volume={0.5} />
      <Sfx name="tick" at={b(s + 3, 1)} volume={0.5} />
    </AbsoluteFill>
  );
};
