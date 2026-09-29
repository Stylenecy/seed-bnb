"use client";

import { useEffect, useState } from "react";
import { auth } from "./auth";

/**
 * Subscribe to the mock auth flags exposed by lib/auth.ts. Re-renders the
 * caller when either flag flips (same tab via the eqx-auth-change event,
 * other tabs via the native `storage` event).
 */
export function useAuth() {
  const [signedIn, setSignedIn] = useState(false);
  const [hasPosition, setHasPosition] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setSignedIn(auth.isSignedIn());
      setHasPosition(auth.hasPosition());
    };
    refresh();
    window.addEventListener("eqx-auth-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("eqx-auth-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return { signedIn, hasPosition };
}
