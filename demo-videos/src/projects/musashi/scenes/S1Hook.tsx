import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { Caption, clamp, ComicPanel, ComicText, Halftone, INK, InkFrame, Person, Phone, Pulse, Sfx, SpeechBubble, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { InkDefs, TokenCoin, Washi } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S1 · HOOK (track bars 36–40; the file starts at bar 36).
 *   36 b0 caption + panel 1 (token rain)   b1 panel 2 (the trader + "100×!" DM)   b2 panel 3 (the pump)   b3 "APE IN!"
 *   37    pump keeps climbing, b2 "it's got VIBES." bubble
 *   38 b0 "RUG!" — the chart cliffs, coins grey out, the trader slumps
 *   39    DIP — ink wash floods the page: "TOO LATE." + README line
 */
const PW = 548;
const PH = 600;
const PY = 250;
const PX = [96, 686, 1276];
const TICKERS = ["MOON", "PEPE2", "CATX", "DOGE9", "APE", "100X", "WAGMI", "FROG", "GIGA", "BONK2", "LAMBO", "SAFU"];

/** Pump then cliff, in panel px. `p` reveals, `crash` 0..1 bends the tail down. */
const Pump: React.FC<{ p: number; crash: number }> = ({ p, crash }) => {
  const n = 12;
  const shown = Math.floor(p * n + 0.001);
  const w = 440;
  const h = 360;
  const cw = w / n;
  const mids = Array.from({ length: n }, (_, i) => {
    const up = h * 0.85 - i * i * 2.1 - i * 6;
    const fall = i >= 8 ? crash * (i - 7) * 95 : 0;
    return Math.min(h - 10, up + fall);
  });
  return (
    <g transform="translate(54 70)">
      <line x1={0} y1={h} x2={w} y2={h} stroke={INK} strokeWidth={5} />
      {mids.slice(0, shown).map((m, i) => {
        const prev = i > 0 ? mids[i - 1]! : m + 14;
        const down = m > prev;
        const top = Math.min(prev, m);
        const bh = Math.max(12, Math.abs(m - prev));
        return (
          <g key={i}>
            <line x1={i * cw + cw / 2} y1={top - 12} x2={i * cw + cw / 2} y2={top + bh + 12} stroke={INK} strokeWidth={4} />
            <rect x={i * cw + cw * 0.16} y={top} width={cw * 0.68} height={bh} fill={down ? C.rose : C.green} stroke={INK} strokeWidth={4} rx={2} />
          </g>
        );
      })}
    </g>
  );
};

export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.hook; // 36

  const p = useBeatPunch(beatsIn(k, k + 3), 0.02, 5);
  const rug = frame >= b(k + 2);
  const crash = interpolate(frame, [b(k + 2), b(k + 2) + 8], [0, 1], clamp);
  const pumpP = interpolate(frame, [b(k, 2), b(k + 2)], [0.25, 1], clamp);
  const dip = interpolate(frame, [b(k + 3), b(k + 3) + 6], [0, 1], clamp);
  const shake = rug && frame < b(k + 2) + 10 ? Math.sin(frame * 3.1) * 10 * (1 - (frame - b(k + 2)) / 10) : 0;
  const grey = rug ? 1 : 0;

  return (
    <AbsoluteFill style={{ background: C.washi }}>
      <Washi />
      <Halftone opacity={0.06} gap={18} color={C.crimsonDeep} />
      <AbsoluteFill style={{ transform: `translateX(${shake}px) scale(${1 + 0.06 * dip})` }}>
        <Pulse intensity={1.1} shake={0.4}>
          <Caption at={b(k)} x={96} y={96} size={42} bg="#fff" rot={-1.2} maxWidth={1300}>
            A thousand new tokens. Every. Single. Day.
          </Caption>

          {/* 1 — token rain */}
          <ComicPanel at={b(k)} x={PX[0]!} y={PY} w={PW} h={PH} rot={-1.6} bg={C.amberSoft} bg2={C.amber} from="up" punch={p}>
            <svg width={PW} height={PH}>
              {TICKERS.map((t, i) => {
                const col = i % 4;
                const speed = 7 + random(`sp${i}`) * 6;
                const y0 = -120 - random(`y${i}`) * 500;
                const yy = ((y0 + frame * speed) % (PH + 240)) - 60;
                return (
                  <TokenCoin
                    key={t}
                    x={70 + col * 136 + random(`x${i}`) * 20}
                    y={yy}
                    r={52}
                    label={t}
                    fill={grey ? "#9a9a9a" : [C.amberHi, C.green, "#8ecbff", "#ffb4c8"][i % 4]}
                    rot={(frame * (i % 2 ? 2 : -2)) % 360}
                  />
                );
              })}
            </svg>
          </ComicPanel>

          {/* 2 — the trader */}
          <ComicPanel at={b(k, 1)} x={PX[1]!} y={PY + 16} w={PW} h={PH} rot={1.2} bg="#ffe1d6" bg2={C.crimson} from="down" punch={p}>
            <svg width={PW} height={PH}>
              <Person x={200} y={430} s={1.9} body={C.blue} mood={rug ? "sad" : "happy"} pose={rug ? "slump" : "hold"} />
              <Phone x={330} y={330} s={1.5} rot={10} screen={rug ? C.rose : C.green} label={rug ? "RUG" : "100×!"} />
            </svg>
          </ComicPanel>

          {/* 3 — the pump */}
          <ComicPanel at={b(k, 2)} x={PX[2]!} y={PY} w={PW} h={PH} rot={-1} bg="#fff6e0" bg2={C.washiDeep} from="right" punch={p}>
            <svg width={PW} height={PH}>
              <InkDefs />
              <Pump p={pumpP} crash={crash} />
              <text x={30} y={60} fontFamily={F.comic} fontSize={44} fill={INK}>
                $MOON / BNB
              </text>
            </svg>
          </ComicPanel>

          <SpeechBubble at={b(k, 1) + 4} x={720} y={170} w={420} h={130} tailX={200} tailY={150} size={36}>
            "Telegram says 100×!"
          </SpeechBubble>
          <SpeechBubble at={b(k + 1, 2)} x={1370} y={150} w={400} h={120} tailX={120} tailY={140} size={36}>
            "It's got VIBES."
          </SpeechBubble>
        </Pulse>
      </AbsoluteFill>

      <ComicText text="APE IN!" from={b(k, 3)} x={960} y={930} size={130} rotate={-6} fill={C.green} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2)} />
      <SpeedBurst cx={1540} cy={560} from={b(k + 2)} count={20} inner={180} spread={600} color={C.crimson} opacity={0.6} width={8} seed="rug" fade />
      <ComicText text="RUG!" from={b(k + 2)} x={1500} y={560} size={260} rotate={10} skewX={-6} fill={C.rose} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3)} />

      {/* bar 39 dip: ink floods the page */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 65% at 50% 50%, rgba(11,9,7,0.94), rgba(17,5,5,0.97))`,
          opacity: dip,
        }}
      />
      <ComicText text="TOO LATE." from={b(k + 3)} x={960} y={470} size={250} rotate={-5} skewX={-8} tiltX={6} fill={C.washi} variant="onomatopoeia" echoColor={C.crimson} />
      {frame >= b(k + 3, 2) ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 700,
            textAlign: "center",
            fontFamily: F.display,
            fontStyle: "italic",
            fontSize: 54,
            color: C.washi,
            opacity: interpolate(frame, [b(k + 3, 2), b(k + 3, 2) + 8], [0, 1], clamp),
          }}
        >
          If everyone already knows about it, <span style={{ color: C.amberHi }}>you're too late.</span>
        </div>
      ) : null}

      <InkFrame inset={22} width={5} opacity={0.9} color={INK} />

      <Sfx name="impact" at={b(k)} volume={0.55} />
      <Sfx name="impact" at={b(k, 1)} volume={0.55} />
      <Sfx name="impact" at={b(k, 2)} volume={0.55} />
      <Sfx name="impact" at={b(k, 3)} volume={0.7} />
      <Sfx name="tick" at={b(k + 1)} volume={0.45} />
      <Sfx name="tick" at={b(k + 1, 2)} volume={0.55} />
      <Sfx name="impact" at={b(k + 2)} volume={1} />
      <Sfx name="whoosh" at={b(k + 3)} volume={0.5} />
      <Sfx name="impact" at={b(k + 3)} volume={0.8} />
      <Sfx name="tick" at={b(k + 3, 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
