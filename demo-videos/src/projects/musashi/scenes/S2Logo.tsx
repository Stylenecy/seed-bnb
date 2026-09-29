import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, ComicText, fadeUp, Halftone, INK, InkFrame, Pulse, Sfx, SpeedBurst, useBeatPunch, useSceneClock } from "../../../kit";
import { BrushStroke, InkDefs, InkNight, KatanaSlash, Kanji } from "../art";
import { C, F, LOGO } from "../theme";
import { BAR } from "../timeline";

/**
 * S2 · LOGO (bars 40–43) — phrase DROP.
 *   40 b0 katana SLASH! across the frame, logo slams in over the rising sun
 *      b1 MUSASHI   b2 武蔵   b3 "Conviction-weighted token intelligence"
 *   41 b0 "Find early. Strike with conviction."   b2 "Every call on-chain."
 *   42 b0 NOW ON BNB CHAIN   b2 ink underline   b3 pipeline one-liner
 */
export const S2Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, beatsIn } = useSceneClock();
  const k = BAR.logo; // 40

  const slam = spring({ frame: frame - b(k) - 2, fps, config: { damping: 12, stiffness: 170, mass: 0.9 } });
  const logoScale = interpolate(slam, [0, 1], [2.3, 1]) * useBeatPunch(beatsIn(k, k + 3), 0.03, 5);
  const sun = spring({ frame: frame - b(k), fps, config: { damping: 18, stiffness: 90 } });
  const word = spring({ frame: frame - b(k, 1), fps, config: { damping: 11, stiffness: 240, mass: 0.5 } });
  const kan = spring({ frame: frame - b(k, 2), fps, config: { damping: 10, stiffness: 260, mass: 0.5 } });

  return (
    <AbsoluteFill>
      <InkNight glow={1.2} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <InkDefs id="sun2" scale={12} freq={0.02} />
        <circle cx={960} cy={300} r={250 * sun} fill={C.crimson} opacity={0.85} filter="url(#sun2)" />
      </svg>
      <Halftone opacity={0.05} gap={20} color={C.amber} mask="radial-gradient(ellipse at center, transparent 30%, black 80%)" />
      <SpeedBurst cx={960} cy={300} from={b(k)} count={28} inner={260} spread={760} color={C.gold} opacity={0.35} width={7} seed="mlogo" fade />

      <Pulse intensity={1.25} shake={0.7}>
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 300,
            transform: `translate(-50%, -50%) scale(${logoScale}) rotate(${(1 - slam) * -12}deg)`,
            opacity: frame < b(k) + 2 ? 0 : interpolate(slam, [0, 0.2], [0, 1], clamp),
            filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.7)) drop-shadow(0 0 30px rgba(217,119,6,0.35))",
          }}
        >
          <Img src={LOGO} style={{ width: 520, display: "block" }} />
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 500, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
          <div
            style={{
              fontFamily: F.sans,
              fontWeight: 800,
              fontSize: 150,
              letterSpacing: "0.08em",
              color: C.text,
              opacity: frame < b(k, 1) ? 0 : interpolate(word, [0, 0.3], [0, 1], clamp),
              transform: `translateY(${(1 - word) * 50}px) scale(${0.6 + 0.4 * word})`,
              textShadow: "0 8px 40px rgba(0,0,0,0.7)",
            }}
          >
            MUSASHI
          </div>
          <div style={{ opacity: frame < b(k, 2) ? 0 : 1, transform: `scale(${interpolate(kan, [0, 1], [2, 1])}) rotate(${(1 - kan) * 10}deg)` }}>
            <Kanji text="武蔵" size={130} color={C.amberHi} style={{ textShadow: `0 0 24px rgba(217,119,6,0.55), 4px 4px 0 ${INK}` }} />
          </div>
        </div>

        {frame >= b(k, 3) ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: 690, display: "flex", justifyContent: "center", ...fadeUp(frame, b(k, 3), 8, 20) }}>
            <div
              style={{
                padding: "12px 30px",
                borderRadius: 12,
                background: "rgba(90,60,20,0.5)",
                border: `1.5px solid rgba(217,119,6,0.55)`,
                boxShadow: "0 0 24px rgba(217,119,6,0.25)",
                fontFamily: F.sans,
                fontWeight: 600,
                fontSize: 36,
                color: C.text,
              }}
            >
              Conviction-Weighted Token Intelligence
            </div>
          </div>
        ) : null}

        <div style={{ position: "absolute", left: 0, right: 0, top: 790, textAlign: "center", fontFamily: F.display, fontSize: 60, color: C.washi, ...fadeUp(frame, b(k + 1), 10, 24) }}>
          {frame >= b(k + 1) ? (
            <>
              Find early. <i style={{ color: C.amberHi }}>Strike with conviction.</i>
              {frame >= b(k + 1, 2) ? <span style={{ color: C.textMuted, fontSize: 46 }}> Every call on-chain.</span> : null}
            </>
          ) : null}
        </div>

        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <InkDefs />
          <BrushStroke x={610} y={866} w={700} h={40} at={b(k + 2, 2)} dur={6} color={C.crimson} id="ul" opacity={0.9} />
        </svg>

        <div style={{ position: "absolute", left: 0, right: 0, top: 920, display: "flex", justifyContent: "center" }}>
          <BnbBadge label="NOW ON BNB CHAIN" at={b(k + 2)} size={40} variant="comic" />
        </div>
      </Pulse>

      <KatanaSlash at={b(k)} x1={-100} y1={760} x2={2020} y2={120} seed="s2" />
      <ComicText text="SLASH!" from={b(k)} x={1520} y={170} size={150} rotate={-10} skewX={-8} fill={C.washi} variant="onomatopoeia" echoColor={C.crimson} exitAt={b(k + 1)} />
      {frame >= b(k + 2, 3) ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 44, textAlign: "center", fontFamily: F.mono, fontSize: 24, color: C.textMuted, ...fadeUp(frame, b(k + 2, 3), 8, 10) }}>
          7 elimination gates · 4 specialists · adversarial debate · only the survivors STRIKE
        </div>
      ) : null}

      <InkFrame inset={22} width={5} opacity={0.85} color={C.washi} innerColor={C.gold} />

      <Sfx name="impact" at={b(k)} volume={1} />
      <Sfx name="whoosh" at={b(k)} volume={0.6} />
      <Sfx name="tick" at={b(k, 1)} volume={0.5} />
      <Sfx name="impact" at={b(k, 2)} volume={0.6} />
      <Sfx name="tick" at={b(k, 3)} volume={0.5} />
      <Sfx name="tick" at={b(k + 1)} volume={0.45} />
      <Sfx name="tick" at={b(k + 1, 2)} volume={0.45} />
      <Sfx name="impact" at={b(k + 2)} volume={0.85} />
      <Sfx name="chime" at={b(k + 2)} volume={0.5} />
    </AbsoluteFill>
  );
};
