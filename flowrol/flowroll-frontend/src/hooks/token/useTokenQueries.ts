import { useQuery } from "@tanstack/react-query";
import { erc20Abi } from "viem";
import { useContractClient } from "@/hooks/useContractClient";

export function useAllowance(
  tokenAddress: `0x${string}`,
  spender: `0x${string}` | undefined
) {
  const { address, publicClient } = useContractClient();

  return useQuery({
    queryKey: ["allowance", tokenAddress, address, spender],
    queryFn: async () =>
      publicClient!.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address!, spender!],
      }),
    enabled: !!address && !!tokenAddress && !!spender,
  });
}

export function useTokenBalance(tokenAddress: `0x${string}`) {
  const { address, publicClient } = useContractClient();

  return useQuery({
    queryKey: ["token-balance", tokenAddress, address],
    queryFn: async () =>
      publicClient!.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address!],
      }),
    enabled: !!address && !!tokenAddress,
  });
}

export function useTokenDecimals(tokenAddress: `0x${string}`) {
  const { publicClient } = useContractClient();

  return useQuery({
    queryKey: ["token-decimals", tokenAddress],
    queryFn: async () =>
      publicClient!.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "decimals",
      }),
    enabled: !!tokenAddress,
  });
}

export function useNativeTokenBalance() {
  const { address, publicClient } = useContractClient();

  return useQuery({
    queryKey: ["native-balance", address],
    queryFn: async () => 
      publicClient!.getBalance({ 
        address: address! 
      }),
    enabled: !!address && !!publicClient,
  });
}