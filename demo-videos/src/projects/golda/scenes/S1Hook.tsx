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
  Person,
  Pulse,
  Sfx,
  SpeedBurst,
  SweatDrops,
  useBeatPunch,
  useSceneClock,
} from "../../../kit";
import { Candles, GoldBar, Padlock, StormCloud, UsdtStack } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S1 · HOOK (video bars 2–4; the file starts at bar 2, a soft break bar).
 *   bar 2 b0  panel 1 "Your treasury: 100% dollars."        (USDT stacks tick up b1–b3)
 *   bar 2 b1  panel 2 "Then the market turns."               (storm flashes, candles fall b1→b3)
 *   bar 2 b2  panel 3 "Gold is the safe haven… but by hand?"  (ingot behind a padlock, b3 "SLOW. OFF-CHAIN.")
 *   bar 3 b0  "NO HEDGE?!" slams · b2 "What if the vault moved itself?"
 */
const PW = 548;
const PH = 680;
const PY = 214;
const PX = [96, 686, 1276];

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.hook; // 2

  const p = useBeatPunch(beatsIn(k, k + 1), 0.022, 5);
  const candles = interpolate(frame, [b(k, 1), b(k, 3)], [0, 1], clamp);
  const stacks = frame >= b(k, 3) ? 4 : frame >= b(k, 2) ? 3 : frame >= b(k, 1) ? 2 : 1;
  const flash = Math.floor(frame / 3) % 5 === 0 ? 1 : 0;
  const brk = interpolate(frame, [b(k + 1), b(k + 2)], [0, 1], clamp);
  const drain = 1 - 0.55 * interpolate(frame, [b(k + 1), b(k + 1, 1)], [0, 1], clamp);
  const redTag = frame >= b(k, 3);

  return (
    <AbsoluteFill style={{ background: "#0d0b08" }}>
      <Halftone opacity={0.07} gap={18} />
      <AbsoluteFill style={{ transform: `scale(${1 + 0.06 * brk})`, filter: `saturate(${drain})` }}>
        <Pulse intensity={1.1} shake={0.6}>
          <Caption at={b(k)} x={96} y={84} size={40} bg={C.goldSoft} rot={-1.2} maxWidth={1100}>
            Meanwhile, in an on-chain treasury…
          </Caption>

          <ComicPanel at={b(k)} x={PX[0]!} y={PY} w={PW} h={PH} rot={-1.6} bg="#BFF0DC" bg2={C.usdt} from="up" punch={p}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <UsdtStack x={150} y={520} s={1} n={stacks} label="USDT" />
              <UsdtStack x={400} y={560} s={0.85} n={Math.max(1, stacks - 1)} />
              <Person x={300} y={400} s={1.1} body="#2d3a55" mood="happy" pose="hold" />
            </svg>
            <Caption at={b(k)} x={24} y={40} size={34} rot={0} maxWidth={500}>
              Your treasury: 100% dollars.
            </Caption>
          </ComicPanel>

          <ComicPanel at={b(k, 1)} x={PX[1]!} y={PY + 16} w={PW} h={PH} rot={1.3} bg="#C9CCD6" bg2="#5b6070" from="down">
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <StormCloud x={PW / 2} y={220} s={0.95} flash={flash} />
              <Candles x={PW / 2} y={500} s={1.1} p={candles} />
            </svg>
            <Caption at={b(k, 1)} x={24} y={40} size={34} rot={-1} maxWidth={500}>
              Then the market turns.
            </Caption>
          </ComicPanel>

          <ComicPanel at={b(k, 2)} x={PX[2]!} y={PY - 6} w={PW} h={PH} rot={-1.1} bg="#FFE9A8" bg2={C.gold} from="right">
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <GoldBar x={PW / 2} y={360} s={1.5} shine={flash} />
              <Padlock x={PW / 2 + 130} y={440} s={0.9} fill="#8b8f99" />
              <Person x={110} y={470} s={0.95} body="#2d3a55" mood="shock" pose="point" />
              {redTag ? <SweatDrops x={80} y={330} s={0.9} /> : null}
            </svg>
            <Caption at={b(k, 2)} x={24} y={40} size={34} rot={1} maxWidth={500}>
              Gold is the safe haven… by hand?
            </Caption>
            {redTag ? (
              <div
                style={{
                  position: "absolute",
                  left: 40,
                  bottom: 40,
                  padding: "10px 18px",
                  background: C.rose,
                  border: `4px solid ${INK}`,
                  boxShadow: `5px 5px 0 ${INK}`,
                  fontFamily: F.comic,
                  fontSize: 38,
                  color: INK,
                  transform: `rotate(-3deg) scale(${interpolate(frame, [b(k, 3), b(k, 3) + 5], [1.4, 1], clamp)})`,
                }}
              >
                SLOW. MANUAL. OFF-CHAIN.
              </div>
            ) : null}
          </ComicPanel>
        </Pulse>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 60% 60% at 50% 52%, rgba(40,26,6,0.85), rgba(8,7,5,0.5))",
          opacity: interpolate(frame, [b(k + 1), b(k + 1) + 5], [0, 1], clamp),
        }}
      />
      <SpeedBurst cx={960} cy={520} from={b(k + 1)} count={22} inner={260} spread={700} color={C.gold} opacity={0.6} width={8} seed="hedge" />
      <ComicText text="NO HEDGE?!" from={b(k + 1)} x={960} y={500} size={250} rotate={-7} skewX={-8} tiltX={8} fill={C.goldSoft} variant="onomatopoeia" echoColor={INK} />
      <ComicText text="What if the vault hedged itself?" from={b(k + 1, 2)} x={960} y={820} size={64} rotate={-2} fill={C.usdtSoft} />

      <InkFrame inset={22} width={5} opacity={0.9} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={0.55} />
      <Sfx name="impact" at={b(k, 1)} volume={0.55} />
      <Sfx name="impact" at={b(k, 2)} volume={0.55} />
      <Sfx name="tick" at={b(k, 3)} volume={0.6} />
      <Sfx name="impact" at={b(k + 1)} volume={0.95} />
      <Sfx name="tick" at={b(k + 1, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
