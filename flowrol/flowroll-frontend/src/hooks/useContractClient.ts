import {
  useAccount,
  usePublicClient,
  useWriteContract,
  useChainId,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { getContractsForChain } from "@/lib/contracts/addresses";
import { ACTIVE_CHAIN, CHAIN_LABEL, IS_TESTNET } from "@/lib/chain";

export function useContractClient() {
  const { address } = useAccount();
  const walletChainId = useChainId();
  // Always read/write against the configured BSC network; wallet is prompted
  // to switch (see NetworkSwitcher) when it is on another chain.
  const chainId = ACTIVE_CHAIN.id;

  const publicClient = usePublicClient({ chainId });
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const contracts = getContractsForChain(chainId.toString());

  return {
    address,
    isTestnet: IS_TESTNET,
    chainId,
    walletChainId,
    isWrongNetwork: !!address && walletChainId !== chainId,
    chainName: CHAIN_LABEL,
    publicClient,
    writeContractAsync,
    queryClient,
    contracts,
  };
}
