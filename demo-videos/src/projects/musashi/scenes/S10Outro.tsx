import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, DriftDots, fadeUp, Halftone, InkFrame, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { BrushStroke, InkDefs, InkNight, KatanaSlash, Kanji } from "../art";
import { C, F, LOGO } from "../theme";
import { BAR, TOTAL } from "../timeline";

/**
 * S10 · OUTRO (bars 64–68; the music is spliced to the file's last phrase 68–72).
 *   64 b0 slash + logo slam   b1 MUSASHI 武蔵   b2 tagline   b3 BUILT ON BNB CHAIN
 *   65 b0 site / repo footer  66 → end: fade to ink with the music
 */
export const S10Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, start } = useSceneClock();
  const k = BAR.outro; // 64

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 13, stiffness: 160, mass: 0.9 } });
  const word = spring({ frame: frame - b(k, 1), fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  const sun = spring({ frame: frame - b(k), fps, config: { damping: 20, stiffness: 70 } });
  const fadeOut = interpolate(frame, [b(k + 2), TOTAL - start], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: "#050303" }}>
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <InkNight glow={1.1} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <InkDefs id="sun10" scale={12} freq={0.02} />
          <circle cx={560} cy={330} r={230 * sun} fill={C.crimson} opacity={0.85} filter="url(#sun10)" />
        </svg>
        <Halftone opacity={0.04} gap={20} color={C.amber} />
        <DriftDots count={14} seed="moutro" color={C.gold} alt={C.amberHi} opacity={0.35} />
        <SpeedBurst cx={560} cy={330} from={b(k)} count={20} inner={170} spread={560} color={C.gold} opacity={0.3} width={6} seed="mout" fade />

        <Pulse intensity={0.9} shake={0.3}>
          <div
            style={{
              position: "absolute",
              left: 560,
              top: 330,
              transform: `translate(-50%, -50%) scale(${interpolate(slam, [0, 1], [1.9, 1])}) rotate(${(1 - slam) * 12}deg)`,
              opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
              filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.7))",
            }}
          >
            <Img src={LOGO} style={{ width: 460, display: "block" }} />
          </div>
          <div style={{ position: "absolute", left: 900, top: 200, opacity: frame < b(k, 1) ? 0 : interpolate(word, [0, 0.3], [0, 1], clamp), transform: `translateX(${(1 - word) * 60}px)` }}>
            <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 150, letterSpacing: "0.08em", color: C.text, lineHeight: 1 }}>MUSASHI</div>
            <Kanji text="武蔵" size={90} color={C.amberHi} style={{ marginTop: 14, letterSpacing: "0.3em" }} />
          </div>

          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <InkDefs />
            <BrushStroke x={330} y={640} w={1260} h={120} at={b(k, 2)} dur={7} color="#1a0d08" id="o10" opacity={0.95} />
          </svg>
          <div style={{ position: "absolute", left: 0, right: 0, top: 662, textAlign: "center", ...fadeUp(frame, b(k, 2) + 2, 10, 20) }}>
            <div style={{ fontFamily: F.display, fontSize: 66, color: C.washi }}>
              Find early. <i style={{ color: C.amberHi }}>Strike with conviction.</i>
            </div>
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 820, display: "flex", justifyContent: "center" }}>
            <BnbBadge label="BUILT ON BNB CHAIN" at={b(k, 3)} size={40} variant="gold" />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 935, textAlign: "center", fontFamily: F.mono, fontSize: 28, color: C.textMuted, ...fadeUp(frame, b(k + 1), 10, 16) }}>
            musashi-agent.xyz · github.com/yeheskieltame/musashi · BSC Testnet (chainId 97)
          </div>
        </Pulse>

        <InkFrame inset={22} width={5} opacity={0.8} color={C.washi} innerColor={C.gold} />
      </AbsoluteFill>
      <KatanaSlash at={b(k)} x1={-80} y1={200} x2={2000} y2={900} seed="s10" hold={8} />

      <Sfx name="impact" at={b(k)} volume={0.85} />
      <Sfx name="whoosh" at={b(k, 1)} volume={0.4} />
      <Sfx name="tick" at={b(k, 2)} volume={0.45} />
      <Sfx name="chime" at={b(k, 3)} volume={0.6} />
    </AbsoluteFill>
  );
};
