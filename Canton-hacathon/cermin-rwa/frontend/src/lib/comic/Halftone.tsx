import type { CSSProperties } from 'react';

interface HalftoneProps {
  /** Dot opacity — keep it a whisper (<= 0.06). Default 0.05. */
  opacity?: number;
  /** Dot radius in px. */
  dot?: number;
  /** Tile size in px — bigger = sparser dots. */
  gap?: number;
  /** Extra classes (e.g. `fixed inset-0 z-[1]` for the app-level layer). */
  className?: string;
  style?: CSSProperties;
}

/**
 * Comic newsprint halftone — a CSS radial-gradient dot texture overlay. Sits
 * UNDER content as a whisper of comic-book grain. `currentColor` drives the dot
 * color, so a `text-foreground` class makes it theme-aware automatically
 * (parchment dots on the dark theme, ink dots on the light one). Always
 * `pointer-events: none`.
 */
export function Halftone({ opacity = 0.05, dot = 1, gap = 12, className = '', style }: HalftoneProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none text-foreground ${className}`}
      style={{
        opacity,
        backgroundImage: `radial-gradient(currentColor ${dot}px, transparent ${dot + 0.6}px)`,
        backgroundSize: `${gap}px ${gap}px`,
        ...style,
      }}
    />
  );
}
