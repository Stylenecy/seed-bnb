import { beforeEach, describe, expect, it } from 'vitest';
import { targetBpsForTriggerBps } from './lib/health';
import { BACKFILL_DAYS } from './lib/priceHistory';
import { DEFAULT_STRATEGY_ID, STRATEGY_TRIGGER_BPS } from './lib/strategies';
import {
  useCerminStore,
  selectCollateralValue,
  selectDefensePrice,
  selectHealthRatioBps,
  selectHealthStatus,
  selectProtectionFloorPrice,
  selectProtectionRunway,
} from './store';

// Snapshot the store's initial state so each test can restore it — Zustand
// stores are module-level singletons, and these actions mutate in place.
const initialState = useCerminStore.getState();

beforeEach(() => {
  useCerminStore.setState(initialState, true);
});

describe('initial demo state', () => {
  it('matches the seeded demo numbers and starts Protected', () => {
    const state = useCerminStore.getState();
    expect(selectCollateralValue(state)).toBe(10_000);
    expect(state.loan.outstanding).toBe(6_000);
    expect(state.shadowVault.balance).toBe(1_500);
    expect(selectHealthRatioBps(state)).toBe(16_667);
    expect(selectHealthStatus(state)).toBe('protected');
  });

  it('seeds the activity feed newest-first', () => {
    const { activity } = useCerminStore.getState();
    expect(activity.length).toBeGreaterThanOrEqual(2);
    // seed-welcome is the more recent seed timestamp (-2min) and must render
    // before seed-vault (-6min) — ActivityFeed renders array order as-is.
    expect(new Date(activity[0].at).getTime()).toBeGreaterThan(new Date(activity[1].at).getTime());
    expect(activity[0].id).toBe('seed-welcome');
    expect(activity[1].id).toBe('seed-vault');
  });

  it('derives the Shadow Vault protection runway from the demo numbers (~41.5%)', () => {
    const runway = selectProtectionRunway(useCerminStore.getState());
    expect(runway).toBeCloseTo(0.415, 6);
  });

  it('seeds the Guard Trigger at the default strategy so BorrowFlow opens on the Recommended card', () => {
    // Cross-check between store.ts's initialGuardPolicy and Amendment 4's
    // DEFAULT_STRATEGY_ID (Balanced): if either side drifts, the Borrow
    // flow would silently stop opening on the default/Recommended card.
    const { guardPolicy } = useCerminStore.getState();
    expect(guardPolicy.triggerRatioBps).toBe(STRATEGY_TRIGGER_BPS[DEFAULT_STRATEGY_ID]);
    expect(guardPolicy.targetRatioBps).toBe(targetBpsForTriggerBps(guardPolicy.triggerRatioBps));
  });

  it('seeds priceHistory with a 30-day synthetic backfill plus one observed point at the demo price', () => {
    const { priceHistory } = useCerminStore.getState();
    expect(priceHistory).toHaveLength(BACKFILL_DAYS + 1);
    expect(priceHistory[priceHistory.length - 1]).toMatchObject({ price: 1.0 });
    expect(priceHistory[priceHistory.length - 1].synthetic).toBeUndefined();
  });

  it('derives the Task 17 defense/floor chart lines from the demo numbers (0.78 / 0.585)', () => {
    const state = useCerminStore.getState();
    expect(selectDefensePrice(state)).toBe(0.78);
    expect(selectProtectionFloorPrice(state)).toBe(0.585);
  });
});

describe('setPrice + guardRepay (the rescue scenario)', () => {
  it('does nothing while the price is unchanged', () => {
    useCerminStore.getState().guardRepay();
    const state = useCerminStore.getState();
    expect(state.loan.outstanding).toBe(6_000);
    expect(state.shadowVault.balance).toBe(1_500);
  });

  it('fires GuardRepay and logs a rescue activity entry when price drops to 0.76', () => {
    useCerminStore.getState().setPrice(0.76);
    expect(selectHealthStatus(useCerminStore.getState())).toBe('action');

    const activityBefore = useCerminStore.getState().activity.length;
    useCerminStore.getState().guardRepay();
    const state = useCerminStore.getState();

    expect(state.loan.outstanding).toBeCloseTo(5_241.38, 2);
    expect(state.shadowVault.balance).toBeCloseTo(741.38, 2);
    // Amendment 3: restored to the 145% target = Protected — the demo rescue ends green.
    expect(selectHealthStatus(state)).toBe('protected');
    expect(state.activity.length).toBe(activityBefore + 1);
    expect(state.activity[0].kind).toBe('rescue');
    expect(state.activity[0].message).toContain('Shadow Vault');
  });

  it('appends an observed price tick to priceHistory, deduping a no-op price move', () => {
    const before = useCerminStore.getState().priceHistory.length;
    useCerminStore.getState().setPrice(1.0); // same as the seeded price: no-op
    expect(useCerminStore.getState().priceHistory.length).toBe(before);

    useCerminStore.getState().setPrice(0.76);
    const after = useCerminStore.getState().priceHistory;
    expect(after.length).toBe(before + 1);
    expect(after[after.length - 1]).toMatchObject({ price: 0.76 });
  });

  it('drops the defense line toward the price after a rescue repays the loan (post-rescue, chart reacts)', () => {
    const before = selectDefensePrice(useCerminStore.getState());
    useCerminStore.getState().setPrice(0.76);
    useCerminStore.getState().guardRepay();
    const after = selectDefensePrice(useCerminStore.getState());
    // Lower outstanding after the rescue -> a lower price would be needed to
    // breach the trigger again -> the defense line drops.
    expect(after).toBeLessThan(before);
  });
});

