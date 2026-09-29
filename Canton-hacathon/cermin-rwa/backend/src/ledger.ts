// Ledger bridge for Cermin-RWA backend.
//
// The `Ledger` seam + response shapes live here. Two implementations:
//   - MockLedger: in-memory state seeded with the demo numbers. Used by tests and by
//                 default (MOCK_LEDGER=true). No network.
//   - EvmLedger (./evmLedger.ts): the CerminRWA Solidity contract on BNB Chain
//                 (BSC testnet 97 by default) via viem. Replaces the original Canton
//                 JSON API v1/v2 clients (removed in the BNB migration).
//
// Demo numbers (global-constraints.md #7), used to seed MockLedger:
//   collateral: 10,000 mUST face value, price 1.00 -> $10,000 value
//   loan:       principal 6,000 mUSD, rate 500 bps -> initial Health Ratio ~166%
//   policy:     triggerRatioBps 13000 (130%), targetRatioBps 14500 (145%),
//               maxRepayPerEvent 2,000
//   vault:      balance 1,500 mUSD

import { PriceHistoryBuffer, type PricePoint } from './priceHistory.ts';
export type { PricePoint } from './priceHistory.ts';

// Collateral posted (LOCKED) against a live loan. `null` in the position view
// when the user has no loan yet (their unlocked, spendable mUST is `wallet`).
export interface CollateralView {
  instrumentId: string;
  amount: number;
  price: number;
  value: number;
  nextCouponDate: string;
}

export interface LoanView {
  loanId: string;
  principal: number;
  outstanding: number;
  rateBps: number;
}

export interface VaultView {
  balance: number;
}

export interface PolicyView {
  triggerRatioBps: number;
  targetRatioBps: number;
  couponSweep: boolean;
}

/** Unlocked mUST the user holds from the faucet — spendable when they borrow.
 * Distinct from `collateral`, which is the locked amount backing a live loan. */
export interface WalletView {
  mustBalance: number;
}

export interface RescueEventView {
  loanId: string;
  description: string;
  amount: number;
  healthBefore: number;
  healthAfter: number;
  at: string;
}

/**
 * A single borrower's position, scoped to the party in the `X-Cermin-Party`
 * header (or the legacy demo borrower when absent). `collateral`, `loan`,
 * `vault`, `policy` and `healthRatioBps` are all `null` for a freshly-onboarded
 * user until they claim the faucet and borrow — the empty-state the self-service
 * Dashboard renders (faucet CTA, then borrow CTA).
 */
export interface PositionView {
  party: string | null;
  wallet: WalletView;
  collateral: CollateralView | null;
  loan: LoanView | null;
  vault: VaultView | null;
  policy: PolicyView | null;
  healthRatioBps: number | null;
  rescueEvents: RescueEventView[];
}

export interface BorrowRequest {
  collateralAmount: number;
  principal: number;
  triggerRatioBps: number;
  couponSweep: boolean;
  /** Initial ShadowVault balance funded at origination. Optional (default 0);
   * the user can top up later. */
  vaultDeposit?: number;
}

export interface OnboardResult {
  party: string;
  username: string;
  /** true when this call allocated a new party; false when it resolved an
   * existing one (a returning user typing the same name). */
  created: boolean;
}

export interface FaucetResult {
  party: string;
  minted: number;
  mustBalance: number;
}

/** Thrown for bad input; routes map this to HTTP 400. */
export class LedgerValidationError extends Error {}

/** Thrown when a request conflicts with current state (faucet already claimed,
 * a live loan already exists); routes map this to HTTP 409. */
export class LedgerConflictError extends Error {}

export interface Ledger {
  /** Provision (or resolve) a self-service party for `username` — the "login". */
  onboard(username: string): Promise<OnboardResult>;
  /** Mint 10,000 mock mUST to `party` (once per user). */
  faucet(party: string): Promise<FaucetResult>;
  getPosition(party?: string): Promise<PositionView>;
  vaultTopUp(amount: number, party?: string): Promise<PositionView>;
  vaultWithdraw(amount: number, party?: string): Promise<PositionView>;
  borrow(req: BorrowRequest, party?: string): Promise<PositionView>;
  /** Dev-only: set the collateral price (mock) / exercise Oracle UpdatePrice (real).
   * The oracle/price is GLOBAL; `party` only scopes the returned position view. */
  simPrice(price: number, party?: string): Promise<PositionView>;
  /** Task 17 dashboard price chart: a deterministic synthetic 30-day backfill
   * plus every observed price tick since (deduped on repeats). The price is
   * GLOBAL — same series for every caller, no `party` scoping needed. */
  getPriceHistory(): Promise<{ points: PricePoint[] }>;
}

