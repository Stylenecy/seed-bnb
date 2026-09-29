import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  clamp,
  CoinDot,
  ComicPanel,
  ComicText,
  Halftone,
  INK,
  InkArrow,
  InkFrame,
  Jar,
  Person,
  PremiumBg,
  Pulse,
  Sfx,
  SpeechBubble,
  useBeatPunch,
  useSceneClock,
  Vault,
} from "../../../kit";
import { Pancakes, PlanSheet, RiskShield, StockTile } from "../art";
import { C, F, VERA } from "../theme";
import { BAR } from "../timeline";

/**
 * S3 · HOW IT WORKS (bars 5–9). Slides in with the title; one comic step per
 * bar (panel slams on b0, detail on b1, onomatopoeia b1/b2, arrow + coin hop b2→b3):
 *   bar 5  SAY IT     "Grow $20, big names."
 *   bar 6  VERA PLANS AAPL 50 / TSLA 40 / NVDA 10, EIP-712 signed with a risk score
 *   bar 7  RISK GATE  InferenceVerifier: signature + risk ≤ ceiling, else revert
 *   bar 8  SWAP       StaxExecutor → PancakeSwap V3 → AAPLx + TSLAx, fee → treasury
 */
const PW = 390;
const PH = 700;
const GAP = 66;
const X0 = (1920 - (4 * PW + 3 * GAP)) / 2;
const PY = 262;
const px = (i: number) => X0 + i * (PW + GAP);

type Step = { n: string; title: string; body: string; bg: string; bg2: string };
const STEPS: Step[] = [
  { n: "1", title: "Say it", body: "Tell Vera a goal and an amount, in plain words.", bg: "#BFE8D2", bg2: "#6cc09c" },
  { n: "2", title: "Vera plans", body: "She picks a mix and signs it (EIP-712) with a risk score.", bg: "#D8E6F2", bg2: "#9fb4d8" },
  { n: "3", title: "Risk gate", body: "InferenceVerifier checks the signature and the risk ceiling. Too risky? Revert.", bg: "#F7D2B8", bg2: "#ecab7e" },
  { n: "4", title: "Swap", body: "StaxExecutor buys AAPLx + TSLAx on PancakeSwap V3. 0.25% fee to treasury.", bg: "#FFE9A8", bg2: "#F0B90B" },
];

