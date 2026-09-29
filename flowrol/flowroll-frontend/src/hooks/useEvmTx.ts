"use client";

// Replaces InterwovenKit's `estimateGas` + `submitTxBlock` (Cosmos MsgCall)
// with a plain EVM transaction via wagmi on BNB Chain.

import { useCallback } from "react";
import type { Abi } from "viem";
import { useAccount, useSwitchChain, useWriteContract, usePublicClient } from "wagmi";
import { ACTIVE_CHAIN } from "@/lib/chain";

export function useEvmTx() {
  const { address, chainId: walletChainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: ACTIVE_CHAIN.id });

  const sendTx = useCallback(
    async (params: {
      address: `0x${string}`;
      // Some Flowroll ABIs are plain JSON (not `as const`), so keep this loose.
      abi: Abi | readonly unknown[];
      functionName: string;
      args?: readonly unknown[];
      value?: bigint;
    }): Promise<`0x${string}`> => {
      if (!address) throw new Error("Wallet not connected");
      if (walletChainId !== ACTIVE_CHAIN.id) {
        await switchChainAsync({ chainId: ACTIVE_CHAIN.id });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hash = await writeContractAsync({
        ...(params as any),
        chainId: ACTIVE_CHAIN.id,
        account: address,
      });
      await publicClient!.waitForTransactionReceipt({ hash });
      return hash;
    },
    [address, walletChainId, writeContractAsync, switchChainAsync, publicClient],
  );

  return { sendTx, address };
}
