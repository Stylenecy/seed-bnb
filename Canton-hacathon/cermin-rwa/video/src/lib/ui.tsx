import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ATMOSPHERE_BG, COLORS, RADIUS, SHADOW_CARD } from "./tokens";
import { FONT_DISPLAY, FONT_SANS } from "./fonts";
import { mascot as mascotSrc, sfx as sfxSrc } from "./assets";

/** Full-frame ink atmosphere background with the faint gold + sage glows. */
export const Atmosphere: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => (
  <AbsoluteFill style={{ background: ATMOSPHERE_BG }}>{children}</AbsoluteFill>
);

/* ----------------------------------------------------------------- Audio */

const SFX_DUR: Record<string, number> = {
  whoosh: 34,
  chime: 48,
  click: 12,
  riser: 92,
};

/** Place a one-shot sound effect at a local frame within the current scene. */
export const Sfx: React.FC<{
  type: "whoosh" | "chime" | "click" | "riser";
  at: number;
  volume?: number;
}> = ({ type, at, volume = 0.5 }) => (
  <Sequence from={at} durationInFrames={SFX_DUR[type] ?? 40} name={`sfx-${type}`}>
    <Audio src={sfxSrc(type)} volume={volume} />
  </Sequence>
);

/* ------------------------------------------------------------------- Card */

export const Card: React.FC<{
  children?: React.ReactNode;
  style?: React.CSSProperties;
  surface?: "raised" | "sunken";
}> = ({ children, style, surface = "raised" }) => (
  <div
    style={{
      background: surface === "sunken" ? COLORS.sunken : COLORS.raised,
      border: `1px solid ${COLORS.hairline}`,
      borderRadius: RADIUS,
      boxShadow: SHADOW_CARD,
      padding: 28,
      ...style,
    }}
  >
    {children}
  </div>
);

/* --------------------------------------------------------------- Logo mark */

/** The Cermin mark: gold ring + centered gold dot, optionally with wordmark. */
export const Logo: React.FC<{
  size?: number;
  withWord?: boolean;
  wordSize?: number;
}> = ({ size = 64, withWord = false, wordSize = 44 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.34 }}>
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
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24">
        <circle
          cx={12}
          cy={12}
          r={9}
          fill="none"
          stroke={COLORS.gold}
          strokeWidth={1.8}
        />
        <circle cx={12} cy={12} r={3.4} fill={COLORS.gold} />
      </svg>
    </div>
    {withWord ? (
      <span
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 600,
          fontSize: wordSize,
          color: COLORS.text,
          letterSpacing: "-0.01em",
        }}
      >
        Cermin-RWA
      </span>
    ) : null}
  </div>
);

/* ------------------------------------------------------------- Word rise */

/**
 * Word-by-word staggered rise + fade in. `delay` is the local frame the
 * animation begins; `stagger` is per-word offset. Exits are handled by the
 * caller (opacity via a wrapper) when needed.
 */
export const WordRise: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  fontSize: number;
  color?: string;
  family?: string;
  weight?: number;
  lineHeight?: number;
  align?: "center" | "left";
  maxWidth?: number;
  style?: React.CSSProperties;
}> = ({
  text,
  delay = 0,
  stagger = 3,
  fontSize,
  color = COLORS.text,
  family = FONT_DISPLAY,
  weight = 600,
  lineHeight = 1.05,
  align = "center",
  maxWidth,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: `${fontSize * 0.06}px ${fontSize * 0.28}px`,
        justifyContent: align === "center" ? "center" : "flex-start",
        maxWidth,
        lineHeight,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const p = spring({
          frame: frame - delay - i * stagger,
          fps,
          config: { damping: 200, stiffness: 120, mass: 0.7 },
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontFamily: family,
              fontWeight: weight,
              fontSize,
              color,
              opacity: p,
              transform: `translateY(${(1 - p) * fontSize * 0.5}px)`,
              letterSpacing: "-0.015em",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------- Status pill */

export const StatusPill: React.FC<{
  label: string;
  color: string;
  fontSize?: number;
}> = ({ label, color, fontSize = 22 }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: fontSize * 0.5,
      padding: `${fontSize * 0.4}px ${fontSize * 0.85}px`,
      borderRadius: 999,
      border: `1px solid ${COLORS.hairlineStrong}`,
      background: COLORS.sunken,
      fontFamily: FONT_SANS,
      fontWeight: 500,
      fontSize,
      color,
    }}
  >
    <span
      style={{
        width: fontSize * 0.42,
        height: fontSize * 0.42,
        borderRadius: 999,
        background: color,
        display: "inline-block",
      }}
    />
    {label}
  </div>
);

/* ---------------------------------------------------------- Browser frame */

/** A subtle browser chrome: ink toolbar with three faint dots + content. */
export const BrowserFrame: React.FC<{
  width: number;
  height: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ width, height, children, style }) => {
  const bar = Math.round(height * 0.045);
  return (
    <div
      style={{
        width,
        height: height + bar,
        borderRadius: 18,
        overflow: "hidden",
        background: COLORS.raised,
        border: `1px solid ${COLORS.hairlineStrong}`,
        boxShadow: SHADOW_CARD,
        ...style,
      }}
    >
      <div
        style={{
          height: bar,
          background: COLORS.sunken,
          borderBottom: `1px solid ${COLORS.hairline}`,
          display: "flex",
          alignItems: "center",
          gap: bar * 0.32,
          paddingLeft: bar * 0.7,
        }}
      >
        {["a", "b", "c"].map((k) => (
          <span
            key={k}
            style={{
              width: bar * 0.26,
              height: bar * 0.26,
              borderRadius: 999,
              background: COLORS.hairlineStrong,
              display: "inline-block",
            }}
          />
        ))}
      </div>
      <div style={{ width, height, position: "relative" }}>{children}</div>
    </div>
  );
};

/* ----------------------------------------------------------------- Mascot */

/** Mascot image, edges softly masked with a radial fade so the square hides. */
export const Mascot: React.FC<{
  name: "watch" | "shield";
  size: number;
  style?: React.CSSProperties;
  opacity?: number;
}> = ({ name, size, style, opacity = 1 }) => {
  const maskImg =
    "radial-gradient(circle at 47% 46%, #000 38%, rgba(0,0,0,0.85) 52%, transparent 66%)";
  return (
    <div style={{ width: size, height: size, opacity, ...style }}>
      <Img
        src={mascotSrc(name)}
        style={{
          width: size,
          height: size,
          objectFit: "cover",
          WebkitMaskImage: maskImg,
          maskImage: maskImg,
        }}
      />
    </div>
  );
};

/* ------------------------------------------------------ small motion utils */

/** Fade + gentle rise, for whole blocks. Returns style to spread onto a div. */
export const useRise = (
  delay: number,
  distance = 24,
): React.CSSProperties => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, stiffness: 110, mass: 0.7 },
  });
  return {
    opacity: p,
    transform: `translateY(${(1 - p) * distance}px)`,
  };
};

/** Standard scene-boundary fade: fade in over the first `n` frames, fade out
 * over the last `n` frames of a scene of length `dur`. */
export const useSceneFade = (dur: number, n = 12): number => {
  const frame = useCurrentFrame();
  return interpolate(
    frame,
    [0, n, dur - n, dur],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
};