describe('payCoupon', () => {
  it('credits the wallet when Coupon Sweep is off', () => {
    useCerminStore.getState().payCoupon();
    const state = useCerminStore.getState();
    expect(state.wallet.balance).toBe(112.5);
    expect(state.loan.outstanding).toBe(6_000);
    expect(state.activity[0].kind).toBe('coupon');
  });

  it('sweeps into the loan when Coupon Sweep is on', () => {
    useCerminStore.getState().setCouponSweep(true);
    useCerminStore.getState().payCoupon();
    const state = useCerminStore.getState();
    expect(state.loan.outstanding).toBe(5_887.5); // 6000 - 112.50
    expect(state.wallet.balance).toBe(0);
  });
});

describe('borrow / topUpVault / withdrawVault', () => {
  it('borrow increases outstanding and credits the wallet', () => {
    useCerminStore.getState().borrow(1_000);
    const state = useCerminStore.getState();
    expect(state.loan.outstanding).toBe(7_000);
    expect(state.wallet.balance).toBe(1_000);
  });

  it('topUpVault moves funds from wallet to vault, capped at the wallet balance', () => {
    useCerminStore.getState().borrow(500);
    useCerminStore.getState().topUpVault(1_000); // only 500 available
    const state = useCerminStore.getState();
    expect(state.wallet.balance).toBe(0);
    expect(state.shadowVault.balance).toBe(2_000); // 1500 + 500
  });

  it('withdrawVault moves funds from vault to wallet, capped at the vault balance', () => {
    useCerminStore.getState().withdrawVault(10_000); // only 1500 available
    const state = useCerminStore.getState();
    expect(state.shadowVault.balance).toBe(0);
    expect(state.wallet.balance).toBe(1_500);
  });
});

describe('setGuardTrigger', () => {
  it('updates the trigger and keeps the 1500bps restore spread to the target', () => {
    useCerminStore.getState().setGuardTrigger(15_000); // 150%
    const state = useCerminStore.getState();
    expect(state.guardPolicy.triggerRatioBps).toBe(15_000);
    expect(state.guardPolicy.targetRatioBps).toBe(16_500);
    expect(state.activity[0].message).toContain('Guard Trigger');
  });

  it('ignores a non-positive trigger', () => {
    useCerminStore.getState().setGuardTrigger(0);
    expect(useCerminStore.getState().guardPolicy.triggerRatioBps).toBe(13_000);
  });
});

describe('setCouponSweep activity logging', () => {
  it('logs an activity entry when toggled on and off', () => {
    useCerminStore.getState().setCouponSweep(true);
    expect(useCerminStore.getState().activity[0].message).toContain('Coupon Sweep on');
    useCerminStore.getState().setCouponSweep(false);
    expect(useCerminStore.getState().activity[0].message).toContain('Coupon Sweep off');
  });
});

describe('resetDemo', () => {
  it('restores every slice to the seeded demo numbers after the rescue scenario runs', () => {
    useCerminStore.getState().setPrice(0.76);
    useCerminStore.getState().guardRepay();
    useCerminStore.getState().resetDemo();

    const state = useCerminStore.getState();
    expect(state.collateral.price).toBe(1.0);
    expect(state.loan.outstanding).toBe(6_000);
    expect(state.shadowVault.balance).toBe(1_500);
    expect(state.guardPolicy.triggerRatioBps).toBe(13_000);
    expect(state.wallet.balance).toBe(0);
    expect(state.activity[0].id).toBe('seed-welcome');
    expect(state.priceHistory).toHaveLength(BACKFILL_DAYS + 1);
    expect(state.priceHistory[state.priceHistory.length - 1].price).toBe(1.0);
  });
});
