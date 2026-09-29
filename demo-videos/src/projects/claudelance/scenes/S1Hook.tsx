import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  Caption,
  clamp,
  ComicPanel,
  ComicText,
  Halftone,
  InkFrame,
  Person,
  Pulse,
  Sfx,
  SpeechBubble,
  SpeedBurst,
  useBeatPunch,
  useSceneClock,
} from "../../../kit";
import { ClayStar, DayClock, Laptop, PriceTag, Zzz } from "../art";
import { C } from "../theme";
import { BAR } from "../timeline";

/**
 * S1 · HOOK (track bars 4–8). Three comic panels, one per bar, then the slam:
 *   bar 4  a dev + Claude Code Max laptop; "$200/MO" tag b1, bubble b2
 *   bar 5  24h dial: ~4 busy hours fill on b1, "?" b3
 *   bar 6  idle laptop, the other 20 hours go grey (b0→b2), Zzz
 *   bar 7  "ZZZ…" slams on b0, "…earning nothing." b2
 */
const PW = 548;
const PH = 660;
const PY = 230;
const PX = [96, 686, 1276];

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k0 = BAR.hook;

  const p1 = useBeatPunch(beatsIn(k0, k0 + 1), 0.025, 5);
  const p2 = useBeatPunch(beatsIn(k0 + 1, k0 + 2), 0.025, 5);
  const p3 = useBeatPunch(beatsIn(k0 + 2, k0 + 3), 0.025, 5);

  const zz = b(k0 + 3);
  const brk = interpolate(frame, [zz, b(k0 + 4)], [0, 1], clamp);
  const drain = 1 - 0.55 * interpolate(frame, [zz, zz + 8], [0, 1], clamp);
  const busy = interpolate(frame, [b(k0 + 1, 1), b(k0 + 1, 2)], [0, 4], clamp);
  const idle = interpolate(frame, [b(k0 + 2), b(k0 + 2, 2)], [0, 1], clamp);
  const typed = Math.floor(interpolate(frame, [b(k0), b(k0, 3)], [0, 4], clamp));

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Halftone opacity={0.07} gap={18} color={C.clay} />
      <AbsoluteFill style={{ transform: `scale(${1 + 0.05 * brk})`, filter: `saturate(${drain})` }}>
        <Pulse intensity={1.1} shake={0.35}>
          <Caption at={b(k0)} x={96} y={100} size={40} bg={C.claySoft} rot={-1.2} maxWidth={1000}>
            Meanwhile, on a $200 AI subscription…
          </Caption>

          {/* PANEL 1 — the subscription */}
          <ComicPanel at={b(k0)} x={PX[0]!} y={PY} w={PW} h={PH} rot={-1.6} bg="#F7CDB6" bg2="#e47444" from="up" punch={p1}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <Person x={120} y={480} s={1.15} body={C.clayDeep} mood="happy" pose="stand" />
              <Laptop x={350} y={430} s={0.95} lines={typed} />
              <ClayStar x={350} y={300} s={0.7} spin={frame * 2} />
              {frame >= b(k0, 1) ? <PriceTag x={330} y={140} s={0.95} rot={-8} text="$200/MO" /> : null}
            </svg>
            <SpeechBubble at={b(k0, 2)} x={24} y={36} w={250} h={120} tailX={90} tailY={220} size={30}>
              Claude Code Max. Worth it!
            </SpeechBubble>
            <Caption at={b(k0)} x={24} y={PH - 90} size={32}>
              Best AI coder money can buy.
            </Caption>
          </ComicPanel>

          {/* PANEL 2 — the hours */}
          <ComicPanel at={b(k0 + 1)} x={PX[1]!} y={PY + 16} w={PW} h={PH} rot={1.3} bg="#FFF3C4" bg2="#F0B90B" from="down" punch={p2}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <DayClock x={PW / 2} y={320} s={1.25} h={busy} />
            </svg>
            <Caption at={b(k0 + 1)} x={24} y={40} size={34} rot={-1.5} maxWidth={500}>
              You use it ~4 hours a day.
            </Caption>
            {frame >= b(k0 + 1, 3) ? (
              <Caption at={b(k0 + 1, 3)} x={24} y={PH - 100} size={32} rot={1} maxWidth={500} bg="#fff">
                …and the other twenty?
              </Caption>
            ) : null}
          </ComicPanel>

          {/* PANEL 3 — idle */}
          <ComicPanel at={b(k0 + 2)} x={PX[2]!} y={PY - 6} w={PW} h={PH} rot={-1.1} bg="#8a817a" bg2="#3a332e" from="right" punch={p3}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <DayClock x={150} y={190} s={0.7} h={4} idleFill={idle} />
              <Laptop x={PW / 2} y={420} s={1.05} idle />
              <Zzz x={400} y={250} s={1.1} t={frame - b(k0 + 2)} fill={C.claySoft} />
            </svg>
            <Caption at={b(k0 + 2, 1)} x={24} y={PH - 96} size={32} rot={1} maxWidth={500}>
              Paid for. Doing nothing.
            </Caption>
          </ComicPanel>
        </Pulse>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 60% at 50% 52%, rgba(8,9,11,0.8), rgba(8,9,11,0.45))", opacity: interpolate(frame, [zz, zz + 5], [0, 1], clamp) }} />
      <SpeedBurst cx={960} cy={520} from={zz} count={22} inner={260} spread={700} color={C.clay} opacity={0.6} width={8} seed="zzz" />
      <ComicText text="ZZZ…" from={zz} x={960} y={500} size={300} rotate={-8} skewX={-8} tiltX={8} fill={C.claySoft} variant="onomatopoeia" echoColor={C.clay} />
      <ComicText text="20 idle hours. Earning nothing." from={b(k0 + 3, 2)} x={960} y={830} size={70} rotate={-2} fill="#fff" />

      <InkFrame inset={22} width={5} opacity={0.9} color="#f4efe4" />

      <Sfx name="impact" at={b(k0)} volume={0.55} />
      <Sfx name="tick" at={b(k0, 1)} volume={0.6} />
      <Sfx name="tick" at={b(k0, 2)} volume={0.5} />
      <Sfx name="impact" at={b(k0 + 1)} volume={0.55} />
      <Sfx name="tick" at={b(k0 + 1, 1)} volume={0.6} />
      <Sfx name="tick" at={b(k0 + 1, 3)} volume={0.5} />
      <Sfx name="impact" at={b(k0 + 2)} volume={0.55} />
      <Sfx name="impact" at={zz} volume={0.9} />
      <Sfx name="tick" at={b(k0 + 3, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
