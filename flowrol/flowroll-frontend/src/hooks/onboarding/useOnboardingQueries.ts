"use client";

import { useQuery } from "@tanstack/react-query";

import { useContractClient } from "@/hooks/useContractClient";

interface OnboardingData {
  gas: bigint;
  allowance: bigint;
}

export function useOnboardingQueries(evmAddress: `0x${string}` | undefined) {
  const { publicClient } = useContractClient();

  const query = useQuery({
    queryKey: ["onboarding-queries", evmAddress],
    queryFn: async (): Promise<OnboardingData> => {
      if (!publicClient || !evmAddress) throw new Error("Client not initialized");

      // Aggregate gas balance and protocol permissions
      // (Initia zapper allowance check dropped — no bridge/zap step on BSC.)
      const gas = await publicClient.getBalance({ address: evmAddress });
      return { gas, allowance: 0n };
    },
    enabled: !!evmAddress && !!publicClient,
    refetchInterval: 5000,
  });

  return {
    evmAddress,
    balances: {
      gas: query.data?.gas ?? 0n,
    },
    currentAllowance: query.data?.allowance ?? 0n,
    refetchBalances: query.refetch,
    isLoadingBalances: query.isLoading,
  };
}