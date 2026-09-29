import assert from "node:assert/strict";
import { test } from "node:test";
import { healthRatioBps, priceDipPct, repayAmountToTarget, roundMoney } from "../src/health.js";

// Demo numbers, verbatim from global-constraints.md #7:
// collateralAmount 10,000 mUST; principal/outstanding 6,000 mUSD; trigger 13000bps
// (130%); target 14500bps (145%); maxRepayPerEvent 2,000; vault 1,500.
const COLLATERAL_AMOUNT = 10_000;
const OUTSTANDING = 6_000;
const TARGET_RATIO_BPS = 14_500;
const MAX_REPAY_PER_EVENT = 2_000;
const VAULT_BALANCE = 1_500;

test("healthRatioBps: initial position at par is ~166%", () => {
  const bps = healthRatioBps(COLLATERAL_AMOUNT, 1.0, OUTSTANDING);
  assert.equal(bps, 16667); // 10000*1.00/6000 = 166.67%
  assert.equal(Math.round(bps / 100), 167); // reads as ~166-167%, well above the 130% trigger
});

test("healthRatioBps: price drop to 0.76 gives ~126.7% (below 130% trigger)", () => {
  const bps = healthRatioBps(COLLATERAL_AMOUNT, 0.76, OUTSTANDING);
  assert.equal(bps, 12667); // 10000*0.76/6000 = 126.67%
  assert.ok(bps < 13_000, "should be below the 13000bps Guard Trigger");
});

test("healthRatioBps: no debt is treated as maximally healthy", () => {
  assert.equal(healthRatioBps(COLLATERAL_AMOUNT, 1.0, 0), Number.POSITIVE_INFINITY);
});

test("repayAmountToTarget: demo rescue scenario repays ~759 to restore ~145%", () => {
  const repay = repayAmountToTarget(
    COLLATERAL_AMOUNT,
    0.76,
    OUTSTANDING,
    TARGET_RATIO_BPS,
    MAX_REPAY_PER_EVENT,
    VAULT_BALANCE,
  );
  assert.ok(Math.abs(repay - 758.62) < 0.01, `expected ~758.62, got ${repay}`);
  assert.equal(Math.round(repay), 759);

  const newOutstanding = roundMoney(OUTSTANDING - repay);
  assert.ok(Math.abs(newOutstanding - 5241.38) < 0.01, `expected ~5241.38, got ${newOutstanding}`);

  const restoredBps = healthRatioBps(COLLATERAL_AMOUNT, 0.76, newOutstanding);
  assert.ok(Math.abs(restoredBps - TARGET_RATIO_BPS) <= 1, `expected ~14500bps, got ${restoredBps}`);
});

test("repayAmountToTarget: at or above target, nothing is owed", () => {
  assert.equal(repayAmountToTarget(COLLATERAL_AMOUNT, 1.0, OUTSTANDING, TARGET_RATIO_BPS, MAX_REPAY_PER_EVENT, VAULT_BALANCE), 0);
});

test("repayAmountToTarget: capped by maxRepayPerEvent on a deep price drop", () => {
  // price 0.50 -> collateral value 5000; needed = 6000 - 5000/1.45 ≈ 2551.72,
  // which exceeds maxRepayPerEvent (2000). Use a vault balance well above
  // 2000 so the maxRepayPerEvent cap is the one under test, not the balance.
  const plentyOfBalance = 5_000;
  const repay = repayAmountToTarget(COLLATERAL_AMOUNT, 0.5, OUTSTANDING, TARGET_RATIO_BPS, MAX_REPAY_PER_EVENT, plentyOfBalance);
  assert.equal(repay, MAX_REPAY_PER_EVENT);
});

test("repayAmountToTarget: capped by vault balance when the vault can't cover the need", () => {
  const thinBalance = 300;
  const repay = repayAmountToTarget(COLLATERAL_AMOUNT, 0.76, OUTSTANDING, TARGET_RATIO_BPS, MAX_REPAY_PER_EVENT, thinBalance);
  assert.equal(repay, thinBalance);
});

test("repayAmountToTarget: never negative even if outstanding is already below target", () => {
  const repay = repayAmountToTarget(COLLATERAL_AMOUNT, 1.0, 100, TARGET_RATIO_BPS, MAX_REPAY_PER_EVENT, VAULT_BALANCE);
  assert.equal(repay, 0);
});

test("priceDipPct: measured against par (1.00)", () => {
  assert.equal(priceDipPct(0.76), 24);
  assert.equal(priceDipPct(1.0), 0);
  assert.equal(priceDipPct(0.5), 50);
});

test("roundMoney: rounds to cents", () => {
  assert.equal(roundMoney(758.6206896551724), 758.62);
  assert.equal(roundMoney(1), 1);
});
