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
  LockedEnvelope,
  Person,
  Phone,
  PremiumBg,
  Pulse,
  Robot,
  Sfx,
  useBeatPunch,
  useSceneClock,
  Vault,
} from "../../../kit";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S3 · HOW IT WORKS (bars 7–12). Slides in on the bar-7 break with the title;
 * then one comic step per bar, each landing on its downbeat:
 *   bar 8  SEND        sender deposits 10 USDT + encrypted claim key
 *   bar 9  HOLD        IPayPool vault locks it           ("LOCKED!")
 *   bar 10 AUTO-CLAIM  relayer bot pays the gas          ("ZOOM!")
 *   bar 11 RECEIVE     recipient gets 9.95, fee → jar    ("CLAIMED!")
 * On beat 2 of each step bar, an ink arrow draws to the next panel and a coin
 * hops across on beats 2→3.
 */
const PW = 390;
const PH = 700;
const GAP = 66;
const X0 = (1920 - (4 * PW + 3 * GAP)) / 2;
const PY = 262;
const px = (i: number) => X0 + i * (PW + GAP);

type Step = { n: string; title: string; body: string; bg: string; bg2: string };
const STEPS: Step[] = [
  { n: "1", title: "Send", body: "Deposit 10 USDT with a claim key encrypted for your friend.", bg: "#FFB3C7", bg2: "#F2789B" },
  { n: "2", title: "Hold", body: "IPayPool holds it. Only the recipient's key unlocks it.", bg: "#C9D2E3", bg2: "#8E9BB5" },
  { n: "3", title: "Auto-claim", body: "The relayer decrypts it and calls sponsorClaim, paying the gas.", bg: "#A6F1FF", bg2: "#4FC7DB" },
  { n: "4", title: "Receive", body: "Your friend gets 9.95 USDT. The 0.5% fee goes to the treasury.", bg: "#FFEB8A", bg2: "#9ADB6A" },
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
          color: C.yellow,
          fontFamily: F.comic,
          fontSize: 36,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {s.n}
      </span>
      <span style={{ fontFamily: F.comic, fontSize: 52, color: INK, letterSpacing: "0.02em", textTransform: "uppercase" }}>{s.title}</span>
    </div>
    <div
      style={{
        marginTop: 10,
        background: "#fff",
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
  const k = BAR.how; // 7 — the break; steps on 8..11
  const punches = [0, 1, 2, 3].map((i) => useBeatPunch(beatsIn(k + 1 + i, k + 2 + i), 0.022, 5)); // eslint-disable-line react-hooks/rules-of-hooks

  // Coin hop across the gap after step i (beats 2→3 of bar k+1+i).
  const hop = (i: number) => interpolate(frame, [b(k + 1 + i, 2), b(k + 1 + i, 3)], [0, 1], clamp);
  const dial = interpolate(frame, [b(k + 2), b(k + 2, 2)], [0, 270], clamp);
  const flame = 0.6 + 0.4 * Math.sin(frame * 1.3);
  const bot = interpolate(frame, [b(k + 3), b(k + 3, 1)], [-140, 0], clamp);

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(94,240,255,0.14)" glowB="rgba(232,69,126,0.16)" glow="top" floor={0.35} />
      <Halftone opacity={0.05} gap={18} />

      {/* Title on the break */}
      <ComicText text="How it works" from={b(k)} x={960} y={128} size={112} rotate={-2} skewX={-5} fill={C.yellow} stagger={1} />
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
        four steps · the receiver never needs gas
      </div>

      <Pulse intensity={0.9} shake={0.5}>
        {/* dashed ghost slots for steps not yet revealed */}
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
                border: "4px dashed rgba(244,239,228,0.22)",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: F.comic,
                fontSize: 160,
                color: "rgba(244,239,228,0.12)",
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
                  <Person x={120} y={250} s={1.05} body={C.pink} mood="happy" pose="hold">
                    <Phone x={0} y={-8} s={0.55} screen="#141414" label="10" labelColor={C.yellow} />
                  </Person>
                  {frame >= b(k + 1, 1) ? <LockedEnvelope x={284} y={130} s={0.95} rot={-8} /> : null}
                  {frame >= b(k + 1, 1) ? <CoinDot cx={290} cy={250} r={36} label="10" rotate={-8} /> : null}
                </>
              ) : null}
              {i === 1 ? <Vault x={PW / 2} y={236} s={1.05} dial={dial} label="IPayPool" /> : null}
              {i === 2 ? (
                <g transform={`translate(${bot} 0)`}>
                  <Robot x={PW / 2} y={230} s={1.2} flame={flame} fill="#B7C2D6" visor={C.teal} />
                </g>
              ) : null}
              {i === 3 ? (
                <>
                  <Person x={130} y={250} s={1.05} body="#2F7BD9" skin="#F2C49B" mood="happy" pose="cheer" wave={Math.sin(frame * 0.5) * 8} />
                  {frame >= b(k + 4, 1) ? <CoinDot cx={290} cy={150} r={44} label="9.95" /> : null}
                  {frame >= b(k + 4, 2) ? <Jar x={300} y={300} s={0.8} label="0.05" /> : null}
                </>
              ) : null}
            </svg>
            <StepLabel s={s} />
          </ComicPanel>
        ))}

        {/* Arrows + coin hops between panels. */}
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {[0, 1, 2].map((i) => {
            const x1 = px(i) + PW - 14;
            const x2 = px(i + 1) + 14;
            const y = PY + 240;
            const h = hop(i);
            return (
              <g key={i}>
                <InkArrow x1={x1} y1={y} x2={x2} y2={y} at={b(k + 1 + i, 2)} dur={6} bend={-46} color={C.yellow} width={8} />
                {h > 0 && h < 1 ? <CoinDot cx={x1 + (x2 - x1) * h} cy={y - 34 - Math.sin(h * Math.PI) * 70} r={22} rotate={h * 180} /> : null}
              </g>
            );
          })}
        </svg>
      </Pulse>

      {/* Onomatopoeia on the step downbeats (steps 2–4). */}
      <ComicText text="LOCKED!" from={b(k + 2, 1)} x={px(1) + PW / 2} y={PY + 30} size={78} rotate={-8} fill={C.yellow} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3)} />
      <ComicText text="ZOOM!" from={b(k + 3, 1)} x={px(2) + PW / 2} y={PY + 30} size={86} rotate={7} fill="#fff" variant="onomatopoeia" echoColor={C.teal} exitAt={b(k + 4) - 2} />
      <ComicText text="CLAIMED!" from={b(k + 4, 1)} x={px(3) + PW / 2} y={PY + 30} size={76} rotate={-6} fill={C.green} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      {[0, 1, 2, 3].map((i) => (
        <Sfx key={`im${i}`} name="impact" at={b(k + 1 + i)} volume={0.55} />
      ))}
      {[0, 1, 2].map((i) => (
        <Sfx key={`wh${i}`} name="tick" at={b(k + 1 + i, 2)} volume={0.6} />
      ))}
      <Sfx name="chime" at={b(k + 4, 1)} volume={0.6} />
    </AbsoluteFill>
  );
};
