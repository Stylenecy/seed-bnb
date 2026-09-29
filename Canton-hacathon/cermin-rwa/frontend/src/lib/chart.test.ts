import { describe, expect, it } from 'vitest';
import {
  buildAreaPath,
  buildLinePath,
  computeDeltaPercent,
  computeYDomain,
  isCoincidentLines,
  linearScale,
  nearestIndex,
  pickTickIndices,
  selectFloorCaption,
  shouldClearTooltipOnPointerUp,
} from './chart';

describe('linearScale', () => {
  it('maps a domain onto a pixel range', () => {
    const scale = linearScale([0, 10], [100, 200]);
    expect(scale(0)).toBe(100);
    expect(scale(10)).toBe(200);
    expect(scale(5)).toBe(150);
  });

  it('extrapolates outside the domain (charts don\'t clamp their own scale)', () => {
    const scale = linearScale([0, 10], [0, 100]);
    expect(scale(20)).toBe(200);
    expect(scale(-10)).toBe(-100);
  });

  it('returns the range midpoint for a zero-span domain instead of dividing by zero', () => {
    const scale = linearScale([5, 5], [0, 100]);
    expect(scale(5)).toBe(50);
    expect(Number.isFinite(scale(5))).toBe(true);
  });
});

describe('computeYDomain', () => {
  it('pads both the series min and max by ~4% of the plotted span when there is no floor/defense to extend it', () => {
    const [min, max] = computeYDomain([1, 0.8, 1.2]);
    const pad = (1.2 - 0.8) * 0.04;
    expect(min).toBeCloseTo(0.8 - pad, 6);
    expect(max).toBeCloseTo(1.2 + pad, 6);
  });

  it('pulls the lower bound down to include the floor price when it sits below the series, plus proportional padding', () => {
    const [min] = computeYDomain([0.9, 0.95, 1.0], 0.78, 0.585);
    // raw span is [0.585, 1.0] (floor dominates the min, series dominates the max).
    const pad = (1.0 - 0.585) * 0.04;
    expect(min).toBeCloseTo(0.585 - pad, 6);
  });

  it('pulls the upper bound up to include the defense price when it sits above the series, plus proportional padding', () => {
    const [, max] = computeYDomain([0.5, 0.55], 0.78, 0.3);
    // raw span is [0.3, 0.78] (floor pulls the min further down than the series, defense sets the max).
    const pad = (0.78 - 0.3) * 0.04;
    expect(max).toBeCloseTo(0.78 + pad, 6);
  });

  it('post-rescue: as defense/floor drift further from the series, the domain widens to keep both visible', () => {
    const before = computeYDomain([0.9, 0.95, 1.0], 0.78, 0.585);
    // A rescue lowers outstanding, so both reference prices drop further below price.
    const after = computeYDomain([0.9, 0.95, 1.0], 0.681, 0.4);
    expect(after[0]).toBeLessThan(before[0]);
  });

  it('does not balloon into a giant dead band when a reference line sits far from the series (breach + empty vault)', () => {
    // The exact task-20 repro shape: price has crashed well below a defense
    // line that hasn't moved. The old `*1.05`-on-the-raw-value formula left
    // most of the domain empty above the series; proportional padding keeps
    // the padding itself small relative to the (now much wider) span.
    const [min, max] = computeYDomain([0.6, 0.62, 0.58], 0.996, 0.996);
    const span = max - min;
    const pad = span * 0.04;
    // The padding on either side should be a small sliver of the total span,
    // not a large fraction of it.
    expect(pad / span).toBeLessThan(0.05);
    expect(max).toBeGreaterThanOrEqual(0.996);
    expect(min).toBeLessThanOrEqual(0.58);
  });

  it('ignores a hidden (<=0) floor line — the vault-covers-outstanding edge case', () => {
    const withoutFloor = computeYDomain([0.9, 1.0], 0.78, 0);
    const seriesOnly = computeYDomain([0.9, 1.0], 0.78);
    expect(withoutFloor).toEqual(seriesOnly);
  });

  it('ignores a hidden (<=0) defense line — the no-live-loan edge case', () => {
    const withoutDefense = computeYDomain([0.9, 1.0], 0, 0.585);
    // raw span is [0.585, 1.0] (floor pulls the min down; no defense to extend the max).
    const pad = (1.0 - 0.585) * 0.04;
    expect(withoutDefense[1]).toBeCloseTo(1.0 + pad, 6);
  });

  it('never goes negative even with a floor deep below the series', () => {
    const [min] = computeYDomain([0.05], 0, 0.01);
    expect(min).toBeGreaterThanOrEqual(0);
  });

  it('gives a flat series some visible headroom instead of a zero-height domain', () => {
    const [min, max] = computeYDomain([1, 1, 1]);
    expect(max).toBeGreaterThan(min);
  });

  it('falls back to [0, 1] for an empty series with no defense/floor', () => {
    expect(computeYDomain([])).toEqual([0, 1]);
  });
});

describe('isCoincidentLines', () => {
  it('is always coincident when the vault is empty, regardless of pixel distance', () => {
    expect(isCoincidentLines(100, 300, 0)).toBe(true);
    expect(isCoincidentLines(100, 300, -5)).toBe(true);
  });

  it('is coincident when the two lines land within the pixel threshold', () => {
    expect(isCoincidentLines(100, 108, 1_500)).toBe(true);
    expect(isCoincidentLines(100, 113.9, 1_500)).toBe(true);
  });

  it('is not coincident when the lines are well separated and the vault has money', () => {
    expect(isCoincidentLines(100, 200, 1_500)).toBe(false);
  });

  it('is not coincident when either line is hidden (null)', () => {
    expect(isCoincidentLines(null, 200, 1_500)).toBe(false);
    expect(isCoincidentLines(100, null, 1_500)).toBe(false);
  });
});

