import { describe, expect, it } from 'vitest';
import {
  collateralFloorForRatioBps,
  computeGuardRepay,
  computeHealthRatioBps,
  computeProtectionRunway,
  computeQuarterlyCoupon,
  defensePrice,
  getNextCouponDate,
  healthStatus,
  maxOutstandingForRatioBps,
  protectionFloorPrice,
  RESTORE_SPREAD_BPS,
  roundMoney,
  targetBpsForTriggerBps,
} from './health';

// Demo numbers verbatim from .superpowers/sdd/global-constraints.md:
// - 10,000 mUST face value, price 1.00 -> $10,000 collateral value.
// - Loan principal 6,000 mUSD, rate 500 bps -> initial Health Ratio 166%.
// - Guard Trigger 13000 bps (130%), target restore 14500 bps (145%), maxRepayPerEvent 2,000.
// - Shadow Vault funded with 1,500 mUSD.
// - Rescue: price drops to 0.76 -> ratio 126.7% < 130% -> GuardRepay ~759 -> outstanding ~5,241 -> ratio ~145%.
// - Coupon: 450 bps annual on 10,000 face = 112.50 mUSD quarterly.

const DEMO = {
  faceValue: 10_000,
  principal: 6_000,
  couponRateBps: 450,
  triggerRatioBps: 13_000,
  targetRatioBps: 14_500,
  maxRepayPerEvent: 2_000,
  vaultBalance: 1_500,
};