/** Faucet mint size + fixed origination terms (STATE.md §2 demo numbers). */
export const FAUCET_MUST = 10000;
export const INSTRUMENT_ID = 'mUST-2030';
export const RATE_BPS = 500;
export const RESTORE_SPREAD_BPS = 1500; // target = trigger + 1500 (e.g. 13000 -> 14500)
export const MAX_REPAY_PER_EVENT = 2000;

/** Slugify a username to a `cermin-u-<slug>` party hint (etiquette: hints are
 * `cermin-u-*` only). Lowercase, keep [a-z0-9], collapse the rest to single
 * dashes, trim leading/trailing dashes. */
export function partyHintForUsername(username: string): string {
  const slug = String(username)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  if (!slug) throw new LedgerValidationError('username must contain at least one letter or digit');
  return `cermin-u-${slug}`;
}

// ---------------------------------------------------------------------------
// Shared math (identical to the Guard Agent's trigger math per global-constraints.md #7)
// ---------------------------------------------------------------------------

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Defensive runtime check: request bodies are untrusted JSON, not really `number`. */
export function requirePositiveNumber(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new LedgerValidationError(`${name} must be a positive number`);
  }
  return value;
}

/** Health Ratio = (collateralAmount * price) / outstanding, as Int bps (13000 = 130%). */
export function computeHealthRatioBps(collateralValue: number, outstanding: number): number {
  return Math.round((collateralValue / outstanding) * 10000);
}

export function validateTriggerBps(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new LedgerValidationError('triggerRatioBps must be a positive integer');
  }
  return value;
}

/** One borrower's in-memory position. `mustBalance` is unlocked (faucet) mUST;
 * `collateralLocked` is the amount pledged against a live loan. */
interface MockUser {
  party: string;
  mustBalance: number;
  collateralLocked: number;
  loan: LoanView | null;
  vault: VaultView | null;
  policy: (PolicyView & { maxRepayPerEvent: number }) | null;
  rescueEvents: RescueEventView[];
}

/** The party key used when no `X-Cermin-Party` header is present — the legacy
 * pre-seeded demo scene (STATE.md §2 numbers), so the standalone /api/position
 * demo and its tests keep working unchanged. */
const LEGACY_PARTY = '__legacy_demo__';

function emptyUser(party: string): MockUser {
  return { party, mustBalance: 0, collateralLocked: 0, loan: null, vault: null, policy: null, rescueEvents: [] };
}

function seedLegacyUser(): MockUser {
  return {
    party: LEGACY_PARTY,
    mustBalance: 0,
    collateralLocked: 10000,
    loan: { loanId: 'loan-1', principal: 6000, outstanding: 6000, rateBps: RATE_BPS },
    vault: { balance: 1500 },
    policy: { triggerRatioBps: 13000, targetRatioBps: 14500, couponSweep: false, maxRepayPerEvent: MAX_REPAY_PER_EVENT },
    rescueEvents: [],
  };
}

/**
 * In-memory multi-user ledger. The default (no-header) borrower is the legacy
 * demo scene; every distinct `X-Cermin-Party` header is its own onboarded user,
 * created on first touch. The oracle `price` is GLOBAL — one number every user's
 * Health Ratio reads, exactly like the on-ledger PriceFeed.
 */
export class MockLedger implements Ledger {
  private price = 1.0;
  private users = new Map<string, MockUser>();
  /** username slug -> party, so a returning username resolves the same party. */
  private parties = new Map<string, string>();
  private allocSeq = 0;
  /** Task 17: observed-price ring buffer + synthetic backfill (STATE.md §3 —
   * price is global, so one buffer serves every user). */
  private history = new PriceHistoryBuffer();

  constructor() {
    this.users.set(LEGACY_PARTY, seedLegacyUser());
    this.history.record(this.price);
  }

