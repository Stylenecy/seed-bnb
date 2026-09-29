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
  Robot,
  Sfx,
  SpeechBubble,
  useBeatPunch,
  useSceneClock,
  Vault,
  Wallet,
} from "../../../kit";
import { CiShield, IdCard, Laptop } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S4 · HOW IT WORKS (bars 14–18). One comic step per bar: panel slams on b0,
 * details b1, onomatopoeia b1/b2, arrow + coin hop b2→b3.
 *   14 POST   poster locks USDT in escrow (postBounty)
 *   15 CLAIM  an ERC-8004 agent stakes and claims a slot (claimSlot)
 *   16 SHIP   deliverable on-chain, the relayer attests CI (submitDeliverable + attestCI)
 *   17 PAID   pickWinner → 98% to the agent, 2% fee, stake back, reputation +1
 */
const PW = 390;
const PH = 690;
const GAP = 66;
const X0 = (1920 - (4 * PW + 3 * GAP)) / 2;
const PY = 262;
const px = (i: number) => X0 + i * (PW + GAP);

type Step = { n: string; title: string; body: string; bg: string; bg2: string };
const STEPS: Step[] = [
  { n: "1", title: "Post", body: "A poster escrows USDT for a task: code, research, content…", bg: "#F7CDB6", bg2: "#e47444" },
  { n: "2", title: "Claim", body: "An AI agent with an ERC-8004 identity stakes and claims a slot.", bg: "#D9F2E6", bg2: "#34d399" },
  { n: "3", title: "Ship + CI", body: "The deliverable goes on-chain. The relayer attests CI. Only it can.", bg: "#E4E0FF", bg2: "#9a8cff" },
  { n: "4", title: "Get paid", body: "Winner picked: 98% to the agent, 2% fee, stake back, reputation +1.", bg: "#FFE9A8", bg2: "#F0B90B" },
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
          color: C.claySoft,
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

export const S4HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.how; // 14
  const punches = [0, 1, 2, 3].map((i) => useBeatPunch(beatsIn(k + i, k + 1 + i), 0.022, 5)); // eslint-disable-line react-hooks/rules-of-hooks

  const hop = (i: number) => interpolate(frame, [b(k + i, 2), b(k + i, 3)], [0, 1], clamp);
  const dial = interpolate(frame, [b(k), b(k, 1)], [0, 220], clamp);
  const ci = interpolate(frame, [b(k + 2, 1), b(k + 2, 2)], [0, 1], clamp);
  const typed = Math.floor(interpolate(frame, [b(k + 2), b(k + 2, 1)], [0, 4], clamp));
  const coinIn = interpolate(frame, [b(k, 1), b(k, 2)], [0, 1], clamp);
  const payout = interpolate(frame, [b(k + 3, 1), b(k + 3, 2)], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(228,116,68,0.2)" glowB="rgba(240,185,11,0.14)" glow="top" floor={0.35} />
      <Halftone opacity={0.05} gap={18} />

      <ComicText text="How it works" from={b(k)} x={960} y={128} size={112} rotate={-2} skewX={-5} fill={C.claySoft} stagger={1} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 196,
          textAlign: "center",
          fontFamily: F.serif,
          fontStyle: "italic",
          fontSize: 34,
          color: C.text,
          opacity: interpolate(frame, [b(k, 1), b(k, 1) + 8], [0, 1], clamp),
        }}
      >
        the same contract on Celo and on BNB Chain · escrow, identity and payout all on-chain
      </div>

      <Pulse intensity={0.9} shake={0.3}>
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
              {i === 0 ? (
                <>
                  <Person x={96} y={300} s={0.95} body={C.clayDeep} mood="happy" pose="point" />
                  <Vault x={285} y={250} s={0.72} label="ESCROW" dial={dial} />
                  {coinIn > 0 && coinIn < 1 ? <CoinDot cx={150 + 130 * coinIn} cy={170 + 60 * coinIn - Math.sin(coinIn * Math.PI) * 60} r={24} label="$" rotate={coinIn * 200} /> : null}
                </>
              ) : null}
              {i === 1 ? (
                <>
                  <Robot x={110} y={260} s={1.05} fill="#9AA3B5" visor="#5EF0FF" />
                  {frame >= b(k + 1, 1) ? <IdCard x={275} y={150} s={0.7} rot={6} /> : null}
                  {frame >= b(k + 1, 2) ? <CoinDot cx={290} cy={300} r={34} label="0.1" /> : null}
                </>
              ) : null}
              {i === 2 ? (
                <>
                  <Laptop x={150} y={240} s={0.72} lines={typed} />
                  {frame >= b(k + 2, 1) ? <CiShield x={300} y={170} s={0.8} draw={ci} /> : null}
                </>
              ) : null}
              {i === 3 ? (
                <>
                  <Wallet x={120} y={260} s={1.0} label="AGENT" />
                  <Jar x={320} y={290} s={0.8} label="2%" />
                  {payout > 0 ? <CoinDot cx={120} cy={170 - payout * 40} r={30} label="98%" opacity={payout} /> : null}
                  {frame >= b(k + 3, 2) ? (
                    <text x={280} y={120} textAnchor="middle" fontFamily={F.comic} fontSize={48} fill={C.clayDeep} stroke={INK} strokeWidth={6} paintOrder="stroke">
                      REP +1
                    </text>
                  ) : null}
                </>
              ) : null}
            </svg>
            {i === 0 ? (
              <SpeechBubble at={b(k, 1)} x={150} y={24} w={220} h={110} tailX={40} tailY={170} size={28}>
                Fix my bug. 1 USDT.
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
                <InkArrow x1={x1} y1={y} x2={x2} y2={y} at={b(k + i, 2)} dur={6} bend={-46} color={C.claySoft} width={8} />
                {h > 0 && h < 1 ? <CoinDot cx={x1 + (x2 - x1) * h} cy={y - 34 - Math.sin(h * Math.PI) * 70} r={22} label="$" rotate={h * 180} /> : null}
              </g>
            );
          })}
        </svg>
      </Pulse>

      <ComicText text="ESCROWED!" from={b(k, 2)} x={px(0) + PW / 2} y={PY + 20} size={74} rotate={-8} fill={C.claySoft} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1)} />
      <ComicText text="CLAIMED!" from={b(k + 1, 2)} x={px(1) + PW / 2} y={PY + 40} size={78} rotate={7} fill="#fff" variant="onomatopoeia" echoColor={C.emerald} exitAt={b(k + 2)} />
      <ComicText text="CI PASS!" from={b(k + 2, 2)} x={px(2) + PW / 2} y={PY + 20} size={78} rotate={-6} fill={C.emerald} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3)} />
      <ComicText text="PAID!" from={b(k + 3, 1)} x={px(3) + PW / 2} y={PY + 40} size={96} rotate={6} fill="#F0B90B" variant="onomatopoeia" echoColor={INK} />

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
