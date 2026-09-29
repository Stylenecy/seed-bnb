import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Halftone } from './Halftone';
import { ComicTag } from './ComicTag';
import { InkCard } from './InkCard';
import { SpeechBubble } from './SpeechBubble';
import { SpeedBurst } from './SpeedBurst';
import { Mascot } from './Mascot';
import { CoinBurst } from './CoinBurst';
import { SavedBurst } from './SavedBurst';

/**
 * Render-smoke for the comic kit's React pieces. This project's vitest env is
 * `node` — no jsdom — so components are rendered server-side with
 * `react-dom/server` (already a transitive dependency of `react-dom`) and
 * asserted on their markup, the established pattern from `PriceChart.test.ts` /
 * `Landing.test.ts`. The mascot's `usePrefersReducedMotion` tolerates the
 * absent `window` (returns false), so no DOM stub is needed here.
 */

describe('comic kit render-smoke', () => {
  it('Halftone renders a non-interactive textured layer', () => {
    const html = renderToStaticMarkup(createElement(Halftone, { opacity: 0.04 }));
    expect(html).toContain('radial-gradient');
    expect(html).toContain('pointer-events');
    expect(html).toContain('aria-hidden');
  });

  it('ComicTag renders its Bangers label with an ink stroke', () => {
    const html = renderToStaticMarkup(createElement(ComicTag, { children: 'PROTECTED!', color: 'var(--color-sage)' }));
    expect(html).toContain('PROTECTED!');
    expect(html).toContain('Bangers');
    expect(html).toContain('--color-ink-line');
  });

  it('InkCard renders a framed container and applies tilt only when set', () => {
    const straight = renderToStaticMarkup(createElement(InkCard, { children: 'body' }));
    expect(straight).toContain('body');
    expect(straight).toContain('border-ink-line');
    expect(straight).not.toContain('rotate(');

    const tilted = renderToStaticMarkup(createElement(InkCard, { children: 'x', tilt: -2 }));
    expect(tilted).toContain('rotate(-2deg)');
  });

  it('SpeedBurst renders the seeded rays as SVG paths', () => {
    const html = renderToStaticMarkup(createElement(SpeedBurst, { count: 10, seed: 'test' }));
    const paths = html.match(/<path /g) ?? [];
    expect(paths).toHaveLength(10);
    expect(html).toContain('aria-hidden');
  });

  it('Mascot renders a masked, sized image with alt text per pose', () => {
    const watch = renderToStaticMarkup(createElement(Mascot, { pose: 'watch' as const, size: 120 }));
    expect(watch).toContain('mascot-watch.webp');
    expect(watch).toContain('alt="Cermin');
    expect(watch).toContain('width="120"');
    expect(watch).toContain('mask-image');

    const shield = renderToStaticMarkup(createElement(Mascot, { pose: 'shield' as const }));
    expect(shield).toContain('mascot-shield.webp');
  });

  it('SpeechBubble renders an ink-framed bubble with the body and a tail', () => {
    const left = renderToStaticMarkup(createElement(SpeechBubble, { children: 'All quiet. I have this.' }));
    expect(left).toContain('All quiet. I have this.');
    // Inherits the InkCard frame token…
    expect(left).toContain('border-ink-line');
    // …and the tail draws with the theme ink outline + surface fill tokens.
    expect(left).toContain('var(--color-ink-line)');
    expect(left).toContain('var(--color-surface-raised)');
    expect(left).toContain('aria-hidden');

    // A tilt is forwarded to the underlying InkCard; the tail direction is a
    // pure style choice that never throws for any supported edge.
    const tilted = renderToStaticMarkup(createElement(SpeechBubble, { children: 'x', tilt: -2, tail: 'bottom' as const }));
    expect(tilted).toContain('rotate(-2deg)');
  });

  it('CoinBurst / SavedBurst render nothing on mount (fire only on trigger change)', () => {
    expect(renderToStaticMarkup(createElement(CoinBurst, { trigger: 'x' }))).toBe('');
    expect(renderToStaticMarkup(createElement(SavedBurst, { trigger: 'x' }))).toBe('');
  });
});
