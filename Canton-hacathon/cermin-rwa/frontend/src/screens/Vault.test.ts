import { describe, expect, it } from 'vitest';
import { isTopUpDisabled } from './Vault';

// The top-up "Add" gate (Task 15 live-mode fix): in backend mode there is no
// on-ledger wallet, so the mock wallet cap must NOT apply — any positive amount
// submits a real ShadowVault.TopUp. In mock mode the wallet cap stays (the demo
// parachute, byte-identical behavior). `backendMode` is passed explicitly so
// both branches are pinned regardless of the build's VITE_API_URL.

describe('isTopUpDisabled (backend/live mode)', () => {
  it('enables any positive amount even when it exceeds the (always-0) wallet', () => {
    expect(isTopUpDisabled('1000', 0, true)).toBe(false);
    expect(isTopUpDisabled('0.01', 0, true)).toBe(false);
  });

  it('still disables empty, zero, negative and non-numeric amounts', () => {
    expect(isTopUpDisabled('', 0, true)).toBe(true);
    expect(isTopUpDisabled('0', 0, true)).toBe(true);
    expect(isTopUpDisabled('-5', 0, true)).toBe(true);
    expect(isTopUpDisabled('abc', 0, true)).toBe(true);
  });
});

describe('isTopUpDisabled (standalone mock mode)', () => {
  it('keeps the wallet-balance cap', () => {
    expect(isTopUpDisabled('1000', 500, false)).toBe(true); // exceeds wallet
    expect(isTopUpDisabled('500', 500, false)).toBe(false); // within wallet
    expect(isTopUpDisabled('', 500, false)).toBe(true); // no amount
  });
});
