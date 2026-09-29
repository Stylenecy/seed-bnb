import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ComicPanel, ComicText, Halftone, INK, InkArrow, InkFrame, PremiumBg, Pulse, Robot, Sfx, useBeatPunch, useSceneClock } from "../../../kit";
import { ChainLinks, EquityDrop, Shield, Snake, Storm } from "../art";
import { C, F, REGIME } from "../theme";
import { BAR } from "../timeline";

/**
 * S3 · HOW IT WORKS (bars 31–36). Slides in on the dip bar 31 (title card),
 * then one comic step per bar, slamming on the downbeat, detail on b2:
 *   32 READ THE MACRO   regime engine: BTC 1h vol z-score + EWMA trend → label
 *   33 PUSH IT ON-CHAIN setRegime() on MacroGuard (BSC)
 *   34 VETO THE TRADE   allowed(signal): RiskOff blocks Long
 *   35 LOG + HALT       recordDecision() every tick; drawdown past the limit → Halted
 */
const PW = 404;
const PH = 600;
const PY = 300;
const GAP = 38;
const X0 = (1920 - (PW * 4 + GAP * 3)) / 2;
const px = (i: number) => X0 + i * (PW + GAP);

const Step: React.FC<{ n: number; title: string; sub: string; subAt: number; children: React.ReactNode }> = ({ n, title, sub, subAt, children }) => {
  const f = useCurrentFrame();
  return (
    <>
      <div style={{ position: "absolute", left: 22, top: 18, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 54, height: 54, borderRadius: 99, background: INK, color: C.gold, fontFamily: F.comic, fontSize: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</span>
        <span style={{ fontFamily: F.comic, fontSize: 40, color: INK, letterSpacing: "0.03em" }}>{title}</span>
      </div>
      <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`} style={{ position: "absolute", inset: 0 }}>
        {children}
      </svg>
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          bottom: 18,
          padding: "12px 16px",
          background: "#f4efe4",
          border: `4px solid ${INK}`,
          fontFamily: F.sans,
          fontWeight: 600,
          fontSize: 25,
          lineHeight: 1.25,
          color: INK,
          opacity: interpolate(f, [subAt, subAt + 5], [0, 1], clamp),
          transform: `translateY(${interpolate(f, [subAt, subAt + 7], [16, 0], clamp)}px)`,
        }}
      >
        {sub}
      </div>
    </>
  );
};

export const S3HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.how; // 31
  const s = k + 1; // first step bar (32)

  const punches = [0, 1, 2, 3].map((i) => useBeatPunch(beatsIn(s + i, s + i + 1), 0.025, 5)); // eslint-disable-line react-hooks/rules-of-hooks
  const title = interpolate(frame, [b(k), b(k) + 10], [0, 1], clamp);
  const regimeIdx = frame >= b(s, 3) ? 2 : frame >= b(s, 2) ? 1 : 0;
  const regime = [REGIME.on, REGIME.neutral, REGIME.off][regimeIdx]!;
  const veto = frame >= b(s + 2, 2);
  const eq = interpolate(frame, [b(s + 3), b(s + 3, 2)], [0.1, 1], clamp);
  const halted = frame >= b(s + 3, 2);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(154,168,240,0.2)" glowB="rgba(240,185,11,0.1)" glow="top" floor={0.35} grid={0.5} />
      <Halftone opacity={0.04} gap={20} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 92, textAlign: "center", opacity: title, transform: `translateY(${(1 - title) * 30}px)` }}>
        <div style={{ fontFamily: F.mono, fontSize: 26, letterSpacing: "0.3em", color: C.peri }}>HOW IT WORKS</div>
        <div style={{ fontFamily: F.display, fontSize: 74, color: C.text, marginTop: 6 }}>
          The market sets the regime. <i style={{ color: C.gold }}>The chain enforces it.</i>
        </div>
      </div>

      <Pulse intensity={1} shake={0.4}>
        <ComicPanel at={b(s)} x={px(0)} y={PY} w={PW} h={PH} rot={-1.4} bg="#DCE2FF" bg2="#9aa8f0" from="up" punch={punches[0]}>
          <Step n={1} title="READ THE MACRO" sub="Regime engine: BTC 1h vol z-score + EWMA trend." subAt={b(s, 2)}>
            <Storm x={200} y={200} s={0.8} bolt={regimeIdx === 2} />
            <g transform="translate(202, 350)">
              <rect x={-150} y={-40} width={300} height={80} rx={40} fill={regime.color} stroke={INK} strokeWidth={6} />
              <text x={0} y={16} textAnchor="middle" fontFamily={F.comic} fontSize={46} fill={INK}>
                {regime.label}
              </text>
            </g>
          </Step>
        </ComicPanel>

        <ComicPanel at={b(s + 1)} x={px(1)} y={PY + 14} w={PW} h={PH} rot={1.2} bg="#FFE9A8" bg2="#F0B90B" from="down" punch={punches[1]}>
          <Step n={2} title="PUSH ON-CHAIN" sub="The Python engine calls setRegime() on MacroGuard." subAt={b(s + 1, 2)}>
            <Snake x={150} y={300} s={0.95} />
            <ChainLinks x={300} y={390} s={0.8} />
            <Shield x={300} y={230} s={0.55} />
          </Step>
        </ComicPanel>

        <ComicPanel at={b(s + 2)} x={px(2)} y={PY - 6} w={PW} h={PH} rot={-1} bg="#FFC2C2" bg2="#f87171" from="down" punch={punches[2]}>
          <Step n={3} title="VETO THE TRADE" sub="Each tick asks allowed(signal). Risk-off blocks longs." subAt={b(s + 2, 2)}>
            <Robot x={130} y={330} s={0.9} mood={veto ? "neutral" : "happy"} visor="#9aa8f0" />
            <Shield x={295} y={290} s={0.7} />
            <g transform="translate(290, 170) rotate(-8)">
              <rect x={-80} y={-34} width={160} height={68} rx={10} fill={C.green} stroke={INK} strokeWidth={6} />
              <text x={0} y={16} textAnchor="middle" fontFamily={F.comic} fontSize={44} fill={INK}>LONG</text>
              {veto ? <path d="M-86 -40 L86 40 M-86 40 L86 -40" stroke={C.red} strokeWidth={14} strokeLinecap="round" /> : null}
            </g>
          </Step>
        </ComicPanel>

        <ComicPanel at={b(s + 3)} x={px(3)} y={PY + 8} w={PW} h={PH} rot={1.5} bg="#C9F5E3" bg2="#34d399" from="right" punch={punches[3]}>
          <Step n={4} title="LOG + HALT" sub="recordDecision() every tick. Too deep a drawdown → Halted." subAt={b(s + 3, 2)}>
            <EquityDrop x={202} y={250} w={320} h={210} p={eq} />
            {halted ? (
              <g transform="translate(202, 400)">
                <path d="M-48 -116 L48 -116 L116 -48 L116 48 L48 116 L-48 116 L-116 48 L-116 -48 Z" transform="scale(0.55)" fill={C.red} stroke={INK} strokeWidth={10} />
                <text x={0} y={14} textAnchor="middle" fontFamily={F.comic} fontSize={34} fill="#fff">HALT</text>
              </g>
            ) : null}
          </Step>
        </ComicPanel>

        {[0, 1, 2].map((i) => (
          <InkArrow key={i} x1={px(i) + PW - 30} y1={PY + 110} x2={px(i + 1) + 40} y2={PY + 110} at={b(s + i + 1) - 4} dur={6} bend={-30} color={C.gold} width={6} />
        ))}
      </Pulse>

      <ComicText text="4 STEPS." from={b(k, 2)} x={960} y={620} size={170} rotate={-4} fill={C.gold} variant="onomatopoeia" echoColor={INK} exitAt={b(s) - 2} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      <Sfx name="impact" at={b(k, 2)} volume={0.6} />
      {[0, 1, 2, 3].map((i) => (
        <React.Fragment key={i}>
          <Sfx name="impact" at={b(s + i)} volume={0.7} />
          <Sfx name="tick" at={b(s + i, 2)} volume={0.5} />
        </React.Fragment>
      ))}
      <Sfx name="tick" at={b(s, 3)} volume={0.5} />
      <Sfx name="impact" at={b(s + 3, 2)} volume={0.6} />
    </AbsoluteFill>
  );
};
