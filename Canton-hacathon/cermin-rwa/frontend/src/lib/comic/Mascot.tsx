import type { CSSProperties } from 'react';
import { radialMaskStyle } from './mask';
import { usePrefersReducedMotion } from './motion';

export type MascotPose = 'watch' | 'shield';

interface MascotProps {
  /** `watch` = the lantern-bearing watcher (calm/alert); `shield` = arms-out
   * guardian stepping in. */
  pose: MascotPose;
  /** Rendered square size in px. Default 120. */
  size?: number;
  /** Gentle idle bob. Auto-disabled under `prefers-reduced-motion`. Default true. */
  bob?: boolean;
  /** `eager` for an above-the-fold mascot; defaults to `lazy` (CLS-safe). */
  loading?: 'lazy' | 'eager';
  className?: string;
  style?: CSSProperties;
  /** Override the accessible description. */
  alt?: string;
}

const SRC: Record<MascotPose, string> = {
  watch: '/comic/mascot-watch.webp',
  shield: '/comic/mascot-shield.webp',
};

const DEFAULT_ALT: Record<MascotPose, string> = {
  watch: 'Cermin, the mirror-guardian, watching over your position',
  shield: 'Cermin, the mirror-guardian, stepping in to shield your position',
};

/**
 * The mirror-guardian mascot — Cermin's face throughout the journey. The art
 * has a square ink-dark baked background; `radialMaskStyle` fades its edges to
 * transparent so it melts into any dark surface with no hard square seam. The
 * optional idle bob is a CSS keyframe (`cermin-bob` in index.css) that the
 * global reduced-motion rule already neutralizes — and which this component
 * also refuses to apply when the user asked for reduced motion.
 */
export function Mascot({ pose, size = 120, bob = true, loading = 'lazy', className = '', style, alt }: MascotProps) {
  const reduced = usePrefersReducedMotion();
  const animate = bob && !reduced;
  return (
    <img
      src={SRC[pose]}
      alt={alt ?? DEFAULT_ALT[pose]}
      width={size}
      height={size}
      loading={loading}
      decoding="async"
      draggable={false}
      className={`select-none ${animate ? 'motion-safe:animate-[cermin-bob_4s_ease-in-out_infinite]' : ''} ${className}`}
      style={{ width: size, height: size, ...radialMaskStyle(), ...style }}
    />
  );
}
