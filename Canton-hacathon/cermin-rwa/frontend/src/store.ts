import { useEffect } from 'react';
import { create } from 'zustand';
import {
  computeGuardRepay,
  computeHealthRatioBps,
  computeProtectionRunway,
  computeQuarterlyCoupon,
  defensePrice,
  getNextCouponDate,
  healthStatus,
  protectionFloorPrice,
  RESTORE_SPREAD_BPS,
  roundMoney,
  STATUS_LABEL,
  type HealthStatus,
} from './lib/health';
import { formatPercentBps, formatUsd } from './lib/format';
import { appendPriceTick, seedPriceHistory, type PricePoint } from './lib/priceHistory';
import * as backend from './lib/backend';

/**
 * In-memory mock store standing in for the ledger (Task 8 optionally wires
 * this to a real backend). Field names and math mirror the contract shapes
 * and formula in .superpowers/sdd/global-constraints.md so a later swap to
 * live ledger data is a data-source change, not a rewrite.
 */

export interface CollateralState {
  instrumentId: string;
  faceValue: number;
  price: number;
  couponRateBps: number;
  maturity: string; // ISO date
}

export interface LoanState {
  loanId: string;
  principal: number;
  outstanding: number;
  rateBps: number;
}

export interface ShadowVaultState {
  balance: number;
}

export interface GuardPolicyState {
  triggerRatioBps: number;
  targetRatioBps: number;
  maxRepayPerEvent: number;
  couponSweep: boolean;
}

export interface WalletState {
  balance: number;
}

/** Result of a self-service async action (connect / faucet / borrow), so screens
 * can surface a clear inline error (e.g. a 409 faucet double-claim). */
export interface ActionResult {
  ok: boolean;
  error?: string;
}

export type ActivityKind = 'welcome' | 'rescue' | 'coupon' | 'vault' | 'borrow';

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  message: string;
  at: string; // ISO timestamp
}

export interface CerminStore {
  collateral: CollateralState;
  loan: LoanState;
  shadowVault: ShadowVaultState;
  guardPolicy: GuardPolicyState;
  wallet: WalletState;
  activity: ActivityItem[];
  /** Task 17 dashboard price chart: 30-day synthetic backfill + observed
   * ticks, ascending chronological order. Mock mode: grown locally by
   * `setPrice`/`resetDemo`. Backend mode: replaced wholesale by each
   * `syncFromBackend` poll from `GET /api/price-history`. */
  priceHistory: PricePoint[];

  // --- self-service session (backend mode only; inert in mock mode) ---
  /** The connected user's BNB Chain address (their "wallet address"), or null. */
  session: backend.Session | null;
  /** Unlocked mUST the user holds from the faucet — spendable at borrow. */
  mustBalance: number;
  /** Whether the connected user has a live loan (false = empty-state dashboard). */
  hasLoan: boolean;

  /** Onboard/resolve a party for `username` and store the session (backend mode). */
  connect: (username: string) => Promise<ActionResult>;
  /** Clear the session and return to the connect screen (backend mode). */
  disconnect: () => void;
  /** Claim 10,000 mUST from the faucet for the connected party (backend mode). */
  claimFaucet: () => Promise<ActionResult>;
  /** Full live origination: locks collateral, creates Loan + GuardPolicy + Vault. */
  originateLoan: (req: {
    collateralAmount: number;
    principal: number;
    triggerRatioBps: number;
    couponSweep: boolean;
    vaultDeposit?: number;
  }) => Promise<ActionResult>;

