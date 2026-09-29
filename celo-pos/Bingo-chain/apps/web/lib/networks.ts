import type { Address } from "viem";

/// Multichain config: BINGOChain is live on Celo mainnet (the default) and now
/// also deployable on BNB Chain (BSC testnet 97 / mainnet 56). The active network
/// is picked at build time with NEXT_PUBLIC_CHAIN_ID (default 42220 = Celo), so
/// every existing Celo deployment keeps working unchanged.

export type TokenInfo = { address: Address; decimals: number; symbol: string };
export type GasToken = { label: string; erc20: Address | undefined; feeCurrency: Address | undefined; decimals: number; fund: string };

export type Network = {
  id: 42220 | 56 | 97;
  name: string;
  rpc: string;
  explorer: string;
  nativeSymbol: string;
  bingo: Address;
  lance: Address;
  /// ERC-4626 pool asset behind $LANCE (CELO ERC20 on Celo, WBNB on BSC).
  lanceAsset: Address;
  lanceAssetSymbol: string;
  tokens: Record<string, TokenInfo>;
  minStake: Record<string, string>;
  gasTokens: Record<string, GasToken>;
};

const ZERO = "0x0000000000000000000000000000000000000000" as Address;
const env = (v: string | undefined) => (v && v.startsWith("0x") ? (v as Address) : ZERO);

const CELO_MAINNET: Network = {
  id: 42220,
  name: "Celo",
  rpc: process.env.NEXT_PUBLIC_CELO_MAINNET_RPC || "https://forno.celo.org",
  explorer: "https://celoscan.io",
  nativeSymbol: "CELO",
  bingo: "0x8bE7c07CCF9FF515d82D4c36aB4EB937941432f1",
  lance: "0xb70c9Cd73428Afe51eEEA832C49E8840D3f85cA2",
  lanceAsset: "0x471EcE3750Da237f93B8E339c536989b8978a438",
  lanceAssetSymbol: "CELO",
  tokens: {
    LANCE: { address: "0xb70c9Cd73428Afe51eEEA832C49E8840D3f85cA2", decimals: 18, symbol: "LANCE" },
    CELO: { address: "0x471EcE3750Da237f93B8E339c536989b8978a438", decimals: 18, symbol: "CELO" },
    cUSD: { address: "0x765DE816845861e75A25fCA122bb6898B8B1282a", decimals: 18, symbol: "cUSD" },
    USDC: { address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", decimals: 6, symbol: "USDC" },
    USDT: { address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", decimals: 6, symbol: "USDT" },
  },
  minStake: { LANCE: "10", CELO: "1", cUSD: "0.5", USDC: "0.5", USDT: "0.5" },
  // Celo fee abstraction (CIP-64): CELO native; cUSD direct fee currency; USDT via its fee adapter.
  gasTokens: {
    CELO: { label: "CELO", erc20: undefined, feeCurrency: undefined, decimals: 18, fund: "0.2" },
    cUSD: { label: "cUSD", erc20: "0x765DE816845861e75A25fCA122bb6898B8B1282a", feeCurrency: "0x765DE816845861e75A25fCA122bb6898B8B1282a", decimals: 18, fund: "0.4" },
    USDT: { label: "USDT", erc20: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", feeCurrency: "0x0E2A3e05bc9A16F5292A6170456A710cb89C6f72", decimals: 6, fund: "0.4" },
  },
};

// BSC has no fee abstraction: session keys are funded in native BNB only.
// NOTE: stablecoins on BSC use 18 decimals (not 6).
const BSC_MAINNET: Network = {
  id: 56,
  name: "BNB Smart Chain",
  rpc: process.env.NEXT_PUBLIC_BSC_MAINNET_RPC || "https://bsc-dataseed.bnbchain.org",
  explorer: "https://bscscan.com",
  nativeSymbol: "BNB",
  bingo: env(process.env.NEXT_PUBLIC_BSC_BINGO_ADDRESS), // TODO: set after BSC mainnet deploy
  lance: env(process.env.NEXT_PUBLIC_BSC_LANCE_ADDRESS), // TODO: set after LanceHub BSC deploy
  lanceAsset: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
  lanceAssetSymbol: "WBNB",
  tokens: {
    LANCE: { address: env(process.env.NEXT_PUBLIC_BSC_LANCE_ADDRESS), decimals: 18, symbol: "LANCE" },
    WBNB: { address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", decimals: 18, symbol: "WBNB" },
    USDT: { address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18, symbol: "USDT" },
    USDC: { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18, symbol: "USDC" },
  },
  minStake: { LANCE: "10", WBNB: "0.001", USDT: "0.5", USDC: "0.5" },
  gasTokens: { BNB: { label: "BNB", erc20: undefined, feeCurrency: undefined, decimals: 18, fund: "0.002" } },
};

const BSC_TESTNET: Network = {
  id: 97,
  name: "BNB Smart Chain Testnet",
  rpc: process.env.NEXT_PUBLIC_BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
  explorer: "https://testnet.bscscan.com",
  nativeSymbol: "tBNB",
  bingo: env(process.env.NEXT_PUBLIC_BSC_TESTNET_BINGO_ADDRESS), // TODO: set after BSC testnet deploy
  lance: env(process.env.NEXT_PUBLIC_BSC_TESTNET_LANCE_ADDRESS),
  lanceAsset: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd", // WBNB (testnet)
  lanceAssetSymbol: "WBNB",
  tokens: {
    LANCE: { address: env(process.env.NEXT_PUBLIC_BSC_TESTNET_LANCE_ADDRESS), decimals: 18, symbol: "LANCE" },
    WBNB: { address: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd", decimals: 18, symbol: "WBNB" },
    // MockERC20 (18 dec) deployed by the operator on testnet
    USDT: { address: env(process.env.NEXT_PUBLIC_BSC_TESTNET_USDT_ADDRESS), decimals: 18, symbol: "USDT" },
  },
  minStake: { LANCE: "10", WBNB: "0.001", USDT: "0.5" },
  gasTokens: { BNB: { label: "tBNB", erc20: undefined, feeCurrency: undefined, decimals: 18, fund: "0.002" } },
};

export const NETWORKS: Record<number, Network> = { 42220: CELO_MAINNET, 56: BSC_MAINNET, 97: BSC_TESTNET };

export const ACTIVE_NETWORK: Network = NETWORKS[Number(process.env.NEXT_PUBLIC_CHAIN_ID || 42220)] ?? CELO_MAINNET;

/// Tokens with a configured address on the active network (unset BSC env vars are hidden).
export const activeTokens = (): Record<string, TokenInfo> =>
  Object.fromEntries(Object.entries(ACTIVE_NETWORK.tokens).filter(([, t]) => t.address !== ZERO));
