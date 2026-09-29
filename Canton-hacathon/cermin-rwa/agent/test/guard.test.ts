import assert from "node:assert/strict";
import { test } from "node:test";
import { createGuardState, runGuardCycle } from "../src/guard.js";
import { MockLedger, type Ledger } from "../src/ledger.js";
import type { CouponDistribution, GuardPolicy, Loan, PriceFeed, ShadowVault } from "../src/types.js";

const INSTRUMENT_ID = "mUST-2030";
const LOAN_ID = "LOAN-1";
const BORROWER = "Borrower";
const POOL_OPERATOR = "PoolOperator";
const GUARD_AGENT = "GuardAgent";
const ORACLE = "Oracle";
const ISSUER = "Issuer";

/** Seeds the demo scenario from global-constraints.md #7: 10,000 mUST @ 1.00,
 * 6,000 mUSD loan, 130%/145% trigger/target, 2,000 max repay per event, 1,500
 * mUSD Shadow Vault. Any field can be overridden per test (e.g. vault balance,
 * price, couponSweep). */
function seedDemoScenario(
  ledger: MockLedger,
  overrides: {
    price?: number;
    outstanding?: number;
    vaultBalance?: number;
    couponSweep?: boolean;
  } = {},
) {
  const priceFeed = ledger.seedPriceFeed({
    oracle: ORACLE,
    instrumentId: INSTRUMENT_ID,
    price: overrides.price ?? 1.0,
    subscribers: [BORROWER, GUARD_AGENT, POOL_OPERATOR],
  } satisfies PriceFeed);

  const loan = ledger.seedLoan({
    borrower: BORROWER,
    poolOperator: POOL_OPERATOR,
    guardAgent: GUARD_AGENT,
    loanId: LOAN_ID,
    principal: 6_000,
    outstanding: overrides.outstanding ?? 6_000,
    rateBps: 500,
    collateralInstrumentId: INSTRUMENT_ID,
    collateralAmount: 10_000,
  } satisfies Loan);

  const policy = ledger.seedGuardPolicy({
    borrower: BORROWER,
    guardAgent: GUARD_AGENT,
    triggerRatioBps: 13_000,
    targetRatioBps: 14_500,
    maxRepayPerEvent: 2_000,
    couponSweep: overrides.couponSweep ?? false,
  } satisfies GuardPolicy);

  const vault = ledger.seedShadowVault({
    borrower: BORROWER,
    guardAgent: GUARD_AGENT,
    balance: overrides.vaultBalance ?? 1_500,
  } satisfies ShadowVault);

  return { priceFeed, loan, policy, vault };
}

function capturingLogger(): { logs: string[]; log: (m: string) => void } {
  const logs: string[] = [];
  return { logs, log: (m: string) => logs.push(m) };
}

test("guard cycle: no fire at initial 166% health", async () => {
  const ledger = new MockLedger();
  seedDemoScenario(ledger);
  const { logs, log } = capturingLogger();

  await runGuardCycle(ledger, createGuardState(), log);

  assert.equal(logs.length, 0);
  const [loan] = await ledger.getActiveLoans();
  assert.equal(loan!.payload.outstanding, 6_000);
  const [vault] = await ledger.getActiveShadowVaults();
  assert.equal(vault!.payload.balance, 1_500);
  assert.equal(ledger.getRescueEvents().length, 0);
});

test("guard cycle: trigger fires at 126.7%, repays ~759 to restore ~145%, and never re-fires on the same price tick", async () => {
  const ledger = new MockLedger();
  seedDemoScenario(ledger);
  ledger.updatePrice(INSTRUMENT_ID, 0.76);
  const state = createGuardState();
  const { logs, log } = capturingLogger();

  await runGuardCycle(ledger, state, log);

  assert.equal(logs.length, 1);
  assert.match(logs[0]!, /^Price dipped 24%\. Repaid \$758\.62 from your Shadow Vault\. Position safe\. — Cermin$/);

  const [loan] = await ledger.getActiveLoans();
  assert.ok(Math.abs(loan!.payload.outstanding - 5241.38) < 0.01, `got ${loan!.payload.outstanding}`);
  const [vault] = await ledger.getActiveShadowVaults();
  assert.ok(Math.abs(vault!.payload.balance - 741.38) < 0.01, `got ${vault!.payload.balance}`);
  assert.equal(ledger.getRescueEvents().length, 1);

  // Same price observation, no new oracle tick: must not fire again even
  // though a stale re-read of the ratio would still look unhealthy-ish.
  await runGuardCycle(ledger, state, log);
  assert.equal(logs.length, 1, "must not fire twice on the same price observation");
  assert.equal(ledger.getRescueEvents().length, 1);

  const [loanAfter] = await ledger.getActiveLoans();
  assert.equal(loanAfter!.payload.outstanding, loan!.payload.outstanding);
});

