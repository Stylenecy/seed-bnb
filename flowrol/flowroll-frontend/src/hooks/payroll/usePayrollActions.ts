"use client";

import { useMutation } from "@tanstack/react-query";
import { useChainId } from "wagmi";

import { PAYROLL_MANAGER_ABI } from "@/lib/contracts/abis";
import { useContractClient } from "../useContractClient";
import { useEvmTx } from "@/hooks/useEvmTx";
import { flowLog } from "@/lib/utils";

export function usePayrollActions() {
  const { sendTx } = useEvmTx();

  const {
    address,
    publicClient,
    queryClient,
    contracts,
    chainId,
    isTestnet,
  } = useContractClient();

  // const chainId = useChainId();

  const createGroup = useMutation({
    mutationFn: async ({
      name,
      cycleDuration,
    }: {
      name: string;
      cycleDuration: bigint;
    }) => {
      if (!address) throw new Error("Wallet not connected");

      const { result } = await publicClient!.simulateContract({
        address: contracts.PAYROLL_MANAGER_ADDRESS,
        abi: PAYROLL_MANAGER_ABI,
        functionName: "createGroup",
        args: [name, cycleDuration],
        account: address,
      });

      const transactionHash = await sendTx({
        address: contracts.PAYROLL_MANAGER_ADDRESS,
        abi: PAYROLL_MANAGER_ABI,
        functionName: "createGroup",
        args: [name, cycleDuration],
      });

      flowLog("Transaction hash: ", transactionHash);

      return { hash: transactionHash, groupId: result as bigint };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employer-groups", address] });
    },
  });

  const setupPayroll = useMutation({
    mutationFn: async ({
      groupId,
      employees,
      salaries,
    }: {
      groupId: bigint;
      employees: `0x${string}`[];
      salaries: bigint[];
    }) => {
      if (!address) throw new Error("Wallet not connected");

      const transactionHash = await sendTx({
        address: contracts.PAYROLL_MANAGER_ADDRESS,
        abi: PAYROLL_MANAGER_ABI,
        functionName: "setUpPayroll",
        args: [groupId, employees, salaries],
      });

      return transactionHash;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-details"] });
      queryClient.invalidateQueries({ queryKey: ["group-employees"] });
      
    },
    onError: (error) => {
      flowLog("Payroll error: ", error);
    },
  });

  return {
    createGroup,
    setupPayroll,
    isReady: !!address,
  };
}
