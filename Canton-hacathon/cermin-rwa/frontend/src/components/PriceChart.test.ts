import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { HealthStatus } from '../lib/health';
import { PriceChart, type ChartPoint } from './PriceChart';

/**
 * PR review fix (Task 17 follow-up) — the focusable interaction rect used to
 * live *inside* the `role="img"` svg, which collapses all descendants to
 * presentational, so it exposed no accessible name/role. The fix moved it out
 * to a sibling <button> overlay.
 *
 * This project's vitest environment is `node` — no jsdom, no
 * @testing-library/react (see lib/chart.ts's doc comment: the chart's DOM-free
 * geometry math is unit-tested directly and PriceChart.tsx stays a thin
 * rendering layer over it). Rather than add a new test dependency to drive a
 * real DOM, these tests render the component server-side with
 * `react-dom/server` (already a transitive dependency of `react-dom`, which is
 * already a project dependency) and assert on the resulting markup — the same
 * "verify by rendered attributes" fallback the review asked for when no
 * browser tooling is available. Interactive pointer behavior (Task 20's
 * touch-tooltip fix) is unit-tested at the pure-function level in
 * `lib/chart.test.ts` (`shouldClearTooltipOnPointerUp`) and verified for real
 * in a browser (see the task report).
 */

const points: ChartPoint[] = [
  { at: '2026-06-01T00:00:00.000Z', price: 1.0 },
  { at: '2026-06-15T00:00:00.000Z', price: 0.9 },
  { at: '2026-07-01T00:00:00.000Z', price: 0.8 },
];

interface RenderOpts {
  defensePrice: number;
  floorPrice: number;
  vaultBalance?: number;
  status?: HealthStatus;
  showCaption?: boolean;
  points?: ChartPoint[];
}

function renderChart(opts: RenderOpts): string {
  const { defensePrice, floorPrice, vaultBalance = 1_500, status = 'protected', showCaption, points: pts = points } = opts;
  return renderToStaticMarkup(
    createElement(PriceChart, { points: pts, defensePrice, floorPrice, vaultBalance, status, showCaption }),
  );
}

function extractLabelY(html: string, label: string): number {
  const match = html.match(new RegExp(`y="([\\d.]+)"[^>]*>${label}`));
  if (!match) throw new Error(`label not found in markup: ${label}`);
  return Number(match[1]);
}

function extractLabelColor(html: string, label: string): string {
  const match = html.match(new RegExp(`fill="([^"]+)"[^>]*>${label}`));
  if (!match) throw new Error(`colored label not found in markup: ${label}`);
  return match[1];
}

/** `react-dom/server` HTML-escapes text node content — an apostrophe comes
 * out as `&#x27;`. Cermin's first-person copy is full of contractions, so
 * assertions against caption text need the same escaping the renderer uses. */
function esc(s: string): string {
  return s.replace(/'/g, '&#x27;');
}

describe('PriceChart accessibility', () => {
  it('keeps the svg presentational: role="img" plus one summary aria-label', () => {
    const html = renderChart({ defensePrice: 0.78, floorPrice: 0.585 });
    const svgOpenTag = html.match(/<svg\b[^>]*>/)?.[0] ?? '';
    expect(svgOpenTag).toContain('role="img"');
    expect(svgOpenTag).toMatch(/aria-label="[^"]+"/);
  });

  it('exposes the interactive control as a sibling of the svg (never a descendant)', () => {
    const html = renderChart({ defensePrice: 0.78, floorPrice: 0.585 });
    const svgStart = html.indexOf('<svg');
    const svgEnd = html.indexOf('</svg>');
    const buttonStart = html.indexOf('<button');
    expect(svgStart).toBeGreaterThan(-1);
    expect(svgEnd).toBeGreaterThan(svgStart);
    expect(buttonStart).toBeGreaterThan(svgEnd);

    // The bug was a focusable node *inside* role="img" losing its name; assert
    // the svg subtree carries no focusable/interactive element at all.
    const svgSubtree = html.slice(svgStart, svgEnd);
    expect(svgSubtree).not.toContain('<button');
    expect(svgSubtree.toLowerCase()).not.toContain('tabindex');
  });

  it('gives the sibling control its own non-empty accessible name', () => {
    const html = renderChart({ defensePrice: 0.78, floorPrice: 0.585 });
    const buttonTag = html.match(/<button\b[^>]*>/)?.[0] ?? '';
    const name = buttonTag.match(/aria-label="([^"]+)"/)?.[1] ?? '';
    expect(name.length).toBeGreaterThan(0);
    expect(name).toMatch(/arrow keys/i);
    expect(buttonTag).not.toContain('aria-hidden');
  });
});

