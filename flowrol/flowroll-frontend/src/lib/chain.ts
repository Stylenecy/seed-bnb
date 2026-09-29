// BNB Smart Chain configuration (migrated from Initia MiniEVM / InterwovenKit).
//
// Default: BSC testnet (chainId 97). Set NEXT_PUBLIC_CHAIN_ID=56 for BSC
// mainnet. RPC can be overridden with NEXT_PUBLIC_BSC_RPC_URL.

import { bsc, bscTestnet } from "viem/chains";

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID?.trim() || "97");
const BASE = CHAIN_ID === 56 ? bsc : bscTestnet;

const RPC_URL =
  process.env.NEXT_PUBLIC_BSC_RPC_URL?.trim() ||
  (CHAIN_ID === 56
    ? "https://bsc-dataseed.bnbchain.org"
    : "https://data-seed-prebsc-1-s1.bnbchain.org:8545");

export const ACTIVE_CHAIN = {
  ...BASE,
  rpcUrls: { ...BASE.rpcUrls, default: { http: [RPC_URL] } },
} as typeof BASE;

export const IS_TESTNET = ACTIVE_CHAIN.id === bscTestnet.id;
export const CHAIN_LABEL = IS_TESTNET ? "BSC Testnet" : "BNB Smart Chain";
export const NATIVE_SYMBOL = IS_TESTNET ? "tBNB" : "BNB";
export const RPC = RPC_URL;

/** Stablecoins on BSC (and our MockUSDC on testnet) use 18 decimals, not 6. */
export const USDC_DECIMALS = 18;

export const FAUCET_URL = "https://www.bnbchain.org/en/testnet-faucet";

const EXPLORER = ACTIVE_CHAIN.blockExplorers.default.url;
export const explorerTx = (hash: string) => `${EXPLORER}/tx/${hash}`;
export const explorerAddress = (addr: string) => `${EXPLORER}/address/${addr}`;

// BSC RPCs cap the eth_getLogs block range, so history scans are paged.
export const LOGS_CHUNK = BigInt(process.env.NEXT_PUBLIC_LOGS_CHUNK?.trim() || "5000");

export async function getLogsChunked<R>(
  client: { getBlockNumber: () => Promise<bigint> },
  fromBlock: bigint,
  fetch: (range: { fromBlock: bigint; toBlock: bigint }) => Promise<R[]>,
): Promise<R[]> {
  const latest = await client.getBlockNumber();
  const out: R[] = [];
  for (let from = fromBlock; from <= latest; from += LOGS_CHUNK) {
    const to = from + LOGS_CHUNK - 1n < latest ? from + LOGS_CHUNK - 1n : latest;
    out.push(...(await fetch({ fromBlock: from, toBlock: to })));
  }
  return out;
}
