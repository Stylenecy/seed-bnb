import { describe, expect, it } from 'vitest';
import {
  buildStrategyLiveCopy,
  CUSTOM_TRIGGER_MAX_BPS,
  CUSTOM_TRIGGER_MIN_BPS,
  DEFAULT_STRATEGY_ID,
  MAX_LTV,
  STRATEGIES,
  STRATEGY_TRIGGER_BPS,
  strategyForTriggerBps,
  strategyIdForTriggerBps,
  strategyNameForTriggerBps,
} from './strategies';

// Amendment 4 (global-constraints.md) — BINDING: names, values, and order.
// Conservative 15000 bps; Balanced 13000 bps (DEFAULT, "Recommended" chip);
// Aggressive 12000 bps; Custom user-picked 12000-15000 bps.

describe('STRATEGIES (Amendment 4, pinned)', () => {
  it('is exactly four strategies in the binding order', () => {
    expect(STRATEGIES.map((s) => s.id)).toEqual(['conservative', 'balanced', 'aggressive', 'custom']);
  });

  it('pins the exact bps for each named strategy', () => {
    expect(STRATEGY_TRIGGER_BPS).toEqual({ conservative: 15_000, balanced: 13_000, aggressive: 12_000 });
    // The card list reads from the same typed lookup — no second copy of the numbers.
    expect(STRATEGIES.find((s) => s.id === 'conservative')?.triggerBps).toBe(15_000);
    expect(STRATEGIES.find((s) => s.id === 'balanced')?.triggerBps).toBe(13_000);
    expect(STRATEGIES.find((s) => s.id === 'aggressive')?.triggerBps).toBe(12_000);
  });

  it('Custom has no fixed bps — it is user-picked', () => {
    expect(STRATEGIES.find((s) => s.id === 'custom')?.triggerBps).toBeNull();
  });

  it('only Balanced carries the "Recommended" chip, and is the default', () => {
    const recommended = STRATEGIES.filter((s) => s.recommended);
    expect(recommended).toHaveLength(1);
    expect(recommended[0].id).toBe('balanced');
    expect(DEFAULT_STRATEGY_ID).toBe('balanced');
  });

  it('gives every strategy non-empty first-person Cermin copy', () => {
    for (const s of STRATEGIES) {
      expect(s.summary.length).toBeGreaterThan(0);
      expect(s.meaning.length).toBeGreaterThan(0);
      // First-person Cermin voice on EVERY card — both lines must have
      // Cermin speaking as "I" (docs/03-ux.md copy tone).
      expect(s.summary).toMatch(/\bI\b/);
      expect(s.meaning).toMatch(/\bI\b/);
      // Zero jargon / calm: no scare words.
      expect(s.summary.toLowerCase()).not.toContain('liquidat');
      expect(s.meaning.toLowerCase()).not.toContain('liquidat');
    }
  });
});

describe('strategyIdForTriggerBps (which card the Borrow flow opens on)', () => {
  it('opens on the named card for an exact Amendment 4 value', () => {
    expect(strategyIdForTriggerBps(15_000)).toBe('conservative');
    expect(strategyIdForTriggerBps(13_000)).toBe('balanced');
    expect(strategyIdForTriggerBps(12_000)).toBe('aggressive');
  });

  it('opens on Custom for a prior custom pick inside the 120-150% range', () => {
    expect(strategyIdForTriggerBps(12_500)).toBe('custom');
    expect(strategyIdForTriggerBps(14_000)).toBe('custom');
  });

  it('falls back to the recommended default for a trigger this UI cannot represent', () => {
    expect(strategyIdForTriggerBps(11_000)).toBe(DEFAULT_STRATEGY_ID);
    expect(strategyIdForTriggerBps(16_000)).toBe(DEFAULT_STRATEGY_ID);
  });
});

