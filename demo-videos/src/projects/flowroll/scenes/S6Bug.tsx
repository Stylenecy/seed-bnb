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
  SpeedBurst,
  useBeatPunch,
  useSceneClock,
  Vault,
} from "../../../kit";
import { ChainLinks, Padlock } from "../art";
import { C, CHAIN, F } from "../theme";
import { BAR } from "../timeline";

/**
 * S6 · THE BUG (bars 26–28). Slides in. A payday bug that predates the BNB
 * migration was found while verifying, and fixed (VERIFY-BNB.md → "Bugs fixed").
 *   26 b0  panel: payday reverts 0xe025cb32 (InsufficientPendingSalary), vault chained
 *      b1  the error name · b2 "STUCK!" · b3 who it hit (addEmployee groups, every cycle after #1)
 *   27 b0 (break)  "FIXED!" panel slams: pending salary per funded cycle, released on cancel, saturates at 0
 *      b1  265/265 tests · b2 3 new regression tests (2 fail on the old contract) · b3 ABIs unchanged
 */
const Code: React.FC<{ at: number; sign: "+" | "−"; children: React.ReactNode }> = ({ at, sign, children }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <div
      style={{
        fontFamily: F.mono,
        fontSize: 25,
        color: INK,
        background: sign === "+" ? "rgba(16,185,129,0.22)" : "rgba(244,63,94,0.2)",
        borderLeft: `6px solid ${sign === "+" ? "#0f9f6e" : C.rose}`,
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
  const k = BAR.bug; // 26

  const pA = useBeatPunch(beatsIn(k, k + 1), 0.025, 5);
  const pB = useBeatPunch(beatsIn(k + 1, k + 2), 0.025, 5);
  const shake = frame >= b(k, 2) && frame < b(k + 1) ? Math.sin(frame * 2.3) * 4 * Math.exp(-(frame - b(k, 2)) / 8) : 0;
  const tests = Math.round(interpolate(frame, [b(k + 1, 1), b(k + 1, 1) + 8], [0, 265], clamp));

  return (
    <AbsoluteFill>
      <PremiumBg base={C.bg} glowA="rgba(244,63,94,0.2)" glowB="rgba(16,185,129,0.2)" glow="top" floor={0.3} />
      <Halftone opacity={0.05} gap={18} />

      <Caption at={b(k)} x={96} y={70} size={40} bg={C.amber} rot={-1.2} maxWidth={1500}>
        Found while verifying the BNB port: a payday bug that predates it.
      </Caption>

      <Pulse intensity={0.9} shake={0.4}>
        {/* BUG panel */}
        <ComicPanel at={b(k)} x={96} y={190} w={840} h={760} rot={-1.2} bg="#FFC2CC" bg2={C.rose} from="left" punch={pA}>
          <div style={{ position: "absolute", left: 30, top: 26, fontFamily: F.comic, fontSize: 58, color: INK, letterSpacing: "0.02em" }}>BEFORE · PAYDAY</div>
          <svg width={840} height={420} viewBox="0 0 840 420" style={{ position: "absolute", left: 0, top: 90, transform: `translateX(${shake}px)` }}>
            <Vault x={420} y={210} s={1.35} label="CYCLE FUNDS" fill="#3a3550" />
            <ChainLinks x={420} y={200} n={11} rot={-14} />
            <ChainLinks x={420} y={220} n={11} rot={14} />
            <Padlock x={420} y={260} s={1.15} />
          </svg>
          <div style={{ position: "absolute", left: 30, right: 30, top: 520 }}>
            <div style={{ fontFamily: F.mono, fontSize: 30, color: INK, fontWeight: 700, ...fadeUp(frame, b(k), 6, 10) }}>
              payday → <span style={{ color: "#b0102d" }}>revert {CHAIN.bugError}</span>
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 22, color: INK, marginTop: 6, ...fadeUp(frame, b(k, 1), 6, 10) }}>PayrollManager__InsufficientPendingSalary</div>
            <div style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 26, color: INK, marginTop: 16, lineHeight: 1.3, background: "#fff", border: `4px solid ${INK}`, boxShadow: `5px 5px 0 ${INK}`, padding: "10px 14px", ...fadeUp(frame, b(k, 3), 6, 10) }}>
              Pending salary was only counted once. Groups built with <b>addEmployee</b>, and <b>every cycle after the first</b>, locked their funds.
            </div>
          </div>
        </ComicPanel>

        {/* FIX panel */}
        <ComicPanel at={b(k + 1)} x={984} y={200} w={840} h={750} rot={1.2} bg="#B8F5D6" bg2={C.emerald} from="right" punch={pB}>
          <div style={{ position: "absolute", left: 30, top: 26, fontFamily: F.comic, fontSize: 58, color: INK, letterSpacing: "0.02em" }}>AFTER · THE FIX</div>
          <div style={{ position: "absolute", left: 30, right: 30, top: 110 }}>
            <Code at={b(k + 1)} sign="+">pending salary added per funded cycle</Code>
            <Code at={b(k + 1)} sign="+">released again in cancelCycle</Code>
            <Code at={b(k + 1)} sign="+">removeFromTotalPendingSalary saturates at 0</Code>
          </div>
          <div style={{ position: "absolute", left: 30, top: 360, display: "flex", alignItems: "baseline", gap: 20, opacity: frame >= b(k + 1, 1) ? 1 : 0 }}>
            <span style={{ ...inkTextStyle(170, "#fff"), fontVariantNumeric: "tabular-nums" }}>{tests}/265</span>
          </div>
          <div style={{ position: "absolute", left: 34, top: 560, fontFamily: F.comic, fontSize: 44, color: INK, ...fadeUp(frame, b(k + 1, 1), 6, 10) }}>FORGE TESTS PASS</div>
          <div style={{ position: "absolute", left: 30, right: 30, top: 620, fontFamily: F.sans, fontWeight: 500, fontSize: 26, color: INK, lineHeight: 1.3, ...fadeUp(frame, b(k + 1, 2), 6, 10) }}>
            3 new regression tests: 2 fail on the old contract, all 3 pass now.
            <span style={{ opacity: frame >= b(k + 1, 3) ? 1 : 0 }}> Public ABIs unchanged.</span>
          </div>
        </ComicPanel>
      </Pulse>

      <ComicText text="STUCK!" from={b(k, 2)} x={700} y={300} size={130} rotate={-10} fill={C.rose} variant="onomatopoeia" echoColor={INK} exitAt={b(k + 1, 2)} />
      <SpeedBurst cx={1400} cy={580} from={b(k + 1)} count={18} inner={200} spread={500} color={C.emerald} opacity={0.5} width={7} seed="fix" fade />
      <ComicText text="FIXED!" from={b(k + 1)} x={1640} y={250} size={140} rotate={8} fill={C.gold} variant="onomatopoeia" echoColor={INK} />

      <InkFrame inset={22} width={5} opacity={0.85} color="#f4efe4" />

      <Sfx name="impact" at={b(k)} volume={0.7} />
      <Sfx name="tick" at={b(k, 1)} volume={0.5} />
      <Sfx name="impact" at={b(k, 2)} volume={0.8} />
      <Sfx name="tick" at={b(k, 3)} volume={0.5} />
      <Sfx name="impact" at={b(k + 1)} volume={0.85} />
      <Sfx name="chime" at={b(k + 1, 1)} volume={0.55} />
      <Sfx name="tick" at={b(k + 1, 2)} volume={0.5} />
      <Sfx name="tick" at={b(k + 1, 3)} volume={0.5} />
    </AbsoluteFill>
  );
};