  private resolveUser(party?: string): MockUser {
    const key = party ?? LEGACY_PARTY;
    let u = this.users.get(key);
    if (!u) {
      u = emptyUser(key);
      this.users.set(key, u);
    }
    return u;
  }

  private snapshot(u: MockUser): PositionView {
    const loan = u.loan;
    // Collateral reflects the LOCKED amount when a loan exists, otherwise the
    // borrower's unlocked (faucet) mUST — so the borrow flow can preview against
    // it. Null only when the user holds nothing and has no loan.
    const collateralAmount = loan ? u.collateralLocked : u.mustBalance;
    return {
      party: u.party === LEGACY_PARTY ? null : u.party,
      wallet: { mustBalance: round2(u.mustBalance) },
      collateral:
        collateralAmount > 0
          ? {
              instrumentId: INSTRUMENT_ID,
              amount: collateralAmount,
              price: this.price,
              value: round2(collateralAmount * this.price),
              nextCouponDate: '2026-10-10',
            }
          : null,
      loan: loan ? { ...loan } : null,
      vault: u.vault ? { ...u.vault } : null,
      policy: u.policy
        ? { triggerRatioBps: u.policy.triggerRatioBps, targetRatioBps: u.policy.targetRatioBps, couponSweep: u.policy.couponSweep }
        : null,
      healthRatioBps: loan ? computeHealthRatioBps(u.collateralLocked * this.price, loan.outstanding) : null,
      // Newest first (docs/03-ux.md). Reverse the chronological push order rather
      // than sort on `at`, which can collide within the same millisecond.
      rescueEvents: [...u.rescueEvents].reverse(),
    };
  }

  /** Guard Agent stand-in: on a global price move, rescue every user whose loan
   * has breached its own trigger (the real agent's per-loan GuardRepay). */
  private maybeRescue(u: MockUser): void {
    if (!u.loan || !u.vault || !u.policy) return;
    const collateralValue = u.collateralLocked * this.price;
    const healthBefore = computeHealthRatioBps(collateralValue, u.loan.outstanding);
    if (healthBefore >= u.policy.triggerRatioBps) return;
    const targetOutstanding = collateralValue / (u.policy.targetRatioBps / 10000);
    const needed = u.loan.outstanding - targetOutstanding;
    if (needed <= 0) return;
    const repay = round2(Math.min(needed, u.policy.maxRepayPerEvent, u.vault.balance));
    if (repay <= 0) return;
    u.loan.outstanding = round2(u.loan.outstanding - repay);
    u.vault.balance = round2(u.vault.balance - repay);
    const healthAfter = computeHealthRatioBps(collateralValue, u.loan.outstanding);
    u.rescueEvents.push({
      loanId: u.loan.loanId,
      description: `Auto-repay from Shadow Vault restored the Health Ratio`,
      amount: repay,
      healthBefore,
      healthAfter,
      at: new Date().toISOString(),
    });
  }

  async onboard(username: string): Promise<OnboardResult> {
    const hint = partyHintForUsername(username);
    const existing = this.parties.get(hint);
    if (existing) return { party: existing, username, created: false };
    this.allocSeq += 1;
    const party = `${hint}::mock-ns-${this.allocSeq}`;
    this.parties.set(hint, party);
    this.users.set(party, emptyUser(party));
    return { party, username, created: true };
  }

  async faucet(party: string): Promise<FaucetResult> {
    if (!party) throw new LedgerValidationError('party is required');
    const u = this.resolveUser(party);
    if (u.mustBalance >= FAUCET_MUST) {
      throw new LedgerConflictError(`You already hold ${u.mustBalance} mUST — the faucet is one claim per user.`);
    }
    u.mustBalance = round2(u.mustBalance + FAUCET_MUST);
    return { party, minted: FAUCET_MUST, mustBalance: u.mustBalance };
  }

  async getPosition(party?: string): Promise<PositionView> {
    this.history.record(this.price); // append on every position read (dedupes no-ops)
    return this.snapshot(this.resolveUser(party));
  }

  async getPriceHistory(): Promise<{ points: PricePoint[] }> {
    return this.history.getHistory();
  }

  async vaultTopUp(amount: number, party?: string): Promise<PositionView> {
    const amt = requirePositiveNumber(amount, 'amount');
    const u = this.resolveUser(party);
    if (!u.vault) throw new LedgerValidationError('no Shadow Vault yet — borrow first');
    u.vault.balance = round2(u.vault.balance + amt);
    return this.snapshot(u);
  }