  /** Oracle-style update — just moves the price, mirrors PriceFeed.UpdatePrice. */
  setPrice: (price: number) => void;
  /** Guard Agent's ShadowVault.GuardRepay: checks the trigger, repays toward the target if needed. */
  guardRepay: () => void;
  /** CouponDistribution.ClaimCoupon: pays the quarterly coupon, sweeping into the loan if enabled. */
  payCoupon: () => void;
  /** Draws more principal against the existing collateral. */
  borrow: (amount: number) => void;
  /** Moves stablecoin from the wallet into the private Shadow Vault. */
  topUpVault: (amount: number) => void;
  /** Moves stablecoin back out of the Shadow Vault into the wallet. */
  withdrawVault: (amount: number) => void;
  /** Turns Coupon Sweep on/off (GuardPolicy field, borrower-controlled). */
  setCouponSweep: (enabled: boolean) => void;
  /**
   * Sets the Guard Trigger (borrower-controlled, offered as chips in the
   * Borrow flow). Keeps the same restore buffer the demo default uses
   * (target sits 1500 bps above trigger, e.g. 130% -> 145%) so a custom
   * trigger still has a sane target to restore to.
   */
  setGuardTrigger: (triggerRatioBps: number) => void;
  /** Restores every slice to the seeded demo numbers — lets the Simulation screen be replayed. */
  resetDemo: () => void;
}

function makeActivityItem(kind: ActivityKind, message: string): ActivityItem {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    kind,
    message,
    at: new Date().toISOString(),
  };
}

// --- Demo numbers, verbatim from .superpowers/sdd/global-constraints.md ---
const initialCollateral: CollateralState = {
  instrumentId: 'mUST-2030',
  faceValue: 10_000,
  price: 1.0,
  couponRateBps: 450,
  maturity: '2030-12-31',
};

const initialLoan: LoanState = {
  loanId: 'LOAN-001',
  principal: 6_000,
  outstanding: 6_000,
  rateBps: 500,
};

const initialShadowVault: ShadowVaultState = { balance: 1_500 };

const initialGuardPolicy: GuardPolicyState = {
  triggerRatioBps: 13_000,
  targetRatioBps: 14_500,
  maxRepayPerEvent: 2_000,
  couponSweep: false,
};

const initialWallet: WalletState = { balance: 0 };

const initialHealthBps = computeHealthRatioBps(
  initialCollateral.faceValue * initialCollateral.price,
  initialLoan.outstanding,
);
const initialStatusLabel =
  STATUS_LABEL[healthStatus(initialHealthBps, initialGuardPolicy.triggerRatioBps, initialGuardPolicy.targetRatioBps)];

/**
 * Seeded "welcome" notes, newest first (ActivityFeed renders array order —
 * see docs/03-ux.md "newest first"). A function, not a constant, so
 * `resetDemo` can regenerate a fresh copy with current timestamps.
 */
function makeInitialActivity(): ActivityItem[] {
  return [
    {
      id: 'seed-welcome',
      kind: 'welcome',
      // Status word stays true to the actual computed state, not a hardcoded assumption.
      message: `Good morning. Your Health Ratio is ${formatPercentBps(initialHealthBps)} — ${initialStatusLabel.toLowerCase()}. — Cermin`,
      at: new Date(Date.now() - 2 * 60_000).toISOString(),
    },
    {
      id: 'seed-vault',
      kind: 'welcome',
      message: `Your Shadow Vault is funded with ${formatUsd(initialShadowVault.balance)}, ready if you ever need it. — Cermin`,
      at: new Date(Date.now() - 6 * 60_000).toISOString(),
    },
  ];
}

