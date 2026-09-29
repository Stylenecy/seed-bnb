/**
 * ALL ledger I/O lives in this one module (global-constraints.md: "Isolate ALL
 * ledger HTTP calls in ONE module ... so endpoint-shape drift is a one-file fix
 * in Task 8"). guard.ts only ever talks to the `Ledger` interface below — it
 * never knows whether it is backed by the in-memory MockLedger (used by every
 * test) or the real JSON API sandbox.
 *
 * Two implementations:
 *  - MockLedger:   in-memory, deterministic, replays the same business rules the
 *                  contract enforces (trigger assert, capped repay). Used by all
 *                  tests — no network.
 *  - EvmLedger (./evmLedger.ts): reads/writes the CerminRWA Solidity contract on
 *                  BNB Chain via viem. (The original Canton JSON API v1/v2
 *                  clients were removed in the BNB migration.)
 */

import type {
  Contract,
  CouponDistribution,
  GracePeriod,
  GuardPolicy,
  Loan,
  PriceFeed,
  RescueEvent,
  ShadowVault,
} from "./types.js";
import { healthRatioBps, repayAmountToTarget, roundMoney } from "./health.js";

/** Arguments to ShadowVault.GuardRepay: the cids the choice fetches internally
 * to compute and assert the Health Ratio (per contract shapes). */
export interface GuardRepayArgs {
  priceFeedCid: string;
  loanCid: string;
  guardPolicyCid: string;
}

export interface GuardRepayResult {
  vault: Contract<ShadowVault>;
  loan: Contract<Loan>;
  rescueEvent: Contract<RescueEvent>;
  amountRepaid: number;
  healthBefore: number;
  healthAfter: number;
}

/** Arguments to CouponDistribution.SweepToLoan (Amendment 2): controller
 * guardAgent; requires a GuardPolicy cid with couponSweep=True plus a live
 * Loan cid, and routes the full coupon amount via Loan.ApplyRepayment
 * atomically. The Guard Agent exercises SweepToLoan, never ClaimCoupon
 * (ClaimCoupon stays controller=owner for manual claims). */
export interface SweepToLoanArgs {
  guardPolicyCid: string;
  loanCid: string;
}

export interface SweepToLoanResult {
  amount: number;
  loan: Contract<Loan>;
}

/** The seam: guard.ts is written entirely against this interface. */
export interface Ledger {
  getActivePriceFeeds(): Promise<Contract<PriceFeed>[]>;
  getActiveLoans(): Promise<Contract<Loan>[]>;
  getActiveGuardPolicies(): Promise<Contract<GuardPolicy>[]>;
  getActiveShadowVaults(): Promise<Contract<ShadowVault>[]>;
  getActiveGracePeriods(): Promise<Contract<GracePeriod>[]>;
  getActiveCouponDistributions(): Promise<Contract<CouponDistribution>[]>;

  /** ShadowVault.GuardRepay, controller guardAgent. */
  exerciseGuardRepay(vaultCid: string, args: GuardRepayArgs): Promise<GuardRepayResult>;

  /** Starts a GracePeriod for the given loan. Contract shapes do not name the
   * choice that creates GracePeriod; we assume it lives on Loan (whose
   * signatories, borrower + poolOperator, plus guardAgent as controller,
   * together cover all three GracePeriod signatories) controlled by guardAgent.
   * Lane A confirms/adjusts the exact wiring at integration (Task 8). */
  exerciseStartGracePeriod(loanCid: string): Promise<Contract<GracePeriod>>;

  /** CouponDistribution.SweepToLoan, controller guardAgent (Amendment 2). */
  exerciseSweepToLoan(couponCid: string, args: SweepToLoanArgs): Promise<SweepToLoanResult>;
}

// ---------------------------------------------------------------------------
// MockLedger — in-memory, used by every test. No network.
// ---------------------------------------------------------------------------

let idSeq = 0;
function nextId(prefix: string): string {
  idSeq += 1;
  return `${prefix}#${idSeq}`;
}

/** Default grace period length; not a demo number in global-constraints.md, so
 * this is an implementation default the agent uses for the mock only. */
const DEFAULT_GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;