  async vaultWithdraw(amount: number, party?: string): Promise<PositionView> {
    const amt = requirePositiveNumber(amount, 'amount');
    const u = this.resolveUser(party);
    if (!u.vault) throw new LedgerValidationError('no Shadow Vault yet — borrow first');
    if (amt > u.vault.balance) throw new LedgerValidationError('amount exceeds vault balance');
    u.vault.balance = round2(u.vault.balance - amt);
    return this.snapshot(u);
  }

  async borrow(req: BorrowRequest, party?: string): Promise<PositionView> {
    const collateralAmount = requirePositiveNumber(req.collateralAmount, 'collateralAmount');
    const principal = requirePositiveNumber(req.principal, 'principal');
    const triggerRatioBps = validateTriggerBps(req.triggerRatioBps);
    if (typeof req.couponSweep !== 'boolean') throw new LedgerValidationError('couponSweep must be a boolean');
    const vaultDeposit = req.vaultDeposit ?? 0;
    if (typeof vaultDeposit !== 'number' || !Number.isFinite(vaultDeposit) || vaultDeposit < 0) {
      throw new LedgerValidationError('vaultDeposit must be a non-negative number');
    }
    const u = this.resolveUser(party);
    if (u.loan) throw new LedgerConflictError('You already have a live loan — repay it before borrowing again.');
    if (u.mustBalance < collateralAmount) {
      throw new LedgerConflictError(`Not enough mUST to post as collateral — claim the faucet first (have ${u.mustBalance}, need ${collateralAmount}).`);
    }

    // Only the collateral consumes faucet mUST (it is locked); the ShadowVault
    // balance is an abstract Decimal reserve (STATE.md §2 money model), so
    // vaultDeposit is not drawn from the wallet.
    u.mustBalance = round2(u.mustBalance - collateralAmount);
    u.collateralLocked = collateralAmount;
    u.loan = { loanId: 'loan-1', principal, outstanding: principal, rateBps: RATE_BPS };
    u.policy = {
      triggerRatioBps,
      targetRatioBps: triggerRatioBps + RESTORE_SPREAD_BPS,
      couponSweep: req.couponSweep,
      maxRepayPerEvent: MAX_REPAY_PER_EVENT,
    };
    u.vault = { balance: round2(vaultDeposit) };
    return this.snapshot(u);
  }

  async simPrice(price: number, party?: string): Promise<PositionView> {
    this.price = requirePositiveNumber(price, 'price');
    this.history.record(this.price);
    for (const u of this.users.values()) this.maybeRescue(u);
    return this.snapshot(this.resolveUser(party));
  }
}

// ---------------------------------------------------------------------------
// Factory: MOCK_LEDGER=true (default) -> MockLedger; false -> EvmLedger on BNB Chain.
// ---------------------------------------------------------------------------

import { EvmLedger } from './evmLedger.ts';

export function createLedger(): Ledger {
  if (process.env.MOCK_LEDGER !== 'false') return new MockLedger();
  const required = ['CERMIN_RWA_ADDRESS', 'OPERATOR_PRIVATE_KEY', 'GUARD_AGENT_ADDRESS', 'USER_KEY_SECRET'] as const;
  for (const k of required) {
    if (!process.env[k]) throw new Error(`${k} is required when MOCK_LEDGER=false`);
  }
  return new EvmLedger({
    rpcUrl: process.env.BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.bnbchain.org:8545',
    chainId: Number(process.env.CHAIN_ID ?? 97),
    cerminRwaAddress: process.env.CERMIN_RWA_ADDRESS as `0x${string}`,
    operatorPrivateKey: process.env.OPERATOR_PRIVATE_KEY as `0x${string}`,
    guardAgentAddress: process.env.GUARD_AGENT_ADDRESS as `0x${string}`,
    userKeySecret: process.env.USER_KEY_SECRET as string,
    gasDripWei: BigInt(process.env.GAS_DRIP_WEI ?? '3000000000000000'),
    usersDbPath: process.env.USERS_DB_PATH ?? './data/users.json',
    legacyBorrower: (process.env.LEGACY_BORROWER_ADDRESS || undefined) as `0x${string}` | undefined,
  });
}