export const useCerminStore = create<CerminStore>()((set, get) => ({
  collateral: initialCollateral,
  loan: initialLoan,
  shadowVault: initialShadowVault,
  guardPolicy: initialGuardPolicy,
  wallet: initialWallet,
  activity: makeInitialActivity(),
  priceHistory: seedPriceHistory(initialCollateral.price),

  // Session is restored from localStorage in backend mode so a refresh keeps the
  // user connected. Mock mode: session stays null, mustBalance 0, hasLoan true
  // (the seeded demo position always has a loan) — the connect/empty-state UI is
  // never reached, keeping Mode A byte-identical.
  session: backend.isBackendMode() ? backend.getSession() : null,
  mustBalance: 0,
  hasLoan: true,

  connect: async (username) => {
    if (!backend.isBackendMode()) return { ok: false, error: 'not in backend mode' };
    const name = username.trim();
    if (!name) return { ok: false, error: 'Please enter a name.' };
    try {
      const { party } = await backend.onboard(name);
      backend.setSession({ party, username: name });
      set({ session: { party, username: name } });
      await syncFromBackend();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: errorText(err) };
    }
  },

  disconnect: () => {
    backend.clearSession();
    set({ session: null, mustBalance: 0, hasLoan: false, activity: [] });
  },

  claimFaucet: async () => {
    if (!backend.isBackendMode()) return { ok: false, error: 'not in backend mode' };
    try {
      await backend.faucet();
      await syncFromBackend();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: errorText(err) };
    }
  },

  originateLoan: async (req) => {
    if (!backend.isBackendMode()) return { ok: false, error: 'not in backend mode' };
    try {
      applyPosition(await backend.borrow(req));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: errorText(err) };
    }
  },

  setPrice: (price) => {
    if (price < 0) return;
    // Backend mode: drop the oracle price on the ledger; the Guard Agent does
    // the rescue and polling reflects it. Mock mode: local price move (below).
    if (backend.isBackendMode()) {
      void backend.simPrice(price).then(applyPosition).catch(logBackendError);
      return;
    }
    set((state) => ({
      collateral: { ...state.collateral, price },
      priceHistory: appendPriceTick(state.priceHistory, price),
    }));
  },

  guardRepay: () => {
    // Backend mode: the on-ledger GuardRepay is performed by the Guard Agent
    // service, not the client — polling surfaces it. No-op here.
    if (backend.isBackendMode()) return;
    const state = get();
    const collateralValue = selectCollateralValue(state);
    const result = computeGuardRepay({
      collateralValue,
      outstanding: state.loan.outstanding,
      vaultBalance: state.shadowVault.balance,
      triggerRatioBps: state.guardPolicy.triggerRatioBps,
      targetRatioBps: state.guardPolicy.targetRatioBps,
      maxRepayPerEvent: state.guardPolicy.maxRepayPerEvent,
    });

    if (!result.fired) return;

    set({
      loan: { ...state.loan, outstanding: result.newOutstanding },
      shadowVault: { ...state.shadowVault, balance: result.newVaultBalance },
      activity: [
        makeActivityItem(
          'rescue',
          `Your Health Ratio slipped to ${formatPercentBps(result.healthBeforeBps)}. I repaid ${formatUsd(
            result.repayAmount,
          )} from your Shadow Vault — you're back to ${formatPercentBps(result.healthAfterBps)}. Your position is safe. — Cermin`,
        ),
        ...state.activity,
      ],
    });
  },

  payCoupon: () => {
    // Backend mode: coupon issuance is triggered on the ledger via a daml script
    // (Cermin.Scripts.Demo:payDemoCoupon); the agent sweeps and polling reflects it.
    if (backend.isBackendMode()) return;
    const state = get();
    const coupon = computeQuarterlyCoupon(state.collateral.faceValue, state.collateral.couponRateBps);
    if (coupon <= 0) return;

    if (state.guardPolicy.couponSweep) {
      const repayAmount = roundMoney(Math.min(coupon, state.loan.outstanding));
      const remainder = roundMoney(coupon - repayAmount);
      const newOutstanding = roundMoney(state.loan.outstanding - repayAmount);
      set({
        loan: { ...state.loan, outstanding: newOutstanding },
        wallet: { balance: roundMoney(state.wallet.balance + remainder) },
        activity: [
          makeActivityItem(
            'coupon',
            `Your Treasury paid ${formatUsd(coupon)} in coupons. I swept it straight into your loan — outstanding is now ${formatUsd(
              newOutstanding,
            )}. — Cermin`,
          ),
          ...state.activity,
        ],
      });
      return;
    }

    set({
      wallet: { balance: roundMoney(state.wallet.balance + coupon) },
      activity: [
        makeActivityItem('coupon', `Your Treasury paid ${formatUsd(coupon)} in coupons, sent straight to your wallet. — Cermin`),
        ...state.activity,
      ],
    });
  },

  borrow: (amount) => {
    if (amount <= 0) return;
    // Backend mode: the demo runs against the pre-seeded sandbox loan; origination
    // is not driven from the client. No-op.
    if (backend.isBackendMode()) return;
    const state = get();
    set({
      loan: {
        ...state.loan,
        principal: roundMoney(state.loan.principal + amount),
        outstanding: roundMoney(state.loan.outstanding + amount),
      },
      wallet: { balance: roundMoney(state.wallet.balance + amount) },
      activity: [
        makeActivityItem('borrow', `You borrowed ${formatUsd(amount)} against your collateral. — Cermin`),
        ...state.activity,
      ],
    });
  },

  topUpVault: (amount) => {
    if (amount <= 0) return;
    if (backend.isBackendMode()) {
      void backend.vaultTopUp(amount).then(applyPosition).catch(logBackendError);
      return;
    }
    const state = get();
    const actual = roundMoney(Math.min(amount, state.wallet.balance));
    if (actual <= 0) return;
    set({
      wallet: { balance: roundMoney(state.wallet.balance - actual) },
      shadowVault: { balance: roundMoney(state.shadowVault.balance + actual) },
      activity: [
        makeActivityItem('vault', `You added ${formatUsd(actual)} to your Shadow Vault. — Cermin`),
        ...state.activity,
      ],
    });
  },

  withdrawVault: (amount) => {
    if (amount <= 0) return;
    if (backend.isBackendMode()) {
      void backend.vaultWithdraw(amount).then(applyPosition).catch(logBackendError);
      return;
    }
    const state = get();
    const actual = roundMoney(Math.min(amount, state.shadowVault.balance));
    if (actual <= 0) return;
    set({
      shadowVault: { balance: roundMoney(state.shadowVault.balance - actual) },
      wallet: { balance: roundMoney(state.wallet.balance + actual) },
      activity: [
        makeActivityItem('vault', `You withdrew ${formatUsd(actual)} from your Shadow Vault. — Cermin`),
        ...state.activity,
      ],
    });
  },

  setCouponSweep: (enabled) => {
    // Backend mode: the GuardPolicy is fixed on the seeded ledger (couponSweep
    // on); not editable from the client. No-op.
    if (backend.isBackendMode()) return;
    const state = get();
    set({
      guardPolicy: { ...state.guardPolicy, couponSweep: enabled },
      activity: [
        makeActivityItem(
          'vault',
          enabled
            ? "You turned Coupon Sweep on. I'll route your Treasury's coupons straight into your loan from now on. — Cermin"
            : "You turned Coupon Sweep off. Coupons will land in your wallet instead. — Cermin",
        ),
        ...state.activity,
      ],
    });
  },

  setGuardTrigger: (triggerRatioBps) => {
    if (triggerRatioBps <= 0) return;
    // Backend mode: the GuardPolicy trigger is set on the seeded ledger. No-op.
    if (backend.isBackendMode()) return;
    const state = get();
    const targetRatioBps = triggerRatioBps + RESTORE_SPREAD_BPS;
    set({
      guardPolicy: { ...state.guardPolicy, triggerRatioBps, targetRatioBps },
      activity: [
        makeActivityItem(
          'vault',
          `You set your Guard Trigger to ${formatPercentBps(triggerRatioBps)}. I'll step in the moment your Health Ratio dips below that. — Cermin`,
        ),
        ...state.activity,
      ],
    });
  },

  resetDemo: () => {
    // Backend mode: can't reset the ledger from the client; just re-pull state.
    if (backend.isBackendMode()) {
      void syncFromBackend();
      return;
    }
    set({
      collateral: { ...initialCollateral },
      loan: { ...initialLoan },
      shadowVault: { ...initialShadowVault },
      guardPolicy: { ...initialGuardPolicy },
      wallet: { ...initialWallet },
      activity: makeInitialActivity(),
      priceHistory: seedPriceHistory(initialCollateral.price),
    });
  },
}));

