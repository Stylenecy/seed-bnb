"use client";

import { PropsWithChildren, useState } from "react";
import { createConfig, http, injected, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Chain } from "viem";

import { ACTIVE_CHAIN, RPC } from "@/lib/chain";

// Wagmi on BNB Smart Chain (BSC testnet 97 by default; NEXT_PUBLIC_CHAIN_ID=56
// for mainnet). Replaces InterwovenKit / Initia Privy connector. Injected
// wallets only (MetaMask, Binance Web3 Wallet, Trust, Rabby, OKX…).
const chain: Chain = ACTIVE_CHAIN;
const wagmiConfig = createConfig({
  connectors: [injected()],
  chains: [chain],
  transports: {
    [chain.id]: http(RPC),
  },
  ssr: true,
});

export default function Providers({ children }: PropsWithChildren) {
  // Initialize QueryClient with standard cache and retry policies
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30,
            retry: 2,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
    </QueryClientProvider>
  );
}
