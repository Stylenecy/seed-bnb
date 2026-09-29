import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, ComicText, fadeUp, Halftone, INK, InkFrame, Pulse, Sfx, steppedCount, useBeatPunch, useSceneClock } from "../../../kit";
import { Hanko, InkDefs, InkNight, KatanaSlash, Samurai } from "../art";
import { C, CHAIN, F, short } from "../theme";
import { BAR } from "../timeline";

/**
 * S6 · THE STRIKE (bars 55–58) — slides in on the dip bar 55. The real smoke
 * flow on BSC testnet (VERIFY-BNB.md, all receipts status 1), told as a duel:
 *   55  MusashiINFT.mint → agent 0           b1 card · b2 MINTED seal · b3 guard up
 *   56  ConvictionLog.logStrike(0, USDT, 56, 4)  b0 SLASH! (phrase downbeat) · convergence pips b0–b3
 *   57  recordOutcome(0, +2500)              counter ticks on b0–b3 · b3 WIN! + reputation() read
 */
const Card: React.FC<{ at: number; y: number; fn: string; call: string; tx: string; gas: string; accent: string; children?: React.ReactNode }> = ({ at, y, fn, call, tx, gas, accent, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const p = spring({ frame: f - at, fps, config: { damping: 13, stiffness: 190, mass: 0.7 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 930,
        top: y,
        width: 880,
        height: 206,
        transform: `translateX(${(1 - p) * 160}px) rotate(${(1 - p) * 4}deg)`,
        opacity: interpolate(p, [0, 0.3], [0, 1], clamp),
        background: C.washi,
        border: `5px solid ${INK}`,
        boxShadow: `8px 8px 0 ${INK}`,
        borderLeft: `18px solid ${accent}`,
        padding: "16px 24px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontFamily: F.comic, fontSize: 40, color: INK, letterSpacing: "0.03em" }}>{fn}</div>
      <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 25, color: INK, marginTop: 4 }}>{call}</div>
      <div style={{ display: "flex", gap: 20, marginTop: 14, fontFamily: F.mono, fontSize: 22, color: "#5b4a33", alignItems: "center" }}>
        <span style={{ padding: "3px 10px", background: INK, color: C.green, borderRadius: 6 }}>status 1</span>
        <span>tx {short(tx, 10, 5)}</span>
        <span>· {gas} gas</span>
      </div>
      {children}
    </div>
  );
};

export const S6Strike: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.strike; // 55

  const guard = interpolate(frame, [b(k, 3), b(k, 3) + 6], [0.35, 0], clamp);
  const swing = interpolate(frame, [b(k + 1) - 3, b(k + 1) + 2], [0, 1], clamp);
  const strike = frame < b(k, 3) ? 0.35 : frame < b(k + 1) - 3 ? guard : swing;
  const pips = steppedCount(frame, [b(k + 1), b(k + 1, 1), b(k + 1, 2), b(k + 1, 3)], [1, 2, 3, 4]);
  const bps = steppedCount(frame, [b(k + 2), b(k + 2, 1), b(k + 2, 2), b(k + 2, 3)], [625, 1250, 1875, 2500]);
  const p = useBeatPunch(beatsIn(k + 1, k + 3), 0.03, 4);
  const sun = interpolate(frame, [0, b(k, 1)], [0.6, 1], clamp);

  return (
    <AbsoluteFill>
      <InkNight glow={1} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <InkDefs id="sun6" scale={12} freq={0.02} />
        <circle cx={470} cy={470} r={300 * sun} fill={C.crimson} opacity={0.85} filter="url(#sun6)" />
      </svg>
      <Halftone opacity={0.04} gap={20} color={C.amber} />

      <Pulse intensity={0.8} shake={0.3}>
        <div style={{ position: "absolute", left: 90, top: 64, fontFamily: F.display, fontWeight: 600, fontSize: 64, color: C.washi, ...fadeUp(frame, 0, 10, 20) }}>
          The strike, <i style={{ color: C.amberHi }}>live on BSC testnet</i>
        </div>
        <div style={{ position: "absolute", left: 90, top: 160 }}>
          <BnbBadge label="BSC TESTNET · CHAIN 97" at={b(k, 1)} size={26} live variant="dark" />
        </div>

        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, transform: `scale(${p})`, transformOrigin: "470px 700px" }}>
          <Samurai x={400} y={700} s={1.55} strike={strike} />
          <ellipse cx={420} cy={1090} rx={380} ry={40} fill={INK} opacity={0.6} />
        </svg>

        <Card at={b(k, 1)} y={210} fn="1 · MINT THE AGENT" call={`MusashiINFT.mint("MUSASHI", …) → agent #0`} tx={CHAIN.tx.mint} gas={CHAIN.gas.mint} accent={C.amberHi} />
        <Card at={b(k + 1)} y={450} fn="2 · LOG THE STRIKE" call="logStrike(0, BSC USDT, 56, 4, evidence)" tx={CHAIN.tx.strike} gas={CHAIN.gas.strike} accent={C.crimson}>
          <div style={{ position: "absolute", right: 24, top: 18, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontFamily: F.comic, fontSize: 28, color: INK, marginRight: 6 }}>CONV</span>
            {[1, 2, 3, 4].map((i) => (
              <span key={i} style={{ width: 30, height: 30, border: `4px solid ${INK}`, background: i <= pips ? C.crimson : "transparent", transform: `rotate(45deg) scale(${i === pips ? 1.2 : 1})` }} />
            ))}
            <span style={{ fontFamily: F.comic, fontSize: 36, color: C.crimson, marginLeft: 8 }}>{pips}/4</span>
          </div>
        </Card>
        <Card at={b(k + 2)} y={690} fn="3 · RECORD THE OUTCOME" call="recordOutcome(0, +2500)" tx={CHAIN.tx.outcome} gas={CHAIN.gas.outcome} accent={C.green}>
          <div style={{ position: "absolute", right: 24, top: 14, fontFamily: F.comic, fontSize: 64, color: C.green, textShadow: `3px 3px 0 ${INK}` }}>+{bps.toLocaleString("en-US")} bps</div>
        </Card>

        {frame >= b(k + 2, 3) ? (
          <div style={{ position: "absolute", left: 930, top: 930, width: 880, display: "flex", justifyContent: "center", ...fadeUp(frame, b(k + 2, 3), 8, 12) }}>
            <div style={{ padding: "10px 22px", borderRadius: 12, background: "rgba(8,6,4,0.94)", border: `2px solid ${C.green}`, fontFamily: F.mono, fontSize: 23, color: C.text, whiteSpace: "nowrap" }}>
              reputation(0) → <b style={{ color: C.green }}>1 strike · 1 win · 0 losses · +2500 bps</b>
            </div>
          </div>
        ) : null}
      </Pulse>

      <Hanko x={1700} y={182} text="MINTED" at={b(k, 2)} size={96} rot={-9} color={C.amberHi} />
      <KatanaSlash at={b(k + 1)} x1={-80} y1={980} x2={2000} y2={80} seed="s6" hold={10} />
      <ComicText text="SLASH!" from={b(k + 1)} x={560} y={260} size={170} rotate={-10} skewX={-8} fill={C.washi} variant="onomatopoeia" echoColor={C.crimson} exitAt={b(k + 2)} />
      <ComicText text="WIN!" from={b(k + 2, 3)} x={520} y={250} size={200} rotate={-8} fill={C.green} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={5} opacity={0.85} color={C.washi} innerColor={C.gold} />

      <Sfx name="whoosh" at={b(k)} volume={0.4} />
      <Sfx name="impact" at={b(k, 1)} volume={0.7} />
      <Sfx name="impact" at={b(k, 2)} volume={0.6} />
      <Sfx name="tick" at={b(k, 3)} volume={0.5} />
      <Sfx name="impact" at={b(k + 1)} volume={1} />
      <Sfx name="whoosh" at={b(k + 1)} volume={0.6} />
      {[1, 2, 3].map((i) => (
        <Sfx key={`p${i}`} name="tick" at={b(k + 1, i)} volume={0.55} />
      ))}
      <Sfx name="impact" at={b(k + 2)} volume={0.75} />
      {[1, 2].map((i) => (
        <Sfx key={`c${i}`} name="tick" at={b(k + 2, i)} volume={0.55} />
      ))}
      <Sfx name="impact" at={b(k + 2, 3)} volume={0.8} />
      <Sfx name="chime" at={b(k + 2, 3)} volume={0.6} />
    </AbsoluteFill>
  );
};
