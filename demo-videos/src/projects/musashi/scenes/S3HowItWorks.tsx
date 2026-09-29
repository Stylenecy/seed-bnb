import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ComicPanel, ComicText, Halftone, INK, InkArrow, InkFrame, Pulse, Sfx, useBeatPunch, useSceneClock } from "../../../kit";
import { BrushStroke, Enso, Hanko, InkDefs, Kanji, Samurai, TokenCoin, Torii, Washi } from "../art";
import { C, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S3 · HOW IT WORKS (bars 43–48). Slides in on bar 43 with the brush title;
 * one scroll panel per bar, each the real engine/contract step:
 *   44  7 GATES      fail-fast elimination (Go engine)            "CUT!"
 *   45  DEBATE       4 specialists → bull vs bear → judge          "CLASH!"
 *   46  STRIKE       ConvictionLog.logStrike(agent, token, conv)   "SLASH!"
 *   47  REPUTATION   recordOutcome → reputation, agent = MusashiINFT "ON-CHAIN!"
 */
const PW = 390;
const PH = 600;
const GAP = 60;
const X0 = (1920 - (4 * PW + 3 * GAP)) / 2;
const PY = 350;
const px = (i: number) => X0 + i * (PW + GAP);

type Step = { n: string; title: string; body: string; bg: string; bg2: string };
const STEPS: Step[] = [
  { n: "1", title: "7 Gates", body: "Safety, liquidity, wallets, social, narrative, timing, cross-check. Fail one: cut.", bg: "#fff6e0", bg2: C.amberSoft },
  { n: "2", title: "Debate", body: "4 specialists read the survivors. Bull vs bear argue before a judge.", bg: "#ffe1d6", bg2: "#f2a48f" },
  { n: "3", title: "Strike", body: "A high-conviction call is logged: ConvictionLog.logStrike().", bg: "#fde7c2", bg2: C.amber },
  { n: "4", title: "Reputation", body: "recordOutcome() scores it. Track record lives on the agent's INFT.", bg: "#e9f2e6", bg2: C.greenSoft },
];

const StepLabel: React.FC<{ s: Step }> = ({ s }) => (
  <div style={{ position: "absolute", left: 20, right: 20, bottom: 20 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span
        style={{
          width: 50,
          height: 50,
          borderRadius: 999,
          background: C.crimson,
          border: `4px solid ${INK}`,
          color: C.washi,
          fontFamily: F.comic,
          fontSize: 32,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {s.n}
      </span>
      <span style={{ fontFamily: F.comic, fontSize: 50, color: INK, letterSpacing: "0.02em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{s.title}</span>
    </div>
    <div
      style={{
        marginTop: 10,
        background: "#fffdf6",
        border: `4px solid ${INK}`,
        boxShadow: `5px 5px 0 ${INK}`,
        padding: "10px 14px",
        fontFamily: F.sans,
        fontWeight: 600,
        fontSize: 23,
        lineHeight: 1.25,
        color: INK,
        minHeight: 112,
      }}
    >
      {s.body}
    </div>
  </div>
);

export const S3HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.how; // 43
  const AT = [b(k + 1), b(k + 2), b(k + 3), b(k + 4)];
  const punches = [0, 1, 2, 3].map((i) => useBeatPunch(beatsIn(k + 1 + i, k + 2 + i), 0.022, 5)); // eslint-disable-line react-hooks/rules-of-hooks

  // gate panel: coins try the gates one per beat, most are cut
  const gateHit = (j: number) => frame >= b(k + 1, j);
  const strike = interpolate(frame, [b(k + 3, 1) - 3, b(k + 3, 1) + 3], [0, 1], clamp);
  const enso = interpolate(frame, [b(k + 4), b(k + 4, 2)], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ background: C.washi }}>
      <Washi />
      <Halftone opacity={0.05} gap={20} color={C.crimsonDeep} />

      <Pulse intensity={0.9} shake={0.25}>
        {/* title */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <InkDefs />
          <BrushStroke x={470} y={70} w={980} h={150} at={b(k)} dur={7} color={INK} id="t3" />
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, top: 96, textAlign: "center", fontFamily: F.display, fontWeight: 600, fontSize: 84, color: C.washi, opacity: interpolate(frame, [b(k) + 4, b(k) + 10], [0, 1], clamp) }}>
          The way of the <i style={{ color: C.amberHi }}>strike</i>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", fontFamily: F.sans, fontWeight: 700, fontSize: 34, color: INK, opacity: interpolate(frame, [b(k, 1), b(k, 1) + 8], [0, 1], clamp) }}>
          A thousand tokens watched. Only the survivors become a STRIKE.
        </div>
        {frame >= b(k, 2) ? (
          <div style={{ position: "absolute", left: 64, top: 70, transform: `scale(${interpolate(frame, [b(k, 2), b(k, 2) + 5], [1.8, 1], clamp)})` }}>
            <Kanji text="道" size={150} color={C.crimson} vertical />
          </div>
        ) : null}
        {frame >= b(k, 2) ? (
          <div style={{ position: "absolute", right: 64, top: 70, transform: `scale(${interpolate(frame, [b(k, 2), b(k, 2) + 5], [1.8, 1], clamp)})` }}>
            <Kanji text="斬" size={150} color={INK} vertical />
          </div>
        ) : null}

        {STEPS.map((s, i) => (
          <ComicPanel key={s.n} at={AT[i]!} x={px(i)} y={PY + (i % 2 ? 14 : 0)} w={PW} h={PH} rot={[-1.4, 1.2, -1, 1.4][i]} bg={s.bg} bg2={s.bg2} from={i % 2 ? "down" : "up"} punch={punches[i]}>
            <svg width={PW} height={PH}>
              <InkDefs />
              {i === 0 ? (
                <g>
                  <Torii x={PW / 2} y={250} w={230} />
                  {[0, 1, 2, 3].map((j) => {
                    const cut = j !== 3 && gateHit(j);
                    const t = interpolate(frame, [b(k + 1, j) - 6, b(k + 1, j)], [0, 1], clamp);
                    return frame >= b(k + 1, j) - 6 ? (
                      <g key={j} opacity={cut ? interpolate(frame, [b(k + 1, j) + 4, b(k + 1, j) + 10], [1, 0.25], clamp) : 1}>
                        <TokenCoin x={40 + t * (PW / 2 - 40) + j * 6} y={200 + j * 4} r={34} label={["RUG", "HNY", "MINT", "OK"][j]!} fill={j === 3 ? C.gold : "#bdbdbd"} rot={cut ? 30 : 0} />
                        {cut ? <path d={`M${PW / 2 - 40} ${160 + j * 4} L${PW / 2 + 40} ${240 + j * 4}`} stroke={C.crimson} strokeWidth={9} strokeLinecap="round" /> : null}
                      </g>
                    ) : null;
                  })}
                  <text x={PW / 2} y={62} textAnchor="middle" fontFamily={F.comic} fontSize={36} fill={INK}>
                    GATE 1 → 7 · FAIL-FAST
                  </text>
                </g>
              ) : null}
              {i === 1 ? (
                <g>
                  {[0, 1, 2, 3].map((j) => (
                    <g key={j} opacity={frame >= b(k + 2) + j * 3 ? 1 : 0}>
                      <circle cx={70 + j * 83} cy={70} r={30} fill={[C.amberHi, "#8ecbff", C.green, "#ffb4c8"][j]} stroke={INK} strokeWidth={5} />
                      <path d={`M${70 + j * 83 - 42} ${62} L${70 + j * 83} ${28} L${70 + j * 83 + 42} ${62} Z`} fill={INK} />
                    </g>
                  ))}
                  <TokenCoin x={PW / 2 - 80 + interpolate(frame, [b(k + 2, 1), b(k + 2, 2)], [-40, 20], clamp)} y={210} r={58} label="BULL" fill={C.green} rot={-8} />
                  <TokenCoin x={PW / 2 + 80 - interpolate(frame, [b(k + 2, 1), b(k + 2, 2)], [-40, 20], clamp)} y={210} r={58} label="BEAR" fill={C.rose} rot={8} />
                  {frame >= b(k + 2, 2) ? (
                    <g transform={`translate(${PW / 2} 210)`}>
                      <path d="M-70 -70 L70 70 M70 -70 L-70 70" stroke="#e8edf2" strokeWidth={10} strokeLinecap="round" />
                      <path d="M-70 -70 L70 70 M70 -70 L-70 70" stroke={INK} strokeWidth={3} strokeLinecap="round" />
                    </g>
                  ) : null}
                </g>
              ) : null}
              {i === 2 ? (
                <g>
                  <Samurai x={PW / 2 - 50} y={210} s={0.72} strike={strike} />
                  {frame >= b(k + 3, 1) ? <path d="M40 330 L360 60" stroke={C.crimson} strokeWidth={10} strokeLinecap="round" opacity={interpolate(frame, [b(k + 3, 1), b(k + 3, 1) + 12], [1, 0.3], clamp)} /> : null}
                </g>
              ) : null}
              {i === 3 ? (
                <g>
                  <Enso x={PW / 2} y={190} r={120} p={enso} color={INK} width={22} />
                  <text x={PW / 2} y={175} textAnchor="middle" fontFamily={F.comic} fontSize={46} fill={INK} opacity={frame >= b(k + 4, 1) ? 1 : 0}>
                    W / L
                  </text>
                  <text x={PW / 2} y={228} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={30} fill={C.crimson} opacity={frame >= b(k + 4, 2) ? 1 : 0}>
                    ± bps
                  </text>
                </g>
              ) : null}
            </svg>
            <StepLabel s={s} />
          </ComicPanel>
        ))}

        {[0, 1, 2].map((i) => (
          <svg key={i} width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <InkArrow x1={px(i) + PW - 10} y1={PY + 190} x2={px(i + 1) + 16} y2={PY + 190} at={AT[i + 1]! - 6} dur={6} bend={-30} color={C.crimson} width={7} />
          </svg>
        ))}
      </Pulse>

      <ComicText text="CUT!" from={b(k + 1, 2)} x={px(0) + PW / 2} y={PY - 50} size={96} rotate={-8} fill={C.crimson} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2, 2)} />
      <ComicText text="CLASH!" from={b(k + 2, 2)} x={px(1) + PW / 2} y={PY - 50} size={96} rotate={7} fill={C.amberHi} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3, 2)} />
      <ComicText text="SLASH!" from={b(k + 3, 1)} x={px(2) + PW / 2} y={PY - 50} size={104} rotate={-6} fill={C.washi} variant="onomatopoeia" echoColor={C.crimson} exitAt={b(k + 4, 2)} />
      <Hanko x={px(3) + PW / 2} y={PY - 40} text="ON-CHAIN" at={b(k + 4, 3)} size={90} rot={-8} />

      <InkFrame inset={22} width={5} opacity={0.9} color={INK} />

      <Sfx name="impact" at={b(k)} volume={0.6} />
      <Sfx name="tick" at={b(k, 1)} volume={0.45} />
      <Sfx name="impact" at={b(k, 2)} volume={0.55} />
      {[0, 1, 2, 3].map((i) => (
        <React.Fragment key={i}>
          <Sfx name="impact" at={AT[i]!} volume={0.7} />
          <Sfx name="tick" at={b(k + 1 + i, 1)} volume={0.45} />
          <Sfx name="tick" at={b(k + 1 + i, 3)} volume={0.4} />
        </React.Fragment>
      ))}
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.6} />
      <Sfx name="impact" at={b(k + 2, 2)} volume={0.6} />
      <Sfx name="whoosh" at={b(k + 3, 1)} volume={0.6} />
      <Sfx name="chime" at={b(k + 4, 3)} volume={0.5} />
    </AbsoluteFill>
  );
};