describe('Task 20 — coincident-line rule', () => {
  it('renders both lines/labels distinctly when defense and floor are well separated and the vault has money', () => {
    const html = renderChart({ defensePrice: 0.78, floorPrice: 0.2, vaultBalance: 1_500 });
    expect(html).toContain('Cermin defends');
    expect(html).toContain('Protection floor');
    const defenseLabelY = extractLabelY(html, 'Cermin defends');
    const floorLabelY = extractLabelY(html, 'Protection floor');
    expect(Math.abs(floorLabelY - defenseLabelY)).toBeGreaterThan(14);
  });

  it('merges into ONE line and ONE label when the vault is empty, even if defense and floor prices are far apart', () => {
    const html = renderChart({ defensePrice: 0.78, floorPrice: 0.2, vaultBalance: 0 });
    expect(html).toContain('Cermin defends');
    expect(html).not.toContain('Protection floor');
  });

  it('merges into ONE line and ONE label when the two prices coincide exactly (defense === floor), never two stacked labels', () => {
    // This is the exact algebraic shape lib/health.ts produces for an empty
    // vault: protectionFloorPrice collapses to exactly defensePrice.
    const html = renderChart({ defensePrice: 0.996, floorPrice: 0.996, vaultBalance: 0 });
    expect(html).toContain('Cermin defends');
    expect(html).not.toContain('Protection floor');
  });
});

describe('Task 20 — breach-state coloring and copy', () => {
  it('uses the calm amber defense line and the default grace-period caption when price is at/above defense', () => {
    const html = renderChart({ defensePrice: 0.78, floorPrice: 0.2, vaultBalance: 1_500, status: 'protected' });
    expect(extractLabelColor(html, 'Cermin defends')).toBe('var(--color-amber)');
    expect(html).toContain(esc("Below the protection floor, I open a grace period instead of a fire-sale"));
  });

  it('switches the defense line to terracotta and the caption to "stepping in" copy on a breach with a funded vault', () => {
    const html = renderChart({ defensePrice: 0.78, floorPrice: 0.2, vaultBalance: 1_500, status: 'action' });
    expect(extractLabelColor(html, 'Cermin defends')).toBe('var(--color-terracotta)');
    expect(html).toContain(esc("I'm stepping in on my next check."));
  });

  it('switches the caption to the explicit top-up nudge on a breach with an empty vault (the exact screenshot repro)', () => {
    // borrow ~6640 @ Conservative (15000 bps trigger), vault 0, price 0.62 ->
    // defensePrice/floorPrice both land at ~0.996, well above the crashed
    // price series -> a breach with the lines merged.
    const crashedPoints: ChartPoint[] = [
      { at: '2026-06-01T00:00:00.000Z', price: 1.0 },
      { at: '2026-06-20T00:00:00.000Z', price: 0.8 },
      { at: '2026-07-01T00:00:00.000Z', price: 0.62 },
    ];
    const html = renderChart({
      points: crashedPoints,
      defensePrice: 0.996,
      floorPrice: 0.996,
      vaultBalance: 0,
      status: 'action',
    });
    expect(html).toContain('Cermin defends');
    expect(html).not.toContain('Protection floor');
    expect(extractLabelColor(html, 'Cermin defends')).toBe('var(--color-terracotta)');
    expect(html).toContain(esc('Your vault is empty — top up so I can act.'));
  });
});

describe('Task 20 — caption visibility', () => {
  it('suppresses the caption entirely when showCaption is false (the Landing hero)', () => {
    const html = renderChart({ defensePrice: 0.78, floorPrice: 0.585, vaultBalance: 1_500, showCaption: false });
    expect(html).not.toContain('Below the protection floor');
    expect(html).not.toContain('stepping in');
    expect(html).not.toContain('Fund your Shadow Vault');
  });

  it('shows no caption at all when there is no active loan (defensePrice <= 0)', () => {
    const html = renderChart({ defensePrice: 0, floorPrice: 0, vaultBalance: 1_500 });
    expect(html).not.toContain('Below the protection floor');
    expect(html).not.toContain('stepping in');
    expect(html).not.toContain('Fund your Shadow Vault');
  });
});
