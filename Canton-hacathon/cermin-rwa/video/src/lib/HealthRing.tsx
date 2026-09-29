import React from "react";
import { interpolate } from "remotion";
import { COLORS } from "./tokens";
import { FONT_DISPLAY, FONT_SANS } from "./fonts";

/**
 * The Health Ratio ring, matching the FE dashboard. `ratio` is in percent
 * (e.g. 166.7). The arc fill maps 100%→half, 200%→full, clamped — a faithful
 * stand-in for the app's ring so the incident in S3 reads like the product.
 */
export const HealthRing: React.FC<{
  ratio: number;
  color: string;
  statusLabel: string;
  size?: number;
  stroke?: number;
}> = ({ ratio, color, statusLabel, size = 360, stroke = 18 }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const fill = interpolate(ratio, [100, 200], [0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dash = c * fill;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ position: "absolute", transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={COLORS.overlay}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: size * 0.02,
        }}
      >
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 500,
            fontSize: size * 0.19,
            color: COLORS.text,
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {ratio.toFixed(1)}%
        </div>
        <div
          style={{
            fontFamily: FONT_SANS,
            fontWeight: 500,
            fontSize: size * 0.045,
            letterSpacing: "0.14em",
            color: COLORS.faint,
            textTransform: "uppercase",
          }}
        >
          Health Ratio
        </div>
        <div
          style={{
            marginTop: size * 0.03,
            display: "inline-flex",
            alignItems: "center",
            gap: size * 0.022,
            padding: `${size * 0.018}px ${size * 0.05}px`,
            borderRadius: 999,
            border: `1px solid ${COLORS.hairlineStrong}`,
            fontFamily: FONT_SANS,
            fontWeight: 500,
            fontSize: size * 0.05,
            color,
          }}
        >
          <span
            style={{
              width: size * 0.03,
              height: size * 0.03,
              borderRadius: 999,
              background: color,
            }}
          />
          {statusLabel}
        </div>
      </div>
    </div>
  );
};
