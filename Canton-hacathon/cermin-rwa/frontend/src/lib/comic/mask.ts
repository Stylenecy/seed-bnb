import type { CSSProperties } from 'react';

/**
 * Soft radial mask style builder for the Mascot. The comic mascot art ships
 * with a square, ink-dark baked background (a starfield / cave); a radial
 * alpha mask fades the outer ring to transparent so the square edges melt into
 * whatever dark surface the mascot sits on, leaving just the glowing figure.
 * Pure so the mask geometry can be unit-tested without a DOM.
 *
 * @param inner  fraction of the radius kept fully opaque (0..1)
 * @param outer  fraction of the radius where alpha reaches 0 (inner < outer <= 1)
 */
export function radialMaskStyle(inner = 0.46, outer = 0.7): CSSProperties {
  const gradient = `radial-gradient(circle at 50% 46%, #000 ${(inner * 100).toFixed(0)}%, transparent ${(outer * 100).toFixed(0)}%)`;
  return {
    maskImage: gradient,
    WebkitMaskImage: gradient,
  };
}