test("guard cycle: repay is capped by maxRepayPerEvent on a deep price drop", async () => {
  const ledger = new MockLedger();
  seedDemoScenario(ledger, { vaultBalance: 5_000 }); // vault has plenty; only the per-event cap should bind
  ledger.updatePrice(INSTRUMENT_ID, 0.5); // needed ≈ 2551.72, exceeds maxRepayPerEvent 2,000
  const { log } = capturingLogger();

  await runGuardCycle(ledger, createGuardState(), log);

  const [loan] = await ledger.getActiveLoans();
  assert.equal(loan!.payload.outstanding, 4_000); // 6000 - 2000
  const [vault] = await ledger.getActiveShadowVaults();
  assert.equal(vault!.payload.balance, 3_000); // 5000 - 2000
});

test("guard cycle: repay is capped by vault balance when the vault can't cover the need", async () => {
  const ledger = new MockLedger();
  seedDemoScenario(ledger, { vaultBalance: 300 }); // needed ≈ 758.62 at price 0.76, vault only has 300
  ledger.updatePrice(INSTRUMENT_ID, 0.76);
  const { log } = capturingLogger();

  await runGuardCycle(ledger, createGuardState(), log);

  const [loan] = await ledger.getActiveLoans();
  assert.equal(loan!.payload.outstanding, 5_700); // 6000 - 300
  const [vault] = await ledger.getActiveShadowVaults();
  assert.equal(vault!.payload.balance, 0);
});

test("guard cycle: empty vault starts a GracePeriod exactly once, never GuardRepay", async () => {
  const ledger = new MockLedger();
  seedDemoScenario(ledger, { vaultBalance: 0 });
  ledger.updatePrice(INSTRUMENT_ID, 0.76);
  const state = createGuardState();
  const { logs, log } = capturingLogger();

  await runGuardCycle(ledger, state, log);
  await runGuardCycle(ledger, state, log); // second poll, vault still empty, same price
  await runGuardCycle(ledger, state, log); // third poll, for good measure

  const gracePeriods = await ledger.getActiveGracePeriods();
  assert.equal(gracePeriods.length, 1);
  assert.equal(gracePeriods[0]!.payload.loanId, LOAN_ID);

  const [loan] = await ledger.getActiveLoans();
  assert.equal(loan!.payload.outstanding, 6_000, "GuardRepay must never fire when the vault is depleted");
  assert.equal(ledger.getRescueEvents().length, 0);

  const graceLogs = logs.filter((m) => m.includes("Grace period started"));
  assert.equal(graceLogs.length, 1);
});

test("guard cycle: coupon sweep exercises SweepToLoan and applies the full amount when couponSweep=true", async () => {
  const ledger = new MockLedger();
  seedDemoScenario(ledger, { couponSweep: true });
  ledger.seedCouponDistribution({
    issuer: ISSUER,
    owner: BORROWER,
    instrumentId: INSTRUMENT_ID,
    amount: 112.5, // demo quarterly coupon: 450bps annual on 10,000 face
  } satisfies CouponDistribution);
  const { logs, log } = capturingLogger();

  await runGuardCycle(ledger, createGuardState(), log);

  const [loan] = await ledger.getActiveLoans();
  assert.equal(loan!.payload.outstanding, 5_887.5); // 6000 - 112.50 via Loan.ApplyRepayment
  const coupons = await ledger.getActiveCouponDistributions();
  assert.equal(coupons.length, 0, "coupon is consumed once swept");
  assert.ok(logs.some((m) => m.includes("Coupon Sweep")));
});

