"use client";

// Initia `.init` name → address lookup removed in the BNB Chain migration.
// Employees must be added by 0x address. Kept as a no-op so callers compile.
// TODO(bnb): optionally resolve Space ID (.bnb) names here.
export function useInitResolver(_input: string) {
  return { resolvedAddress: null as string | null, isResolving: false, isError: false };
}
