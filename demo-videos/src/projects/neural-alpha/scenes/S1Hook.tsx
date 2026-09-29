import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Caption, clamp, ComicPanel, ComicText, Halftone, INK, InkFrame, Person, Pulse, Robot, Sfx, SpeechBubble, SpeedBurst, SweatDrops, useBeatPunch, useSceneClock } from "../../../kit";
import { Candles, TokenCoin, Zzz } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S1 · HOOK (track bars 1–4; the file starts at bar 1, mid-phrase).
 *   1 b0  panel 1 "BSC trades 24/7." — candles pop on every beat
 *   1 b2  panel 2 "You sleep." — ZZZ
 *   2 b0  panel 3 "Your bot trades anyway…" — robot + a token pointing at an empty address
 *   2 b1..b3  NO STOP-LOSS? · NO DRAWDOWN CAP? · WRONG CONTRACT?
 *   3     (break) chart crashes → "REKT." · b2 "What if the risk rules lived in code?"
 */
const PW = 548;
const PH = 620;
const PY = 214;
const PX = [96, 686, 1276];
const QUESTIONS = ["NO STOP-LOSS?", "NO DRAWDOWN CAP?", "WRONG CONTRACT?"];

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.hook; // 1

  const p1 = useBeatPunch(beatsIn(k, k + 2), 0.02, 5);
  const shown = interpolate(frame, [b(k), b(k + 1)], [3, 11], clamp) + (frame >= b(k + 2) ? interpolate(frame, [b(k + 2), b(k + 2, 1)], [0, 3], clamp) : 0);
  const rekt = interpolate(frame, [b(k + 2), b(k + 2) + 5], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ background: C.void }}>
      <Halftone opacity={0.07} gap={18} />
      <AbsoluteFill style={{ transform: `scale(${1 + 0.05 * rekt})`, filter: `saturate(${1 - 0.55 * rekt})` }}>
        <Pulse intensity={1.1} shake={0.6}>
          <Caption at={b(k)} x={96} y={84} size={40} bg={C.neon} rot={-1.2} maxWidth={1200}>
            Trading on BNB Smart Chain…
          </Caption>

          <ComicPanel at={b(k)} x={PX[0]!} y={PY} w={PW} h={PH} rot={-1.6} bg="#D9F7EA" bg2="#0ecb81" from="up" punch={p1}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <Candles x={50} y={170} w={448} h={330} shown={shown} crashFrom={11} />
            </svg>
            <Caption at={b(k)} x={24} y={40} size={34} rot={0} maxWidth={500}>
              BSC trades 24/7.
            </Caption>
          </ComicPanel>

          <ComicPanel at={b(k, 2)} x={PX[1]!} y={PY + 16} w={PW} h={PH} rot={1.3} bg="#1c2330" bg2="#0b0f16" from="down">
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <circle cx={430} cy={150} r={56} fill="#f4efe4" stroke={INK} strokeWidth={7} />
              <circle cx={452} cy={136} r={50} fill="#1c2330" />
              <Person x={250} y={500} s={1.2} body={C.cyan} mood="neutral" pose="slump" />
              <Zzz x={300} y={290} t={frame} />
            </svg>
            <Caption at={b(k, 2)} x={24} y={40} size={34} rot={-1} maxWidth={500}>
              You sleep.
            </Caption>
          </ComicPanel>

          <ComicPanel at={b(k + 1)} x={PX[2]!} y={PY - 6} w={PW} h={PH} rot={-1.1} bg="#FFE3E7" bg2="#f6465d" from="right">
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <Robot x={170} y={400} s={1.25} mood="neutral" visor={C.danger} fill="#9aa3b5" />
              <TokenCoin x={400} y={260} s={0.9} sym="PENGU" bad rot={8} />
              {frame >= b(k + 1, 2) ? <SweatDrops x={230} y={250} s={0.9} /> : null}
            </svg>
            <SpeechBubble at={b(k + 1) + 3} x={40} y={110} w={300} h={100} tailX={150} tailY={210} size={40} shout>
              BUY IT ALL!
            </SpeechBubble>
            <Caption at={b(k + 1)} x={24} y={40} size={32} rot={1} maxWidth={500}>
              Your bot trades anyway…
            </Caption>
          </ComicPanel>

          {QUESTIONS.map((q, i) => (
            <div key={q} style={{ position: "absolute", left: [380, 960, 1540][i], top: [930, 900, 930][i] }}>
              {frame >= b(k + 1, i + 1) ? (
                <div
                  style={{
                    transform: `translate(-50%, -50%) rotate(${[-5, 4, -3][i]}deg) scale(${interpolate(frame, [b(k + 1, i + 1), b(k + 1, i + 1) + 5], [1.8, 1], clamp)})`,
                    padding: "6px 22px",
                    background: [C.gold, "#f4efe4", C.danger][i],
                    border: `5px solid ${INK}`,
                    boxShadow: `6px 6px 0 ${INK}`,
                    fontFamily: F.comic,
                    fontSize: 54,
                    color: INK,
                    whiteSpace: "nowrap",
                  }}
                >
                  {q}
                </div>
              ) : null}
            </div>
          ))}
        </Pulse>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(50,6,12,0.9), rgba(5,6,8,0.65))", opacity: rekt }} />
      <SpeedBurst cx={960} cy={470} from={b(k + 2)} count={22} inner={250} spread={700} color={C.danger} opacity={0.6} width={8} seed="rekt" />
      <ComicText text="REKT." from={b(k + 2)} x={960} y={450} size={300} rotate={-7} skewX={-8} tiltX={8} fill={C.danger} variant="onomatopoeia" echoColor={INK} />
      <ComicText text="What if the risk rules lived in code?" from={b(k + 2, 2)} x={960} y={800} size={70} rotate={-2} fill={C.neon} />

      <InkFrame inset={22} width={5} opacity={0.9} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={0.55} />
      <Sfx name="tick" at={b(k, 1)} volume={0.4} />
      <Sfx name="impact" at={b(k, 2)} volume={0.55} />
      <Sfx name="impact" at={b(k + 1)} volume={0.6} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`q${i}`} name="tick" at={b(k + 1, i)} volume={0.6} />
      ))}
      <Sfx name="impact" at={b(k + 2)} volume={0.95} />
      <Sfx name="whoosh" at={b(k + 2, 2)} volume={0.4} />
    </AbsoluteFill>
  );
};