// ---------------------------------------------------------------------------
// Backend bridge (Task 8): live only when VITE_API_URL is set. In the default
// standalone build `backend.isBackendMode()` is false and none of this runs.
// ---------------------------------------------------------------------------

function logBackendError(err: unknown): void {
  console.error('[cermin] backend error:', err instanceof Error ? err.message : err);
}

/** A user-facing message from a backend error (server `error` string when present). */
function errorText(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Something went wrong. Please try again.';
}

/** Timestamp for the synthetic live-mode welcome note, captured once at store
 * init so the feed shows a real session time ("Just now", then aging naturally)
 * instead of the epoch's "Jan 1, 1970". Constant across polls so the item never
 * jumps around or perpetually reads "Just now". */
const LIVE_WELCOME_AT = new Date().toISOString();

/** Maps the backend's PositionView into the store's activity feed (newest-first).
 * The ledger's RescueEvents cover both auto-repays and coupon sweeps. */
function backendActivity(view: backend.PositionView): ActivityItem[] {
  const events: ActivityItem[] = view.rescueEvents.map((ev) => {
    const isCoupon = ev.description.toLowerCase().includes('coupon');
    return {
      id: `${ev.at}-${ev.amount}-${isCoupon ? 'c' : 'r'}`,
      kind: isCoupon ? 'coupon' : 'rescue',
      message: isCoupon
        ? `Your Treasury paid ${formatUsd(ev.amount)} in coupons. I swept it straight into your loan — you're at ${formatPercentBps(
            ev.healthAfter,
          )}. — Cermin`
        : `Your Health Ratio slipped to ${formatPercentBps(ev.healthBefore)}. I repaid ${formatUsd(
            ev.amount,
          )} from your Shadow Vault — you're back to ${formatPercentBps(ev.healthAfter)}. Your position is safe. — Cermin`,
      at: ev.at,
    };
  });
  const welcome: ActivityItem = {
    id: 'seed-welcome-live',
    kind: 'welcome',
    message:
      view.healthRatioBps != null
        ? `Watching your position live on the ledger — Health Ratio ${formatPercentBps(view.healthRatioBps)}. — Cermin`
        : view.loan == null && view.wallet.mustBalance > 0
          ? `Your ${formatUsd(view.wallet.mustBalance)} of test mUST is ready. Borrow against it whenever you like. — Cermin`
          : `Welcome. Claim some test mUST to get started, and I'll watch your position from here. — Cermin`,
    at: LIVE_WELCOME_AT,
  };
  return [...events, welcome];
}

