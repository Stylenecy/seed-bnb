// BNB Smart Chain definition for viem / wagmi (migrated from BNB Chain).
//
// Default target is BSC testnet (chainId 97). Set NEXT_PUBLIC_CHAIN_ID=56 for
// BSC mainnet. RPC defaults to the public BNB Chain dataseed endpoints;
// override with NEXT_PUBLIC_BSC_RPC_URL (e.g. a NodeReal / Ankr / QuickNode
// endpoint — public dataseeds rate-limit eth_getLogs heavily).

import { bsc, bscTestnet } from "viem/chains";

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID?.trim() || "97");
const BASE = CHAIN_ID === 56 ? bsc : bscTestnet;

const RPC_URL =
  process.env.NEXT_PUBLIC_BSC_RPC_URL?.trim() ||
  (CHAIN_ID === 56
    ? "https://bsc-dataseed.bnbchain.org"
    : "https://bsc-testnet-rpc.publicnode.com"); // bnbchain.org testnet dataseed rejects eth_getLogs

export const bnbChain = {
  ...BASE,
  rpcUrls: {
    ...BASE.rpcUrls,
    default: { http: [RPC_URL] },
  },
} as typeof BASE;

/** Human label for UI copy ("BSC Testnet" / "BNB Smart Chain"). */
export const CHAIN_LABEL = CHAIN_ID === 56 ? "BNB Smart Chain" : "BSC Testnet";

// Block the contracts were deployed at on BSC. Used as `fromBlock` when
// scanning logs — keep it tight so the FE doesn't walk the entire chain.
// TODO(bnb): set NEXT_PUBLIC_DEPLOY_BLOCK to the block of the BSC deploy
// (see contracts/deployments/<chainId>.json `deployBlock`).
export const DEPLOY_BLOCK = BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK?.trim() || "0");

// Max block span per eth_getLogs call. BSC RPCs cap log ranges (commonly
// 1k–50k blocks), so readers page through history in chunks of this size.
export const LOGS_CHUNK = BigInt(process.env.NEXT_PUBLIC_LOGS_CHUNK?.trim() || "5000");

/** Convenience: build a BscScan URL for a tx hash or address. */
export function explorerUrl(kind: "tx" | "address" | "token", value: string): string {
  return `${bnbChain.blockExplorers.default.url}/${kind}/${value}`;
}
