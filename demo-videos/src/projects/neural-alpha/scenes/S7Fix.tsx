import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, ComicPanel, ComicText, fadeUp, Halftone, INK, InkFrame, inkTextStyle, PremiumBg, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { TokenCoin } from "../art";
import { C, CHAIN, F, FIXED, REMOVED, short } from "../theme";
import { BAR } from "../timeline";
import { RealTag, Stamp } from "../ui";

/**
 * S7 · BUG FIX (bars 24–28, DROP on 24). From VERIFY-BNB.md, re-checked live:
 *   24 b0 "15 / 88" panel · b1 PENGU (top buy signal) · b2 "NO CONTRACT!" · b3 "…but marked routable"
 *   25 b0 fixed PENGU card: eth_getCode / symbol() / decimals() rows on b0..b2 · b3 "VERIFIED"
 *   26    the 11 corrected entries pop (3·3·3·2 per beat) · b3 the 4 removed (→ CMC runtime lookup)
 *   27    (break) "88/88 VERIFIED ON-CHAIN"
 */
const Row: React.FC<{ at: number; k: string; v: string; ok?: boolean }> = ({ at, k, v, ok = true }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "10px 0", borderBottom: `2px dashed rgba(8,9,11,0.25)`, ...fadeUp(f, at, 6, 12) }}>
      <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 25, color: "#2a2f33", width: 230 }}>{k}</span>
      <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 27, color: INK, flex: 1 }}>{v}</span>
      <span style={{ fontFamily: F.comic, fontSize: 30, color: ok ? C.neonDeep : C.danger }}>{ok ? "✓" : "✗"}</span>
    </div>
  );
};

const Chip: React.FC<{ at: number; sym: string; sub: string; struck?: boolean }> = ({ at, sym, sub, struck = false }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return <div style={{ width: 270, height: 104 }} />;
  const p = spring({ frame: f - at, fps, config: { damping: 11, stiffness: 240, mass: 0.55 } });
  return (
    <div
      style={{
        width: 270,
        height: 104,
        padding: "10px 18px",
        background: struck ? "#2a1318" : "#0f1a15",
        border: `4px solid ${INK}`,
        outline: `2px solid ${struck ? C.danger : C.neon}`,
        outlineOffset: -8,
        boxShadow: `6px 6px 0 ${INK}`,
        borderRadius: 10,
        transform: `scale(${0.5 + 0.5 * p}) rotate(${(1 - p) * -8}deg)`,
        opacity: interpolate(p, [0, 0.25], [0, 1], clamp),
      }}
    >
      <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 36, color: struck ? C.danger : C.text, textDecoration: struck ? "line-through" : undefined }}>{sym}</div>
      <div style={{ fontFamily: F.mono, fontSize: 19, color: struck ? "#e59aa6" : C.neonSoft, marginTop: 2 }}>{sub}</div>
    </div>
  );
};

