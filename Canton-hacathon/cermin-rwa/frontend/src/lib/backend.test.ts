import { beforeEach, describe, expect, it, vi } from 'vitest';

// A minimal localStorage shim (the test env is `node`, no DOM).
class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  clear() {
    this.m.clear();
  }
}
vi.stubGlobal('localStorage', new MemoryStorage());

import { clearSession, getSession, isBackendMode, setSession } from './backend';
import { truncateParty } from '../components/AddressPill';
import { useCerminStore } from '../store';

beforeEach(() => {
  clearSession();
});

// The whole self-service layer (connect screen, faucet, live borrow) is gated on
// backend mode. The suite runs with VITE_API_URL UNSET (the standalone mock
// parachute), so isBackendMode() is false and none of it engages — Mode A is
// untouched, and the connect screen never exists there.
describe('connect gating: mock mode (VITE_API_URL unset)', () => {
  it('isBackendMode() is false, so the connect screen never gates', () => {
    expect(isBackendMode()).toBe(false);
  });

  it('the store starts with no session and self-service actions are inert', async () => {
    const s = useCerminStore.getState();
    expect(s.session).toBe(null);
    expect(await s.connect('Alice')).toEqual({ ok: false, error: 'not in backend mode' });
    expect(await s.claimFaucet()).toEqual({ ok: false, error: 'not in backend mode' });
    expect(await s.originateLoan({ collateralAmount: 10000, principal: 6000, triggerRatioBps: 13000, couponSweep: false })).toEqual({
      ok: false,
      error: 'not in backend mode',
    });
    // No session was written to storage by any inert action.
    expect(getSession()).toBe(null);
  });
});

describe('session storage (the "login" persistence)', () => {
  it('round-trips a party + username and clears cleanly', () => {
    expect(getSession()).toBe(null);
    setSession({ party: 'cermin-u-alice::1220abcd', username: 'Alice' });
    expect(getSession()).toEqual({ party: 'cermin-u-alice::1220abcd', username: 'Alice' });
    clearSession();
    expect(getSession()).toBe(null);
  });
});

describe('truncateParty (the wallet "address" display)', () => {
  it('keeps the hint and shortens the fingerprint', () => {
    expect(truncateParty('cermin-u-alice::1220a14ca128063')).toBe('cermin-u-alice::1220a1…');
  });
  it('leaves a short bare id readable', () => {
    expect(truncateParty('Borrower')).toBe('Borrower');
  });
});
