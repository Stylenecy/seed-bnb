import React from "react";
import { BnbMark } from "../lib/BnbMark";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Atmosphere, Mascot, Sfx } from "../lib/ui";
import { Pulse } from "../lib/Pulse";
import { Halftone, InkFrame, SpeedBurst } from "../lib/comicFx";
import { COLORS } from "../lib/tokens";
import { FONT_DISPLAY, FONT_SANS } from "../lib/fonts";
import { barA, beatA } from "../lib/beat";

/**
 * S2 starts on bar 7 (comp frame 401) and lives EXACTLY ONE BAR — the quiet
 * breakdown. The logo blinks in the hush and the comic strip hard-cuts in the
 * instant the build re-enters on bar 8 (user: the brand beat must be fast).
 *   beat 28 (0)  — the mark pops
 *   beat 29 (14) — wordmark reveals + chime
 *   beat 30 (28) — tagline + mascot + bottom line
 *   beat 31 (42) — gold shimmer whips across the wordmark into the cut
 */
const S = barA(7);
const bt = (k: number): number => beatA(k) - S; // local beat frame

const AnimatedMark: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 130, mass: 0.9 },
  });
  // Ring is already an arc on the hard cut into S2, then completes.
  const ringDraw = interpolate(frame, [0, 14], [0.55, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dotPop = spring({
    frame: frame - bt(29),
    fps,
    config: { damping: 12, stiffness: 160, mass: 0.7 },
  });
  const size = 150;
  const r = 58;
  const c = 2 * Math.PI * r;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: COLORS.sunken,
        border: `1px solid ${COLORS.hairlineStrong}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Base scale > 0 so the mark is already present on the hard cut into S2.
        transform: `scale(${0.62 + pop * 0.38})`,
        boxShadow: "0 0 60px -10px rgba(201,168,105,0.35)",
      }}
    >
      <svg width={size * 0.82} height={size * 0.82} viewBox="0 0 150 150">
        <circle
          cx={75}
          cy={75}
          r={r}
          fill="none"
          stroke={COLORS.gold}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ringDraw)}
          transform="rotate(-90 75 75)"
        />
        <circle cx={75} cy={75} r={20 * dotPop} fill={COLORS.gold} />
      </svg>
    </div>
  );
};

export const S2Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wordP = spring({
    frame: frame - bt(29),
    fps,
    config: { damping: 200, stiffness: 120, mass: 0.7 },
  });
  const subP = spring({
    frame: frame - bt(30),
    fps,
    config: { damping: 200, stiffness: 120 },
  });
  const bottomP = interpolate(frame, [bt(30), bt(30) + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Gold shimmer whips across the wordmark on the LAST beat, into the cut.
  const shimmer = interpolate(frame, [bt(31), bt(31) + 14], [-120, 220], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bob = Math.sin(frame / 22) * 8;
  const mascotP = spring({
    frame: frame - bt(30),
    fps,
    config: { damping: 200, stiffness: 110 },
  });

  return (
    <Atmosphere>
      {/* Comic house style — same treatment family as the S7 close so the two
          brand beats bookend: halftone texture, one radial ink/gold speed-burst
          snapping out behind the mark on the hard-cut pop, a thin comic frame. */}
      <Halftone opacity={0.05} />
      <SpeedBurst cx={476} cy={506} from={0} count={13} inner={112} spread={300} width={5} opacity={0.34} seed="s2burst" />
      <Pulse sceneStart={S} intensity={1} shake={0.6}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <AnimatedMark />
          <div
            style={{
              opacity: wordP,
              transform: `translateX(${(1 - wordP) * -30}px)`,
              position: "relative",
            }}
          >
            <span
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 600,
                fontSize: 116,
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
                backgroundImage: `linear-gradient(100deg, ${COLORS.text} ${shimmer - 40}%, ${COLORS.goldSoft} ${shimmer}%, ${COLORS.text} ${shimmer + 40}%)`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                display: "inline-block",
              }}
            >
              Cermin-RWA
            </span>
          </div>
          <div
            style={{
              opacity: mascotP,
              transform: `translateY(${bob}px) scale(${0.6 + mascotP * 0.4})`,
            }}
          >
            <Mascot name="watch" size={220} />
          </div>
        </div>

        <div
          style={{
            marginTop: 22,
            opacity: subP,
            transform: `translateY(${(1 - subP) * 18}px)`,
            fontFamily: FONT_SANS,
            fontWeight: 400,
            fontSize: 40,
            color: COLORS.muted,
            letterSpacing: "0.01em",
          }}
        >
          Your loan's on-chain guardian.
        </div>
      </AbsoluteFill>
      </Pulse>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 70,
        }}
      >
        <div
          style={{
            opacity: bottomP * 0.8,
            fontFamily: FONT_SANS,
            fontWeight: 500,
            fontSize: 22,
            letterSpacing: "0.28em",
            color: COLORS.faint,
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <BnbMark size={30} />
          Cermin-RWA · Now on BNB Chain
        </div>
      </AbsoluteFill>

      {/* Thin comic panel border framing the whole brand beat. */}
      <InkFrame inset={30} width={4} radius={22} opacity={0.8} innerRule />

      <Sfx type="chime" at={bt(29)} volume={0.45} />
    </Atmosphere>
  );
};
