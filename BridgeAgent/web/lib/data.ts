import {
  ADDRESSES,
  DEFAULT_AGENT_ID,
  identityRegistryAbi,
  publicClient,
  tradeJournalAbi,
} from "./contracts";

export type AgentSnapshot = {
  agentId: bigint;
  owner: `0x${string}` | null;
  agentURI: string | null;
  venue: string | null;
};

export type TradeRecord = {
  agentId: bigint;
  tradeHash: `0x${string}`;
  pnlBps: bigint;
  closedAt: bigint;
};

export type AgentStats = {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  netPnlBps: bigint;
};

/**
 * Off-chain trade detail, reconstructed from the agent's URI.
 *
 * The on-chain TradeJournal record only stores agentId + tradeHash + pnlBps
 * + closedAt to keep storage cheap. The full detail (coin, side, prices,
 * timestamps) lives off-chain at the agent's URI, indexed by tradeHash.
 *
 * For the prototype we don't actually fetch yet — the agentURI is a
 * placeholder smoke-test JSON. We return null so the UI shows a graceful
 * "off-chain detail unavailable" message instead of blocking.
 */
export type TradeDetail = {
  coin: string;
  side: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  size: number;
  openedAt: bigint;
  closedAt: bigint;
};

export async function fetchAgent(agentId: bigint = DEFAULT_AGENT_ID): Promise<AgentSnapshot> {
  // Reads can fail if the agentId is unminted. Catch each independently
  // so the caller still gets a partial snapshot worth rendering.
  const safeRead = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      return await fn();
    } catch {
      return null;
    }
  };

  const owner = await safeRead(() =>
    publicClient.readContract({
      address: ADDRESSES.identityRegistry,
      abi: identityRegistryAbi,
      functionName: "ownerOf",
      args: [agentId],
    }),
  );

  const agentURI = await safeRead(() =>
    publicClient.readContract({
      address: ADDRESSES.identityRegistry,
      abi: identityRegistryAbi,
      functionName: "tokenURI",
      args: [agentId],
    }),
  );

  const venueBytes = await safeRead(() =>
    publicClient.readContract({
      address: ADDRESSES.identityRegistry,
      abi: identityRegistryAbi,
      functionName: "getMetadata",
      args: [agentId, "venue"],
    }),
  );

  const rawVenue = venueBytes
    ? new TextDecoder().decode(hexToBytes(venueBytes as `0x${string}`))
    : null;

  return {
    agentId,
    owner: (owner as `0x${string}` | null) ?? null,
    agentURI: (agentURI as string | null) ?? null,
    venue: prettifyVenue(rawVenue),
  };
}

/**
 * Display override: the on-chain metadata for agent #3 was minted during a
 * smoke test as raw "hyperliquid" (the underlying matching engine). Byreal
 * Perps is the user-facing venue brand, and that's what we show. Other
 * venue strings pass through unchanged.
 */
function prettifyVenue(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.trim().toLowerCase() === "hyperliquid") return "Byreal Perps";
  return raw;
}

function hexToBytes(hex: `0x${string}`): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    out[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return out;
}

export async function fetchTrades(
  agentId: bigint = DEFAULT_AGENT_ID,
  limit: bigint = 50n,
): Promise<TradeRecord[]> {
  try {
    const raw = await publicClient.readContract({
      address: ADDRESSES.tradeJournal,
      abi: tradeJournalAbi,
      functionName: "tradesByAgent",
      args: [agentId, 0n, limit],
    });
    // Each row is a struct decoded as an object by viem.
    return (raw as readonly {
      agentId: bigint;
      tradeHash: `0x${string}`;
      pnlBps: bigint;
      closedAt: bigint;
    }[]).map((r) => ({
      agentId: r.agentId,
      tradeHash: r.tradeHash,
      pnlBps: r.pnlBps,
      closedAt: r.closedAt,
    }));
  } catch {
    return [];
  }
}

export function summarize(trades: TradeRecord[]): AgentStats {
  let win = 0;
  let loss = 0;
  let net = 0n;
  for (const t of trades) {
    if (t.pnlBps > 0n) win++;
    else if (t.pnlBps < 0n) loss++;
    net += t.pnlBps;
  }
  return {
    totalTrades: trades.length,
    winningTrades: win,
    losingTrades: loss,
    netPnlBps: net,
  };
}

/**
 * Best-effort fetch of off-chain trade detail. Returns null on any failure
 * (network, parse, missing entry). The UI renders a fallback message in
 * that case — never blocks the page.
 *
 * Currently the agent's URI in the prototype points at a placeholder, so
 * we always return null and the UI shows the graceful fallback. The shape
 * of this function and the TradeDetail type matches what real implementations
 * will return, so swapping in a working off-chain store is mechanical.
 */
export async function fetchTradeDetail(
  _agentURI: string | null,
  _tradeHash: `0x${string}`,
): Promise<TradeDetail | null> {
  return null;
}
