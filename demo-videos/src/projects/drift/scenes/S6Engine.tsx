import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ComicText, Glass, Halftone, INK, InkArrow, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { Snake } from "../art";
import { C, CHAIN, F, REGIME, short } from "../theme";
import { BAR } from "../timeline";

/**
 * S6 · THE ENGINE WRITES ON ITS OWN (bars 46–49). VERIFY-BNB.md "Python engine
 * against the live contract", one beat per log line:
 *   46 b0 someone forces RiskOn with cast (tx 0xda18…)   b2 engine: computed neutral ≠ chain → out of sync
 *   47 b0 regime loop sends setRegime(Neutral) from web3.py (tx 0x0630…) "AUTO-RESTORED!"   b2 synced: true
 *   48 b0 guard.record(...) → recordDecision (tx 0x2d76…)   b1 decisionCount 2 → 3   b2 "LOGGED!"
 */
type Line = { at: [number, number]; txt: string; col?: string };

export const S6Engine: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.engine; // 46

  const LINES: Line[] = [
    { at: [0, 0], txt: `$ cast send MacroGuard "setRegime(0)"   # force RiskOn`, col: C.amber },
    { at: [0, 1], txt: `  tx ${short(CHAIN.tx.castRiskOn, 12, 8)}  status 1`, col: C.textMuted },
    { at: [0, 2], txt: `engine  computed neutral ≠ on-chain risk-on`, col: C.red },
    { at: [1, 0], txt: `engine  regime loop → setRegime(Neutral)  [web3.py]`, col: C.peri },
    { at: [1, 1], txt: `  tx ${short(CHAIN.tx.engineRestore, 12, 8)}  status 1`, col: C.textMuted },
    { at: [1, 2], txt: `GET /regime → {"label":"neutral","on_chain":1,"synced":true}`, col: C.green },
    { at: [2, 0], txt: `guard.record("BNBUSDT", +1, 612.34, -0.012)`, col: C.peri },
    { at: [2, 1], txt: `  recordDecision tx ${short(CHAIN.tx.engineRecord, 12, 8)}  status 1`, col: C.textMuted },
    { at: [2, 2], txt: `decisionCount 2 → 3 · guard.allowed(Long) = true`, col: C.green },
  ];

  const chainRegime = frame >= b(k + 1) ? REGIME.neutral : REGIME.on;
  const synced = frame >= b(k + 1, 2) || frame < b(k, 2);
  const count = frame >= b(k + 2, 1) ? 3 : 2;
  const pSync = useBeatPunch([b(k + 1), b(k + 1, 2), b(k + 2, 1)], 0.1, 5);

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(59,130,196,0.22)" glowB="rgba(154,168,240,0.16)" glow="left" floor={0.35} grid={0.5} />
      <Halftone opacity={0.035} gap={22} />

      <div style={{ position: "absolute", left: 90, top: 64 }}>
        <div style={{ fontFamily: F.mono, fontSize: 24, letterSpacing: "0.26em", color: C.peri }}>THE PYTHON ENGINE · LIVE CONTRACT</div>
        <div style={{ fontFamily: F.display, fontSize: 66, color: C.text, marginTop: 4 }}>
          It keeps the chain honest, <i style={{ color: C.gold }}>by itself.</i>
        </div>
      </div>

      <Pulse intensity={0.55} shake={0.2} glow={false}>
        <div style={{ position: "absolute", left: 90, top: 250, width: 1080 }}>
          <Glass radius={22} glow={0.4} glowColor="rgba(154,168,240,0.4)" fill="rgba(9,10,13,0.96)">
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: `1px solid ${C.line}` }}>
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                <span key={c} style={{ width: 13, height: 13, borderRadius: 99, background: c, opacity: 0.85 }} />
              ))}
              <span style={{ marginLeft: 14, fontFamily: F.mono, fontSize: 20, color: C.textMuted }}>apps/trader · uvicorn app.main:app · Python 3.11 · BSC testnet</span>
            </div>
            <div style={{ padding: "22px 26px", minHeight: 560 }}>
              {LINES.map((l, i) => {
                const t = b(k + l.at[0], l.at[1]);
                if (frame < t) return null;
                const typed = Math.min(l.txt.length, Math.floor(((frame - t) / 5) * l.txt.length));
                return (
                  <div key={i} style={{ fontFamily: F.mono, fontSize: 25, lineHeight: 1.75, color: l.col ?? C.text, whiteSpace: "pre" }}>
                    {l.txt.slice(0, typed)}
                    {typed < l.txt.length ? <span style={{ background: C.peri, color: C.bg }}> </span> : null}
                  </div>
                );
              })}
            </div>
          </Glass>
        </div>

        {/* engine ↔ chain sync diagram */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <Snake x={1440} y={430} s={0.95} />
        </svg>
        <div style={{ position: "absolute", left: 1250, top: 560, width: 580, transform: `scale(${pSync})`, transformOrigin: "center" }}>
          {[
            { k: "ENGINE (computed)", r: REGIME.neutral },
            { k: "MACROGUARD (on-chain)", r: chainRegime },
          ].map((row) => (
            <div key={row.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 22px", marginBottom: 12, borderRadius: 14, border: `1.5px solid ${row.r.color}55`, background: `${row.r.color}12` }}>
              <span style={{ fontFamily: F.mono, fontSize: 21, color: C.textMuted }}>{row.k}</span>
              <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 36, color: row.r.color }}>{row.r.label}</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, padding: "12px 20px", borderRadius: 14, background: synced ? "rgba(52,211,153,0.14)" : "rgba(248,113,113,0.16)", border: `1.5px solid ${synced ? C.green : C.red}`, fontFamily: F.mono, fontSize: 24, fontWeight: 700, color: synced ? C.green : C.red, textAlign: "center" }}>
              synced: {synced ? "true" : "false"}
            </div>
            <div style={{ flex: 1, padding: "12px 20px", borderRadius: 14, background: "rgba(154,168,240,0.12)", border: `1.5px solid ${C.peri}`, fontFamily: F.mono, fontSize: 24, fontWeight: 700, color: C.peri, textAlign: "center" }}>
              decisions: {count}
            </div>
          </div>
        </div>
        <InkArrow x1={1500} y1={330} x2={1560} y2={545} at={b(k + 1)} dur={6} bend={40} color={C.gold} width={6} />
      </Pulse>

      <SpeedBurst cx={1500} cy={930} from={b(k + 1)} count={16} inner={120} spread={360} color={C.peri} opacity={0.5} width={6} seed="restore" fade />
      <ComicText text="AUTO-RESTORED!" from={b(k + 1)} x={1530} y={940} size={96} rotate={-5} fill={C.peri} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 2) - 2} />
      <ComicText text="LOGGED ON-CHAIN!" from={b(k + 2, 2)} x={1530} y={940} size={92} rotate={4} fill={C.gold} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" />

      {[0, 1, 2].map((bar) => [0, 1, 2].map((bt) => <Sfx key={`${bar}${bt}`} name="tick" at={b(k + bar, bt)} volume={0.45} />))}
      <Sfx name="impact" at={b(k + 1)} volume={0.75} />
      <Sfx name="chime" at={b(k + 1, 2)} volume={0.45} />
      <Sfx name="impact" at={b(k + 2, 2)} volume={0.7} />
    </AbsoluteFill>
  );
};
