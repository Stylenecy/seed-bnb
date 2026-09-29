import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { celo, bsc, bscTestnet } from "viem/chains";
import { NETWORKS } from "./networks";

/// MiniPay injects an EIP-1193 provider; the injected connector picks it up.
/// Falls back to any injected wallet (MetaMask, etc.) in a normal browser.
/// We use viem's `celo` chain (not a bare defineChain) because it ships the
/// CIP-64 formatters/serializers, so a `feeCurrency` set on a transaction is
/// actually forwarded to the wallet — required for MiniPay to pay gas in cUSD.
/// Multichain: Celo mainnet (default) + BNB Chain (bsc, bscTestnet). Every read/write
/// passes chainId: CHAIN_ID (lib/bingo.ts, from NEXT_PUBLIC_CHAIN_ID).
export const wagmiConfig = createConfig({
  chains: [celo, bsc, bscTestnet],
  connectors: [injected()],
  transports: {
    [celo.id]: http(NETWORKS[42220].rpc),
    [bsc.id]: http(NETWORKS[56].rpc),
    [bscTestnet.id]: http(NETWORKS[97].rpc),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
