import { defineChain } from "viem";
import { bingoAbi } from "./abi";
import { ACTIVE_NETWORK, activeTokens } from "./networks";

export { bingoAbi };

export const celo = defineChain({
  id: 42_220,
  name: "Celo",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: { default: { http: ["https://forno.celo.org"] } },
  blockExplorers: { default: { name: "Celoscan", url: "https://celoscan.io" } },
  // Canonical Multicall3 (deployed at the same address on every chain incl. Celo).
  // Lets the lobby batch many getArena() reads into one RPC call so it scales to
  // hundreds of concurrent arenas without N round-trips.
  contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } },
});

/// Multichain: Celo mainnet (default, live proxy 0x8bE7…32f1, see
/// contracts/deployments/celo-mainnet.json) or BNB Chain (BSC 97/56), selected
/// at build time via NEXT_PUBLIC_CHAIN_ID. See lib/networks.ts.
export const CHAIN_ID = ACTIVE_NETWORK.id;
export const BINGO_ADDRESS = ACTIVE_NETWORK.bingo;
export const EXPLORER_URL = ACTIVE_NETWORK.explorer;
export const NATIVE_SYMBOL = ACTIVE_NETWORK.nativeSymbol;

/// Whitelisted settlement tokens on the active network (owner-enabled via allowToken).
export const TOKENS = activeTokens();

/// On-chain minimum stake per token (matches the core's minStakeOf). The create
/// form seeds the stake field with this when the token changes.
export const MIN_STAKE: Record<string, string> = ACTIVE_NETWORK.minStake;

/// Board geometry constants mirrored from the contract.
export const BOARD_SIZE = 25;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
