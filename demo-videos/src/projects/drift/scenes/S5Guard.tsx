import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, ComicText, Glass, Halftone, INK, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { C, CHAIN, F, REGIME, short } from "../theme";
import { BAR } from "../timeline";
import { Pill, SignalLight } from "../ui";

/**
 * S5 · THE GUARD, LIVE (bars 40–46) — DROP. The real BSC-testnet smoke flow
 * from VERIFY-BNB.md, replayed one step per bar on a code-drawn console of the
 * contract's state (every tx below is real, receipt status 1):
 *   40 setRegime(RiskOff)            → allowed(Long) false          "VETOED!"
 *   41 recordDecision(Short, −5%)    → no halt, decisionCount 1
 *   42 recordDecision(Flat, −25%)    → Halted event, only Flat       "HALTED!"
 *   43 resume()                      → halted false
 *   44 setRegime(Neutral)            → allowed(Long) true
 *   45 setRegime from a non-agent    → reverts NotAgent() 0x0d9ab13f "DENIED!"
 */
type Step = { fn: string; tx?: string; gas?: number; note: string; col: string };
const STEPS: Step[] = [
  { fn: "setRegime(RiskOff)", tx: CHAIN.tx.riskOff, gas: CHAIN.gas.riskOff, note: "allowed(Long) → false", col: C.red },
  { fn: "recordDecision(BNBUSDT, Short, −5%)", tx: CHAIN.tx.dd5, gas: CHAIN.gas.dd5, note: "no halt", col: C.peri },
  { fn: "recordDecision(BNBUSDT, Flat, −25%)", tx: CHAIN.tx.dd25, gas: CHAIN.gas.dd25, note: "Halted event · only Flat", col: C.red },
  { fn: "resume()", tx: CHAIN.tx.resume, gas: CHAIN.gas.resume, note: "halted → false", col: C.green },
  { fn: "setRegime(Neutral)", tx: CHAIN.tx.neutral, gas: CHAIN.gas.neutral, note: "allowed(Long) → true", col: C.green },
  { fn: "setRegime(…) from a non-agent", note: `reverts NotAgent() ${CHAIN.notAgent}`, col: C.amber },
];