export const S7Fix: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.fix; // 24

  const pA = useBeatPunch(beatsIn(k, k + 1), 0.03, 5);
  const phaseB = interpolate(frame, [b(k + 2) - 5, b(k + 2)], [0, 1], clamp);
  const chipAt = (i: number) => b(k + 2, Math.min(3, Math.floor(i / 3)));

  return (
    <AbsoluteFill>
      <PremiumBg base={C.void} glowA="rgba(246,70,93,0.16)" glowB="rgba(14,203,129,0.16)" glow="top" floor={0.35} grid={0.5} />
      <Halftone opacity={0.04} gap={20} />

      <div style={{ position: "absolute", left: 92, top: 38 }}>
        <RealTag at={0} kind="bug fixed" color={C.danger} label="neural-alpha/src/integrations/bsc-token-addresses.ts" />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 100, textAlign: "center", fontFamily: F.display, fontSize: 64, color: C.text, ...fadeUp(frame, 0, 8, 20) }}>
        {phaseB < 0.5 ? (
          <>
            <span style={{ color: C.danger }}>15 of 88</span> hard-coded BEP-20 addresses pointed at <i>nothing.</i>
          </>
        ) : (
          <>
            11 corrected, 4 removed — <i style={{ color: C.neon }}>every entry re-read on-chain.</i>
          </>
        )}
      </div>

      {phaseB < 1 ? (
        <AbsoluteFill style={{ opacity: 1 - phaseB, transform: `translateY(${-phaseB * 60}px)` }}>
          <Pulse intensity={0.9} shake={0.3}>
            <ComicPanel at={b(k)} x={100} y={250} w={520} h={520} rot={-2} bg="#FFE3E7" bg2="#f6465d" from="left" punch={pA}>
              <div style={{ padding: "36px 40px" }}>
                <div style={{ fontFamily: F.comic, fontSize: 40, color: INK }}>WRONG ADDRESSES</div>
                <div style={{ ...inkTextStyle(158, "#fff"), fontFamily: F.sans, fontWeight: 900 }}>15/88</div>
                <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 28, color: INK, marginTop: 8, lineHeight: 1.25 }}>Right prefix, corrupted tail — no contract behind them. APE was 39 hex chars.</div>
              </div>
            </ComicPanel>

            <ComicPanel at={b(k, 1)} x={680} y={270} w={500} h={500} rot={1.5} bg="#FFF1BF" bg2="#F0B90B" from="down">
              <svg width={500} height={500} viewBox="0 0 500 500" style={{ position: "absolute", inset: 0 }}>
                <TokenCoin x={250} y={220} s={1.35} sym="PENGU" fill={C.gold} />
              </svg>
              <div style={{ position: "absolute", left: 24, top: 24, fontFamily: F.comic, fontSize: 34, color: INK, maxWidth: 440 }}>The test's top buy signal</div>
              {frame >= b(k, 3) ? (
                <div style={{ position: "absolute", left: 24, right: 24, bottom: 24, padding: "10px 14px", background: "#f4efe4", border: `4px solid ${INK}`, fontFamily: F.mono, fontWeight: 700, fontSize: 22, color: INK, ...fadeUp(frame, b(k, 3), 6, 10) }}>
                  hasBscSwapAddress() → "routable" anyway
                </div>
              ) : null}
            </ComicPanel>

            <ComicPanel at={b(k + 1)} x={1240} y={250} w={580} h={520} rot={-1.2} bg="#D9F7EA" bg2="#0ecb81" from="right">
              <div style={{ padding: "30px 34px" }}>
                <div style={{ fontFamily: F.comic, fontSize: 40, color: INK }}>FIXED · PENGU on BSC</div>
                <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 22, color: INK, marginTop: 6 }}>{CHAIN.pengu}</div>
                <div style={{ marginTop: 14 }}>
                  <Row at={b(k + 1)} k="eth_getCode" v="12,493 bytes" />
                  <Row at={b(k + 1, 1)} k="symbol()" v='"PENGU"' />
                  <Row at={b(k + 1, 2)} k="decimals()" v="18" />
                </div>
              </div>
            </ComicPanel>
          </Pulse>
          <Stamp at={b(k, 2)} x={930} y={560} text="NO CONTRACT!" color={C.danger} size={56} rot={-10} />
          <Stamp at={b(k + 1, 3)} x={1530} y={800} text="VERIFIED ON-CHAIN" color={C.neon} size={46} rot={-4} />
        </AbsoluteFill>
      ) : null}

      {frame >= b(k + 2) - 2 ? (
        <AbsoluteFill>
          <Pulse intensity={0.8} shake={0.2}>
            <div style={{ position: "absolute", left: 60, right: 60, top: 270, display: "flex", flexWrap: "wrap", gap: 26, justifyContent: "center" }}>
              {FIXED.map((t, i) => (
                <Chip key={t.sym} at={chipAt(i)} sym={t.sym} sub={`"${t.onchain}" · ${t.dec} dec`} />
              ))}
            </div>
            <div style={{ position: "absolute", left: 60, right: 60, top: 560, display: "flex", gap: 26, justifyContent: "center", alignItems: "center" }}>
              {REMOVED.map((s) => (
                <Chip key={s} at={b(k + 2, 3)} sym={s} sub="removed → CMC" struck />
              ))}
            </div>
          </Pulse>
          <SpeedBurst cx={960} cy={800} from={b(k + 3)} count={20} inner={200} spread={600} color={C.neon} opacity={0.4} width={6} seed="88" fade />
          <ComicText text="88/88 VERIFIED ON-CHAIN" from={b(k + 3)} x={960} y={800} size={116} rotate={-3} fill={C.neon} variant="onomatopoeia" echoColor={INK} stagger={1} />
          {frame >= b(k + 3, 2) ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 910, textAlign: "center", fontFamily: F.mono, fontSize: 24, color: C.text2, ...fadeUp(frame, b(k + 3, 2), 6, 10) }}>
              bytecode + symbol() re-read for all 88 entries · bsc-dataseed · 2026-09-25 · e.g. PENGU {short(CHAIN.pengu, 8, 4)}
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}

      <InkFrame inset={22} width={4} opacity={0.6} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={0.8} />
      <Sfx name="impact" at={b(k, 1)} volume={0.6} />
      <Sfx name="impact" at={b(k, 2)} volume={0.9} />
      <Sfx name="tick" at={b(k, 3)} volume={0.5} />
      <Sfx name="impact" at={b(k + 1)} volume={0.6} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.5} />
      <Sfx name="tick" at={b(k + 1, 2)} volume={0.5} />
      <Sfx name="chime" at={b(k + 1, 3)} volume={0.55} />
      <Sfx name="whoosh" at={b(k + 2)} volume={0.4} />
      {[1, 2, 3].map((i) => (
        <Sfx key={i} name="tick" at={b(k + 2, i)} volume={0.5} />
      ))}
      <Sfx name="impact" at={b(k + 3)} volume={0.85} />
    </AbsoluteFill>
  );
};
