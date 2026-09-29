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
  PremiumBg,
  Pulse,
  Robot,
  Sfx,
  useBeatPunch,
  useSceneClock,
  Vault,
  Wallet,
} from "../../../kit";
import { CoinStack, Shield } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S3 · HOW IT WORKS (bars 7–12). Slides in on the bar-7 break with the title;
 * one comic step per bar after that (steps = the real contract calls):
 *   bar 8  VAULT    openVault + deposit collateral           ("CLUNK!")
 *   bar 9  SKIM     agent borrows USDT to target LTV          ("SKIM!")
 *   bar 10 SHADOW   borrowed USDT waits in the shadow wallet  ("KA-CHING!")
 *   bar 11 DEFEND   price drops → anyone calls defend()       ("DEFENDED!")
 */
const PW = 390;
const PH = 700;
const GAP = 66;
const X0 = (1920 - (4 * PW + 3 * GAP)) / 2;
const PY = 262;
const px = (i: number) => X0 + i * (PW + GAP);

type Step = { n: string; title: string; body: string; bg: string; bg2: string };
const STEPS: Step[] = [
  { n: "1", title: "Vault", body: "Open a vault and deposit BNB as collateral.", bg: "#D9D2FF", bg2: "#9181f5" },
  { n: "2", title: "Skim", body: "The agent borrows USDT up to your target LTV.", bg: "#B8CCFF", bg2: "#407aff" },
  { n: "3", title: "Shadow wallet", body: "Borrowed USDT sits in a reserve you can withdraw.", bg: "#F4FBB0", bg2: "#e4f33d" },
  { n: "4", title: "Defend", body: "Price drops? Anyone can call defend() to restore HF to its minimum.", bg: "#A8F5DD", bg2: "#16d9a8" },
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
          color: C.lime,
          fontFamily: F.comic,
          fontSize: 36,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {s.n}
      </span>
      <span style={{ fontFamily: F.comic, fontSize: 48, color: INK, letterSpacing: "0.02em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{s.title}</span>
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
        fontSize: 24,
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
  const k = BAR.how; // 7
  const punches = [0, 1, 2, 3].map((i) => useBeatPunch(beatsIn(k + 1 + i, k + 2 + i), 0.022, 5)); // eslint-disable-line react-hooks/rules-of-hooks

  const hop = (i: number) => interpolate(frame, [b(k + 1 + i, 2), b(k + 1 + i, 3)], [0, 1], clamp);
  const dial = interpolate(frame, [b(k + 1), b(k + 1, 2)], [0, 270], clamp);
  const flame = 0.6 + 0.4 * Math.sin(frame * 1.3);
  const stack = frame >= b(k + 2, 3) ? 4 : frame >= b(k + 2, 2) ? 3 : frame >= b(k + 2, 1) ? 2 : 1;
  const shieldS = interpolate(frame, [b(k + 4), b(k + 4) + 8], [0.4, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(145,129,245,0.18)" glowB="rgba(228,243,61,0.1)" glow="top" floor={0.35} />
      <Halftone opacity={0.05} gap={18} />

      <ComicText text="How it works" from={b(k)} x={960} y={128} size={112} rotate={-2} skewX={-5} fill={C.lime} stagger={1} />
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
          opacity: interpolate(frame, [b(k, 2), b(k, 2) + 8], [0, 1], clamp),
        }}
      >
        four steps · the agent works, you don't
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
                  <Vault x={PW / 2} y={236} s={1.05} dial={dial} label="VAULT #1" />
                  {frame >= b(k + 1, 1) ? <CoinDot cx={PW / 2 + 110} cy={120} r={40} label="BNB" rotate={-8} /> : null}
                </>
              ) : null}
              {i === 1 ? (
                <>
                  <Robot x={130} y={220} s={1.05} flame={flame} fill="#B7C2D6" visor={C.violet} />
                  <CoinStack x={290} y={300} s={0.9} n={stack} label="USDT" />
                </>
              ) : null}
              {i === 2 ? (
                <>
                  <Wallet x={PW / 2} y={250} s={1.25} fill="#2a2a27" label="SHADOW" labelColor={C.lime} />
                  <Person x={80} y={250} s={0.8} body={C.indigo} mood="happy" pose="point" />
                </>
              ) : null}
              {i === 3 ? (
                <g transform={`translate(${PW / 2} 220) scale(${shieldS}) translate(${-PW / 2} -220)`}>
                  <Shield x={PW / 2} y={210} s={1.2} fill={C.emerald} label="HF ≥ 1.50" />
                </g>
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
                <InkArrow x1={x1} y1={y} x2={x2} y2={y} at={b(k + 1 + i, 2)} dur={6} bend={-46} color={C.lime} width={8} />
                {h > 0 && h < 1 ? <CoinDot cx={x1 + (x2 - x1) * h} cy={y - 34 - Math.sin(h * Math.PI) * 70} r={22} rotate={h * 180} /> : null}
              </g>
            );
          })}
        </svg>
      </Pulse>

      <ComicText text="CLUNK!" from={b(k + 1, 1)} x={px(0) + PW / 2} y={PY + 30} size={80} rotate={-8} fill={C.lime} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2)} />
      <ComicText text="SKIM!" from={b(k + 2, 1)} x={px(1) + PW / 2} y={PY + 50} size={86} rotate={7} fill="#fff" variant="onomatopoeia" echoColor={C.azure} exitAt={b(k + 3)} />
      <ComicText text="KA-CHING!" from={b(k + 3, 1)} x={px(2) + PW / 2} y={PY + 30} size={74} rotate={-6} fill={C.lime} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 4) - 2} />
      <ComicText text="DEFENDED!" from={b(k + 4, 1)} x={px(3) + PW / 2} y={PY + 50} size={72} rotate={-5} fill={C.emerald} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`im${i}`} name="impact" at={b(k + 1 + i)} volume={0.55} />
      ))}
      {[0, 1, 2].map((i) => (
        <Sfx key={`tk${i}`} name="tick" at={b(k + 1 + i, 2)} volume={0.6} />
      ))}
      <Sfx name="chime" at={b(k + 4, 1)} volume={0.6} />
    </AbsoluteFill>
  );
};
