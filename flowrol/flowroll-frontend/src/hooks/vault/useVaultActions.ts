"use client";

import { useMutation } from "@tanstack/react-query";
import { PAY_VAULT_ABI } from "@/lib/contracts/abis";
import { useContractClient } from "../useContractClient";
import { flowLog } from "@/lib/utils";
import { useEvmTx } from "@/hooks/useEvmTx";

export function useVaultActions() {
    const { sendTx } = useEvmTx();

    const { queryClient, contracts, address, isTestnet } = useContractClient();

    const claim = useMutation({
        mutationFn: async ({ amount }: { amount: bigint }) => {
            if (!address) throw new Error("Wallet not connected");

            const transactionHash = await sendTx({
        address: contracts.PAY_VAULT_ADDRESS,
                abi: PAY_VAULT_ABI,
                functionName: "claim",
                args: [amount],
      });

            return transactionHash;
        },
        onSuccess: (hash) => {
            flowLog("Claim successful. Hash:", hash);
            queryClient.invalidateQueries({ queryKey: ["available-balance", address] });
            queryClient.invalidateQueries({ queryKey: ["token-balance", contracts.USDC_ADDRESS, address ] });
        },
        onError: (error) => {
            flowLog("Claim failed:", error);
        },
    });

    const claimAndSave = useMutation({
        mutationFn: async ({
            amount,
            savePct,
            durationInSeconds,
        }: {
            amount: bigint;
            savePct: number;
            durationInSeconds: number;
        }) => {
            if (!address) throw new Error("Wallet not connected");

            const basisPoints = BigInt(Math.floor(savePct * 100));
            const duration = BigInt(durationInSeconds);

            const transactionHash = await sendTx({
        address: contracts.PAY_VAULT_ADDRESS,
                abi: PAY_VAULT_ABI,
                functionName: "claimAndSave",
                args: [amount, basisPoints, duration],
      });

            return transactionHash;
        },
        onSuccess: (hash) => {
            flowLog("Claim and Save successful. Hash:", hash);
            queryClient.invalidateQueries({ queryKey: ["available-balance", address] });
            queryClient.invalidateQueries({ queryKey: ["token-balance", contracts.USDC_ADDRESS, address] });
        },
        onError: (error) => {
            flowLog("Claim and save failed:", error);
        },
    });

    return {
        claim,
        claimAndSave,
        isReady: !!address,
    };
}