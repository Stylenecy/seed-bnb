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
  Person,
  Phone,
  PremiumBg,
  Pulse,
  Robot,
  Sfx,
  useBeatPunch,
  useSceneClock,
  Vault,
} from "../../../kit";
import { GrowthChart, PaydayClock } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S3 · HOW IT WORKS (bars 11–16). Slides in on the bar-11 break with the title; then one
 * comic step per bar, each slamming on its downbeat:
 *   bar 12 DEPOSIT   employer funds the cycle once             ("CLUNK!")
 *   bar 13 EARN      the agent routes idle funds into yield     ("GROW!")
 *   bar 14 ADVANCE   staff draw earned salary early, 1.5% flat  ("ZIP!")
 *   bar 15 PAYDAY    agent triggers payday, advance auto-repaid ("PAYDAY!")
 */
const PW = 390;
const PH = 700;
const GAP = 66;
const X0 = (1920 - (4 * PW + 3 * GAP)) / 2;
const PY = 262;
const px = (i: number) => X0 + i * (PW + GAP);

type Step = { n: string; title: string; body: string; bg: string; bg2: string };
const STEPS: Step[] = [
  { n: "1", title: "Deposit", body: "The employer funds the pay cycle once. Salaries are set per employee.", bg: "#DCCFFF", bg2: "#7c3aed" },
  { n: "2", title: "Earn", body: "An agent moves idle payroll into yield and keeps a payday buffer.", bg: "#B8F5E6", bg2: "#14b8a6" },
  { n: "3", title: "Advance", body: "Staff draw earned salary before payday. Flat 1.5% fee.", bg: "#FFE9A8", bg2: "#F0B90B" },
  { n: "4", title: "Payday", body: "The agent triggers payday. Advances repay themselves. Claim.", bg: "#FFD6B0", bg2: "#f59e0b" },
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
          color: C.gold,
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
        fontWeight: 500,
        fontSize: 25,
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
  const k = BAR.how; // 11, steps on 12..15
  const punches = [0, 1, 2, 3].map((i) => useBeatPunch(beatsIn(k + 1 + i, k + 2 + i), 0.022, 5)); // eslint-disable-line react-hooks/rules-of-hooks

  const hop = (i: number) => interpolate(frame, [b(k + 1 + i, 2), b(k + 1 + i, 3)], [0, 1], clamp);
  const drop = interpolate(frame, [b(k + 1, 1), b(k + 1, 2)], [0, 1], clamp);
  const grow = interpolate(frame, [b(k + 2, 1), b(k + 2, 3)], [0.15, 1], clamp);
  const zip = interpolate(frame, [b(k + 3, 1), b(k + 3, 2)], [0, 1], clamp);
  const tick = interpolate(frame, [b(k + 4), b(k + 4, 1)], [0.7, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(124,58,237,0.2)" glowB="rgba(20,184,166,0.16)" glow="top" floor={0.35} />
      <Halftone opacity={0.05} gap={18} />

      <ComicText text="How it works" from={b(k)} x={960} y={128} size={112} rotate={-2} skewX={-5} fill={C.gold} stagger={1} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 196,
          textAlign: "center",
          fontFamily: F.serif,
          fontStyle: "italic",
          fontSize: 36,
          color: C.text,
          opacity: interpolate(frame, [b(k, 2), b(k, 2) + 8], [0, 1], clamp),
        }}
      >
        one pay cycle · every step is a smart-contract call
      </div>

      <Pulse intensity={0.9} shake={0.5}>
        {STEPS.map((s, i) =>
          frame < b(k + 1 + i) ? (
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
                opacity: interpolate(frame, [b(k, 1) + i * 3, b(k, 1) + i * 3 + 6], [0, 1], clamp),
              }}
            >
              {s.n}
            </div>
          ) : null,
        )}
        {STEPS.map((s, i) => (
          <ComicPanel
            key={s.n}
            at={b(k + 1 + i)}
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
              {i === 0 ? (
                <>
                  <Person x={100} y={270} s={1.0} body={C.violet} mood="happy" pose="point" />
                  <Vault x={280} y={270} s={0.8} label="PAYROLL" fill="#3a3550" dial={drop * 180} />
                  {drop > 0 && drop < 1 ? <CoinDot cx={280} cy={80 + 110 * drop} r={30} label="$" rotate={drop * 200} /> : null}
                </>
              ) : null}
              {i === 1 ? (
                <>
                  <Robot x={110} y={250} s={0.95} fill="#9AA3B5" visor={C.tealLite} flame={0.5 + 0.5 * Math.sin(frame / 3)} />
                  <GrowthChart x={280} y={230} s={0.9} g={grow} color={C.emerald} />
                </>
              ) : null}
              {i === 2 ? (
                <>
                  <Person x={120} y={270} s={1.0} body={C.emerald} mood="happy" pose="hold">
                    <Phone x={0} y={-8} s={0.55} screen="#0A0F1C" label="1.5%" labelColor={C.gold} />
                  </Person>
                  {zip > 0 ? <CoinDot cx={330 - 130 * zip} cy={110 + 60 * zip} r={34} label="$" rotate={zip * 360} opacity={Math.min(1, zip * 3)} /> : null}
                </>
              ) : null}
              {i === 3 ? (
                <>
                  <PaydayClock x={270} y={180} s={0.95} t={tick} />
                  <Person x={110} y={270} s={1.0} body={C.emerald} mood="happy" pose="cheer" wave={Math.sin(frame * 0.5) * 8} />
                </>
              ) : null}
            </svg>
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
                <InkArrow x1={x1} y1={y} x2={x2} y2={y} at={b(k + 1 + i, 2)} dur={6} bend={-46} color={C.gold} width={8} />
                {h > 0 && h < 1 ? <CoinDot cx={x1 + (x2 - x1) * h} cy={y - 34 - Math.sin(h * Math.PI) * 70} r={22} rotate={h * 180} /> : null}
              </g>
            );
          })}
        </svg>
      </Pulse>

      <ComicText text="CLUNK!" from={b(k + 1, 2)} x={px(0) + PW / 2} y={PY + 30} size={80} rotate={-7} fill={C.gold} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2, 3)} />
      <ComicText text="GROW!" from={b(k + 2, 2)} x={px(1) + PW / 2} y={PY + 30} size={86} rotate={7} fill={C.emerald} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3, 3)} />
      <ComicText text="ZIP!" from={b(k + 3, 2)} x={px(2) + PW / 2} y={PY + 30} size={90} rotate={-6} fill="#fff" variant="onomatopoeia" echoColor={C.violet} exitAt={b(k + 4, 3)} />
      <ComicText text="PAYDAY!" from={b(k + 4, 1)} x={px(3) + PW / 2} y={PY + 30} size={80} rotate={-5} fill={C.gold} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`im${i}`} name="impact" at={b(k + 1 + i)} volume={0.55} />
      ))}
      {[0, 1, 2].map((i) => (
        <Sfx key={`tk${i}`} name="tick" at={b(k + 1 + i, 2)} volume={0.6} />
      ))}
      <Sfx name="whoosh" at={b(k + 3, 2)} volume={0.4} />
      <Sfx name="chime" at={b(k + 4, 1)} volume={0.6} />
    </AbsoluteFill>
  );
};
