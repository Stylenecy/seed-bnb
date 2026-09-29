import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  Caption,
  clamp,
  CoinDot,
  ComicPanel,
  ComicText,
  FONTS,
  Halftone,
  INK,
  InkFrame,
  PAPER,
  Person,
  Pulse,
  Sfx,
  SpeechBubble,
  SpeedBurst,
  SweatDrops,
  useBeatPunch,
  useSceneClock,
  Vault,
  Wallet,
} from "../../../kit";
import { CalendarPage } from "../art";
import { C } from "../theme";
import { BAR } from "../timeline";

/**
 * S1 · HOOK (bars 5–8). Frame 0 is track bar 5: the band is already in.
 *   bar 5  "Payroll cash sits idle all month."   vault slams b0, Z b1, Z b2, Z b3
 *   bar 6  b0 "Payday is 12 days away."          employee, calendar b1
 *          b2 "So staff borrow at brutal fees."  panel 3 slams, lender sign + "FEES!" b3, coins leak toward the break
 *   bar 7  BREAK: "IDLE CASH. BROKE STAFF." slams on the downbeat, the page drains toward the cut.
 */
const PW = 548;
const PH = 700;
const PY = 214;
const PX = [96, 686, 1276];

const Sign: React.FC<{ x: number; y: number; text: string; sub: string }> = ({ x, y, text, sub }) => (
  <g transform={`translate(${x} ${y}) rotate(-4)`}>
    <line x1={0} y1={40} x2={0} y2={170} stroke={INK} strokeWidth={10} />
    <rect x={-110} y={-60} width={220} height={110} rx={8} fill="#FFE14D" stroke={INK} strokeWidth={6} />
    <text x={0} y={-12} textAnchor="middle" fontFamily={FONTS.comic} fontSize={40} fill={INK}>
      {text}
    </text>
    <text x={0} y={30} textAnchor="middle" fontFamily={FONTS.comic} fontSize={28} fill={C.rose}>
      {sub}
    </text>
  </g>
);

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.hook;

  const p1 = useBeatPunch(beatsIn(k, k + 1), 0.025, 5);
  const p2 = useBeatPunch(beatsIn(k + 1, k + 2), 0.025, 5);
  const p3 = useBeatPunch(beatsIn(k + 1, k + 2).slice(2), 0.025, 5);

  const brk = interpolate(frame, [b(k + 2), b(k + 3)], [0, 1], clamp);
  const drain = 1 - 0.5 * interpolate(frame, [b(k + 2), b(k + 2, 1)], [0, 1], clamp);
  const leak = interpolate(frame, [b(k + 1, 3), b(k + 2)], [0, 1], clamp);

  const z = (i: number) => (frame >= b(k, 1 + i) ? interpolate(frame, [b(k, 1 + i), b(k, 1 + i) + 6], [0, 1], clamp) : 0);

  return (
    <AbsoluteFill style={{ background: "#0a0f1c" }}>
      <Halftone opacity={0.07} gap={18} />
      <AbsoluteFill style={{ transform: `scale(${1 + 0.06 * brk})`, filter: `saturate(${drain})` }}>
        <Pulse intensity={1.1} shake={0.6}>
          <Caption at={b(k)} x={96} y={84} size={40} bg={C.amber} rot={-1.2} maxWidth={1100}>
            Meanwhile, at every company…
          </Caption>

          {/* PANEL 1: payroll cash sleeps */}
          <ComicPanel at={b(k)} x={PX[0]!} y={PY} w={PW} h={PH} rot={-1.6} bg="#C9B8FF" bg2={C.violet} from="up" punch={p1}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <Vault x={274} y={400} s={1.45} label="PAYROLL" fill="#3a3550" dial={0} />
              {[0, 1, 2].map((i) =>
                z(i) > 0 ? (
                  <text
                    key={i}
                    x={390 + i * 42}
                    y={250 - i * 52 - 10 * z(i)}
                    fontFamily={FONTS.comic}
                    fontSize={56 + i * 14}
                    fill={PAPER}
                    stroke={INK}
                    strokeWidth={7}
                    paintOrder="stroke"
                    opacity={z(i)}
                  >
                    Z
                  </text>
                ) : null,
              )}
            </svg>
            <Caption at={b(k)} x={24} y={PH - 110} size={32} rot={0} maxWidth={500}>
              Payroll cash sits idle all month.
            </Caption>
          </ComicPanel>

          {/* PANEL 2: the employee is broke before payday */}
          <ComicPanel at={b(k + 1)} x={PX[1]!} y={PY + 16} w={PW} h={PH} rot={1.3} bg="#A8F0E4" bg2={C.teal} from="down" punch={p2}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <Person x={170} y={470} s={1.25} body={C.emerald} mood="shock" pose="hold" />
              {frame >= b(k + 1, 1) ? <CalendarPage x={410} y={240} s={1.05} rot={6} day="12" head="PAYDAY IN" /> : null}
              {frame >= b(k + 1, 1) ? <Wallet x={400} y={500} s={0.95} rot={-8} fill="#6E4A2E" label="$0" /> : null}
              {frame >= b(k + 1, 1) + 4 ? <SweatDrops x={236} y={250} s={1.2} /> : null}
            </svg>
            <SpeechBubble at={b(k + 1, 1)} x={30} y={40} w={260} h={120} tailX={150} tailY={200} size={30}>
              Rent is due NOW.
            </SpeechBubble>
          </ComicPanel>

          {/* PANEL 3: the loan shark */}
          <ComicPanel at={b(k + 1, 2)} x={PX[2]!} y={PY - 6} w={PW} h={PH} rot={-1.1} bg="#FFC2CC" bg2={C.rose} from="right" punch={p3}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              {frame >= b(k + 1, 3) ? <Sign x={380} y={250} text="FAST CASH" sub="huge fees" /> : null}
              <Person x={150} y={500} s={1.1} body={C.emerald} mood="sad" pose="slump" />
              {leak > 0 && leak < 1
                ? [0, 1, 2].map((i) => (
                    <CoinDot key={i} cx={170 + 220 * leak + i * 26} cy={420 - Math.sin(leak * Math.PI) * 120 - i * 18} r={24} rotate={leak * 300} />
                  ))
                : null}
            </svg>
            <Caption at={b(k + 1, 2)} x={24} y={PH - 110} size={32} rot={1} maxWidth={500}>
              So staff borrow at brutal fees.
            </Caption>
            <ComicText text="FEES!" from={b(k + 1, 3)} x={150} y={170} size={110} rotate={-10} fill={C.amber} variant="onomatopoeia" echoColor={INK} />
          </ComicPanel>
        </Pulse>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 60% 60% at 50% 52%, rgba(7,10,18,0.82), rgba(7,10,18,0.45))",
          opacity: interpolate(frame, [b(k + 2), b(k + 2) + 5], [0, 1], clamp),
        }}
      />
      <SpeedBurst cx={960} cy={500} from={b(k + 2)} count={22} inner={280} spread={700} color={C.violetLite} opacity={0.6} width={8} seed="idle" />
      <ComicText text="IDLE CASH." from={b(k + 2)} x={960} y={400} size={230} rotate={-6} skewX={-8} tiltX={8} fill={C.gold} variant="onomatopoeia" echoColor={C.violet} />
      <ComicText text="BROKE STAFF." from={b(k + 2, 1)} x={960} y={640} size={200} rotate={4} skewX={-6} fill={C.tealLite} variant="onomatopoeia" echoColor={INK} />
      <ComicText text="Same payroll. Two problems." from={b(k + 2, 2)} x={960} y={880} size={60} rotate={-2} fill="#fff" />

      <InkFrame inset={22} width={5} opacity={0.9} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={0.55} />
      <Sfx name="impact" at={b(k + 1)} volume={0.55} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.55} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`z${i}`} name="tick" at={b(k, i)} volume={0.5} />
      ))}
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.6} />
      <Sfx name="impact" at={b(k + 1, 3)} volume={0.6} />
      <Sfx name="impact" at={b(k + 2)} volume={0.9} />
      <Sfx name="impact" at={b(k + 2, 1)} volume={0.7} />
    </AbsoluteFill>
  );
};