describe('computeHealthRatioBps', () => {
  it('matches the demo initial Health Ratio of ~166%', () => {
    const bps = computeHealthRatioBps(DEMO.faceValue * 1.0, DEMO.principal);
    expect(bps).toBe(16_667); // 10000/6000 = 166.67%
    expect(Math.floor(bps / 100)).toBe(166); // "~166%" at whole-percent granularity
  });

  it('matches the demo rescue-trigger ratio of 126.7% after a price drop to 0.76', () => {
    const bps = computeHealthRatioBps(DEMO.faceValue * 0.76, DEMO.principal);
    expect(bps / 100).toBeCloseTo(126.7, 1);
    expect(bps).toBeLessThan(DEMO.triggerRatioBps);
  });

  it('treats an undrawn loan (outstanding 0) as maximally safe', () => {
    expect(computeHealthRatioBps(10_000, 0)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('maxOutstandingForRatioBps (Borrow flow slider cap)', () => {
  it('is the inverse of computeHealthRatioBps: the returned outstanding holds the ratio at/above the floor', () => {
    // Demo collateral $10,000 at the lowest offered Guard Trigger (120%):
    // max outstanding = 10,000 / 1.2 = 8,333.33 (floored to the cent).
    const maxOutstanding = maxOutstandingForRatioBps(10_000, 12_000);
    expect(maxOutstanding).toBe(8_333.33);
    expect(computeHealthRatioBps(10_000, maxOutstanding)).toBeGreaterThanOrEqual(12_000);
  });

  it('pins the demo Borrow slider cap: max additional borrow keeps the ratio >= 12000 bps', () => {
    // Exactly the Borrow flow's derivation: helper minus current outstanding
    // (6,000), floored to the screen's $50 steps -> $2,300 additional.
    const maxAdditional = Math.floor((maxOutstandingForRatioBps(10_000, 12_000) - 6_000) / 50) * 50;
    expect(maxAdditional).toBe(2_300);
    expect(computeHealthRatioBps(10_000, 6_000 + maxAdditional)).toBeGreaterThanOrEqual(12_000);
  });

  it('is 0 for a worthless collateral or non-positive floor', () => {
    expect(maxOutstandingForRatioBps(0, 12_000)).toBe(0);
    expect(maxOutstandingForRatioBps(10_000, 0)).toBe(0);
  });
});

describe('collateralFloorForRatioBps (Guard Trigger strategy cards\' live dollar figure)', () => {
  it('is the inverse of computeHealthRatioBps: the returned collateral value holds the ratio exactly at the target', () => {
    // Demo outstanding $6,000 at the Balanced trigger (130%): floor = 6,000 * 1.30 = 7,800.
    const floor = collateralFloorForRatioBps(6_000, 13_000);
    expect(floor).toBe(7_800);
    expect(computeHealthRatioBps(floor, 6_000)).toBe(13_000);
  });

  it('matches every Amendment 4 strategy trigger against the demo outstanding', () => {
    expect(collateralFloorForRatioBps(6_000, 15_000)).toBe(9_000); // Conservative
    expect(collateralFloorForRatioBps(6_000, 13_000)).toBe(7_800); // Balanced
    expect(collateralFloorForRatioBps(6_000, 12_000)).toBe(7_200); // Aggressive
  });

  it('is 0 for a fully repaid loan or a non-positive ratio', () => {
    expect(collateralFloorForRatioBps(0, 13_000)).toBe(0);
    expect(collateralFloorForRatioBps(6_000, 0)).toBe(0);
  });
});

describe('targetBpsForTriggerBps (the trigger-plus-restore-spread rule)', () => {
  it('sits exactly RESTORE_SPREAD_BPS above the trigger (demo: 130% -> 145%)', () => {
    expect(targetBpsForTriggerBps(13_000)).toBe(14_500);
    expect(targetBpsForTriggerBps(15_000)).toBe(16_500);
    expect(targetBpsForTriggerBps(12_000)).toBe(12_000 + RESTORE_SPREAD_BPS);
  });
});

describe('healthStatus (Amendment 3: thresholds derive from the GuardPolicy, no magic 150%)', () => {
  it('is Protected at/above the target ratio', () => {
    expect(healthStatus(14_500, 13_000, 14_500)).toBe('protected'); // exactly at target: protected
    expect(healthStatus(16_667, 13_000, 14_500)).toBe('protected');
  });

  it('is Guarded between the trigger (inclusive) and the target (exclusive)', () => {
    expect(healthStatus(14_499, 13_000, 14_500)).toBe('guarded');
    expect(healthStatus(13_000, 13_000, 14_500)).toBe('guarded'); // exactly at trigger: not yet "action"
  });

  it('is Action suggested strictly below the trigger', () => {
    expect(healthStatus(12_999, 13_000, 14_500)).toBe('action');
    expect(healthStatus(12_667, 13_000, 14_500)).toBe('action');
  });

  it('follows a custom policy, not hardcoded demo numbers', () => {
    // Trigger 120%, target 135%: 140% is protected here even though it
    // sits below the demo policy's 145% target.
    expect(healthStatus(14_000, 12_000, 13_500)).toBe('protected');
    expect(healthStatus(13_000, 12_000, 13_500)).toBe('guarded');
    expect(healthStatus(11_900, 12_000, 13_500)).toBe('action');
  });
});

describe('computeGuardRepay — the rescue scenario', () => {
  it('fires and repays toward the target ratio when price drops to 0.76', () => {
    const collateralValue = DEMO.faceValue * 0.76; // 7,600
    const result = computeGuardRepay({
      collateralValue,
      outstanding: DEMO.principal,
      vaultBalance: DEMO.vaultBalance,
      triggerRatioBps: DEMO.triggerRatioBps,
      targetRatioBps: DEMO.targetRatioBps,
      maxRepayPerEvent: DEMO.maxRepayPerEvent,
    });

    expect(result.fired).toBe(true);
    expect(result.repayAmount).toBeCloseTo(758.62, 2); // "~759 mUSD"
    expect(result.newOutstanding).toBeCloseTo(5_241.38, 2); // "~5,241"
    expect(result.newVaultBalance).toBeCloseTo(741.38, 2);
    expect(result.healthAfterBps / 100).toBeCloseTo(145.0, 0); // "~145%"
    expect(result.healthAfterBps).toBeGreaterThanOrEqual(DEMO.targetRatioBps - 5);
    // Amendment 3: restoring to target IS Protected — the demo rescue ends green.
    expect(healthStatus(result.healthAfterBps, DEMO.triggerRatioBps, DEMO.targetRatioBps)).toBe('protected');
  });

  it('is a no-op when the Health Ratio is already at/above the trigger', () => {
    const collateralValue = DEMO.faceValue * 1.0; // full-price, 166% ratio
    const result = computeGuardRepay({
      collateralValue,
      outstanding: DEMO.principal,
      vaultBalance: DEMO.vaultBalance,
      triggerRatioBps: DEMO.triggerRatioBps,
      targetRatioBps: DEMO.targetRatioBps,
      maxRepayPerEvent: DEMO.maxRepayPerEvent,
    });

    expect(result.fired).toBe(false);
    expect(result.repayAmount).toBe(0);
    expect(result.newOutstanding).toBe(DEMO.principal);
    expect(result.newVaultBalance).toBe(DEMO.vaultBalance);
  });

  it('caps the repayment at maxRepayPerEvent when the vault can cover more than that', () => {
    // Severe drop: needed repay would exceed maxRepayPerEvent, but the vault has plenty.
    const collateralValue = DEMO.faceValue * 0.5; // 5,000 -> ratio 83.3%, well under trigger
    const result = computeGuardRepay({
      collateralValue,
      outstanding: DEMO.principal,
      vaultBalance: 10_000, // plenty of vault balance
      triggerRatioBps: DEMO.triggerRatioBps,
      targetRatioBps: DEMO.targetRatioBps,
      maxRepayPerEvent: DEMO.maxRepayPerEvent,
    });

    // needed = 6000 - 5000/1.45 = 2551.72, which exceeds maxRepayPerEvent (2000)
    expect(result.fired).toBe(true);
    expect(result.repayAmount).toBe(DEMO.maxRepayPerEvent);
    expect(result.newOutstanding).toBeCloseTo(DEMO.principal - DEMO.maxRepayPerEvent, 2);
  });

  it('caps the repayment at the available vault balance when the vault is the tightest constraint', () => {
    const collateralValue = DEMO.faceValue * 0.76; // needed ~758.62
    const result = computeGuardRepay({
      collateralValue,
      outstanding: DEMO.principal,
      vaultBalance: 200, // much smaller than what's needed
      triggerRatioBps: DEMO.triggerRatioBps,
      targetRatioBps: DEMO.targetRatioBps,
      maxRepayPerEvent: DEMO.maxRepayPerEvent,
    });

    expect(result.fired).toBe(true);
    expect(result.repayAmount).toBe(200);
    expect(result.newVaultBalance).toBe(0);
    // Only partial protection — still below the target, but better than before.
    expect(result.healthAfterBps).toBeGreaterThan(result.healthBeforeBps);
  });
});

describe('computeProtectionRunway', () => {
  it('derives the demo Shadow Vault runway from the demo numbers', () => {
    // With the seeded demo numbers (10,000 @ $1.00 collateral, 6,000
    // outstanding, 130% trigger), the vault (1,500) is fully spent by the
    // time the fully-reduced position (outstanding - vault = 4,500) itself
    // crosses the trigger: floor collateral value = 1.3 * 4,500 = 5,850,
    // i.e. a 41.5% drop from the current $10,000 collateral value.
    //
    // Note: docs/03-ux.md's illustrative copy ("Your vault can absorb a
    // 23% price drop") predates the demo numbers fixed later in
    // global-constraints.md and was never reconciled with them — 41.5% is
    // the value this formula produces for the actual seeded state.
    const runway = computeProtectionRunway({
      collateralValue: 10_000,
      outstanding: 6_000,
      vaultBalance: 1_500,
      triggerRatioBps: 13_000,
    });
    expect(runway).toBeCloseTo(0.415, 6);
    expect(Math.round(runway * 100)).toBe(42); // rounds to "42%" for display
  });

  it('is 0 when the vault cannot cover any drop (vault already at/above what full repay would need)', () => {
    // A vault bigger than outstanding fully repays the loan outright —
    // there's no floor collateral value below which the position isn't
    // safe, so the runway caps at 100%, not more.
    const runway = computeProtectionRunway({
      collateralValue: 10_000,
      outstanding: 6_000,
      vaultBalance: 6_000,
      triggerRatioBps: 13_000,
    });
    expect(runway).toBe(1);
  });

  it('grows with a bigger vault balance and shrinks with a smaller one', () => {
    const base = { collateralValue: 10_000, outstanding: 6_000, triggerRatioBps: 13_000 };
    const smaller = computeProtectionRunway({ ...base, vaultBalance: 500 });
    const bigger = computeProtectionRunway({ ...base, vaultBalance: 3_000 });
    expect(bigger).toBeGreaterThan(smaller);
  });

  it('is 0 for an undrawn loan (no outstanding to protect)', () => {
    expect(computeProtectionRunway({ collateralValue: 10_000, outstanding: 0, vaultBalance: 1_500, triggerRatioBps: 13_000 })).toBe(0);
  });
});

describe('computeQuarterlyCoupon', () => {
  it('matches the demo: 450 bps annual on 10,000 face = 112.50 mUSD quarterly', () => {
    expect(computeQuarterlyCoupon(DEMO.faceValue, DEMO.couponRateBps)).toBe(112.5);
  });
});

describe('roundMoney', () => {
  it('rounds to the nearest cent', () => {
    expect(roundMoney(758.6206896551724)).toBe(758.62);
    expect(roundMoney(5241.379310344828)).toBe(5241.38);
  });
});

describe('defensePrice (Task 17 chart — "Cermin defends · $X" line)', () => {
  it('matches the demo numbers: outstanding 6000, trigger 13000, collateral 10000 -> 0.78', () => {
    expect(defensePrice(6_000, 13_000, 10_000)).toBe(0.78);
  });

  it('is the price at which computeHealthRatioBps exactly equals the trigger', () => {
    const price = defensePrice(6_000, 13_000, 10_000);
    expect(computeHealthRatioBps(10_000 * price, 6_000)).toBe(13_000);
  });

  it('is 0 for an undrawn loan, a non-positive trigger, or worthless collateral', () => {
    expect(defensePrice(0, 13_000, 10_000)).toBe(0);
    expect(defensePrice(6_000, 0, 10_000)).toBe(0);
    expect(defensePrice(6_000, 13_000, 0)).toBe(0);
  });

  it('rises with a bigger outstanding and falls with more collateral', () => {
    const base = defensePrice(6_000, 13_000, 10_000);
    expect(defensePrice(8_000, 13_000, 10_000)).toBeGreaterThan(base);
    expect(defensePrice(6_000, 13_000, 15_000)).toBeLessThan(base);
  });
});

describe('protectionFloorPrice (Task 17 chart — "Protection floor · $Y" line, NOT liquidation)', () => {
  it('matches the demo numbers: outstanding 6000, vault 1500, trigger 13000, collateral 10000 -> 0.585', () => {
    expect(protectionFloorPrice(6_000, 1_500, 13_000, 10_000)).toBe(0.585);
  });

  it('is always at/below defensePrice for the same inputs (the floor sits under the defense line)', () => {
    const defense = defensePrice(6_000, 13_000, 10_000);
    const floor = protectionFloorPrice(6_000, 1_500, 13_000, 10_000);
    expect(floor).toBeLessThan(defense);
  });

  it('is the price at which the fully-vault-reduced position exactly hits the trigger', () => {
    const floor = protectionFloorPrice(6_000, 1_500, 13_000, 10_000);
    expect(computeHealthRatioBps(10_000 * floor, 6_000 - 1_500)).toBe(13_000);
  });

  it('clamps to 0 (and hides the line) when the vault balance is >= outstanding', () => {
    expect(protectionFloorPrice(6_000, 6_000, 13_000, 10_000)).toBe(0);
    expect(protectionFloorPrice(6_000, 9_000, 13_000, 10_000)).toBe(0); // over-funded vault
  });

  it('is 0 for an undrawn loan, a non-positive trigger, or worthless collateral', () => {
    expect(protectionFloorPrice(0, 1_500, 13_000, 10_000)).toBe(0);
    expect(protectionFloorPrice(6_000, 1_500, 0, 10_000)).toBe(0);
    expect(protectionFloorPrice(6_000, 1_500, 13_000, 0)).toBe(0);
  });
});

describe('getNextCouponDate', () => {
  it('returns the next calendar-quarter end on or after "now"', () => {
    expect(getNextCouponDate(new Date(Date.UTC(2026, 6, 10)))).toEqual(new Date(Date.UTC(2026, 8, 30)));
    expect(getNextCouponDate(new Date(Date.UTC(2026, 0, 1)))).toEqual(new Date(Date.UTC(2026, 2, 31)));
    expect(getNextCouponDate(new Date(Date.UTC(2026, 11, 31)))).toEqual(new Date(Date.UTC(2026, 11, 31)));
    expect(getNextCouponDate(new Date(Date.UTC(2026, 11, 31, 12)))).toEqual(new Date(Date.UTC(2027, 2, 31)));
  });
});
