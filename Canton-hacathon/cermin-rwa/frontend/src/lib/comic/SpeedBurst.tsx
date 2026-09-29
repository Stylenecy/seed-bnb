import type { CSSProperties } from 'react';
import { buildSpeedRays, VIEWBOX } from './geometry';

interface SpeedBurstProps {
  /** Number of rays. Default 12. */
  count?: number;
  /** Deterministic seed — same seed renders the same wobble every time. */
  seed?: string;
  /** Ray color. Default gold. */
  color?: string;
  /** Base stroke width in viewBox units (0..100). Default 2. */
  width?: number;
  /** Inner radius the rays start from (viewBox units). */
  inner?: number;
  /** Outer reach of the longest ray (viewBox units). */
  spread?: number;
  opacity?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Radial comic speed-lines — the "pop" energy behind a reveal. The rays are
 * hand-wobbled by a seeded pseudo-random (no `Math.random` in render, so they
 * never flicker on re-render), built by the pure `buildSpeedRays`. Fills its
 * positioned parent; drop it behind a status stamp or a celebration. Always
 * decorative + non-interactive.
 */
export function SpeedBurst({
  count = 12,
  seed = 'burst',
  color = 'var(--color-gold)',
  width = 2,
  inner = 16,
  spread = 46,
  opacity = 0.5,
  className = '',
  style,
}: SpeedBurstProps) {
  const rays = buildSpeedRays({ count, seed, inner, spread, width });
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      className={`pointer-events-none ${className}`}
      style={{ opacity, overflow: 'visible', ...style }}
    >
      {rays.map((ray, i) => (
        <path key={i} d={ray.d} fill="none" stroke={color} strokeWidth={ray.width} strokeLinecap="round" />
      ))}
    </svg>
  );
}