export class MockLedger implements Ledger {
  private priceFeeds: Contract<PriceFeed>[] = [];
  private loans: Contract<Loan>[] = [];
  private guardPolicies: Contract<GuardPolicy>[] = [];
  private shadowVaults: Contract<ShadowVault>[] = [];
  private gracePeriods: Contract<GracePeriod>[] = [];
  private couponDistributions: Contract<CouponDistribution>[] = [];
  private rescueEvents: Contract<RescueEvent>[] = [];

  // --- seeding (test setup) -------------------------------------------------

  seedPriceFeed(payload: PriceFeed, contractId = nextId("pricefeed")): Contract<PriceFeed> {
    const c = { contractId, payload };
    this.priceFeeds.push(c);
    return c;
  }

  seedLoan(payload: Loan, contractId = nextId("loan")): Contract<Loan> {
    const c = { contractId, payload };
    this.loans.push(c);
    return c;
  }

  seedGuardPolicy(payload: GuardPolicy, contractId = nextId("policy")): Contract<GuardPolicy> {
    const c = { contractId, payload };
    this.guardPolicies.push(c);
    return c;
  }

  seedShadowVault(payload: ShadowVault, contractId = nextId("vault")): Contract<ShadowVault> {
    const c = { contractId, payload };
    this.shadowVaults.push(c);
    return c;
  }

  seedGracePeriod(payload: GracePeriod, contractId = nextId("grace")): Contract<GracePeriod> {
    const c = { contractId, payload };
    this.gracePeriods.push(c);
    return c;
  }

  seedCouponDistribution(
    payload: CouponDistribution,
    contractId = nextId("coupon"),
  ): Contract<CouponDistribution> {
    const c = { contractId, payload };
    this.couponDistributions.push(c);
    return c;
  }

  /** Simulates the oracle's UpdatePrice choice: archive+recreate with a new
   * contract id, exactly as PriceFeed's contract shape specifies. */
  updatePrice(instrumentId: string, newPrice: number): Contract<PriceFeed> {
    const idx = this.priceFeeds.findIndex((p) => p.payload.instrumentId === instrumentId);
    if (idx < 0) throw new Error(`MockLedger.updatePrice: no PriceFeed for ${instrumentId}`);
    const updated: Contract<PriceFeed> = {
      contractId: nextId("pricefeed"),
      payload: { ...this.priceFeeds[idx]!.payload, price: newPrice },
    };
    this.priceFeeds[idx] = updated;
    return updated;
  }

  getRescueEvents(): Contract<RescueEvent>[] {
    return [...this.rescueEvents];
  }

  // --- Ledger interface ------------------------------------------------------

  async getActivePriceFeeds(): Promise<Contract<PriceFeed>[]> {
    return [...this.priceFeeds];
  }

  async getActiveLoans(): Promise<Contract<Loan>[]> {
    return [...this.loans];
  }

  async getActiveGuardPolicies(): Promise<Contract<GuardPolicy>[]> {
    return [...this.guardPolicies];
  }

  async getActiveShadowVaults(): Promise<Contract<ShadowVault>[]> {
    return [...this.shadowVaults];
  }

  async getActiveGracePeriods(): Promise<Contract<GracePeriod>[]> {
    return [...this.gracePeriods];
  }

  async getActiveCouponDistributions(): Promise<Contract<CouponDistribution>[]> {
    return [...this.couponDistributions];
  }