test("guard cycle: coupon is left untouched when couponSweep=false (SweepToLoan never exercised)", async () => {
  const ledger = new MockLedger();
  seedDemoScenario(ledger, { couponSweep: false });
  ledger.seedCouponDistribution({
    issuer: ISSUER,
    owner: BORROWER,
    instrumentId: INSTRUMENT_ID,
    amount: 112.5,
  } satisfies CouponDistribution);
  const { logs, log } = capturingLogger();

  await runGuardCycle(ledger, createGuardState(), log);

  const [loan] = await ledger.getActiveLoans();
  assert.equal(loan!.payload.outstanding, 6_000);
  const coupons = await ledger.getActiveCouponDistributions();
  assert.equal(coupons.length, 1, "coupon must stay live for the owner's manual ClaimCoupon");
  assert.equal(logs.length, 0);
});

test("guard cycle: after a capped repay leaving ratio still below trigger, the same price observation never fires twice", async () => {
  const ledger = new MockLedger();
  seedDemoScenario(ledger, { vaultBalance: 5_000 });
  // Deep drop: needed ≈ 2551.72 > maxRepayPerEvent 2000, so the repay is
  // capped and the ratio lands at 5000/4000 = 12500bps — still BELOW the
  // 13000bps trigger. Only the last-acted-contractId gate prevents a re-fire.
  ledger.updatePrice(INSTRUMENT_ID, 0.5);
  const state = createGuardState();
  const { logs, log } = capturingLogger();

  await runGuardCycle(ledger, state, log);

  const [loanAfterFirst] = await ledger.getActiveLoans();
  assert.equal(loanAfterFirst!.payload.outstanding, 4_000); // capped at 2000
  const [vaultAfterFirst] = await ledger.getActiveShadowVaults();
  assert.equal(vaultAfterFirst!.payload.balance, 3_000);
  assert.equal(ledger.getRescueEvents().length, 1);
  assert.equal(logs.length, 1);

  // Second cycle on the SAME PriceFeed contractId: ratio is still 12500bps
  // < trigger, so only the idempotency gate stands between us and a double fire.
  await runGuardCycle(ledger, state, log);

  assert.equal(ledger.getRescueEvents().length, 1, "no second RescueEvent on the same price observation");
  const [loanAfterSecond] = await ledger.getActiveLoans();
  assert.equal(loanAfterSecond!.payload.outstanding, 4_000, "outstanding unchanged");
  const [vaultAfterSecond] = await ledger.getActiveShadowVaults();
  assert.equal(vaultAfterSecond!.payload.balance, 3_000, "vault balance unchanged");
  assert.equal(logs.length, 1, "no second rescue log");

  // A fresh oracle tick (new PriceFeed contractId) re-arms the gate.
  ledger.updatePrice(INSTRUMENT_ID, 0.5);
  await runGuardCycle(ledger, state, log);
  assert.equal(ledger.getRescueEvents().length, 2, "a new price observation may fire again");
});

test("guard cycle: two borrowers who SHARE a loanId are BOTH rescued (idempotency key includes borrower)", async () => {
  // Self-service testnet: every borrower can end up with the same loanId
  // ("loan-1") and they all act on the SAME global PriceFeed cid. If the
  // idempotency map were keyed by loanId alone, the first borrower's rescue
  // would mark that price cid "acted" and silently skip the second. Key by
  // borrower+loanId and both fire in one poll.
  const ledger = new MockLedger();
  const SHARED_LOAN_ID = "loan-1";
  for (const borrower of ["BorrowerAlice", "BorrowerBob"]) {
    ledger.seedLoan({
      borrower,
      poolOperator: POOL_OPERATOR,
      guardAgent: GUARD_AGENT,
      loanId: SHARED_LOAN_ID,
      principal: 6_000,
      outstanding: 6_000,
      rateBps: 500,
      collateralInstrumentId: INSTRUMENT_ID,
      collateralAmount: 10_000,
    } satisfies Loan);
    ledger.seedGuardPolicy({
      borrower,
      guardAgent: GUARD_AGENT,
      triggerRatioBps: 13_000,
      targetRatioBps: 14_500,
      maxRepayPerEvent: 2_000,
      couponSweep: false,
    } satisfies GuardPolicy);
    ledger.seedShadowVault({ borrower, guardAgent: GUARD_AGENT, balance: 1_500 } satisfies ShadowVault);
  }
  // One shared global PriceFeed — the same cid every borrower's loan resolves.
  ledger.seedPriceFeed({
    oracle: ORACLE,
    instrumentId: INSTRUMENT_ID,
    price: 1.0,
    subscribers: [GUARD_AGENT],
  } satisfies PriceFeed);
  ledger.updatePrice(INSTRUMENT_ID, 0.76); // both drop below trigger on the same tick

  const { logs, log } = capturingLogger();
  await runGuardCycle(ledger, createGuardState(), log);

  const loans = await ledger.getActiveLoans();
  for (const l of loans) {
    assert.ok(Math.abs(l.payload.outstanding - 5241.38) < 0.01, `${l.payload.borrower} rescued: ${l.payload.outstanding}`);
  }
  assert.equal(ledger.getRescueEvents().length, 2, "both borrowers rescued in one poll");
  assert.equal(logs.filter((m) => m.includes("Repaid $758.62")).length, 2);
});

