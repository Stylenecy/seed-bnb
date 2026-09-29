import type { CSSProperties, ReactNode } from 'react';

interface InkCardProps {
  children: ReactNode;
  className?: string;
  /** Slight comic tilt in degrees (−2..2). ACCENT cards only — data tables
   * and forms stay straight. Default 0 (straight). */
  tilt?: number;
  /** Drop the built-in `p-6 sm:p-7` padding so the caller can set its own
   * (the hero card wants a taller, custom pad). */
  noPadding?: boolean;
  style?: CSSProperties;
  /** Render as a semantic `<section>` instead of a `<div>`. */
  as?: 'div' | 'section';
}

/**
 * The comic card: a 2.5px ink outline + a hard 4px offset shadow, both keyed to
 * the theme-aware `--color-ink-line` token (parchment frame on dark, ink frame
 * on light) so it reads as an ink-drawn comic panel in either theme. Same warm
 * `bg-surface-raised` fill and rounding language as the plain `Card`, so it's a
 * drop-in for accent surfaces. `tilt` gives an accent card a jaunty lean; keep
 * it to ±2° and off the data-dense cards.
 */
export function InkCard({ children, className = '', tilt = 0, noPadding = false, style, as = 'div' }: InkCardProps) {
  const Tag = as;
  const pad = noPadding ? '' : 'p-6 sm:p-7';
  return (
    <Tag
      className={`rounded-2xl border-[2.5px] border-ink-line bg-surface-raised shadow-[4px_4px_0_var(--color-ink-line)] ${pad} ${className}`}
      style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined, ...style }}
    >
      {children}
    </Tag>
  );
}
