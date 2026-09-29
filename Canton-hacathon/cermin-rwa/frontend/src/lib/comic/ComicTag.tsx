import type { CSSProperties, ReactNode } from 'react';

interface ComicTagProps {
  children: ReactNode;
  /** Font size in px. Default 22 (a small section-label tag). */
  size?: number;
  /** Rotation in degrees — lay the tag at a jaunty comic angle. */
  rotate?: number;
  /** Fill color (any CSS color / var). Default gold. */
  color?: string;
  className?: string;
  style?: CSSProperties;
  /** Optional accessible role bump — a tag used purely as decoration can pass
   * `aria-hidden`; a tag standing in for a heading passes it through. */
  ariaHidden?: boolean;
}

/**
 * Bangers uppercase accent lettering — the comic "tag" / onomatopoeia voice
 * (section labels, status stamps, "SAVED!"). NEVER body copy. The ink outline
 * comes from `-webkit-text-stroke` + a hard offset shadow, both keyed to the
 * theme-aware `--color-ink-line` token (parchment stroke on dark, ink stroke
 * on light) so the outline never turns white in light theme and reads as a
 * comic sticker in both. `paint-order: stroke fill` keeps the stroke behind the
 * glyph so it never eats the letterform.
 */
export function ComicTag({
  children,
  size = 22,
  rotate = 0,
  color = 'var(--color-gold)',
  className = '',
  style,
  ariaHidden,
}: ComicTagProps) {
  const stroke = Math.max(1, size * 0.045);
  const offset = Math.max(1.5, size * 0.05);
  return (
    <span
      aria-hidden={ariaHidden}
      className={`comic-tag inline-block leading-none uppercase ${className}`}
      style={{
        fontFamily: "'Bangers', system-ui, cursive",
        fontWeight: 400,
        fontSize: `${size}px`,
        letterSpacing: '0.03em',
        color,
        WebkitTextStrokeWidth: `${stroke}px`,
        WebkitTextStrokeColor: 'var(--color-ink-line)',
        paintOrder: 'stroke fill',
        textShadow: `${offset}px ${offset}px 0 var(--color-ink-line)`,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