describe('selectFloorCaption', () => {
  it('returns null when there is no active loan (no defense line)', () => {
    expect(
      selectFloorCaption({ hasDefense: false, hasFloor: false, isBreach: false, coincident: false, vaultBalance: 0 }),
    ).toBeNull();
  });

  it('breach with a funded vault: reassurance, takes priority over the coincident nudge', () => {
    const caption = selectFloorCaption({
      hasDefense: true,
      hasFloor: true,
      isBreach: true,
      coincident: true,
      vaultBalance: 500,
    });
    expect(caption).toBe("I'm stepping in on my next check.");
  });

  it('breach with an empty vault: the explicit top-up nudge', () => {
    const caption = selectFloorCaption({
      hasDefense: true,
      hasFloor: true,
      isBreach: true,
      coincident: true,
      vaultBalance: 0,
    });
    expect(caption).toBe('Your vault is empty — top up so I can act.');
  });

  it('coincident but not breached: the fund-your-vault nudge', () => {
    const caption = selectFloorCaption({
      hasDefense: true,
      hasFloor: true,
      isBreach: false,
      coincident: true,
      vaultBalance: 0,
    });
    expect(caption).toBe("Fund your Shadow Vault to open a buffer below this line — that's where I repay from.");
  });

  it('the default grace-period explanation when neither breached nor coincident', () => {
    const caption = selectFloorCaption({
      hasDefense: true,
      hasFloor: true,
      isBreach: false,
      coincident: false,
      vaultBalance: 1_500,
    });
    expect(caption).toBe("Below the protection floor, I open a grace period instead of a fire-sale — there's no forced liquidation here.");
  });

  it('no caption when the floor line is hidden and nothing else applies', () => {
    const caption = selectFloorCaption({
      hasDefense: true,
      hasFloor: false,
      isBreach: false,
      coincident: false,
      vaultBalance: 5_000,
    });
    expect(caption).toBeNull();
  });

  // First-person Cermin voice (STATE.md §2 / §3 tone rule) across every
  // non-null caption variant.
  it.each([
    { isBreach: true, coincident: false, vaultBalance: 500 },
    { isBreach: true, coincident: false, vaultBalance: 0 },
    { isBreach: false, coincident: true, vaultBalance: 0 },
    { isBreach: false, coincident: false, vaultBalance: 1_500 },
  ])('is first-person Cermin voice for %o', (variant) => {
    const caption = selectFloorCaption({ hasDefense: true, hasFloor: true, ...variant });
    expect(caption).toMatch(/\bI\b/);
  });
});

describe('shouldClearTooltipOnPointerUp', () => {
  it('clears on touch release (the "stuck tooltip" fix — touch never fires pointerleave on drag-off)', () => {
    expect(shouldClearTooltipOnPointerUp('touch')).toBe(true);
  });

  it('clears on pen release too', () => {
    expect(shouldClearTooltipOnPointerUp('pen')).toBe(true);
  });

  it('leaves a mouse pointer alone — pointerleave/blur already govern it', () => {
    expect(shouldClearTooltipOnPointerUp('mouse')).toBe(false);
  });
});

describe('buildLinePath', () => {
  it('starts with M and continues with L for each subsequent point', () => {
    const d = buildLinePath([
      { x: 0, y: 10 },
      { x: 5, y: 20 },
      { x: 10, y: 5 },
    ]);
    expect(d).toBe('M0.00,10.00 L5.00,20.00 L10.00,5.00');
  });

  it('is empty for no points', () => {
    expect(buildLinePath([])).toBe('');
  });
});

describe('buildAreaPath', () => {
  it('closes the line down to the baseline and back to the first x', () => {
    const d = buildAreaPath(
      [
        { x: 0, y: 10 },
        { x: 10, y: 5 },
      ],
      50,
    );
    expect(d).toBe('M0.00,10.00 L10.00,5.00 L10.00,50.00 L0.00,50.00 Z');
  });

  it('is empty for no points', () => {
    expect(buildAreaPath([], 50)).toBe('');
  });
});

describe('pickTickIndices', () => {
  it('picks first, middle, and last for a typical 31-point series', () => {
    expect(pickTickIndices(31)).toEqual([0, 15, 30]);
  });

  it('dedupes when count >= length (short series)', () => {
    expect(pickTickIndices(2)).toEqual([0, 1]);
    expect(pickTickIndices(1)).toEqual([0]);
  });

  it('is empty for a zero-length series', () => {
    expect(pickTickIndices(0)).toEqual([]);
  });
});

describe('nearestIndex', () => {
  it('finds the closest x position', () => {
    const xs = [0, 10, 20, 30];
    expect(nearestIndex(xs, 12)).toBe(1);
    expect(nearestIndex(xs, 26)).toBe(3);
    expect(nearestIndex(xs, -5)).toBe(0);
  });
});

describe('computeDeltaPercent', () => {
  it('computes the % change from the first to the last price', () => {
    expect(computeDeltaPercent([1.0, 1.04])).toBeCloseTo(4, 6);
    expect(computeDeltaPercent([1.0, 0.76])).toBeCloseTo(-24, 6);
  });

  it('is 0 for fewer than 2 points or a worthless starting price', () => {
    expect(computeDeltaPercent([])).toBe(0);
    expect(computeDeltaPercent([1.0])).toBe(0);
    expect(computeDeltaPercent([0, 1.0])).toBe(0);
  });
});
