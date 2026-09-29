"use client";

import { useMutation } from "@tanstack/react-query";

import { useContractClient } from "@/hooks/useContractClient";

export function useOnboardingActions(evmAddress?: `0x${string}`) {
  const { queryClient, contracts, chainId } = useContractClient();

  // Native gas faucet orchestrator
  const claimFreeGas = useMutation({
    mutationFn: async () => {
      if (!evmAddress) throw new Error("Wallet not connected");

      const response = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: evmAddress, chainId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to claim gas");
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["native-balance", evmAddress],
      });
    },
  });

  const claimUSDC = useMutation({
    mutationFn: async () => {
      if (!evmAddress) throw new Error("Wallet not connected");

      // Assuming you renamed the previous bridge API route to /api/claim
      const response = await fetch("/api/claim-usdc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: evmAddress, chainId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to claim USDC");
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["token-balance", contracts.USDC_ADDRESS, evmAddress] });
    },
  });



  return { claimFreeGas, claimUSDC };
}
