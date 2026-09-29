import React from "react";
import { BnbMark } from "../lib/BnbMark";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Atmosphere, Logo, Mascot, Sfx } from "../lib/ui";
import { Pulse } from "../lib/Pulse";
import { DriftDots, Halftone, InkFrame, SpeedBurst } from "../lib/comicFx";
import { COLORS, SCENE_DUR } from "../lib/tokens";
import { FONT_DISPLAY, FONT_SANS } from "../lib/fonts";
import { barC, beatC, BAR_S, FPS } from "../lib/beat";

/**
 * S7 opens on barC(38) (comp 3720), reveals the launch wordmark, holds, then
 * fades clean to ink over the last ~60 frames as the track's REAL outro fades
 * to silence — the cut ENDS on frame 3941 (~2:11), landing on ink+silence
 * together (see Main.tsx partCVol). Local grid helpers (bar 38 = part-C beat 152):
 */
const S = barC(38);
/** kth beat into the scene. */
const beat = (n: number): number => beatC(152 + n) - S;

export const S7Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const markP = spring({ frame, fps, config: { damping: 14, stiffness: 130, mass: 0.9 } });
  const wordP = spring({ frame: frame - beat(1), fps, config: { damping: 200, stiffness: 120, mass: 0.7 } });
  const tagP = spring({ frame: frame - beat(2), fps, config: { damping: 200, stiffness: 120 } });
  const smallP = interpolate(frame, [beat(3), beat(3) + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const mascotP = spring({ frame: frame - beat(3), fps, config: { damping: 200, stiffness: 90 } });
  const bob = Math.sin(frame / 24) * 7;

  // Present immediately on the hard cut (bar 38); hold through the wordmark
  // reveal, then fade clean to ink over the last ~60 frames as the track's real
  // outro decays to silence, landing together at frame 3941 (matches Main.tsx
  // partCVol's safety fade).
  const sceneOp = interpolate(frame, [SCENE_DUR.s7 - 60, SCENE_DUR.s7], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Gold shimmer sweeps the wordmark once per bar through the max-energy close.
  const barLen = BAR_S * FPS; // 56.25 frames
  const barPhase = (frame % barLen) / barLen;
  const shimmer = interpolate(barPhase, [0, 1], [-60, 260]);

  return (
    <Atmosphere>
      <AbsoluteFill style={{ opacity: sceneOp }}>
        {/* Comic world so the close sits IN the same book as the cold open:
            halftone texture, slow-drifting ink/gold motes, and a soft radial
            ink/gold speed-burst behind the wordmark. All subtle — the wordmark
            still owns the frame — and all fade with the outro via sceneOp. */}
        <Halftone opacity={0.045} />
        <DriftDots count={7} seed="s7drift" opacity={0.3} />
        <SpeedBurst cx={960} cy={506} from={0} count={15} inner={150} spread={540} width={5} opacity={0.13} seed="s7burst" />

        <Pulse sceneStart={S} intensity={1.15} shake={1}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24 }}>
          {/* Base scale > 0 so the mark is present on the hard cut into S7. */}
          <div style={{ transform: `scale(${0.55 + markP * 0.45})` }}>
            <Logo size={132} />
          </div>
          <div
            style={{
              opacity: wordP,
              transform: `translateY(${(1 - wordP) * 20}px)`,
              fontFamily: FONT_DISPLAY,
              fontWeight: 600,
              fontSize: 128,
              letterSpacing: "-0.02em",
              backgroundImage: `linear-gradient(100deg, ${COLORS.text} ${shimmer - 42}%, ${COLORS.goldSoft} ${shimmer}%, ${COLORS.text} ${shimmer + 42}%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Cermin-RWA
          </div>
          <div
            style={{
              opacity: tagP,
              transform: `translateY(${(1 - tagP) * 16}px)`,
              fontFamily: FONT_DISPLAY,
              fontWeight: 500,
              fontSize: 48,
              color: COLORS.gold,
            }}
          >
            Shadow money. Zero liquidations.
          </div>
          <div
            style={{
              opacity: smallP * 0.85,
              marginTop: 12,
              fontFamily: FONT_SANS,
              fontWeight: 500,
              fontSize: 30,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: COLORS.muted,
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <BnbMark size={44} />
            Guarded RWA loans on BNB Chain.
          </div>
        </AbsoluteFill>
        </Pulse>

        {/* Mascot resting calmly in the corner, with a soft ink-outline
            "sticker" rim (parchment glow + ink lift via drop-shadow) so it sits
            ON the comic page. */}
        <AbsoluteFill style={{ alignItems: "flex-end", justifyContent: "flex-end", padding: 40 }}>
          <div
            style={{
              opacity: mascotP * 0.92,
              transform: `translateY(${bob}px)`,
              filter:
                "drop-shadow(0 0 2.5px rgba(243,237,226,0.9)) drop-shadow(0 0 6px rgba(243,237,226,0.35)) drop-shadow(0 10px 20px rgba(5,7,10,0.55))",
            }}
          >
            <Mascot name="watch" size={240} />
          </div>
        </AbsoluteFill>

        {/* Thin comic panel border inset — bookends the S2 logo frame. */}
        <InkFrame inset={30} width={4} radius={22} opacity={0.7} innerRule />
      </AbsoluteFill>

      <Sfx type="chime" at={0} volume={0.45} />
    </Atmosphere>
  );
};
