import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { GLASS } from "./tokens";

/**
 * Premium dark canvas (perps-agent): ellipse glows in the project's colours,
 * a slowly scrolling perspective grid floor, vertical guide lines, drifting
 * light beams and a vignette. Put it FIRST in a scene (under everything).
 */
export const PremiumBg: React.FC<{
  base?: string;
  /** Primary glow colour (rgba string). */
  glowA?: string;
  /** Secondary glow colour (rgba string). */
  glowB?: string;
  glow?: "top" | "center" | "right" | "left";
  /** Perspective grid floor opacity (0 hides). */
  floor?: number;
  /** Flat grid-line overlay opacity (0 hides). */
  grid?: number;
  beams?: boolean;
}> = ({
  base = GLASS.bg,
  glowA = "rgba(240,185,11,0.22)",
  glowB = "rgba(232,69,126,0.14)",
  glow = "top",
  floor = 0.5,
  grid = 0,
  beams = true,
}) => {
  const frame = useCurrentFrame();
  const pos = { top: "50% -6%", center: "50% 45%", right: "76% 46%", left: "24% 46%" }[glow];
  const pos2 = { top: "22% 12%", center: "70% 70%", right: "30% 70%", left: "72% 30%" }[glow];
  return (
    <AbsoluteFill style={{ background: base, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 56% 46% at ${pos}, ${glowA} 0%, transparent 66%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 40% 34% at ${pos2}, ${glowB} 0%, transparent 62%)` }} />
      {grid > 0 ? (
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(to right, ${GLASS.grid} 1px, transparent 1px), linear-gradient(to bottom, ${GLASS.grid} 1px, transparent 1px)`,
            backgroundSize: "96px 96px",
            backgroundPosition: "center center",
            opacity: grid,
            maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 80%)",
          }}
        />
      ) : null}
      {floor > 0 ? (
        <div style={{ position: "absolute", inset: 0, perspective: 620, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              left: "-50%",
              right: "-50%",
              bottom: -40,
              height: "62%",
              transform: "rotateX(70deg)",
              transformOrigin: "bottom center",
              backgroundImage: `linear-gradient(to right, ${GLASS.grid} 1px, transparent 1px), linear-gradient(to bottom, ${GLASS.grid} 1px, transparent 1px)`,
              backgroundSize: "64px 64px",
              backgroundPositionY: `${(frame * 0.8) % 64}px`,
              opacity: floor,
              maskImage: "linear-gradient(to top, rgba(0,0,0,0.9), transparent 72%)",
              WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.9), transparent 72%)",
            }}
          />
        </div>
      ) : null}
      {beams
        ? [
            { x: 16, c: glowA, w: 280, ph: 0, amp: 60, op: 0.5 },
            { x: 44, c: glowB, w: 360, ph: 2.1, amp: 90, op: 0.5 },
            { x: 72, c: glowA, w: 240, ph: 4.0, amp: 70, op: 0.4 },
          ].map((b, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: -200 + Math.sin(frame / 70 + b.ph) * b.amp,
                left: `${b.x}%`,
                width: b.w,
                height: 1700,
                transform: "rotate(-32deg)",
                transformOrigin: "top center",
                background: `linear-gradient(to bottom, transparent, ${b.c}, transparent)`,
                opacity: b.op,
                filter: "blur(60px)",
              }}
            />
          ))
        : null}
      {[25, 50, 75].map((x) => (
        <div key={x} style={{ position: "absolute", top: 0, bottom: 0, left: `${x}%`, width: 1, background: GLASS.grid }} />
      ))}
      <AbsoluteFill style={{ boxShadow: "inset 0 0 420px rgba(0,0,0,0.75)" }} />
    </AbsoluteFill>
  );
};
