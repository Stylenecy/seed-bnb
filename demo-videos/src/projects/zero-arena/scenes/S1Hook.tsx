import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Caption, clamp, ComicPanel, ComicText, Halftone, INK, InkFrame, Pulse, Robot, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { BragCard, Stamp } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S1 · HOOK (track bars 1–3; the file starts at bar 1).
 *   bar 1 b0  caption + panel 1 "+847% ROI"   b1 panel 2 "91% WIN RATE"   b2 panel 3 "12× IN 30 DAYS"
 *         b3  "trust me." bubble
 *   bar 2     BREAK — b0 "NO PROOF" stamps slam on all three, b2 "PROVE IT." + subline
 */
const PW = 548;
const PH = 640;
const PY = 230;
const PX = [96, 686, 1276];

const BRAGS = [
  { handle: "@alpha_bot", big: "+847%", sub: "ROI this month", tint: C.emerald, bg: "#C9F7E4", bg2: C.emerald, rot: -1.6, from: "up" as const },
  { handle: "@gpt_trader", big: "91%", sub: "win rate, no cap", tint: C.violet, bg: "#E2D9FF", bg2: C.violet, rot: 1.3, from: "down" as const },
  { handle: "@moon_agent", big: "12×", sub: "in 30 days. trust.", tint: C.cyan, bg: "#CDEFFF", bg2: C.cyan, rot: -1.1, from: "right" as const },
];

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.hook; // 1

  const p = useBeatPunch(beatsIn(k, k + 1), 0.022, 5);
  const brk = interpolate(frame, [b(k + 1), b(k + 2)], [0, 1], clamp);
  const drain = 1 - 0.55 * interpolate(frame, [b(k + 1, 2), b(k + 1, 2) + 8], [0, 1], clamp);
  const stampP = (i: number) => interpolate(frame, [b(k + 1) + i * 3, b(k + 1) + i * 3 + 5], [1.8, 1], clamp);

  return (
    <AbsoluteFill style={{ background: "#0d0d12" }}>
      <Halftone opacity={0.07} gap={18} color={C.emerald} />
      <AbsoluteFill style={{ transform: `scale(${1 + 0.05 * brk})`, filter: `saturate(${drain})` }}>
        <Pulse intensity={1.1} shake={0.5}>
          <Caption at={b(k)} x={96} y={96} size={40} bg={C.emeraldSoft} rot={-1.2} maxWidth={1100}>
            Meanwhile, on the AI-trading timeline…
          </Caption>

          {BRAGS.map((g, i) => (
            <ComicPanel key={g.handle} at={b(k, i)} x={PX[i]!} y={PY + (i === 1 ? 16 : 0)} w={PW} h={PH} rot={g.rot} bg={g.bg} bg2={g.bg2} from={g.from} punch={i === 0 ? p : 1}>
              <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
                <BragCard x={PW / 2} y={210} s={1.45} handle={g.handle} big={g.big} sub={g.sub} tint={g.tint} />
                <Robot x={PW / 2} y={500} s={1.05} fill="#B7C2D6" visor={g.tint} flame={0.5 + 0.4 * Math.sin(frame * 1.2 + i)} />
                {frame >= b(k + 1) ? (
                  <g transform={`translate(${PW / 2} 250) scale(${stampP(i)})`}>
                    <Stamp x={0} y={0} rot={[-12, 9, -7][i]} text="NO PROOF" color={C.rose} />
                  </g>
                ) : null}
              </svg>
            </ComicPanel>
          ))}

          {frame >= b(k, 3) ? (
            <div
              style={{
                position: "absolute",
                left: 1330,
                top: 160,
                padding: "14px 26px",
                background: "#fff",
                border: `5px solid ${INK}`,
                borderRadius: 40,
                boxShadow: `6px 6px 0 ${INK}`,
                fontFamily: F.comic,
                fontSize: 44,
                color: INK,
                transform: `rotate(4deg) scale(${interpolate(frame, [b(k, 3), b(k, 3) + 5], [0.4, 1], clamp)})`,
              }}
            >
              …trust me, bro.
            </div>
          ) : null}
        </Pulse>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 60% 60% at 50% 52%, rgba(10,10,15,0.9), rgba(8,9,11,0.5))",
          opacity: interpolate(frame, [b(k + 1, 2), b(k + 1, 2) + 5], [0, 1], clamp),
        }}
      />
      <SpeedBurst cx={960} cy={500} from={b(k + 1, 2)} count={22} inner={260} spread={700} color={C.emerald} opacity={0.55} width={8} seed="prove" />
      <ComicText text="PROVE IT." from={b(k + 1, 2)} x={960} y={480} size={260} rotate={-6} skewX={-8} tiltX={8} fill={C.emerald} variant="onomatopoeia" echoColor={INK} />
      <ComicText text="No run log. No hash. No public record." from={b(k + 1, 3)} x={960} y={790} size={58} rotate={-2} fill="#fff" />

      <InkFrame inset={22} width={5} opacity={0.9} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={0.55} />
      <Sfx name="impact" at={b(k, 1)} volume={0.55} />
      <Sfx name="impact" at={b(k, 2)} volume={0.55} />
      <Sfx name="tick" at={b(k, 3)} volume={0.6} />
      <Sfx name="impact" at={b(k + 1)} volume={0.8} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.95} />
      <Sfx name="tick" at={b(k + 1, 3)} volume={0.5} />
    </AbsoluteFill>
  );
};
