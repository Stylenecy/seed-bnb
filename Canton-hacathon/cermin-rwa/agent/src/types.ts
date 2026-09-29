/**
 * Contract shape mirrors of the Daml templates, copied verbatim (field names and
 * intent) from .superpowers/sdd/global-constraints.md "Contract shapes" section.
 *
 * These are plain TypeScript types for the Guard Agent's own use — they are NOT
 * generated from the Daml package (the Daml build happens in a parallel lane).
 * Money fields (Decimal in Daml) are represented as `number`; ratios (Int bps in
 * Daml) are represented as `number` (integer basis points, 13000 = 130%). Dates
 * and times are ISO-8601 strings.
 */

export type Party = string;

/** issuer, owner : Party; instrumentId : Text ("mUST-2030"); faceValue : Decimal;
 *  couponRateBps : Int; maturity : Date; lockedBy : Optional Party */
export interface TreasuryToken {
  issuer: Party;
  owner: Party;
  instrumentId: string;
  faceValue: number;
  couponRateBps: number;
  maturity: string; // ISO date
  lockedBy: Party | null;
}

/** issuer, owner : Party; amount : Decimal — mock mUSD cash leg */
export interface StableCoin {
  issuer: Party;
  owner: Party;
  amount: number;
}

/** oracle : Party; instrumentId : Text; price : Decimal; subscribers : [Party]
 *  (choice UpdatePrice by oracle, archive+recreate) */
export interface PriceFeed {
  oracle: Party;
  instrumentId: string;
  price: number;
  subscribers: Party[];
}

/** borrower, poolOperator, guardAgent : Party; loanId : Text; principal : Decimal;
 *  outstanding : Decimal; rateBps : Int; collateralInstrumentId : Text;
 *  collateralAmount : Decimal
 *  choices: Repay (borrower), ApplyRepayment (borrower — invoked with borrower
 *  authority from inside ShadowVault.GuardRepay / coupon sweep), TopUpCollateral
 *  (borrower), LastResortDefault (poolOperator, only after GracePeriod expiry) */
export interface Loan {
  borrower: Party;
  poolOperator: Party;
  guardAgent: Party;
  loanId: string;
  principal: number;
  outstanding: number;
  rateBps: number;
  collateralInstrumentId: string;
  collateralAmount: number;
}

/** borrower, guardAgent : Party; balance : Decimal
 *  choices: TopUp/Withdraw (borrower); GuardRepay (guardAgent) — fetches PriceFeed +
 *  Loan + GuardPolicy by cid args, asserts healthRatio < triggerRatioBps, repays
 *  min(needed, maxRepayPerEvent, balance) via Loan.ApplyRepayment, recreates vault
 *  with reduced balance, creates RescueEvent. */
export interface ShadowVault {
  borrower: Party;
  guardAgent: Party;
  balance: number;
}

/** borrower, guardAgent : Party; triggerRatioBps, targetRatioBps : Int;
 *  maxRepayPerEvent : Decimal; couponSweep : Bool */
export interface GuardPolicy {
  borrower: Party;
  guardAgent: Party;
  triggerRatioBps: number;
  targetRatioBps: number;
  maxRepayPerEvent: number;
  couponSweep: boolean;
}

/** borrower, guardAgent, poolOperator; loanId : Text; startedAt : Time; expiresAt : Time */
export interface GracePeriod {
  borrower: Party;
  guardAgent: Party;
  poolOperator: Party;
  loanId: string;
  startedAt: string; // ISO datetime
  expiresAt: string; // ISO datetime
}

/** guardAgent, borrower : Party; loanId : Text; description : Text; amount : Decimal;
 *  healthBefore, healthAfter : Int (bps); at : Time */
export interface RescueEvent {
  guardAgent: Party;
  borrower: Party;
  loanId: string;
  description: string;
  amount: number;
  healthBefore: number;
  healthAfter: number;
  at: string; // ISO datetime
}

/** issuer, owner : Party; instrumentId : Text; amount : Decimal
 *  choice ClaimCoupon (owner) → StableCoin to owner (manual claim).
 *  Amendment 2: observers include guardAgent; NEW choice SweepToLoan
 *  (controller guardAgent) requires a couponSweep=True GuardPolicy cid + live
 *  Loan cid and routes the full amount via Loan.ApplyRepayment atomically.
 *  The Guard Agent exercises SweepToLoan, never ClaimCoupon. */
export interface CouponDistribution {
  issuer: Party;
  owner: Party;
  instrumentId: string;
  amount: number;
}

/** Generic on-ledger contract wrapper: a payload plus its contract id. */
export interface Contract<T> {
  contractId: string;
  payload: T;
}
