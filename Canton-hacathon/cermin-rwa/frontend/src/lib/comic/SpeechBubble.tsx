import type { CSSProperties, ReactNode } from 'react';
import { InkCard } from './InkCard';

type TailDir = 'left' | 'right' | 'bottom';

interface SpeechBubbleProps {
  children: ReactNode;
  /** Which edge the little tail pokes out of, pointing back at the speaker
   * (usually the mascot narrating). Default 'left'. */
  tail?: TailDir;
  /** Where the tail sits along that edge — a CSS length/percentage from the
   * start (top for left/right, left for bottom). Default '50%'. */
  tailOffset?: string;
  /** Slight comic tilt in degrees (−2..2), forwarded to the InkCard. Default 0. */
  tilt?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * A comic speech bubble — an InkCard body with a small ink-outlined tail poking
 * toward whoever is talking (the mascot narrator in Onboarding). The tail is
 * two stacked CSS border-triangles: an ink triangle behind and a slightly
 * smaller `surface-raised` fill triangle in front, so only the ink slants show
 * as an outline that continues the card's frame. Both keyed to the theme-aware
 * `--color-ink-line` / `--color-surface-raised` tokens, so it reads as an
 * ink-drawn bubble in either theme (parchment frame on dark, ink on light).
 * Decorative tail (`aria-hidden`); the bubble body carries the real content.
 */
export function SpeechBubble({ children, tail = 'left', tailOffset = '50%', tilt = 0, className = '', style }: SpeechBubbleProps) {
  return (
    <InkCard noPadding tilt={tilt} className={`relative ${className}`} style={style}>
      <div className="px-4 py-3 sm:px-5 sm:py-4">{children}</div>
      <Tail tail={tail} offset={tailOffset} />
    </InkCard>
  );
}

/** The two-triangle tail (ink outline behind, surface fill in front). */
function Tail({ tail, offset }: { tail: TailDir; offset: string }) {
  const base: CSSProperties = { position: 'absolute', width: 0, height: 0 };
  const ink = 'var(--color-ink-line)';
  const fill = 'var(--color-surface-raised)';

  let inkStyle: CSSProperties;
  let fillStyle: CSSProperties;

  if (tail === 'left') {
    inkStyle = { ...base, left: -13, top: offset, transform: 'translateY(-50%)', borderTop: '11px solid transparent', borderBottom: '11px solid transparent', borderRight: `13px solid ${ink}` };
    fillStyle = { ...base, left: -9, top: offset, transform: 'translateY(-50%)', borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: `11px solid ${fill}` };
  } else if (tail === 'right') {
    inkStyle = { ...base, right: -13, top: offset, transform: 'translateY(-50%)', borderTop: '11px solid transparent', borderBottom: '11px solid transparent', borderLeft: `13px solid ${ink}` };
    fillStyle = { ...base, right: -9, top: offset, transform: 'translateY(-50%)', borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: `11px solid ${fill}` };
  } else {
    inkStyle = { ...base, bottom: -13, left: offset, transform: 'translateX(-50%)', borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderTop: `13px solid ${ink}` };
    fillStyle = { ...base, bottom: -9, left: offset, transform: 'translateX(-50%)', borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: `11px solid ${fill}` };
  }

  return (
    <span aria-hidden="true">
      <span style={inkStyle} />
      <span style={fillStyle} />
    </span>
  );
}
