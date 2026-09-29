import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption, clamp, ComicPanel, ComicText, Halftone, INK, InkFrame, Pulse, Robot, Sfx, SpeechBubble, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { DumpChart, Pencil, PlanCard, Stamp } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S1 · HOOK (track bars 3–8; the file starts on the bar-3 break).
 *   3  (break) a lone bot in the dark: "Trading bots run while you sleep." · b2 "They say they have a plan."
 *   4  DROP panel 1 "It posts a plan." (clipboard) · b2 speech "TRUST ME"
 *   5  panel 2 "Then the market dumps." (-12%) · b2 LOSS stamp
 *   6  panel 3 "…and the plan quietly changes." pencil scribbles it out b1–b3, EDITED? stamp b3
 *   7  (break) "NO RECEIPTS." + "Nothing on-chain says what the bot promised."
 */
const PW = 548;
const PH = 600;
const PY = 214;
const PX = [96, 686, 1276];
const PLAN = ["band  ±7%", "levels 12", "max dd 12%"];

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.hook; // 3
  const d = k + 1; // 4, the drop

  const intro = frame < b(d);
  const botIn = spring({ frame: frame - b(k), fps, config: { damping: 14, stiffness: 120, mass: 0.9 } });
  const p1 = useBeatPunch(beatsIn(d, d + 3), 0.02, 5);
  const chart = interpolate(frame, [b(d + 1), b(d + 1, 2)], [0.1, 1], clamp);
  const scribble = interpolate(frame, [b(d + 2, 1), b(d + 2, 3)], [0, 1], clamp);
  const pencilX = interpolate(scribble, [0, 0.25, 0.5, 0.75, 1], [330, 200, 360, 220, 340]);
  const brk = frame >= b(d + 3);
  const dim = interpolate(frame, [b(d + 3), b(d + 3) + 5], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Halftone opacity={0.07} gap={18} color={C.coralHi} />

      {intro ? (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: "radial-gradient(ellipse 40% 50% at 50% 55%, rgba(217,119,87,0.22), transparent 70%)" }} />
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <Robot x={960} y={interpolate(botIn, [0, 1], [760, 600])} s={2.2} mood="neutral" visor={C.coralHi} fill="#8f8680" opacity={interpolate(botIn, [0, 0.3], [0, 1], clamp)} />
          </svg>
          <Caption at={b(k)} x={960 - 520} y={170} size={54} bg={C.cream} rot={-1.5} maxWidth={1100}>
            Trading bots run while you sleep.
          </Caption>
          <Caption at={b(k, 2)} x={960 - 380} y={860} size={46} bg={C.coralHi} rot={1.2} maxWidth={900}>
            They say they have a plan.
          </Caption>
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ filter: `saturate(${1 - 0.6 * dim})` }}>
          <Pulse intensity={1.1} shake={0.6}>
            <ComicPanel at={b(d)} x={PX[0]!} y={PY} w={PW} h={PH} rot={-1.6} bg={C.cream} bg2={C.coralHi} from="up" punch={p1}>
              <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
                <PlanCard x={PW / 2} y={350} s={1.15} rot={-3} lines={PLAN} />
              </svg>
              <Caption at={b(d)} x={24} y={40} size={34} rot={0} maxWidth={500}>
                It posts a plan.
              </Caption>
              <SpeechBubble at={b(d, 2)} x={330} y={120} w={196} h={90} tailX={110} tailY={210} size={42} shout>
                TRUST ME
              </SpeechBubble>
            </ComicPanel>

            <ComicPanel at={b(d + 1)} x={PX[1]!} y={PY + 16} w={PW} h={PH} rot={1.3} bg="#ffd9d9" bg2="#f28b8b" from="down">
              <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
                <DumpChart x={PW / 2} y={340} s={1.3} p={chart} label={frame >= b(d + 1, 1) ? "-12%" : undefined} />
              </svg>
              <Caption at={b(d + 1)} x={24} y={40} size={34} rot={-1} maxWidth={500}>
                Then the market dumps.
              </Caption>
              <Stamp at={b(d + 1, 2)} text="LOSS" x={PW / 2} y={530} rot={8} />
            </ComicPanel>

            <ComicPanel at={b(d + 2)} x={PX[2]!} y={PY - 6} w={PW} h={PH} rot={-1.1} bg="#f4efe4" bg2="#d8ccb4" from="right">
              <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
                <PlanCard x={PW / 2 - 20} y={350} s={1.15} rot={2} lines={PLAN} scribble={scribble} newLine={"“PLAN B!”"} />
                {frame >= b(d + 2, 1) ? <Pencil x={pencilX} y={300 + Math.sin(scribble * 20) * 10} s={0.9} rot={28} /> : null}
              </svg>
              <Caption at={b(d + 2)} x={24} y={40} size={34} rot={1} maxWidth={500}>
                …and the plan quietly changes.
              </Caption>
              <Stamp at={b(d + 2, 3)} text="EDITED?" x={PW / 2} y={530} rot={-6} />
            </ComicPanel>
          </Pulse>
        </AbsoluteFill>
      )}

      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(14,12,11,0.92), rgba(8,7,6,0.7))", opacity: dim }} />
      {brk ? (
        <AbsoluteFill>
          <SpeedBurst cx={960} cy={440} from={b(d + 3)} count={20} inner={250} spread={640} color={C.negHi} opacity={0.5} width={7} seed="rcpt" fade />
          <ComicText text="NO RECEIPTS." from={b(d + 3)} x={960} y={430} size={230} rotate={-5} skewX={-6} fill={C.negHi} variant="onomatopoeia" echoColor={INK} />
          <ComicText text="Nothing on-chain says what the bot promised." from={b(d + 3, 2)} x={960} y={740} size={66} rotate={-1.5} fill={C.cream} />
        </AbsoluteFill>
      ) : null}

      <InkFrame inset={22} width={5} opacity={0.9} color={C.cream} />

      <Sfx name="whoosh" at={b(k)} volume={0.35} />
      <Sfx name="tick" at={b(k, 2)} volume={0.5} />
      <Sfx name="impact" at={b(d)} volume={0.8} />
      <Sfx name="tick" at={b(d, 2)} volume={0.5} />
      <Sfx name="impact" at={b(d + 1)} volume={0.6} />
      <Sfx name="impact" at={b(d + 1, 2)} volume={0.6} />
      <Sfx name="impact" at={b(d + 2)} volume={0.6} />
      {[1, 2].map((i) => (
        <Sfx key={`s${i}`} name="tick" at={b(d + 2, i)} volume={0.5} />
      ))}
      <Sfx name="impact" at={b(d + 2, 3)} volume={0.65} />
      <Sfx name="impact" at={b(d + 3)} volume={0.95} />
      <Sfx name="tick" at={b(d + 3, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