  async exerciseGuardRepay(vaultCid: string, args: GuardRepayArgs): Promise<GuardRepayResult> {
    const vaultIdx = this.shadowVaults.findIndex((v) => v.contractId === vaultCid);
    if (vaultIdx < 0) throw new Error(`GuardRepay: ShadowVault not found: ${vaultCid}`);
    const vault = this.shadowVaults[vaultIdx]!.payload;

    const priceC = this.priceFeeds.find((p) => p.contractId === args.priceFeedCid);
    const loanIdx = this.loans.findIndex((l) => l.contractId === args.loanCid);
    const policyC = this.guardPolicies.find((p) => p.contractId === args.guardPolicyCid);
    if (!priceC || loanIdx < 0 || !policyC) {
      throw new Error("GuardRepay: referenced PriceFeed/Loan/GuardPolicy not found");
    }
    const loan = this.loans[loanIdx]!.payload;
    const policy = policyC.payload;

    const healthBefore = healthRatioBps(loan.collateralAmount, priceC.payload.price, loan.outstanding);
    if (healthBefore >= policy.triggerRatioBps) {
      throw new Error(
        `GuardRepay: health ratio ${healthBefore}bps is not below trigger ${policy.triggerRatioBps}bps`,
      );
    }

    const amountRepaid = repayAmountToTarget(
      loan.collateralAmount,
      priceC.payload.price,
      loan.outstanding,
      policy.targetRatioBps,
      policy.maxRepayPerEvent,
      vault.balance,
    );
    if (amountRepaid <= 0) {
      throw new Error("GuardRepay: nothing to repay (vault empty or already at target)");
    }

    const newOutstanding = roundMoney(loan.outstanding - amountRepaid);
    const updatedLoan: Contract<Loan> = {
      contractId: this.loans[loanIdx]!.contractId,
      payload: { ...loan, outstanding: newOutstanding },
    };
    this.loans[loanIdx] = updatedLoan;

    const newVault: Contract<ShadowVault> = {
      contractId: nextId("vault"),
      payload: { ...vault, balance: roundMoney(vault.balance - amountRepaid) },
    };
    this.shadowVaults[vaultIdx] = newVault;

    const healthAfter = healthRatioBps(loan.collateralAmount, priceC.payload.price, newOutstanding);
    const rescueEvent: Contract<RescueEvent> = {
      contractId: nextId("rescue"),
      payload: {
        guardAgent: vault.guardAgent,
        borrower: vault.borrower,
        loanId: loan.loanId,
        description: `Auto-repay: health ratio ${healthBefore}bps < trigger ${policy.triggerRatioBps}bps`,
        amount: amountRepaid,
        healthBefore,
        healthAfter,
        at: new Date().toISOString(),
      },
    };
    this.rescueEvents.push(rescueEvent);

    return { vault: newVault, loan: updatedLoan, rescueEvent, amountRepaid, healthBefore, healthAfter };
  }

  async exerciseStartGracePeriod(loanCid: string): Promise<Contract<GracePeriod>> {
    const loanC = this.loans.find((l) => l.contractId === loanCid);
    if (!loanC) throw new Error(`StartGracePeriod: Loan not found: ${loanCid}`);

    const existing = this.gracePeriods.find((g) => g.payload.loanId === loanC.payload.loanId);
    if (existing) return existing;

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + DEFAULT_GRACE_PERIOD_MS);
    const gracePeriod: Contract<GracePeriod> = {
      contractId: nextId("grace"),
      payload: {
        borrower: loanC.payload.borrower,
        guardAgent: loanC.payload.guardAgent,
        poolOperator: loanC.payload.poolOperator,
        loanId: loanC.payload.loanId,
        startedAt: startedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
    };
    this.gracePeriods.push(gracePeriod);
    return gracePeriod;
  }

  async exerciseSweepToLoan(couponCid: string, args: SweepToLoanArgs): Promise<SweepToLoanResult> {
    const idx = this.couponDistributions.findIndex((c) => c.contractId === couponCid);
    if (idx < 0) throw new Error(`SweepToLoan: CouponDistribution not found: ${couponCid}`);
    const coupon = this.couponDistributions[idx]!.payload;

    // Amendment 2: the choice requires a GuardPolicy cid with couponSweep=True
    // plus a live Loan cid — mirror those asserts here.
    const policyC = this.guardPolicies.find((p) => p.contractId === args.guardPolicyCid);
    if (!policyC) throw new Error(`SweepToLoan: GuardPolicy not found: ${args.guardPolicyCid}`);
    if (!policyC.payload.couponSweep) {
      throw new Error("SweepToLoan: GuardPolicy.couponSweep is not enabled");
    }
    const loanIdx = this.loans.findIndex((l) => l.contractId === args.loanCid);
    if (loanIdx < 0) throw new Error(`SweepToLoan: Loan not found: ${args.loanCid}`);

    this.couponDistributions.splice(idx, 1); // consuming choice

    // Routes the full coupon amount via Loan.ApplyRepayment atomically.
    const loan = this.loans[loanIdx]!.payload;
    const newOutstanding = roundMoney(Math.max(0, loan.outstanding - coupon.amount));
    const updatedLoan: Contract<Loan> = {
      contractId: this.loans[loanIdx]!.contractId,
      payload: { ...loan, outstanding: newOutstanding },
    };
    this.loans[loanIdx] = updatedLoan;
    return { amount: coupon.amount, loan: updatedLoan };
  }
}
