import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  Caption,
  clamp,
  ComicPanel,
  ComicText,
  Halftone,
  INK,
  InkFrame,
  Pulse,
  Robot,
  Sfx,
  SpeechBubble,
  SpeedBurst,
  steppedCount,
  SweatDrops,
  useBeatPunch,
  useSceneClock,
} from "../../../kit";
import { Candles, EquityDrop, Shield, Storm } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S1 · HOOK (track bars 24–28; the file starts at bar 24, mid-plateau).
 *   bar 24 b0  panel 1 "Your bot sees a signal."  (robot shouts LONG!, candles climb)
 *   bar 24 b1  panel 2 "It can't see the macro storm." (storm, candles crash b1→b3)
 *   bar 24 b2  panel 3 "Nothing stops the drawdown." (equity falls)
 *   bar 25     drawdown ticks −5 → −12 → −19 → −25% on the beats
 *   bar 26     "REKT!" slams on the downbeat; b2 "Who pulls the brake?"
 *   bar 27     the shield drops in (b0) → "A guard it can't override." (b2)
 */
const PW = 548;
const PH = 640;
const PY = 214;
const PX = [96, 686, 1276];

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.hook; // 24

  const p1 = useBeatPunch(beatsIn(k, k + 2), 0.02, 5);
  const up = interpolate(frame, [b(k), b(k, 1)], [0.2, 0.55], clamp);
  const crash = interpolate(frame, [b(k, 1), b(k + 1)], [0.2, 1], clamp);
  const eq = interpolate(frame, [b(k, 2), b(k + 2)], [0.05, 1], clamp);
  const dd = steppedCount(frame, [b(k + 1), b(k + 1, 1), b(k + 1, 2), b(k + 1, 3)], [-5, -12, -19, -25]);
  const ddShown = frame >= b(k + 1);
  const pDD = useBeatPunch(beatsIn(k + 1, k + 2), 0.18, 4);
  const rekt = interpolate(frame, [b(k + 2), b(k + 2) + 5], [0, 1], clamp);
  const guard = interpolate(frame, [b(k + 3) - 6, b(k + 3)], [0, 1], clamp);
  const drain = 1 - 0.55 * rekt;

  return (
    <AbsoluteFill style={{ background: "#0c0d11" }}>
      <Halftone opacity={0.07} gap={18} />
      <AbsoluteFill style={{ transform: `scale(${1 + 0.05 * rekt})`, filter: `saturate(${drain})` }}>
        <Pulse intensity={1.1} shake={0.6}>
          <Caption at={b(k)} x={96} y={84} size={40} bg={C.peri} rot={-1.2} maxWidth={1100}>
            Meanwhile, at 3 AM on the trading desk…
          </Caption>

          <ComicPanel at={b(k)} x={PX[0]!} y={PY} w={PW} h={PH} rot={-1.6} bg="#DCE2FF" bg2="#9aa8f0" from="up" punch={p1}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <Candles x={300} y={470} w={380} h={200} p={up} crash={false} n={10} />
              <Robot x={150} y={390} s={1.05} mood="happy" visor="#9aa8f0" />
            </svg>
            <SpeechBubble at={b(k) + 3} x={250} y={130} w={250} h={110} tailX={200} tailY={260} size={52} shout>
              LONG!
            </SpeechBubble>
            <Caption at={b(k)} x={24} y={40} size={34} rot={0} maxWidth={500}>
              Your bot sees a signal.
            </Caption>
          </ComicPanel>

          <ComicPanel at={b(k, 1)} x={PX[1]!} y={PY + 16} w={PW} h={PH} rot={1.3} bg="#FFC2C2" bg2="#f87171" from="down">
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <Storm x={290} y={230} s={0.95} bolt={frame >= b(k, 2)} />
              <Candles x={PW / 2} y={470} w={420} h={210} p={crash} n={14} />
            </svg>
            <Caption at={b(k, 1)} x={24} y={40} size={34} rot={-1} maxWidth={500}>
              It can't see the macro storm.
            </Caption>
          </ComicPanel>

          <ComicPanel at={b(k, 2)} x={PX[2]!} y={PY - 6} w={PW} h={PH} rot={-1.1} bg="#2b2d45" bg2="#14152b" from="right">
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <EquityDrop x={PW / 2} y={400} w={420} h={300} p={eq} />
              {frame >= b(k, 3) ? <SweatDrops x={460} y={170} s={1} /> : null}
            </svg>
            <Caption at={b(k, 2)} x={24} y={40} size={34} rot={1} maxWidth={440}>
              Nothing stops the drawdown.
            </Caption>
            {ddShown ? (
              <div
                style={{
                  position: "absolute",
                  left: 40,
                  bottom: 40,
                  padding: "10px 22px",
                  background: C.red,
                  border: `4px solid ${INK}`,
                  boxShadow: `5px 5px 0 ${INK}`,
                  fontFamily: F.comic,
                  fontSize: 64,
                  color: INK,
                  transform: `rotate(-3deg) scale(${pDD})`,
                }}
              >
                DRAWDOWN {dd}%
              </div>
            ) : null}
          </ComicPanel>
        </Pulse>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 60% 60% at 50% 52%, rgba(40,6,12,0.85), rgba(8,9,11,0.5))",
          opacity: rekt * (1 - 0.35 * guard),
        }}
      />
      <SpeedBurst cx={960} cy={500} from={b(k + 2)} count={22} inner={260} spread={700} color={C.red} opacity={0.6} width={8} seed="rekt" />
      <ComicText text="REKT!" from={b(k + 2)} x={960} y={470} size={300} rotate={-7} skewX={-8} tiltX={8} fill={C.red} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3) - 2} />
      <ComicText text="Who pulls the brake?" from={b(k + 2, 2)} x={960} y={790} size={70} rotate={-2} fill={C.peri} exitAt={b(k + 3) - 2} />

      {frame >= b(k + 3) - 6 ? (
        <AbsoluteFill>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <Shield x={960} y={interpolate(guard, [0, 1], [-200, 420])} s={1.9 * (1 + 0.1 * (1 - guard))} rot={(1 - guard) * -18} />
          </svg>
          <SpeedBurst cx={960} cy={420} from={b(k + 3)} count={18} inner={240} spread={600} color={C.peri} opacity={0.55} width={7} seed="shield" fade />
          <ComicText text="A GUARD IT CAN'T OVERRIDE." from={b(k + 3, 2)} x={960} y={850} size={96} rotate={-3} fill={C.gold} variant="onomatopoeia" echoColor={INK} stagger={1} />
        </AbsoluteFill>
      ) : null}

      <InkFrame inset={22} width={5} opacity={0.9} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={0.55} />
      <Sfx name="impact" at={b(k, 1)} volume={0.55} />
      <Sfx name="impact" at={b(k, 2)} volume={0.55} />
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`dd${i}`} name="tick" at={b(k + 1, i)} volume={0.6} />
      ))}
      <Sfx name="impact" at={b(k + 2)} volume={0.95} />
      <Sfx name="tick" at={b(k + 2, 2)} volume={0.5} />
      <Sfx name="whoosh" at={b(k + 3)} volume={0.5} />
      <Sfx name="impact" at={b(k + 3, 2)} volume={0.7} />
    </AbsoluteFill>
  );
};
