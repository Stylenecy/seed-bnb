import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Caption, clamp, ComicPanel, ComicText, Halftone, InkFrame, Person, Pulse, Sfx, SpeechBubble, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { Board, House, PopBall } from "../art";
import { C } from "../theme";
import { BAR } from "../timeline";

/**
 * S1 · HOOK (track bars 8–12). Frame 0 is already the bar-8 drop, so the first
 * panel slams on the very first frame. One panel per bar, details on beats:
 *   bar 8   a player + paper card; balls 7 · 12 · 3 drop on b1–b3, bubble b2
 *   bar 9   THE HOUSE draws from a hidden drum; eyes dart on every beat
 *   bar 10  "HOUSE WINS" — the player can't check a thing
 *   bar 11  BREAK: "RIGGED?!" slams on b0, sub-line on b2
 */
const PW = 548;
const PH = 640;
const PY = 240;
const PX = [96, 686, 1276];
const CARD = [7, 1, 12, 20, 3, 14, 9, 25, 5, 17, 2, 22, 11, 8, 19, 6, 24, 13, 4, 16, 21, 10, 18, 23, 15];

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k0 = BAR.hook; // 8

  const p1 = useBeatPunch(beatsIn(k0, k0 + 1), 0.025, 5);
  const p2 = useBeatPunch(beatsIn(k0 + 1, k0 + 2), 0.025, 5);
  const p3 = useBeatPunch(beatsIn(k0 + 2, k0 + 3), 0.025, 5);

  const rig = b(k0 + 3);
  const dim = interpolate(frame, [rig, rig + 5], [0, 1], clamp);
  const zoom = interpolate(frame, [rig, b(k0 + 4)], [0, 1], clamp);
  // eyes dart left/right on every beat of bar 9, spin the drum
  const beatIdx = beatsIn(k0 + 1, k0 + 3).filter((t) => frame >= t).length;
  const look = beatIdx % 2 === 0 ? -1 : 1;
  const spin = interpolate(frame, [b(k0 + 1), b(k0 + 3)], [0, 540], clamp);
  const marked = [7, 12, 3].filter((_, i) => frame >= b(k0, i + 1) + 6);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Halftone opacity={0.08} gap={18} color={C.neon} />
      <AbsoluteFill style={{ transform: `scale(${1 + 0.05 * zoom})`, filter: `saturate(${1 - 0.5 * dim})` }}>
        <Pulse intensity={1.2} shake={0.4}>
          <Caption at={b(k0)} x={96} y={96} size={40} bg={C.neonSoft} rot={-1.2} maxWidth={1100}>
            Friday night. Online bingo. Real money on the line…
          </Caption>

          {/* PANEL 1 — the player */}
          <ComicPanel at={b(k0)} x={PX[0]!} y={PY} w={PW} h={PH} rot={-1.6} bg="#bfe0ff" bg2="#3d8bff" from="up" punch={p1}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <Person x={150} y={470} s={1.15} body={C.ballI} mood="happy" pose="hold" />
              <Board x={380} y={420} s={0.62} nums={CARD} marked={marked} light cell={52} rot={6} />
            </svg>
            <PopBall at={b(k0, 1)} x={330} y={110} size={104} label={7} />
            <PopBall at={b(k0, 2)} x={440} y={150} size={104} label={12} />
            <PopBall at={b(k0, 3)} x={220} y={140} size={104} label={3} />
            <SpeechBubble at={b(k0, 2)} x={20} y={180} w={230} h={100} tailX={120} tailY={150} size={30}>
              One more!
            </SpeechBubble>
          </ComicPanel>

          {/* PANEL 2 — the house */}
          <ComicPanel at={b(k0 + 1)} x={PX[1]!} y={PY + 16} w={PW} h={PH} rot={1.3} bg="#e2d0ff" bg2="#8a5cc7" from="down" punch={p2}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <House x={PW / 2} y={360} s={1.02} look={look} spin={spin} grin={0.4} />
            </svg>
            <Caption at={b(k0 + 1)} x={24} y={30} size={32} rot={-1.5} maxWidth={500}>
              The numbers? Drawn on THEIR server.
            </Caption>
            {frame >= b(k0 + 1, 3) ? (
              <Caption at={b(k0 + 1, 3)} x={24} y={PH - 92} size={30} rot={1} maxWidth={500} bg="#fff">
                Nobody sees the drum.
              </Caption>
            ) : null}
          </ComicPanel>

          {/* PANEL 3 — house wins */}
          <ComicPanel at={b(k0 + 2)} x={PX[2]!} y={PY - 6} w={PW} h={PH} rot={-1.1} bg="#ffc2c2" bg2="#e0604f" from="right" punch={p3}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <House x={370} y={330} s={0.8} look={-1} grin={1} spin={spin} sign="HOUSE WINS" />
              <Person x={120} y={470} s={1.1} body={C.ballI} mood="shock" pose="slump" />
            </svg>
            <SpeechBubble at={b(k0 + 2, 1)} x={20} y={40} w={250} h={110} tailX={100} tailY={250} size={28} shout>
              But I had a line?!
            </SpeechBubble>
            <Caption at={b(k0 + 2, 2)} x={24} y={PH - 92} size={30} rot={1} maxWidth={500}>
              Can't check. Can't prove it.
            </Caption>
          </ComicPanel>
        </Pulse>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 60% at 50% 52%, rgba(1,8,40,0.82), rgba(1,8,40,0.5))", opacity: dim }} />
      <SpeedBurst cx={960} cy={520} from={rig} count={24} inner={260} spread={720} color={C.danger} opacity={0.6} width={8} seed="rig" />
      <ComicText text="RIGGED?!" from={rig} x={960} y={500} size={290} rotate={-7} skewX={-8} tiltX={8} fill={C.ballI} variant="onomatopoeia" echoColor={C.full} burst={C.full} />
      <ComicText text="Trust the house? Hard pass." from={b(k0 + 3, 2)} x={960} y={840} size={72} rotate={-2} fill="#fff" />

      <InkFrame inset={22} width={5} opacity={0.9} color="#f4efe4" />

      <Sfx name="impact" at={b(k0)} volume={0.7} />
      {[1, 2, 3].map((i) => (
        <Sfx key={i} name="tick" at={b(k0, i)} volume={0.6} />
      ))}
      <Sfx name="impact" at={b(k0 + 1)} volume={0.55} />
      <Sfx name="tick" at={b(k0 + 1, 2)} volume={0.4} />
      <Sfx name="impact" at={b(k0 + 2)} volume={0.55} />
      <Sfx name="tick" at={b(k0 + 2, 1)} volume={0.5} />
      <Sfx name="impact" at={rig} volume={0.95} />
      <Sfx name="tick" at={b(k0 + 3, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
