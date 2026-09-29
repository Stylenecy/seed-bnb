// Single source of truth for the BNB Chain definition + the read-only viem
// client. BSC Testnet (97) by default; BSC Mainnet (56) when NEXT_PUBLIC_CHAIN_ID=56.

import { createPublicClient, http } from "viem";
import { bsc, bscTestnet } from "viem/chains";
import { IS_MAINNET, RPC_URL } from "./contracts";

export const bnbChain = IS_MAINNET ? bsc : bscTestnet;

// Shared read client. `batch: true` coalesces concurrent eth_calls made in the
// same tick (e.g. the per-strike reads in StrikeLedger / ReputationPanel) into a
// single JSON-RPC batch request instead of one HTTP round-trip per call.
export const publicClient = createPublicClient({
  chain: bnbChain,
  transport: http(RPC_URL, { batch: true }),
});
