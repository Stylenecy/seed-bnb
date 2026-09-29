"use client";

/**
 * Mock auth state stored in localStorage so the page-to-page flow described
 * in README.md works without a real backend. Two flags:
 *
 *   eqx.signed-in  → user finished the Login modal (any provider).
 *   eqx.has-pos    → user finished the onboarding wizard's "Confirm & Activate".
 *
 * Routes use these to decide between empty state, onboarding, and the full
 * dashboard.
 */

const SIGNED_IN = "eqx.signed-in";
const HAS_POSITION = "eqx.has-pos";

function read(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function write(key: string, on: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (on) window.localStorage.setItem(key, "1");
    else window.localStorage.removeItem(key);
  } catch {
    /* ignore quota / privacy errors */
  }
  // Broadcast within the tab so React hooks can refresh.
  window.dispatchEvent(new Event("eqx-auth-change"));
}

export const auth = {
  isSignedIn: () => read(SIGNED_IN),
  hasPosition: () => read(HAS_POSITION),
  signIn: () => write(SIGNED_IN, true),
  signOut: () => {
    write(HAS_POSITION, false);
    write(SIGNED_IN, false);
  },
  openPosition: () => {
    write(SIGNED_IN, true);
    write(HAS_POSITION, true);
  },
  closePosition: () => write(HAS_POSITION, false),
};
