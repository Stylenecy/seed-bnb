import React from "react";

/** BNB Chain gold. */
export const BNB_GOLD = "#F0B90B";

/**
 * Code-drawn BNB Chain diamond mark (roof chevron, floor chevron, side
 * diamonds, centre diamond). Copied from the demo-videos kit (src/kit/BnbBadge).
 */
export const BnbMark: React.FC<{ size?: number; color?: string; outline?: string; style?: React.CSSProperties }> = ({
  size = 64,
  color = BNB_GOLD,
  outline,
  style,
}) => (
  <svg width={size} height={size} viewBox="-4 -4 134.61 134.61" style={{ display: "block", overflow: "visible", ...style }}>
    <g fill={color} stroke={outline} strokeWidth={outline ? 5 : 0} strokeLinejoin="round">
      <path d="M38.73 53.2 63.32 28.62 87.92 53.22 102.22 38.91 63.32 0 24.43 38.9Z" />
      <path d="M0 63.31 14.3 49 28.61 63.31 14.3 77.61Z" />
      <path d="M38.73 73.41 63.32 98 87.92 73.4 102.23 87.69 63.32 126.61 24.42 87.72Z" />
      <path d="M98 63.31 112.3 49 126.61 63.31 112.3 77.61Z" />
      <path d="M77.83 63.3 63.32 48.78 48.81 63.29 63.32 77.8Z" />
    </g>
  </svg>
);