/** Writes a backend PositionView into the store, preserving the fields the
 * ledger view doesn't carry (couponRateBps, maturity, wallet, maxRepayPerEvent).
 * Handles the empty state: a freshly-onboarded user has null loan/vault/policy. */
function applyPosition(view: backend.PositionView): void {
  const prev = useCerminStore.getState();
  useCerminStore.setState({
    session: backend.getSession(),
    mustBalance: view.wallet.mustBalance,
    hasLoan: view.loan != null,
    collateral: {
      ...prev.collateral,
      instrumentId: view.collateral?.instrumentId ?? prev.collateral.instrumentId,
      faceValue: view.collateral?.amount ?? 0,
      price: view.collateral?.price ?? prev.collateral.price,
    },
    loan: view.loan
      ? {
          loanId: view.loan.loanId,
          principal: view.loan.principal,
          outstanding: view.loan.outstanding,
          rateBps: view.loan.rateBps,
        }
      : { loanId: '', principal: 0, outstanding: 0, rateBps: 0 },
    shadowVault: { balance: view.vault?.balance ?? 0 },
    guardPolicy: {
      ...prev.guardPolicy,
      triggerRatioBps: view.policy?.triggerRatioBps ?? prev.guardPolicy.triggerRatioBps,
      targetRatioBps: view.policy?.targetRatioBps ?? prev.guardPolicy.targetRatioBps,
      couponSweep: view.policy?.couponSweep ?? prev.guardPolicy.couponSweep,
    },
    activity: backendActivity(view),
  });
}

