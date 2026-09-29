import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, ComicText, fadeUp, Glass, Halftone, INK, InkArrow, InkFrame, PAPER, PremiumBg, Pulse, Robot, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { HashBlock } from "../art";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S5 · THE HASH CHAIN (bars 13–15) — DROP. What the operator actually did on
 * BSC testnet (VERIFY-BNB.md smoke flow + the live page):
 *   13 b0 GENESIS = static runHash (LiveCertificate.start)   b1 operator update(epoch 0)
 *      b2 EPOCH 0 block   b3 formula
 *   14 b0 EPOCH 1 (in-season update)   b1 recompute vs on-chain   b2 "MATCHED!"   b3 tamper note
 */
const BX = [330, 960, 1590];
const BY = 440;

export const S5Chain: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.chain; // 13
  const p = useBeatPunch(beatsIn(k, k + 2), 0.02, 5);

  const blocks = [
    { at: b(k), label: "GENESIS · runHash", hash: CHAIN.hash.genesis, fill: PAPER },
    { at: b(k, 2), label: "EPOCH 0", hash: CHAIN.hash.afterEpoch0, fill: "#C9F7E4" },
    { at: b(k + 1), label: "EPOCH 1 · in season", hash: CHAIN.hash.current, fill: "#CDEFFF" },
  ];
  const pop = (t: number) => spring({ frame: frame - t, fps, config: { damping: 11, stiffness: 200, mass: 0.7 } });
  const matched = frame >= b(k + 1, 2);

  return (
    <AbsoluteFill>
      <PremiumBg glowA="rgba(52,211,153,0.24)" glowB="rgba(56,189,248,0.14)" glow="center" floor={0.45} grid={0.5} />
      <Halftone opacity={0.05} gap={18} />
      <SpeedBurst cx={960} cy={BY} from={0} count={20} inner={320} spread={820} color={C.emerald} opacity={0.3} width={6} seed="chain" />

      <ComicText text="Every epoch, hash-chained" from={b(k)} x={960} y={120} size={96} rotate={-2} skewX={-5} fill={C.emerald} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 184, textAlign: "center", fontFamily: F.display, fontStyle: "italic", fontSize: 34, color: C.text, ...fadeUp(frame, b(k, 1), 8, 14) }}>
        LiveCertificate on BSC testnet · token #1 · operator {CHAIN.operator.slice(0, 6)}…{CHAIN.operator.slice(-4)}
      </div>

      <Pulse intensity={1.1} shake={0.6}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <InkArrow x1={BX[0]! + 160} y1={BY} x2={BX[1]! - 160} y2={BY} at={b(k, 1)} dur={8} bend={-60} color={C.emerald} width={9} />
          <InkArrow x1={BX[1]! + 160} y1={BY} x2={BX[2]! - 160} y2={BY} at={b(k, 3)} dur={8} bend={-60} color={C.cyan} width={9} />
          {blocks.map((bl, i) => {
            if (frame < bl.at) return null;
            const s = pop(bl.at);
            return (
              <g key={i} transform={`translate(${BX[i]} ${BY}) scale(${(0.4 + 0.6 * s) * 1.0 * (i === 2 && matched ? p : 1)}) rotate(${[-2, 1.5, -1][i]})`}>
                <HashBlock x={0} y={0} s={1} label={bl.label} hash={bl.hash} fill={bl.fill} glow={matched && i > 0} />
              </g>
            );
          })}
          {frame >= b(k, 1) ? <Robot x={645} y={322 + Math.sin(frame / 6) * 5} s={0.6} fill="#B7C2D6" visor={C.emerald} flame={0.7} /> : null}
          {frame >= b(k, 3) ? <Robot x={1275} y={322 + Math.sin(frame / 6 + 1) * 5} s={0.6} fill="#B7C2D6" visor={C.cyan} flame={0.7} /> : null}
        </svg>

        {frame >= b(k, 1) ? (
          <div style={{ position: "absolute", left: 540, top: 470, fontFamily: F.mono, fontWeight: 700, fontSize: 24, color: C.emerald, ...fadeUp(frame, b(k, 1), 6, 10) }}>update(1, epoch 0)</div>
        ) : null}
        {frame >= b(k, 3) ? (
          <div style={{ position: "absolute", left: 1170, top: 470, fontFamily: F.mono, fontWeight: 700, fontSize: 24, color: C.cyan, ...fadeUp(frame, b(k, 3), 6, 10) }}>update(1, epoch 1)</div>
        ) : null}

        {frame >= b(k, 3) ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 680, display: "flex", justifyContent: "center", ...fadeUp(frame, b(k, 3), 8, 16) }}>
            <div style={{ fontFamily: F.mono, fontSize: 36, color: C.text, padding: "10px 26px", borderRadius: 12, background: "rgba(10,10,15,0.85)", border: `1px solid ${C.line}` }}>
              cumulative<sub style={{ fontSize: 22 }}>n</sub> = keccak(cumulative<sub style={{ fontSize: 22 }}>n−1</sub> ‖ epochHash<sub style={{ fontSize: 22 }}>n</sub>)
            </div>
          </div>
        ) : null}

        {frame >= b(k + 1, 1) ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 790, display: "flex", justifyContent: "center", ...fadeUp(frame, b(k + 1, 1), 8, 20) }}>
            <Glass radius={20} glow={matched ? 0.6 : 0.2} glowColor="rgba(52,211,153,0.5)" fill="rgba(12,14,14,0.94)" innerStyle={{ padding: "18px 34px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "auto auto", columnGap: 30, rowGap: 8, alignItems: "baseline" }}>
                <span style={{ fontFamily: F.sans, fontSize: 26, color: C.textMuted }}>recomputed · keccak(runHash ‖ keccak("epoch-0"))</span>
                <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: C.text }}>{CHAIN.hash.afterEpoch0}</span>
                <span style={{ fontFamily: F.sans, fontSize: 26, color: C.textMuted }}>on-chain cumulativeHash after epoch 0</span>
                <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: matched ? C.emerald : C.text }}>
                  {CHAIN.hash.afterEpoch0} {matched ? "✓" : ""}
                </span>
              </div>
            </Glass>
          </div>
        ) : null}
      </Pulse>

      <ComicText text="MATCHED!" from={b(k + 1, 2)} x={1600} y={610} size={110} rotate={-8} fill={C.emerald} variant="onomatopoeia" echoColor={INK} />
      {frame >= b(k + 1, 3) ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 44, textAlign: "center", fontFamily: F.sans, fontWeight: 600, fontSize: 28, color: C.textMuted, ...fadeUp(frame, b(k + 1, 3), 8, 12) }}>
          Rewrite one old epoch and every later hash stops matching.
        </div>
      ) : null}

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={0.9} />
      <Sfx name="whoosh" at={b(k, 1)} volume={0.4} />
      <Sfx name="impact" at={b(k, 2)} volume={0.6} />
      <Sfx name="tick" at={b(k, 3)} volume={0.55} />
      <Sfx name="impact" at={b(k + 1)} volume={0.7} />
      <Sfx name="tick" at={b(k + 1, 1)} volume={0.55} />
      <Sfx name="impact" at={b(k + 1, 2)} volume={0.9} />
      <Sfx name="chime" at={b(k + 1, 2)} volume={0.55} />
    </AbsoluteFill>
  );
};