test("guard cycle: an exercise failure on one loan does not skip the remaining loans", async () => {
  const ledger = new MockLedger();
  // Borrower A: seeded first, its GuardRepay will throw.
  const { vault: vaultA } = seedDemoScenario(ledger);
  // Borrower B: same shape, seeded second, must still be rescued.
  const BORROWER_B = "BorrowerB";
  ledger.seedLoan({
    borrower: BORROWER_B,
    poolOperator: POOL_OPERATOR,
    guardAgent: GUARD_AGENT,
    loanId: "LOAN-2",
    principal: 6_000,
    outstanding: 6_000,
    rateBps: 500,
    collateralInstrumentId: INSTRUMENT_ID,
    collateralAmount: 10_000,
  } satisfies Loan);
  ledger.seedGuardPolicy({
    borrower: BORROWER_B,
    guardAgent: GUARD_AGENT,
    triggerRatioBps: 13_000,
    targetRatioBps: 14_500,
    maxRepayPerEvent: 2_000,
    couponSweep: false,
  } satisfies GuardPolicy);
  ledger.seedShadowVault({
    borrower: BORROWER_B,
    guardAgent: GUARD_AGENT,
    balance: 1_500,
  } satisfies ShadowVault);
  ledger.updatePrice(INSTRUMENT_ID, 0.76); // both loans drop below trigger

  const failingLedger: Ledger = {
    getActivePriceFeeds: () => ledger.getActivePriceFeeds(),
    getActiveLoans: () => ledger.getActiveLoans(),
    getActiveGuardPolicies: () => ledger.getActiveGuardPolicies(),
    getActiveShadowVaults: () => ledger.getActiveShadowVaults(),
    getActiveGracePeriods: () => ledger.getActiveGracePeriods(),
    getActiveCouponDistributions: () => ledger.getActiveCouponDistributions(),
    exerciseGuardRepay: async (vaultCid, args) => {
      if (vaultCid === vaultA.contractId) throw new Error("simulated exercise failure");
      return ledger.exerciseGuardRepay(vaultCid, args);
    },
    exerciseStartGracePeriod: (loanCid) => ledger.exerciseStartGracePeriod(loanCid),
    exerciseSweepToLoan: (couponCid, args) => ledger.exerciseSweepToLoan(couponCid, args),
  };
  const { logs, log } = capturingLogger();

  await runGuardCycle(failingLedger, createGuardState(), log);

  const loans = await ledger.getActiveLoans();
  const loanA = loans.find((l) => l.payload.loanId === LOAN_ID)!;
  const loanB = loans.find((l) => l.payload.loanId === "LOAN-2")!;
  assert.equal(loanA.payload.outstanding, 6_000, "failed loan is untouched");
  assert.ok(Math.abs(loanB.payload.outstanding - 5241.38) < 0.01, "second loan is still rescued");
  assert.equal(ledger.getRescueEvents().length, 1);
  assert.ok(
    logs.some((m) => m.includes(`Guard cycle error on loan ${LOAN_ID}`) && m.includes("simulated exercise failure")),
    "the failure is logged",
  );
  assert.ok(logs.some((m) => m.includes("Repaid $758.62")), "the second loan's rescue is logged");
});
