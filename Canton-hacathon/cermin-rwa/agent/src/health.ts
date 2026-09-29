/**
 * Pure Health Ratio math. No I/O, no ledger types — just numbers in, numbers out,
 * so they are trivially unit-testable and match whatever the Daml side computes.
 *
 * Health Ratio = (collateralAmount * price) / outstanding, carried as Int bps
 * (13000 = 130%), per global-constraints.md #8.
 */

/** Round a money amount to 2 decimal places (mUSD has cents), half-away-from-zero. */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Health Ratio in basis points: (collateralAmount * price / outstanding) * 10000,
 * rounded to the nearest bp. An outstanding of 0 (loan fully repaid) has no debt
 * to protect, so it is treated as maximally healthy (+Infinity).
 */
export function healthRatioBps(
  collateralAmount: number,
  price: number,
  outstanding: number,
): number {
  if (outstanding <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  const collateralValue = collateralAmount * price;
  return Math.round((collateralValue / outstanding) * 10000);
}

/**
 * Amount to repay this event so the loan's Health Ratio is restored to
 * targetRatioBps, capped by the Guard Policy's maxRepayPerEvent and by whatever
 * the Shadow Vault actually holds. Never negative (if already at/above target,
 * nothing is owed).
 *
 * needed = outstanding - collateralValue / (targetRatioBps / 10000)
 * repay  = min(needed, maxRepayPerEvent, vaultBalance), floored at 0.
 */
export function repayAmountToTarget(
  collateralAmount: number,
  price: number,
  outstanding: number,
  targetRatioBps: number,
  maxRepayPerEvent: number,
  vaultBalance: number,
): number {
  const collateralValue = collateralAmount * price;
  const targetOutstanding = collateralValue / (targetRatioBps / 10000);
  const needed = Math.max(0, outstanding - targetOutstanding);
  const capped = Math.min(needed, maxRepayPerEvent, vaultBalance);
  return roundMoney(Math.max(0, capped));
}

/**
 * Percentage price dip vs. par (1.00), for the human-readable log sentence
 * ("Price dipped 24%. ..."). mUST is a bond-style instrument quoted relative to
 * its 1.00 face value, so par is the natural, stateless reference point — no
 * need to remember the previous price tick.
 */
export function priceDipPct(price: number, parPrice = 1.0): number {
  return roundMoney((1 - price / parPrice) * 100);
}
