"use client";

import { useQuery } from "@tanstack/react-query";
import { useContractClient } from "@/hooks/useContractClient";
import { FLOWROLL_CREDIT_ABI } from "@/lib/contracts/abis";

interface AdvanceInfo {
  pendingSalary: bigint;
  currentDebt: bigint;
  maxAvailableToDraw: bigint;
  currentFeeBps: bigint;
}

export function useAdvanceInfo() {
  const { publicClient, address, contracts } = useContractClient();

  return useQuery({
    queryKey: ["advance-info", address],
    queryFn: async (): Promise<AdvanceInfo> => {
      if (!publicClient || !address) throw new Error("Client not initialized");

      const data = await publicClient.readContract({
        address: contracts.FLOWROLL_CREDIT_ADDRESS,
        abi: FLOWROLL_CREDIT_ABI,
        functionName: "getAdvanceInfo",
        args: [address],
      });

      // Map on-chain array response to structured object
      const [pendingSalary, currentDebt, maxAvailableToDraw, currentFeeBps] = data as [
        bigint,
        bigint,
        bigint,
        bigint
      ];

      return {
        pendingSalary,
        currentDebt,
        maxAvailableToDraw,
        currentFeeBps,
      };
    },
    enabled: !!address && !!publicClient,
    staleTime: 30_000, // Refresh every 30 seconds to keep credit info current
  });
}