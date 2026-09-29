import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, DriftDots, fadeUp, Halftone, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, CHAIN, F, GRADIENT, short } from "../theme";
import { BAR, TOTAL } from "../timeline";
import { FlowMark, GradText } from "../ui";

/**
 * S9 · OUTRO (bar 36 → end). Rides the track's outro to silence (bar 40).
 *   36 b0  mark slam (hard cut) · b2 FLOWROLL wordmark
 *   37 b0  tagline · b2 violet → teal streak
 *   38 b0  BUILT ON BNB CHAIN badge
 *   39 b0  repo + contract footer; fade to ink from 39 b2 as the music dies
 */
export const S9Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, start } = useSceneClock();
  const k = BAR.outro; // 36

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 13, stiffness: 160, mass: 0.9 } });
  const word = spring({ frame: frame - b(k, 2), fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  const streak = interpolate(frame, [b(k + 1, 2), b(k + 2)], [0, 100], clamp);
  const fadeOut = interpolate(frame, [b(k + 3, 2), TOTAL - start], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: "#05070c" }}>
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <PremiumBg base={C.bg} glowA="rgba(124,58,237,0.24)" glowB="rgba(20,184,166,0.2)" glow="center" floor={0.5} />
        <Halftone opacity={0.04} gap={20} />
        <DriftDots count={14} seed="flowroll-outro" color="#F0B90B" alt={C.tealLite} opacity={0.35} />
        <SpeedBurst cx={960} cy={320} from={b(k)} count={20} inner={170} spread={560} color="#F0B90B" opacity={0.35} width={6} seed="out" fade />

        <Pulse intensity={0.8} shake={0.2}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", alignItems: "center", gap: 44 }}>
            <div style={{ transform: `scale(${interpolate(slam, [0, 1], [1.9, 1])}) rotate(${(1 - slam) * 12}deg)`, opacity: interpolate(slam, [0, 0.2], [0, 1], clamp) }}>
              <FlowMark size={210} />
            </div>
            <div
              style={{
                fontFamily: F.display,
                fontWeight: 800,
                fontSize: 170,
                letterSpacing: "-0.03em",
                color: C.text,
                opacity: frame < b(k, 2) ? 0 : interpolate(word, [0, 0.3], [0, 1], clamp),
                transform: `translateX(${(1 - word) * 60}px)`,
              }}
            >
              FLOWROLL
            </div>
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center", ...fadeUp(frame, b(k + 1), 12, 30) }}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 82, color: C.text, letterSpacing: "-0.02em" }}>
              Payroll that <GradText>pays for itself.</GradText>
            </div>
            <div style={{ fontFamily: F.sans, fontSize: 34, color: C.dim, marginTop: 12 }}>Idle salary earns yield · advances on demand · payday on autopilot</div>
          </div>
          <div
            style={{
              position: "absolute",
              left: 460,
              width: 1000,
              top: 650,
              height: 8,
              borderRadius: 8,
              background: GRADIENT,
              clipPath: `inset(0 ${100 - streak}% 0 0)`,
              boxShadow: "0 0 24px rgba(45,212,191,0.5)",
            }}
          />

          <div style={{ position: "absolute", left: 0, right: 0, top: 710, display: "flex", justifyContent: "center" }}>
            <BnbBadge label="BUILT ON BNB CHAIN" at={b(k + 2)} size={40} variant="gold" />
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 850, textAlign: "center", ...fadeUp(frame, b(k + 3), 12, 16) }}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 38, color: C.text }}>seed-bnb-indo / flowrol</div>
            <div style={{ fontFamily: F.mono, fontSize: 24, color: C.dim, marginTop: 10 }}>
              BSC Testnet (97) · PayrollManager {short(CHAIN.payrollManager)} · PayVault {short(CHAIN.payVault)}
            </div>
          </div>
        </Pulse>

        <InkFrame inset={22} width={5} opacity={0.8} color="#f4efe4" innerColor="#F0B90B" />
      </AbsoluteFill>

      <Sfx name="impact" at={b(k)} volume={0.85} />
      <Sfx name="whoosh" at={b(k, 2)} volume={0.4} />
      <Sfx name="chime" at={b(k + 2)} volume={0.6} />
    </AbsoluteFill>
  );
};