const StepLabel: React.FC<{ s: Step }> = ({ s }) => (
  <div style={{ position: "absolute", left: 22, right: 22, bottom: 22 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span
        style={{
          width: 52,
          height: 52,
          borderRadius: 999,
          background: INK,
          color: C.sageLight,
          fontFamily: F.comic,
          fontSize: 36,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {s.n}
      </span>
      <span style={{ fontFamily: F.comic, fontSize: 52, color: INK, letterSpacing: "0.02em", textTransform: "uppercase" }}>{s.title}</span>
    </div>
    <div
      style={{
        marginTop: 10,
        background: "#fff",
        border: `4px solid ${INK}`,
        boxShadow: `5px 5px 0 ${INK}`,
        padding: "12px 14px",
        fontFamily: F.sans,
        fontWeight: 600,
        fontSize: 23,
        lineHeight: 1.25,
        color: INK,
        minHeight: 118,
      }}
    >
      {s.body}
    </div>
  </div>
);

export const S3HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.how; // 5
  const punches = [0, 1, 2, 3].map((i) => useBeatPunch(beatsIn(k + i, k + 1 + i), 0.022, 5)); // eslint-disable-line react-hooks/rules-of-hooks

  const hop = (i: number) => interpolate(frame, [b(k + i, 2), b(k + i, 3)], [0, 1], clamp);
  const signed = interpolate(frame, [b(k + 1, 1), b(k + 1, 2)], [0, 1], clamp);
  const needle = interpolate(frame, [b(k + 2), b(k + 2, 1)], [0.1, 0.45], clamp);
  const orbY = Math.sin(frame / 8) * 6;

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(108,192,156,0.18)" glowB="rgba(236,171,126,0.14)" glow="top" floor={0.35} />
      <Halftone opacity={0.05} gap={18} />

      <ComicText text="How it works" from={b(k)} x={960} y={128} size={112} rotate={-2} skewX={-5} fill={C.sageLight} stagger={1} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 196,
          textAlign: "center",
          fontFamily: F.display,
          fontStyle: "italic",
          fontSize: 34,
          color: C.text,
          opacity: interpolate(frame, [b(k, 1), b(k, 1) + 8], [0, 1], clamp),
        }}
      >
        one sentence in · real tokenized stocks out · risk enforced on-chain
      </div>

      <Pulse intensity={0.9} shake={0.4}>
        {STEPS.map((s, i) =>
          frame < b(k + i) ? (
            <div
              key={`g${s.n}`}
              style={{
                position: "absolute",
                left: px(i),
                top: PY + (i % 2 === 0 ? 0 : 20),
                width: PW,
                height: PH,
                border: "4px dashed rgba(244,239,228,0.22)",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: F.comic,
                fontSize: 160,
                color: "rgba(244,239,228,0.12)",
              }}
            >
              {s.n}
            </div>
          ) : null,
        )}
        {STEPS.map((s, i) => (
          <ComicPanel
            key={s.n}
            at={b(k + i)}
            x={px(i)}
            y={PY + (i % 2 === 0 ? 0 : 20)}
            w={PW}
            h={PH}
            rot={[-1.4, 1.1, -0.9, 1.5][i]}
            bg={s.bg}
            bg2={s.bg2}
            from={(["up", "down", "up", "down"] as const)[i]}
            punch={punches[i]}
          >
            <svg width={PW} height={420} viewBox={`0 0 ${PW} 420`} style={{ position: "absolute", left: 0, top: 0 }}>
              {i === 0 ? <Person x={120} y={290} s={1.05} body={C.sageDeep} mood="happy" pose="point" /> : null}
              {i === 1 ? (
                <>
                  <image href={VERA} x={20} y={110 + orbY} width={130} height={130} />
                  <PlanSheet x={270} y={220} s={0.95} rot={4} signed={signed} />
                </>
              ) : null}
              {i === 2 ? <RiskShield x={PW / 2} y={220} s={1.15} needle={needle} ceiling={0.7} ok /> : null}
              {i === 3 ? (
                <>
                  <Vault x={90} y={150} s={0.55} label="Executor" dial={interpolate(frame, [b(k + 3), b(k + 3, 1)], [0, 200], clamp)} />
                  <Pancakes x={200} y={290} s={0.8} />
                  {frame >= b(k + 3, 1) ? <StockTile x={310} y={120} s={0.62} sym="AAPLx" rot={6} /> : null}
                  {frame >= b(k + 3, 1) ? <StockTile x={320} y={250} s={0.62} sym="TSLAx" fill={C.terracotta} rot={-5} /> : null}
                  {frame >= b(k + 3, 2) ? <Jar x={70} y={330} s={0.6} label="fee" /> : null}
                </>
              ) : null}
            </svg>
            {i === 0 ? (
              <SpeechBubble at={b(k, 1)} x={150} y={40} w={220} h={140} tailX={30} tailY={200} size={30}>
                Grow $20. Big names.
              </SpeechBubble>
            ) : null}
            <StepLabel s={s} />
          </ComicPanel>
        ))}

        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {[0, 1, 2].map((i) => {
            const x1 = px(i) + PW - 14;
            const x2 = px(i + 1) + 14;
            const y = PY + 240;
            const h = hop(i);
            return (
              <g key={i}>
                <InkArrow x1={x1} y1={y} x2={x2} y2={y} at={b(k + i, 2)} dur={6} bend={-46} color={C.sageLight} width={8} />
                {h > 0 && h < 1 ? <CoinDot cx={x1 + (x2 - x1) * h} cy={y - 34 - Math.sin(h * Math.PI) * 70} r={22} label="$" rotate={h * 180} /> : null}
              </g>
            );
          })}
        </svg>
      </Pulse>

      <ComicText text="SIGNED!" from={b(k + 1, 2)} x={px(1) + PW / 2} y={PY + 30} size={78} rotate={-8} fill={C.sageLight} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2)} />
      <ComicText text="CHECKED!" from={b(k + 2, 1)} x={px(2) + PW / 2} y={PY + 30} size={78} rotate={7} fill="#fff" variant="onomatopoeia" echoColor={C.neg} exitAt={b(k + 3)} />
      <ComicText text="SWAPPED!" from={b(k + 3, 1)} x={px(3) + PW / 2} y={PY + 30} size={78} rotate={-6} fill="#F0B90B" variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`im${i}`} name="impact" at={b(k + i)} volume={0.55} />
      ))}
      {[0, 1, 2].map((i) => (
        <Sfx key={`t${i}`} name="tick" at={b(k + i, 2)} volume={0.6} />
      ))}
      <Sfx name="chime" at={b(k + 3, 1)} volume={0.55} />
    </AbsoluteFill>
  );
};
