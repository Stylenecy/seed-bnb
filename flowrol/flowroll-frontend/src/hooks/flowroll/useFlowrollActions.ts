import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useContractClient } from "@/hooks/useContractClient";
import { useEvmTx } from "@/hooks/useEvmTx";
import { FLOWROLL_CREDIT_ABI } from "@/lib/contracts/abis";

export function useFlowrollActions(evmAddress?: `0x${string}`) {
  const queryClient = useQueryClient();
  const { contracts } = useContractClient();
  const { sendTx } = useEvmTx();

  // Protocol salary advance request
  const requestSalary = useMutation({
    mutationFn: async (amountInBaseUnits: bigint) => {
      if (!evmAddress) throw new Error("Wallet not connected");

      const transactionHash = await sendTx({
        address: contracts.FLOWROLL_CREDIT_ADDRESS,
        abi: FLOWROLL_CREDIT_ABI,
        functionName: "requestSalary",
        args: [amountInBaseUnits],
      });
      return transactionHash;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advance-info", evmAddress] });
      queryClient.invalidateQueries({
        queryKey: ["token-balance", contracts.USDC_ADDRESS, evmAddress],
      });
    },
  });

  // Credit debt repayment orchestrator
  const repayDebt = useMutation({
    mutationFn: async ({
      employee,
      amountInBaseUnits,
    }: {
      employee: `0x${string}`;
      amountInBaseUnits: bigint;
    }) => {
      if (!evmAddress) throw new Error("Wallet not connected");

      const transactionHash = await sendTx({
        address: contracts.FLOWROLL_CREDIT_ADDRESS,
        abi: FLOWROLL_CREDIT_ABI,
        functionName: "repayDebt",
        args: [employee, amountInBaseUnits],
      });
      return transactionHash;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advance-info", evmAddress] });
      queryClient.invalidateQueries({
        queryKey: ["token-balance", contracts.USDC_ADDRESS, evmAddress],
      });
    },
  });

  return { requestSalary, repayDebt };
}
