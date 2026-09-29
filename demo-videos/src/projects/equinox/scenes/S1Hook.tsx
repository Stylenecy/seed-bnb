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
  Vault,
} from "../../../kit";
import { CoinStack, CrashChart, Zzz } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S1 · HOOK (track bars 2–4; the video starts the file at bar 2).
 *   bar 2 b0  panel 1 "You borrowed against your BNB."   (vault + USDT stack)
 *   bar 2 b1  panel 2 "Then BNB crashes. At 3 AM."        (chart draws down b1→b3)
 *   bar 2 b2  panel 3 "…and you're asleep."               (Zzz, b3 "HEALTH ↓" tag)
 *   bar 3     BREAK — "LIQUIDATED?!" slams on the downbeat; b2 "Unless an agent is on watch."
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
  const chart = interpolate(frame, [b(k, 1), b(k, 3)], [0, 1], clamp);
  const brk = interpolate(frame, [b(k + 1), b(k + 2)], [0, 1], clamp);
  const drain = 1 - 0.5 * interpolate(frame, [b(k + 1), b(k + 1, 1)], [0, 1], clamp);
  const redTag = frame >= b(k, 3);

  return (
    <AbsoluteFill style={{ background: "#0d0d0f" }}>
      <Halftone opacity={0.07} gap={18} />
      <AbsoluteFill style={{ transform: `scale(${1 + 0.06 * brk})`, filter: `saturate(${drain})` }}>
        <Pulse intensity={1.1} shake={0.6}>
          <Caption at={b(k)} x={96} y={84} size={40} bg={C.lime} rot={-1.2} maxWidth={1000}>
            Meanwhile, in DeFi lending…
          </Caption>

          <ComicPanel at={b(k)} x={PX[0]!} y={PY} w={PW} h={PH} rot={-1.6} bg="#D9D2FF" bg2="#9181f5" from="up" punch={p}>
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <Vault x={170} y={400} s={1.05} label="BNB" dial={frame * 2} />
              <Person x={400} y={420} s={1.15} body={C.indigo} mood="happy" pose="stand" />
              <CoinStack x={400} y={610} s={0.9} n={3} label="USDT" />
            </svg>
            <Caption at={b(k)} x={24} y={40} size={34} rot={0} maxWidth={500}>
              You borrowed against your BNB.
            </Caption>
          </ComicPanel>

          <ComicPanel at={b(k, 1)} x={PX[1]!} y={PY + 16} w={PW} h={PH} rot={1.3} bg="#FFB8C4" bg2="#ff7a90" from="down">
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <circle cx={450} cy={210} r={40} fill="#FFF3B0" stroke={INK} strokeWidth={6} />
              <circle cx={470} cy={196} r={34} fill="#ff9aae" />
              <CrashChart x={PW / 2} y={400} p={chart} w={380} h={230} />
            </svg>
            <Caption at={b(k, 1)} x={24} y={40} size={34} rot={-1} maxWidth={500}>
              Then BNB crashes at 3 AM.
            </Caption>
          </ComicPanel>

          <ComicPanel at={b(k, 2)} x={PX[2]!} y={PY - 6} w={PW} h={PH} rot={-1.1} bg="#2b2f45" bg2="#14162a" from="right">
            <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
              <rect x={60} y={470} width={430} height={60} rx={12} fill="#6b59e8" stroke={INK} strokeWidth={6} />
              <Person x={250} y={400} s={1.15} rot={-78} body={C.indigo} mood="neutral" pose="stand" />
              <Zzz x={330} y={260} s={1} t={frame} />
              {redTag ? <SweatDrops x={170} y={300} s={1} /> : null}
            </svg>
            <Caption at={b(k, 2)} x={24} y={40} size={34} rot={1} maxWidth={420}>
              …and you are asleep.
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
                HEALTH FACTOR ↓↓↓
              </div>
            ) : null}
          </ComicPanel>
        </Pulse>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 60% 60% at 50% 52%, rgba(40,6,12,0.82), rgba(8,9,11,0.45))",
          opacity: interpolate(frame, [b(k + 1), b(k + 1) + 5], [0, 1], clamp),
        }}
      />
      <SpeedBurst cx={960} cy={540} from={b(k + 1)} count={22} inner={260} spread={700} color={C.rose} opacity={0.6} width={8} seed="liq" />
      <ComicText text="LIQUIDATED?!" from={b(k + 1)} x={960} y={520} size={250} rotate={-7} skewX={-8} tiltX={8} fill={C.rose} variant="onomatopoeia" echoColor={INK} />
      <ComicText text="Unless an agent is on watch." from={b(k + 1, 2)} x={960} y={830} size={64} rotate={-2} fill={C.lime} />

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
