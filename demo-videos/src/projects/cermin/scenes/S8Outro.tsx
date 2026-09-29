import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BnbBadge, clamp, DriftDots, fadeUp, Halftone, InkFrame, PremiumBg, Pulse, Sfx, SpeedBurst, useSceneClock } from "../../../kit";
import { C, CHAIN, F, HERO_ART, LOGO, short } from "../theme";
import { BAR, TOTAL } from "../timeline";

/**
 * S8 · OUTRO (bars 43 → 48) — rides the track's own outro to silence.
 *   bar 43 b0  C-mirror mark slams      b2 "Cermin" wordmark
 *   bar 44 b0  headline + b2 recap line (skims · defends · non-custodial)
 *   bar 45 b0  BUILT ON BNB CHAIN badge
 *   bar 46 b0  repo / network / factory footer
 *   bar 47 b2  → fade to ink as the song ends (bar 48)
 * The watercolor horizon is the frontend's own hero art.
 */
export const S8Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { b, start } = useSceneClock();
  const k = BAR.outro; // 43

  const slam = spring({ frame: frame - b(k), fps, config: { damping: 13, stiffness: 160, mass: 0.9 } });
  const word = spring({ frame: frame - b(k, 2), fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  const endLocal = TOTAL - start;
  const fadeOut = interpolate(frame, [b(k + 4, 2), endLocal], [1, 0], clamp);
  const drift = interpolate(frame, [0, endLocal], [1.04, 1.12]);

  return (
    <AbsoluteFill style={{ background: "#0b0907" }}>
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <PremiumBg base="#110e0b" glowA="rgba(240,185,11,0.18)" glowB="rgba(199,122,58,0.2)" glow="center" floor={0} beams={false} />
        {/* the frontend's own hero art, low and warm */}
        <AbsoluteFill
          style={{
            top: 420,
            overflow: "hidden",
            opacity: 0.6,
            maskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 30%, #000 70%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 30%, #000 70%)",
          }}
        >
          <Img
            src={HERO_ART}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "bottom",
              transform: `scale(${drift})`,
              transformOrigin: "bottom",
              filter: "saturate(0.9) brightness(0.8)",
            }}
          />
        </AbsoluteFill>
        <Halftone opacity={0.04} gap={20} color={C.amberHi} />
        <DriftDots count={14} seed="outro" color="#F0B90B" alt={C.amber} opacity={0.35} />
        <SpeedBurst cx={960} cy={250} from={b(k)} count={20} inner={150} spread={520} color="#F0B90B" opacity={0.32} width={6} seed="out" fade />

        <Pulse intensity={0.8} shake={0.2}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 130, display: "flex", justifyContent: "center", alignItems: "center", gap: 36 }}>
            <div
              style={{
                width: 170,
                height: 170,
                borderRadius: 46,
                background: C.cream,
                padding: 18,
                transform: `scale(${interpolate(slam, [0, 1], [1.9, 1])}) rotate(${(1 - slam) * 12}deg)`,
                opacity: interpolate(slam, [0, 0.2], [0, 1], clamp),
                boxShadow: "0 0 0 5px #0b0907, 10px 10px 0 5px #0b0907, 0 0 80px rgba(240,185,11,0.3)",
              }}
            >
              <Img src={LOGO} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div
              style={{
                fontFamily: F.display,
                fontWeight: 500,
                fontSize: 170,
                letterSpacing: "-0.02em",
                color: C.text,
                opacity: frame < b(k, 2) ? 0 : interpolate(word, [0, 0.3], [0, 1], clamp),
                transform: `translateX(${(1 - word) * 60}px)`,
              }}
            >
              Cermin
            </div>
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 380, textAlign: "center", ...fadeUp(frame, b(k + 1), 12, 30) }}>
            <div style={{ fontFamily: F.display, fontSize: 76, color: C.text, letterSpacing: "-0.01em" }}>
              Your BNB stays <i>whole</i>. <i style={{ color: C.amberHi }}>The Shadow is what you live on.</i>
            </div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 500, textAlign: "center", fontFamily: F.sans, fontSize: 32, color: C.textDim, ...fadeUp(frame, b(k + 1, 2), 12, 16) }}>
            Skims the peaks · defends the dips · non-custodial · open-source
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 600, display: "flex", justifyContent: "center" }}>
            <BnbBadge label="BUILT ON BNB CHAIN" at={b(k + 2)} size={40} variant="gold" />
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: 740, textAlign: "center", fontFamily: F.mono, fontSize: 27, color: C.text, ...fadeUp(frame, b(k + 3), 12, 16) }}>
            seed-bnb-indo / Cermin · BSC Testnet (chainId 97) · CerminFactory {short(CHAIN.factory, 6, 4)}
          </div>
        </Pulse>

        <InkFrame inset={22} width={5} opacity={0.8} color={C.cream} innerColor="#F0B90B" />
      </AbsoluteFill>

      <Sfx name="impact" at={b(k)} volume={0.85} />
      <Sfx name="whoosh" at={b(k, 2)} volume={0.4} />
      <Sfx name="chime" at={b(k + 2)} volume={0.6} />
    </AbsoluteFill>
  );
};
