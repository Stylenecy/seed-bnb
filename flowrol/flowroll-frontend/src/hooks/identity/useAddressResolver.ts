"use client";

// Initia `.init` reverse lookup removed in the BNB Chain migration.
// TODO(bnb): optionally resolve Space ID (.bnb) names. Until then this
// always returns null and callers fall back to a truncated 0x address.
export function useAddressResolver(_address: string) {
  return { resolvedName: null as string | null, isResolving: false, isError: false };
}