describe('Custom picker range (Amendment 4: 120%-150%)', () => {
  it('pins the min/max bps', () => {
    expect(CUSTOM_TRIGGER_MIN_BPS).toBe(12_000);
    expect(CUSTOM_TRIGGER_MAX_BPS).toBe(15_000);
  });

  it('matches the Aggressive/Conservative fixed values at its bounds', () => {
    expect(CUSTOM_TRIGGER_MIN_BPS).toBe(STRATEGIES.find((s) => s.id === 'aggressive')?.triggerBps);
    expect(CUSTOM_TRIGGER_MAX_BPS).toBe(STRATEGIES.find((s) => s.id === 'conservative')?.triggerBps);
  });
});

describe('strategyForTriggerBps / strategyNameForTriggerBps (Vault read-only mapping)', () => {
  it('finds the named strategy for each Amendment 4 value', () => {
    expect(strategyForTriggerBps(15_000)?.id).toBe('conservative');
    expect(strategyForTriggerBps(13_000)?.id).toBe('balanced');
    expect(strategyForTriggerBps(12_000)?.id).toBe('aggressive');
  });

  it('reports the strategy name for a fixed bps', () => {
    expect(strategyNameForTriggerBps(15_000)).toBe('Conservative');
    expect(strategyNameForTriggerBps(13_000)).toBe('Balanced');
    expect(strategyNameForTriggerBps(12_000)).toBe('Aggressive');
  });

  it('reports "Custom" for any bps that is not one of the three named triggers', () => {
    expect(strategyForTriggerBps(12_500)).toBeUndefined();
    expect(strategyNameForTriggerBps(12_500)).toBe('Custom');
    expect(strategyNameForTriggerBps(14_000)).toBe('Custom');
    expect(strategyNameForTriggerBps(10_000)).toBe('Custom');
  });
});

describe('MAX_LTV (Task 17 Collateral card progress-bar ceiling)', () => {
  it('is 1 / 1.2 (the Aggressive/Custom-floor trigger of 120%) ≈ 83.3%', () => {
    expect(MAX_LTV).toBeCloseTo(1 / 1.2, 10);
    expect(Math.round(MAX_LTV * 1000) / 10).toBeCloseTo(83.3, 1);
  });

  it('derives from CUSTOM_TRIGGER_MIN_BPS, not a second hardcoded 12000', () => {
    expect(MAX_LTV).toBeCloseTo(10_000 / CUSTOM_TRIGGER_MIN_BPS, 10);
  });
});

describe('buildStrategyLiveCopy (live numbers, demo loan)', () => {
  it('builds the "when I step in" and "what I do" sentences from the demo outstanding ($6,000)', () => {
    const copy = buildStrategyLiveCopy(13_000, 6_000);
    // Floor = 6,000 * 1.30 = $7,800. Target = 130% + 15% restore spread = 145%.
    expect(copy.stepsIn).toBe(
      "I step in when your Health Ratio touches 130.0% — with this loan, that's when your collateral value falls below $7,800.00.",
    );
    expect(copy.restores).toBe(
      "I repay just enough from your Shadow Vault to bring you back to 145.0% (your restore target).",
    );
  });

  it('recomputes for the Conservative trigger against a bigger previewed loan', () => {
    const copy = buildStrategyLiveCopy(15_000, 8_000);
    // Floor = 8,000 * 1.50 = $12,000. Target = 150% + 15% = 165%.
    expect(copy.stepsIn).toContain('150.0%');
    expect(copy.stepsIn).toContain('$12,000.00');
    expect(copy.restores).toContain('165.0%');
  });

  it('recomputes for the Aggressive trigger', () => {
    const copy = buildStrategyLiveCopy(12_000, 6_000);
    // Floor = 6,000 * 1.20 = $7,200. Target = 120% + 15% = 135%.
    expect(copy.stepsIn).toContain('120.0%');
    expect(copy.stepsIn).toContain('$7,200.00');
    expect(copy.restores).toContain('135.0%');
  });
});
