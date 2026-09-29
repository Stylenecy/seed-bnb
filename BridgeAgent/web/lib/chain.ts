import type { Chain } from "viem";
import { bsc, bscTestnet } from "viem/chains";

// BNB Smart Chain. Defaults to BSC Testnet (97); set NEXT_PUBLIC_CHAIN_ID=56 for mainnet.
const base: Chain = process.env.NEXT_PUBLIC_CHAIN_ID === "56" ? bsc : bscTestnet;

export const activeChain: Chain = {
  ...base,
  rpcUrls: {
    ...base.rpcUrls,
    default: {
      http: [process.env.NEXT_PUBLIC_BSC_RPC_URL ?? base.rpcUrls.default.http[0]],
    },
  },
};

export const CHAIN_LABEL = activeChain.id === 56 ? "BSC Mainnet" : "BSC Testnet";