/** One-shot pull of the current position (+ Task 17 price history) from the
 * backend into the store. The two are independent reads (price history isn't
 * user-scoped — the oracle price is global) so one failing doesn't block the
 * other. */
export async function syncFromBackend(): Promise<void> {
  try {
    applyPosition(await backend.getPosition());
  } catch (err) {
    logBackendError(err);
  }
  try {
    const { points } = await backend.getPriceHistory();
    useCerminStore.setState({ priceHistory: points });
  } catch (err) {
    logBackendError(err);
  }
}

// Poll etiquette: each tick fans into 5 ACS reads behind the backend, and Mode D
// hits a public BSC RPC through the backend — keep this ≥3000ms. 4000 is
// the calm middle: the rescue still lands within one agent poll (5s) plus one FE
// poll, while staying modest on a shared network. Backend mode only — the
// standalone mock store never polls.
const BACKEND_POLL_MS = 4_000;

/**
 * React hook: when VITE_API_URL is set, poll the backend and keep the store in
 * sync. A no-op in standalone mock mode. Mounted once from App.
 *
 * `enabled` (Task 19, default true): App.tsx passes `view === 'app'` so the
 * public landing page (`/`) never fires a single ledger read, even for a
 * returning visitor whose backend session is still in localStorage — the
 * landing page is static marketing content, full stop.
 */
export function useBackendPolling(enabled: boolean = true): void {
  useEffect(() => {
    if (!backend.isBackendMode() || !enabled) return;
    let alive = true;
    const tick = () => {
      // Only poll once the user has connected (has a party); before that the
      // connect screen is showing and there is no position to fetch.
      if (alive && backend.getSession()) void syncFromBackend();
    };
    tick();
    const id = setInterval(tick, BACKEND_POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [enabled]);
}

// --- Selectors: the single source of truth for derived numbers, shared by
// components and tests so nobody re-implements the formula. ---

export function selectCollateralValue(state: Pick<CerminStore, 'collateral'>): number {
  return roundMoney(state.collateral.faceValue * state.collateral.price);
}

export function selectHealthRatioBps(state: Pick<CerminStore, 'collateral' | 'loan'>): number {
  return computeHealthRatioBps(selectCollateralValue(state), state.loan.outstanding);
}

export function selectHealthStatus(state: Pick<CerminStore, 'collateral' | 'loan' | 'guardPolicy'>): HealthStatus {
  return healthStatus(selectHealthRatioBps(state), state.guardPolicy.triggerRatioBps, state.guardPolicy.targetRatioBps);
}

export function selectProtectionRunway(
  state: Pick<CerminStore, 'collateral' | 'loan' | 'shadowVault' | 'guardPolicy'>,
): number {
  return computeProtectionRunway({
    collateralValue: selectCollateralValue(state),
    outstanding: state.loan.outstanding,
    vaultBalance: state.shadowVault.balance,
    triggerRatioBps: state.guardPolicy.triggerRatioBps,
  });
}

export function selectNextCouponDate(now: Date = new Date()): Date {
  return getNextCouponDate(now);
}

/** Task 17 — the chart's "Cermin defends · $X" dashed line price. */
export function selectDefensePrice(state: Pick<CerminStore, 'loan' | 'guardPolicy' | 'collateral'>): number {
  return defensePrice(state.loan.outstanding, state.guardPolicy.triggerRatioBps, state.collateral.faceValue);
}

/** Task 17 — the chart's "Protection floor · $Y" dashed line price (0 hides it). */
export function selectProtectionFloorPrice(
  state: Pick<CerminStore, 'loan' | 'shadowVault' | 'guardPolicy' | 'collateral'>,
): number {
  return protectionFloorPrice(
    state.loan.outstanding,
    state.shadowVault.balance,
    state.guardPolicy.triggerRatioBps,
    state.collateral.faceValue,
  );
}
