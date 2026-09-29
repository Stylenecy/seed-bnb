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
  PremiumBg,
  Pulse,
  Robot,
  Sfx,
  useBeatPunch,
  useSceneClock,
  Vault,
} from "../../../kit";
import { GoldBar, Padlock, RouterNode, Scale, ShareTicket, UsdtStack } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S3 · HOW IT WORKS (bars 6–10). Slides in; title on bar 6 b0, one step per bar
 * (the steps are the real GoldaVault surface):
 *   bar 6  DEPOSIT  deposit USDT → gVAULT shares (ERC-4626)                 "MINT!"
 *   bar 7  DECIDE   the off-chain agent picks a gold target                 "RISK-OFF!"
 *   bar 8  SWAP     executeRebalance → LI.FI, whitelisted selectors only    "ROUTED!"
 *   bar 9  GUARD    PAXG valued by a 300 s PancakeSwap V3 TWAP; pro-rata exit "TWAP!"
 */
const PW = 390;
const PH = 700;
const GAP = 66;
const X0 = (1920 - (4 * PW + 3 * GAP)) / 2;
const PY = 262;
const px = (i: number) => X0 + i * (PW + GAP);

type Step = { n: string; title: string; body: string; bg: string; bg2: string };
const STEPS: Step[] = [
  { n: "1", title: "Deposit", body: "Put in USDT. Get gVAULT shares (ERC-4626).", bg: "#BFF0DC", bg2: C.usdt },
  { n: "2", title: "Decide", body: "An off-chain agent reads the market regime and picks a gold target.", bg: "#D9D2FF", bg2: "#9181f5" },
  { n: "3", title: "Swap", body: "executeRebalance routes via LI.FI. Only whitelisted selectors pass.", bg: "#E4DBFF", bg2: "#b9a7ff" },
  { n: "4", title: "Guard", body: "Gold is priced by a 5-min PancakeSwap V3 TWAP. Exits are pro-rata.", bg: "#FFE9A8", bg2: C.gold },
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
          color: C.goldSoft,
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
      <span style={{ fontFamily: F.comic, fontSize: 50, color: INK, letterSpacing: "0.02em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{s.title}</span>
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
  const k = BAR.how; // 6
  const punches = [0, 1, 2, 3].map((i) => useBeatPunch(beatsIn(k + i, k + 1 + i), 0.022, 5)); // eslint-disable-line react-hooks/rules-of-hooks

  const hop = (i: number) => interpolate(frame, [b(k + i, 2), b(k + i, 3)], [0, 1], clamp);
  const dial = interpolate(frame, [b(k), b(k, 2)], [0, 270], clamp);
  const flame = 0.6 + 0.4 * Math.sin(frame * 1.3);
  const tilt = interpolate(frame, [b(k + 1, 1), b(k + 1, 2)], [0, 14], clamp);
  const unlock = interpolate(frame, [b(k + 2, 1), b(k + 2, 1) + 8], [0, 1], clamp);
  const clock = interpolate(frame, [b(k + 3), b(k + 4)], [0, 360], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(217,174,74,0.18)" glowB="rgba(38,161,123,0.12)" glow="top" floor={0.35} />
      <Halftone opacity={0.05} gap={18} />

      <ComicText text="How it works" from={b(k)} x={960} y={128} size={112} rotate={-2} skewX={-5} fill={C.goldSoft} stagger={1} />
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
        one ERC-4626 vault · two assets · an agent that can only swap
      </div>

      <Pulse intensity={0.9} shake={0.5}>
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
            <svg width={PW} height={440} viewBox={`0 0 ${PW} 440`} style={{ position: "absolute", left: 0, top: 0 }}>
              {i === 0 ? (
                <>
                  <Vault x={PW / 2} y={200} s={0.95} dial={dial} label="GOLDA VAULT" fill="#3a3322" />
                  <UsdtStack x={90} y={360} s={0.7} n={3} />
                  {frame >= b(k, 1) ? <ShareTicket x={270} y={360} s={0.8} rot={-8} /> : null}
                </>
              ) : null}
              {i === 1 ? (
                <>
                  <Robot x={95} y={170} s={0.85} flame={flame} fill="#B7C2D6" visor={C.gold} />
                  <Scale
                    x={240}
                    y={290}
                    s={0.62}
                    tilt={tilt}
                    left={<UsdtStack x={0} y={0} s={0.6} n={2} />}
                    right={<GoldBar x={0} y={-6} s={0.55} />}
                  />
                </>
              ) : null}
              {i === 2 ? (
                <>
                  <RouterNode x={PW / 2} y={170} s={1.05} />
                  <Padlock x={PW / 2} y={330} s={0.8} open={unlock} mark="✓" fill={C.goldSoft} />
                </>
              ) : null}
              {i === 3 ? (
                <>
                  <GoldBar x={PW / 2 - 40} y={300} s={1.05} />
                  <g transform={`translate(${PW / 2 + 90} 150)`}>
                    <circle r={60} fill="#fff" stroke={INK} strokeWidth={7} />
                    <line x1={0} y1={0} x2={Math.sin((clock * Math.PI) / 180) * 42} y2={-Math.cos((clock * Math.PI) / 180) * 42} stroke={INK} strokeWidth={7} strokeLinecap="round" />
                    <circle r={7} fill={C.gold} stroke={INK} strokeWidth={3} />
                    <text x={0} y={96} textAnchor="middle" fontFamily={F.comic} fontSize={30} fill={INK}>
                      300 S
                    </text>
                  </g>
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
                <InkArrow x1={x1} y1={y} x2={x2} y2={y} at={b(k + i, 2)} dur={6} bend={-46} color={C.goldSoft} width={8} />
                {h > 0 && h < 1 ? <CoinDot cx={x1 + (x2 - x1) * h} cy={y - 34 - Math.sin(h * Math.PI) * 70} r={22} rotate={h * 180} face={C.gold} ring={C.goldSoft} /> : null}
              </g>
            );
          })}
        </svg>
      </Pulse>

      <ComicText text="MINT!" from={b(k, 1)} x={px(0) + PW / 2} y={PY + 30} size={84} rotate={-8} fill={C.goldSoft} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1)} />
      <ComicText text="RISK-OFF!" from={b(k + 1, 1)} x={px(1) + PW / 2} y={PY + 50} size={74} rotate={7} fill="#fff" variant="onomatopoeia" echoColor="#9181f5" exitAt={b(k + 2)} />
      <ComicText text="ROUTED!" from={b(k + 2, 1)} x={px(2) + PW / 2} y={PY + 30} size={80} rotate={-6} fill={C.goldSoft} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3) - 2} />
      <ComicText text="TWAP!" from={b(k + 3, 1)} x={px(3) + PW / 2} y={PY + 50} size={86} rotate={-5} fill={C.goldSoft} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`im${i}`} name="impact" at={b(k + i)} volume={0.55} />
      ))}
      {[0, 1, 2].map((i) => (
        <Sfx key={`tk${i}`} name="tick" at={b(k + i, 2)} volume={0.6} />
      ))}
      <Sfx name="chime" at={b(k + 3, 1)} volume={0.6} />
    </AbsoluteFill>
  );
};