export const S5Guard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.guard; // 40

  // contract state, driven by the bar we're in (each tx lands on the downbeat)
  const stepAt = (i: number) => b(k + i);
  const done = (i: number) => frame >= stepAt(i);
  const regime = done(4) ? REGIME.neutral : REGIME.off;
  const halted = done(2) && !done(3);
  const count = done(2) ? 2 : done(1) ? 1 : 0;
  const ddTarget = done(2) ? 25 : done(1) ? 5 : 0;
  const ddPrev = done(2) ? 5 : 0;
  const ddAt = done(2) ? stepAt(2) : stepAt(1);
  const dd = done(3) ? 25 : interpolate(frame, [ddAt, ddAt + 10], [ddPrev, ddTarget], clamp);
  const long = !halted && regime === REGIME.neutral;
  const shortOk = !halted;
  const flash = (t: number) => (frame >= t ? Math.exp(-(frame - t) / 5) : 0);
  const pConsole = useBeatPunch(beatsIn(k, k + 6), 0.012, 5);
  const haltFx = halted ? 0.5 + 0.5 * Math.sin((frame - stepAt(2)) / 2.5) : 0;

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA={halted ? "rgba(248,113,113,0.3)" : "rgba(154,168,240,0.24)"} glowB="rgba(240,185,11,0.14)" glow="top" floor={0.4} grid={0.5} />
      <Halftone opacity={0.035} gap={22} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 50, display: "flex", justifyContent: "center", gap: 24, alignItems: "center" }}>
        <BnbBadge label="LIVE ON BSC TESTNET" at={b(k)} size={32} live variant="dark" />
        <span style={{ fontFamily: F.mono, fontSize: 24, color: C.textMuted }}>MacroGuard {CHAIN.guard}</span>
      </div>

      <Pulse intensity={0.6} shake={0.3} glow={false}>
        {/* contract console */}
        <div style={{ position: "absolute", left: 90, top: 140, width: 900, transform: `scale(${pConsole})`, transformOrigin: "center" }}>
          <Glass radius={26} glow={0.45 + 0.4 * haltFx} glowColor={halted ? "rgba(248,113,113,0.6)" : "rgba(154,168,240,0.45)"} fill="rgba(13,14,18,0.95)" innerStyle={{ padding: "30px 36px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 38, color: C.text }}>MacroGuard state</div>
              <Pill color={C.gold} size={18} dot={false}>chainId 97</Pill>
            </div>

            <div style={{ display: "flex", gap: 20, marginTop: 24 }}>
              <div style={{ flex: 1.35, padding: "18px 22px", borderRadius: 16, border: `1.5px solid ${regime.color}66`, background: `${regime.color}14`, transform: `scale(${1 + 0.06 * (flash(stepAt(0)) + flash(stepAt(4)))})` }}>
                <div style={{ fontFamily: F.mono, fontSize: 20, color: C.textMuted, letterSpacing: "0.12em" }}>regime()</div>
                <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 50, color: regime.color, marginTop: 6, whiteSpace: "nowrap" }}>{regime.label}</div>
              </div>
              <div style={{ flex: 1, padding: "18px 22px", borderRadius: 16, border: `1.5px solid ${halted ? C.red : C.line}`, background: halted ? `rgba(248,113,113,${0.12 + 0.12 * haltFx})` : "rgba(255,255,255,0.03)" }}>
                <div style={{ fontFamily: F.mono, fontSize: 20, color: C.textMuted, letterSpacing: "0.12em" }}>halted()</div>
                <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 56, color: halted ? C.red : C.text, marginTop: 2 }}>{halted ? "true" : "false"}</div>
              </div>
              <div style={{ flex: 0.9, padding: "18px 22px", borderRadius: 16, border: `1.5px solid ${C.line}`, background: "rgba(255,255,255,0.03)" }}>
                <div style={{ fontFamily: F.mono, fontSize: 20, color: C.textMuted, letterSpacing: "0.12em" }}>decisions</div>
                <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 56, color: C.peri, marginTop: 2, transform: `scale(${1 + 0.2 * (flash(stepAt(1)) + flash(stepAt(2)))})`, transformOrigin: "left" }}>{count}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 16, marginTop: 18 }}>
              <SignalLight name="Long" ok={long} flash={flash(b(k, 1)) + flash(stepAt(2)) + flash(stepAt(4))} />
              <SignalLight name="Short" ok={shortOk} flash={flash(stepAt(2)) + flash(stepAt(3))} />
              <SignalLight name="Flat" ok flash={flash(stepAt(2))} />
            </div>

            {/* drawdown meter */}
            <div style={{ marginTop: 26 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.mono, fontSize: 21, color: C.textMuted }}>
                <span>last drawdown</span>
                <span style={{ color: dd > 20 ? C.red : C.text, fontWeight: 700, fontSize: 26 }}>−{dd.toFixed(0)}%</span>
              </div>
              <div style={{ position: "relative", height: 26, borderRadius: 13, background: "rgba(255,255,255,0.06)", marginTop: 10, overflow: "visible" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(dd / 30) * 100}%`, borderRadius: 13, background: dd > 20 ? C.red : C.peri, boxShadow: `0 0 18px ${dd > 20 ? C.red : C.peri}` }} />
                <div style={{ position: "absolute", left: `${(20 / 30) * 100}%`, top: -10, bottom: -10, width: 4, background: C.gold, borderRadius: 2 }} />
                <div style={{ position: "absolute", left: `${(20 / 30) * 100}%`, top: 36, transform: "translateX(-50%)", fontFamily: F.mono, fontSize: 19, color: C.gold, whiteSpace: "nowrap" }}>maxDrawdownBps 2000</div>
              </div>
            </div>
            <div style={{ height: 34 }} />
          </Glass>
        </div>

        {/* tx feed */}
        <div style={{ position: "absolute", left: 1030, top: 140, width: 800 }}>
          <div style={{ fontFamily: F.mono, fontSize: 22, color: C.textMuted, letterSpacing: "0.18em", marginBottom: 14 }}>SMOKE FLOW · CAST · RECEIPTS STATUS 1</div>
          {STEPS.map((s, i) => {
            const t = stepAt(i);
            if (frame < t) return null;
            const p = spring({ frame: frame - t, fps, config: { damping: 14, stiffness: 220, mass: 0.6 } });
            const cur = i === Math.min(5, Math.floor((frame - b(k)) / (b(k + 1) - b(k))));
            return (
              <div
                key={i}
                style={{
                  marginBottom: 12,
                  padding: "14px 20px",
                  borderRadius: 14,
                  background: cur ? "rgba(20,21,43,0.95)" : "rgba(14,15,19,0.85)",
                  border: `1.5px solid ${cur ? s.col : C.line}`,
                  boxShadow: cur ? `0 0 24px ${s.col}55` : undefined,
                  transform: `translateX(${(1 - p) * 80}px)`,
                  opacity: interpolate(p, [0, 0.3], [0, 1], clamp) * (cur ? 1 : 0.72),
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                  <span style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 24, color: C.text }}>{s.fn}</span>
                  {s.gas ? <span style={{ fontFamily: F.mono, fontSize: 18, color: C.textDim }}>{s.gas.toLocaleString("en-US")} gas</span> : null}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontFamily: F.mono, fontSize: 20 }}>
                  <span style={{ color: s.col }}>{s.note}</span>
                  <span style={{ color: C.peri }}>{s.tx ? `tx ${short(s.tx, 10, 6)}` : "eth_call"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Pulse>

      {halted ? <AbsoluteFill style={{ boxShadow: `inset 0 0 ${120 + 80 * haltFx}px rgba(248,113,113,0.55)`, pointerEvents: "none" }} /> : null}

      <SpeedBurst cx={1500} cy={870} from={b(k, 2)} count={16} inner={120} spread={320} color={C.red} opacity={0.5} width={6} seed="veto" fade />
      <ComicText text="VETOED!" from={b(k, 2)} x={1480} y={880} size={130} rotate={-7} fill={C.red} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1, 2)} />
      <ComicText text="−5%. STILL SAFE." from={b(k + 1, 2)} x={1440} y={900} size={84} rotate={4} fill={C.peri} exitAt={b(k + 2) - 2} />
      <SpeedBurst cx={1440} cy={870} from={b(k + 2, 1)} count={20} inner={200} spread={420} color={C.red} opacity={0.45} width={7} seed="halt" fade />
      <ComicText text="HALTED!" from={b(k + 2, 1)} x={1440} y={880} size={180} rotate={-6} skewX={-6} fill={C.red} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 3) - 2} />
      <ComicText text="RESUMED." from={b(k + 3, 1)} x={1440} y={910} size={100} rotate={3} fill={C.green} exitAt={b(k + 4) - 2} />
      <ComicText text="LONGS BACK ON!" from={b(k + 4, 1)} x={1440} y={910} size={96} rotate={-3} fill={C.green} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 5) - 2} />
      <SpeedBurst cx={1450} cy={880} from={b(k + 5, 1)} count={16} inner={120} spread={320} color={C.amber} opacity={0.5} width={6} seed="deny" fade />
      <ComicText text="DENIED!" from={b(k + 5, 1)} x={1440} y={890} size={150} rotate={-8} fill={C.amber} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" innerColor="#F0B90B" />

      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Sfx key={`s${i}`} name={i === 2 ? "impact" : "tick"} at={b(k + i)} volume={i === 2 ? 0.9 : 0.6} />
      ))}
      <Sfx name="impact" at={b(k, 2)} volume={0.75} />
      <Sfx name="tick" at={b(k + 1, 2)} volume={0.4} />
      <Sfx name="impact" at={b(k + 2, 1)} volume={0.8} />
      <Sfx name="chime" at={b(k + 3, 1)} volume={0.45} />
      <Sfx name="chime" at={b(k + 4, 1)} volume={0.5} />
      <Sfx name="impact" at={b(k + 5, 1)} volume={0.8} />
    </AbsoluteFill>
  );
};
