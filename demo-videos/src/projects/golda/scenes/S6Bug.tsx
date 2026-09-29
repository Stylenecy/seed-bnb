import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  Caption,
  clamp,
  ComicPanel,
  ComicText,
  fadeUp,
  Halftone,
  INK,
  inkTextStyle,
  InkFrame,
  PremiumBg,
  Pulse,
  Sfx,
  useBeatPunch,
  useSceneClock,
} from "../../../kit";
import { Padlock, RouterNode } from "../art";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S6 · THE BUG (bars 17–19; 17 is a drop). Found on the fork (VERIFY-BNB.md "Bugs fixed"):
 * DeployGolda whitelisted two LI.FI selectors the BSC Diamond does not have.
 *   17 b0  BEFORE panel: 0x4630a0d8 / 0xd6a4bc50 · b1 facetAddress() = 0x0 · b2 "REVERT!" · b3 RebalanceFailed
 *   18 b0  AFTER panel: 0x4666fc80 / 0x5fd9ae2e (GenericSwapFacetV3) · b1 registered · b2 the live API uses them · b3 24/24 tests
 */
const Code: React.FC<{ at: number; sign: "+" | "−"; children: React.ReactNode }> = ({ at, sign, children }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <div
      style={{
        fontFamily: F.mono,
        fontSize: 26,
        color: INK,
        background: sign === "+" ? "rgba(16,185,129,0.22)" : "rgba(244,63,94,0.2)",
        borderLeft: `6px solid ${sign === "+" ? "#0f9f6e" : "#d6334f"}`,
        padding: "8px 14px",
        marginTop: 10,
        ...fadeUp(frame, at, 6, 12),
      }}
    >
      <b>{sign}</b> {children}
    </div>
  );
};

export const S6Bug: React.FC = () => {
  const frame = useCurrentFrame();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.bug; // 17

  const pA = useBeatPunch(beatsIn(k, k + 1), 0.025, 5);
  const pB = useBeatPunch(beatsIn(k + 1, k + 2), 0.025, 5);
  const shake = frame >= b(k, 2) && frame < b(k + 1) ? Math.sin(frame * 2.3) * 5 * Math.exp(-(frame - b(k, 2)) / 8) : 0;
  const unlock = interpolate(frame, [b(k + 1, 1), b(k + 1, 1) + 8], [0, 1], clamp);
  const tests = Math.round(interpolate(frame, [b(k + 1, 3), b(k + 1, 3) + 8], [0, 24], clamp));

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(255,107,107,0.2)" glowB="rgba(38,161,123,0.2)" glow="top" floor={0.3} />
      <Halftone opacity={0.05} gap={18} />

      <Caption at={b(k)} x={96} y={70} size={40} bg={C.amber} rot={-1.2} maxWidth={1600}>
        Found on the fork: the deploy script whitelisted the wrong LI.FI selectors.
      </Caption>

      <Pulse intensity={0.9} shake={0.4}>
        <ComicPanel at={b(k)} x={96} y={190} w={840} h={760} rot={-1.2} bg="#FFC2CC" bg2={C.rose} from="left" punch={pA}>
          <div style={{ position: "absolute", left: 30, top: 26, fontFamily: F.comic, fontSize: 58, color: INK, letterSpacing: "0.02em" }}>BEFORE</div>
          <svg width={840} height={300} viewBox="0 0 840 300" style={{ position: "absolute", left: 0, top: 90, transform: `translateX(${shake}px)` }}>
            <RouterNode x={250} y={150} s={1.2} fill="#d9d2ff" />
            <Padlock x={560} y={150} s={1.25} fill="#8b8f99" mark="✕" />
          </svg>
          <div style={{ position: "absolute", left: 34, right: 34, top: 410 }}>
            <Code at={b(k)} sign="−">{CHAIN.fork.selOld[0]} swapTokensGeneric</Code>
            <Code at={b(k)} sign="−">{CHAIN.fork.selOld[1]} standardizedCall</Code>
            <Code at={b(k, 1)} sign="−">facetAddress(sel) → 0x0 on BSC</Code>
            {frame >= b(k, 3) ? (
              <div style={{ marginTop: 18, fontFamily: F.sans, fontWeight: 700, fontSize: 28, color: INK, ...fadeUp(frame, b(k, 3), 6, 10) }}>
                → every rebalance reverts with <span style={{ fontFamily: F.mono }}>RebalanceFailed</span>
              </div>
            ) : null}
          </div>
        </ComicPanel>

        <ComicPanel at={b(k + 1)} x={990} y={190} w={834} h={760} rot={1.2} bg="#BFF0DC" bg2={C.usdt} from="right" punch={pB}>
          <div style={{ position: "absolute", left: 30, top: 26, fontFamily: F.comic, fontSize: 58, color: INK, letterSpacing: "0.02em" }}>AFTER · FIXED</div>
          <svg width={834} height={300} viewBox="0 0 834 300" style={{ position: "absolute", left: 0, top: 90 }}>
            <RouterNode x={250} y={150} s={1.2} fill="#d9d2ff" />
            <Padlock x={560} y={150} s={1.25} fill={C.goldSoft} open={unlock} mark="✓" />
          </svg>
          <div style={{ position: "absolute", left: 34, right: 34, top: 410 }}>
            <Code at={b(k + 1)} sign="+">{CHAIN.fork.selNew2} swapTokensSingleV3ERC20ToERC20</Code>
            <Code at={b(k + 1)} sign="+">{CHAIN.fork.selLive} swapTokensMultipleV3ERC20ToERC20</Code>
            <Code at={b(k + 1, 1)} sign="+">GenericSwapFacetV3 · registered on BSC</Code>
            {frame >= b(k + 1, 2) ? (
              <div style={{ marginTop: 18, fontFamily: F.sans, fontWeight: 700, fontSize: 28, color: INK, ...fadeUp(frame, b(k + 1, 2), 6, 10) }}>
                → the live li.quest API returns these, and the swap goes through
              </div>
            ) : null}
          </div>
          {frame >= b(k + 1, 3) ? (
            <div style={{ position: "absolute", right: 34, bottom: 18, display: "flex", alignItems: "baseline", gap: 14 }}>
              <div style={{ ...inkTextStyle(72, "#fff") }}>{tests}/24</div>
              <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 24, color: INK }}>forge tests pass</div>
            </div>
          ) : null}
        </ComicPanel>
      </Pulse>

      <ComicText text="REVERT!" from={b(k, 2)} x={700} y={300} size={120} rotate={-9} fill={C.rose} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1)} />
      <ComicText text="FIXED!" from={b(k + 1, 1)} x={1500} y={330} size={130} rotate={-6} fill={C.goldSoft} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={0.8} />
      <Sfx name="tick" at={b(k, 1)} volume={0.5} />
      <Sfx name="impact" at={b(k, 2)} volume={0.9} />
      <Sfx name="tick" at={b(k, 3)} volume={0.5} />
      <Sfx name="impact" at={b(k + 1)} volume={0.8} />
      <Sfx name="chime" at={b(k + 1, 1)} volume={0.6} />
      <Sfx name="tick" at={b(k + 1, 2)} volume={0.5} />
      <Sfx name="tick" at={b(k + 1, 3)} volume={0.6} />
    </AbsoluteFill>
  );
};
