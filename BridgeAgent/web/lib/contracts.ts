import { createPublicClient, http } from "viem";
import { activeChain } from "./chain";
import { identityRegistryAbi, tradeJournalAbi } from "./abis";

export const ADDRESSES = {
  identityRegistry: (process.env.NEXT_PUBLIC_BSC_IDENTITY_REGISTRY ??
    // TODO: set after deploying to BSC (no BSC deployment yet)
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  tradeJournal: (process.env.NEXT_PUBLIC_BSC_TRADE_JOURNAL ??
    // TODO: set after deploying to BSC (no BSC deployment yet)
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
} as const;

export const DEFAULT_AGENT_ID = BigInt(
  process.env.NEXT_PUBLIC_BSC_AGENT_ID ?? "1",
);

export const publicClient = createPublicClient({
  chain: activeChain,
  transport: http(),
});

export { identityRegistryAbi, tradeJournalAbi };
