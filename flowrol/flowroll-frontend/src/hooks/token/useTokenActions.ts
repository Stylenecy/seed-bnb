import { useMutation } from "@tanstack/react-query";
import { erc20Abi } from "viem";
import { toast } from "sonner";
import { useContractClient } from "@/hooks/useContractClient";
import { useEvmTx } from "@/hooks/useEvmTx";
import {
  useWriteContract,
  useAccount,
  usePublicClient,
  useSwitchChain,
} from "wagmi";
import { flowLog } from "@/lib/utils";

export function useTokenActions(tokenAddress: `0x${string}`) {
  const {
    address,
    publicClient,
    writeContractAsync,
    queryClient,
    contracts,
    isTestnet,
  } = useContractClient();

  const { sendTx } = useEvmTx();

  const { switchChainAsync } = useSwitchChain();

  const approveToken = useMutation({
    mutationFn: async ({
      spender,
      amount,
    }: {
      spender: `0x${string}`;
      amount: bigint;
    }) => {
      if (!address) throw new Error("Wallet not connected");

      const transactionHash = await sendTx({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, amount],
      });

      return transactionHash;
    },
    onSuccess: (hash, variables) => {
      flowLog("Approval successful. Hash:", hash);
      flowLog("Variables:", variables);

      queryClient.invalidateQueries({
        queryKey: [
          "allowance",
          tokenAddress,
          address,
          contracts.FLOWROLL_ZAPPER_ADDRESS,
        ],

        // queryKey: ["allowance", tokenAddress, address, spender]
      });
    },
  });

  const revokeApproval = useMutation({
    mutationFn: async (spender: `0x${string}`) => {
      if (!address) throw new Error("Wallet not connected");

      const { request } = await publicClient!.simulateContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [spender, 0n], // setting allowance to zero = revoke
        account: address,
      });

      return await writeContractAsync(request);
    },
    onSuccess: (_, spender) => {
      queryClient.invalidateQueries({
        queryKey: ["allowance", tokenAddress, address, spender],
      });
      toast.success("Approval revoked.");
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Revoke failed.");
    },
  });

  return { approveToken, revokeApproval };
}
