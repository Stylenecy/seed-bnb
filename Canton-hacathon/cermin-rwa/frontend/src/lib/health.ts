/**
 * Health Ratio math, mirroring the Daml ledger semantics binding for this
 * project (see .superpowers/sdd/global-constraints.md).
 *
 * Health Ratio = collateralValue / outstanding, carried as an Int in basis
 * points (13000 = 130%). Money stays in Decimal-like JS numbers, rounded to
 * cents, the same way the ledger carries `Decimal`.
 *
 * These are pure functions on purpose: the Zustand store in `store.ts` is a
 * thin wrapper that calls into this module and writes the result back into
 * state. Keeping the math pure makes it directly testable against the demo
 * numbers without touching React or Zustand.
 */

export const BPS_SCALE = 10_000;

/**
 * Restore buffer kept between the Guard Trigger and its target ratio
 * (demo default: trigger 130% -> target 145%). Shared by the store's
 * `setGuardTrigger` and the Borrow flow's preview so a custom trigger
 * always derives its target the same way.
 */
export const RESTORE_SPREAD_BPS = 1_500;

/**
 * Restore target for a given Guard Trigger — the single expression of the
 * trigger-plus-spread rule for preview code (lib/strategies.ts's live copy
 * and the Borrow flow's preview). The store's `setGuardTrigger` applies the
 * same spread on confirm. Demo default: trigger 13000 -> target 14500.
 */
export function targetBpsForTriggerBps(triggerBps: number): number {
  return triggerBps + RESTORE_SPREAD_BPS;
}

export type HealthStatus = 'protected' | 'guarded' | 'action';

/** Exact status words per docs/03-ux.md — do not rename. */
export const STATUS_LABEL: Record<HealthStatus, string> = {
  protected: 'Protected',
  guarded: 'Guarded',
  action: 'Action suggested',
};

/** Round to the nearest cent, the way ledger `Decimal` amounts settle. */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Health Ratio in bps = (collateralValue / outstanding) * 10000.
 * An undrawn loan (outstanding <= 0) is maximally safe.
 */
export function computeHealthRatioBps(collateralValue: number, outstanding: number): number {
  if (outstanding <= 0) return Number.POSITIVE_INFINITY;
  return Math.round((collateralValue / outstanding) * BPS_SCALE);
}

/**
 * Largest outstanding debt that still keeps the Health Ratio at/above
 * `ratioBps` for the given collateral value — the inverse of
 * `computeHealthRatioBps`, used to cap the Borrow flow's slider. Floored
 * to the cent so the resulting ratio never lands below the floor.
 */
export function maxOutstandingForRatioBps(collateralValue: number, ratioBps: number): number {
  if (collateralValue <= 0 || ratioBps <= 0) return 0;
  return Math.floor(((collateralValue * BPS_SCALE) / ratioBps) * 100) / 100;
}

/**
 * Collateral value at which the Health Ratio exactly equals `ratioBps` for
 * a given outstanding debt — the inverse of `computeHealthRatioBps` solved
 * for collateral value instead of ratio (mirrors `maxOutstandingForRatioBps`,
 * which solves the same equation for outstanding). Used by the Borrow
 * flow's Guard Trigger strategy cards to turn a trigger percentage into a
 * live dollar figure: "that's when your collateral value falls below $X".
 */
export function collateralFloorForRatioBps(outstanding: number, ratioBps: number): number {
  if (outstanding <= 0 || ratioBps <= 0) return 0;
  return roundMoney((outstanding * ratioBps) / BPS_SCALE);
}

/**
 * Classify a Health Ratio into the three UI states. Both thresholds come
 * from the borrower's GuardPolicy (global-constraints.md Amendment 3):
 * Protected = ratio >= targetRatioBps (the agent restores you to your
 * target, and reaching target means you are protected), Guarded =
 * [triggerRatioBps, targetRatioBps), Action suggested = < triggerRatioBps.
 * Demo defaults: trigger 13000 (130%), target 14500 (145%).
 */
export function healthStatus(healthRatioBps: number, triggerRatioBps: number, targetRatioBps: number): HealthStatus {
  if (healthRatioBps >= targetRatioBps) return 'protected';
  if (healthRatioBps >= triggerRatioBps) return 'guarded';
  return 'action';
}

export interface GuardRepayInput {
  collateralValue: number;
  outstanding: number;
  vaultBalance: number;
  triggerRatioBps: number;
  targetRatioBps: number;
  maxRepayPerEvent: number;
}

export interface GuardRepayResult {
  /** Whether the trigger condition was met and a repayment was made. */
  fired: boolean;
  repayAmount: number;
  newOutstanding: number;
  newVaultBalance: number;
  healthBeforeBps: number;
  healthAfterBps: number;
}

/**
 * Mirrors `ShadowVault.GuardRepay`: fires only when the Health Ratio is
 * strictly below the Guard Trigger, then repays the smaller of
 * (amount needed to restore targetRatioBps, maxRepayPerEvent, vaultBalance).
 */
