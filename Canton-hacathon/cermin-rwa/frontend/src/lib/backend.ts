/**
 * Backend-polling data source (Task 8 integration; Task 16 self-service).
 *
 * Default (VITE_API_URL unset): this module is inert — `isBackendMode()` is
 * false and the app runs entirely on the standalone in-memory store in
 * `store.ts`, exactly as before (the demo fallback, unchanged).
 *
 * When VITE_API_URL is set the store polls `GET /api/position` and routes its
 * mutating actions to the backend bridge. Task 16 adds a self-service session:
 * the user "connects" with a username, the backend provisions their own BNB Chain
 * party, and every call carries that party in the `X-Cermin-Party` header so the
 * backend scopes reads/writes to it. The party id is the user's wallet address.
 *
 * This file has no React or store imports on purpose — it is pure config + fetch
 * so importing it can never create a cycle or pull the store into a component.
 */

const API_URL: string | undefined =
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_API_URL as string | undefined) || undefined
    : undefined;

export function isBackendMode(): boolean {
  return !!API_URL;
}

// --- session (the "login"): a party id + username kept in localStorage --------

const PARTY_KEY = 'cermin_party';
const USERNAME_KEY = 'cermin_username';

export interface Session {
  party: string;
  username: string;
}

export function getSession(): Session | null {
  if (typeof localStorage === 'undefined') return null;
  const party = localStorage.getItem(PARTY_KEY);
  const username = localStorage.getItem(USERNAME_KEY);
  return party ? { party, username: username ?? '' } : null;
}

export function setSession(session: Session): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PARTY_KEY, session.party);
  localStorage.setItem(USERNAME_KEY, session.username);
}

export function clearSession(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(PARTY_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

// --- PositionView: mirrors backend/src/ledger.ts's response shape verbatim. ---
// `collateral`, `loan`, `vault`, `policy`, `healthRatioBps` are null for a
// freshly-onboarded user (the empty-state Dashboard).

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

export interface OnboardResult {
  party: string;
  username: string;
  created: boolean;
}
export interface FaucetResult {
  party: string;
  minted: number;
  mustBalance: number;
}

export interface BorrowRequest {
  collateralAmount: number;
  principal: number;
  triggerRatioBps: number;
  couponSweep: boolean;
  vaultDeposit?: number;
}

// --- Task 17: price history (backend/src/priceHistory.ts's response shape) ---

export interface PricePoint {
  at: string; // ISO timestamp
  price: number;
  synthetic?: boolean;
}
export interface PriceHistoryView {
  points: PricePoint[];
}

/** An HTTP error carrying the status so callers can distinguish 409 (conflict). */
export class BackendError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const session = getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init?.headers as Record<string, string>) };
  if (session) headers['X-Cermin-Party'] = session.party;
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // non-JSON body — keep the status text
    }
    throw new BackendError(message, res.status);
  }
  return (await res.json()) as T;
}

export function onboard(username: string): Promise<OnboardResult> {
  return call('/api/onboard', { method: 'POST', body: JSON.stringify({ username }) });
}
export function faucet(): Promise<FaucetResult> {
  return call('/api/faucet', { method: 'POST', body: JSON.stringify({}) });
}
export function getPosition(): Promise<PositionView> {
  return call('/api/position');
}
export function simPrice(price: number): Promise<PositionView> {
  return call('/api/sim/price', { method: 'POST', body: JSON.stringify({ price }) });
}
export function vaultTopUp(amount: number): Promise<PositionView> {
  return call('/api/vault/topup', { method: 'POST', body: JSON.stringify({ amount }) });
}
export function vaultWithdraw(amount: number): Promise<PositionView> {
  return call('/api/vault/withdraw', { method: 'POST', body: JSON.stringify({ amount }) });
}
export function borrow(req: BorrowRequest): Promise<PositionView> {
  return call('/api/borrow', { method: 'POST', body: JSON.stringify(req) });
}
export function getPriceHistory(): Promise<PriceHistoryView> {
  return call('/api/price-history');
}
