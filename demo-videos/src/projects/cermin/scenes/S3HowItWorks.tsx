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
  useBeatPunch,
  useSceneClock,
  Vault,
  Wallet,
} from "../../../kit";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S3 · HOW IT WORKS (bars 11–16). Slides in with the title on bar 11, then one
 * comic step per bar, each landing on its downbeat (the narrator's "Target LTV"
 * lands on bar 13 and "Defend-below" on ≈ bar 14 — see Main.tsx):
 *   bar 12 LOCK     deposit native BNB into your own vault      ("LOCKED!")
 *   bar 13 BORROW   MUSD at target LTV → a share is your Shadow ("CASH!")
 *   bar 14 DEFEND   dip below the defense line → keeper repays   ("DEFEND!")
 *   bar 15 SKIM     rise past the skim threshold → borrow more    ("SKIM!")
 */
const PW = 390;
const PH = 700;
const GAP = 66;
const X0 = (1920 - (4 * PW + 3 * GAP)) / 2;
const PY = 262;
const px = (i: number) => X0 + i * (PW + GAP);

type Step = { n: string; title: string; body: string; bg: string; bg2: string };
const STEPS: Step[] = [
  { n: "1", title: "Lock", body: "Deposit BNB once. It's native collateral in your own vault.", bg: "#F7E9CB", bg2: "#E8C99A" },
  { n: "2", title: "Borrow", body: "It borrows MUSD at your target LTV. A share is your spendable Shadow.", bg: "#DDEBCF", bg2: "#A9C98F" },
  { n: "3", title: "Defend", body: "BNB dips below your defense line? The keeper repays debt.", bg: "#F4D5C0", bg2: "#E8A07A" },
  { n: "4", title: "Skim", body: "BNB climbs past your skim threshold? It borrows a bit more for you.", bg: "#FFE9A8", bg2: "#F0B90B" },
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
          color: "#F0B90B",
          fontFamily: F.comic,
          fontSize: 36,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {s.n}
      </span>
      <span style={{ fontFamily: F.comic, fontSize: 54, color: INK, letterSpacing: "0.02em", textTransform: "uppercase" }}>{s.title}</span>
    </div>
    <div
      style={{
        marginTop: 10,
        background: "#fffaf0",
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
  const k = BAR.how; // 11 — title; steps on 12..15
  const punches = [0, 1, 2, 3].map((i) => useBeatPunch(beatsIn(k + 1 + i, k + 2 + i), 0.022, 5)); // eslint-disable-line react-hooks/rules-of-hooks

  const hop = (i: number) => interpolate(frame, [b(k + 1 + i, 2), b(k + 1 + i, 3)], [0, 1], clamp);
  const dial = interpolate(frame, [b(k + 1), b(k + 1, 2)], [0, 270], clamp);
  const flame = 0.6 + 0.4 * Math.sin(frame * 1.3);
  const bot = interpolate(frame, [b(k + 3), b(k + 3, 1)], [-140, 0], clamp);
  const coinIn = interpolate(frame, [b(k + 1), b(k + 1, 1)], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg base="#110e0b" glowA="rgba(199,122,58,0.2)" glowB="rgba(240,185,11,0.12)" glow="top" floor={0.35} />
      <Halftone opacity={0.05} gap={18} color={C.amberHi} />

      <ComicText text="How it works" from={b(k)} x={960} y={128} size={112} rotate={-2} skewX={-5} fill="#F0B90B" stagger={1} />
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
        one vault · four rules · your BNB is never sold
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
                border: "4px dashed rgba(250,246,240,0.22)",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: F.comic,
                fontSize: 160,
                color: "rgba(250,246,240,0.12)",
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
                  <Vault x={PW / 2} y={250} s={1.05} dial={dial} label="VAULT" />
                  {coinIn < 1 ? <CoinDot cx={PW / 2} cy={70 + 120 * coinIn} r={44} label="BNB" rotate={coinIn * 200} /> : null}
                </>
              ) : null}
              {i === 1 ? (
                <>
                  <Person x={120} y={260} s={1.0} body={C.amber} mood="happy" pose="cheer" wave={Math.sin(frame * 0.5) * 8} />
                  {frame >= b(k + 2, 1) ? <CoinDot cx={290} cy={120} r={42} label="MUSD" face="#8fc27a" ring="#d9f2c8" /> : null}
                  {frame >= b(k + 2, 2) ? <Wallet x={290} y={270} s={0.85} label="SHADOW" fill="#5b3a22" /> : null}
                </>
              ) : null}
              {i === 2 ? (
                <g transform={`translate(${bot} 0)`}>
                  <Robot x={PW / 2 - 40} y={240} s={1.1} flame={flame} fill="#D8CDBB" visor="#F0B90B" />
                  {/* shield */}
                  <path
                    d={`M${PW - 90} 150 l58 22 v44 c0 42 -30 66 -58 78 c-28 -12 -58 -36 -58 -78 v-44z`}
                    fill="#8fc27a"
                    stroke={INK}
                    strokeWidth={6}
                    strokeLinejoin="round"
                    opacity={frame >= b(k + 3, 1) ? 1 : 0}
                  />
                </g>
              ) : null}
              {i === 3 ? (
                <>
                  <polyline points="30,330 90,300 150,316 210,240 270,258 330,160" fill="none" stroke={INK} strokeWidth={16} strokeLinejoin="round" strokeLinecap="round" />
                  <polyline points="30,330 90,300 150,316 210,240 270,258 330,160" fill="none" stroke="#3fae5a" strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
                  {frame >= b(k + 4, 1) ? <CoinDot cx={330} cy={110} r={36} label="+" face="#8fc27a" ring="#d9f2c8" /> : null}
                  {frame >= b(k + 4, 2) ? <Jar x={110} y={140} s={0.75} label="SHADOW" fill="#F7E9CB" /> : null}
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
                <InkArrow x1={x1} y1={y} x2={x2} y2={y} at={b(k + 1 + i, 2)} dur={6} bend={-46} color="#F0B90B" width={8} />
                {h > 0 && h < 1 ? <CoinDot cx={x1 + (x2 - x1) * h} cy={y - 34 - Math.sin(h * Math.PI) * 70} r={22} rotate={h * 180} /> : null}
              </g>
            );
          })}
        </svg>
      </Pulse>

      <ComicText text="LOCKED!" from={b(k + 1, 1)} x={px(0) + PW / 2} y={PY + 20} size={80} rotate={-8} fill="#F0B90B" variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2)} />
      <ComicText text="CASH!" from={b(k + 2, 1)} x={px(1) + PW / 2} y={PY + 40} size={88} rotate={7} fill="#8fe39f" variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3)} />
      <ComicText text="DEFEND!" from={b(k + 3, 1)} x={px(2) + PW / 2} y={PY + 20} size={80} rotate={-6} fill={C.cream} variant="onomatopoeia" echoColor={C.amber} exitAt={b(k + 4)} />
      <ComicText text="SKIM!" from={b(k + 4, 1)} x={px(3) + PW / 2} y={PY + 40} size={90} rotate={6} fill="#F0B90B" variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={5} opacity={0.85} color={C.cream} />

      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`im${i}`} name="impact" at={b(k + 1 + i)} volume={0.5} />
      ))}
      {[0, 1, 2].map((i) => (
        <Sfx key={`wh${i}`} name="tick" at={b(k + 1 + i, 2)} volume={0.55} />
      ))}
      <Sfx name="chime" at={b(k + 4, 1)} volume={0.5} />
    </AbsoluteFill>
  );
};