export function computeGuardRepay(input: GuardRepayInput): GuardRepayResult {
  const { collateralValue, outstanding, vaultBalance, triggerRatioBps, targetRatioBps, maxRepayPerEvent } = input;
  const healthBeforeBps = computeHealthRatioBps(collateralValue, outstanding);

  if (healthBeforeBps >= triggerRatioBps) {
    return {
      fired: false,
      repayAmount: 0,
      newOutstanding: outstanding,
      newVaultBalance: vaultBalance,
      healthBeforeBps,
      healthAfterBps: healthBeforeBps,
    };
  }

  const targetRatio = targetRatioBps / BPS_SCALE;
  // Outstanding that would exactly hit the target ratio at this collateral value.
  const outstandingForTarget = collateralValue / targetRatio;
  const needed = Math.max(outstanding - outstandingForTarget, 0);
  const repayAmount = roundMoney(Math.min(needed, maxRepayPerEvent, vaultBalance, outstanding));
  const newOutstanding = roundMoney(outstanding - repayAmount);
  const newVaultBalance = roundMoney(vaultBalance - repayAmount);
  const healthAfterBps = computeHealthRatioBps(collateralValue, newOutstanding);

  return {
    fired: repayAmount > 0,
    repayAmount,
    newOutstanding,
    newVaultBalance,
    healthBeforeBps,
    healthAfterBps,
  };
}

/** Quarterly coupon = faceValue * couponRateBps / 10000 / 4. */
export function computeQuarterlyCoupon(faceValue: number, couponRateBps: number): number {
  return roundMoney((faceValue * couponRateBps) / BPS_SCALE / 4);
}

/**
 * "Protection runway" — the total price drop (as a fraction, e.g. 0.415 =
 * 41.5%) the current Shadow Vault balance can fully protect against, for a
 * price that keeps sliding down (exactly the Simulation screen's scenario).
 * Used for the Shadow Vault screen's reassurance line: "Your vault can
 * absorb an N% price drop."
 *
 * Derivation: as price falls, GuardRepay fires every time the ratio would
 * cross the Guard Trigger, each time spending vault money to restore some
 * ratio above the trigger. Regardless of how many times it fires along the
 * way, by the time the vault is fully spent it has moved a total of exactly
 * `vaultBalance` from outstanding (that's the whole balance, spent once).
 * So the vault keeps the position safe up until the price at which the
 * *fully-reduced* position (outstanding - vaultBalance) would itself cross
 * the trigger — the same boundary whether the vault is spent in one event
 * or several. Solving `(collateralValue') / (outstanding - vaultBalance) =
 * triggerRatio` for collateralValue' gives the floor collateral value the
 * vault can protect down to; the runway is the drop from today's
 * collateral value to that floor.
 */
export function computeProtectionRunway(input: {
  collateralValue: number;
  outstanding: number;
  vaultBalance: number;
  triggerRatioBps: number;
}): number {
  const { collateralValue, outstanding, vaultBalance, triggerRatioBps } = input;
  if (collateralValue <= 0 || outstanding <= 0) return 0;
  const triggerRatio = triggerRatioBps / BPS_SCALE;
  const minCollateralValue = triggerRatio * Math.max(outstanding - vaultBalance, 0);
  const drop = 1 - minCollateralValue / collateralValue;
  return Math.max(0, Math.min(1, drop));
}

/** Round to 4 decimal places — enough precision for a sub-$10 collateral
 * price (unlike `roundMoney`'s 2-decimal cent rounding) without carrying
 * floating-point noise into the UI or a snapshot test. */
function roundPrice(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 10_000) / 10_000;
}

/**
 * DEFENSE price (Task 17 — dashboard price chart) — the collateral price at
 * which the Health Ratio exactly equals the Guard Trigger:
 * `computeHealthRatioBps(collateralAmount * price, outstanding) ===
 * triggerBps`, solved for price. Above this price the position is
 * Guarded/Protected; at or below it, the agent's rescue condition is met.
 * This is the chart's "Cermin defends · $X" dashed line.
 * Demo numbers: outstanding 6000, trigger 13000 bps, collateral 10000 -> 0.78.
 */
export function defensePrice(outstanding: number, triggerBps: number, collateralAmount: number): number {
  if (outstanding <= 0 || triggerBps <= 0 || collateralAmount <= 0) return 0;
  return roundPrice((triggerBps * outstanding) / (collateralAmount * BPS_SCALE));
}

/**
 * PROTECTION FLOOR price (Task 17) — the collateral price at which even a
 * FULL Shadow Vault sweep can no longer restore the Guard Trigger: the same
 * equation as `defensePrice`, but with `outstanding` first reduced by the
 * entire vault balance (the most the vault could ever repay in one go).
 * This is NOT a liquidation price — below it Cermin opens a grace period
 * instead of a fire-sale (CLAUDE.md hard rule #2; docs/03-ux.md). It is the
 * chart's "Protection floor · $Y" dashed line, always the lower of the two.
 * Demo numbers: outstanding 6000, vault 1500, trigger 13000 bps, collateral
 * 10000 -> 0.585.
 *
 * Edge case: a vault balance >= outstanding could repay the loan outright,
 * so there is no floor to cross — this clamps to 0, and the caller (the
 * PriceChart component) hides the line entirely rather than drawing one at
 * the bottom axis.
 */
export function protectionFloorPrice(
  outstanding: number,
  vaultBalance: number,
  triggerBps: number,
  collateralAmount: number,
): number {
  const remaining = outstanding - vaultBalance;
  if (remaining <= 0 || triggerBps <= 0 || collateralAmount <= 0) return 0;
  return roundPrice((triggerBps * remaining) / (collateralAmount * BPS_SCALE));
}

/**
 * Next coupon date: the nearest upcoming calendar-quarter end (Mar 31,
 * Jun 30, Sep 30, Dec 31), matching the demo's quarterly coupon cadence.
 */
export function getNextCouponDate(now: Date): Date {
  const year = now.getUTCFullYear();
  const quarterEnds = [
    Date.UTC(year, 2, 31),
    Date.UTC(year, 5, 30),
    Date.UTC(year, 8, 30),
    Date.UTC(year, 11, 31),
  ];
  const next = quarterEnds.find((t) => t >= now.getTime());
  return new Date(next ?? Date.UTC(year + 1, 2, 31));
}
