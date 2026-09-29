// HTTP client for the read-only `musashi-core serve` daemon.
//
// The web tier NO LONGER spawns the Go binary per request (see ARCHITECTURE.md
// invariant #2). It calls the daemon over HTTP. The daemon is read-only and
// holds no private key, so nothing reachable from an HTTP request can sign a
// transaction or read a secret.
//
// Run the daemon alongside the app:   musashi-core serve
// Point the app at it:                 MUSASHI_DAEMON_URL=http://127.0.0.1:8787
// Optional shared secret:              MUSASHI_DAEMON_KEY=<random>  (sent as X-Api-Key)

import { getEnv } from "./env";

const DAEMON_URL = (getEnv("MUSASHI_DAEMON_URL") || "http://127.0.0.1:8787").replace(/\/+$/, "");
const DAEMON_KEY = getEnv("MUSASHI_DAEMON_KEY");
const DAEMON_TIMEOUT_MS = 120_000;

type Param = string | number | boolean;

/** GET a daemon endpoint with query params; returns parsed JSON (or text). */
export async function daemonGet(path: string, params: Record<string, Param> = {}): Promise<unknown> {
  const url = new URL(DAEMON_URL + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const headers: Record<string, string> = {};
  if (DAEMON_KEY) headers["X-Api-Key"] = DAEMON_KEY;

  let resp: Response;
  try {
    resp = await fetch(url, { headers, signal: AbortSignal.timeout(DAEMON_TIMEOUT_MS) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `musashi-core daemon unreachable at ${DAEMON_URL} (${msg}). Start it with \`musashi-core serve\` and set MUSASHI_DAEMON_URL.`,
    );
  }

  const text = await resp.text();
  if (!resp.ok) {
    let msg = text;
    try {
      msg = (JSON.parse(text) as { error?: string }).error || text;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(msg || `daemon returned ${resp.status}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ─── Validation (defense in depth; the daemon validates too) ─────────────────

const VALID_CHAIN_IDS = new Set([0, 1, 56, 137, 42161, 8453, 16661]);

function validateAddress(token: string): string {
  const cleaned = token.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(cleaned)) {
    throw new Error("Invalid token address format");
  }
  return cleaned;
}

function validateChainId(chainId: number): number {
  const id = Math.floor(chainId);
  if (!VALID_CHAIN_IDS.has(id)) {
    throw new Error(`Invalid chain ID: ${id}`);
  }
  return id;
}

function validateLimit(limit: number, max = 50): number {
  const n = Math.floor(limit);
  if (n < 1 || n > max) {
    throw new Error(`Limit must be between 1 and ${max}`);
  }
  return n;
}

function validateQuery(query: string, maxLen = 200): string {
  const cleaned = query.trim();
  if (!cleaned || cleaned.length > maxLen) {
    throw new Error(`Query must be 1-${maxLen} characters`);
  }
  return cleaned;
}

// ─── Typed wrappers (stable signatures — API routes & adapters depend on these)

export async function runGates(token: string, chainId: number) {
  return daemonGet("/v1/gates", { token: validateAddress(token), chain: validateChainId(chainId) });
}

export async function runScan(chainId: number, limit: number, gates: boolean) {
  return daemonGet("/v1/scan", { chain: validateChainId(chainId), limit: validateLimit(limit), gates });
}

export async function runSearch(query: string, limit: number) {
  return daemonGet("/v1/search", { q: validateQuery(query), limit: validateLimit(limit, 20) });
}

export async function runDiscover(chainId: number, limit: number) {
  return daemonGet("/v1/discover", { chain: validateChainId(chainId), limit: validateLimit(limit) });
}

export async function runStatus(perAgent: boolean, agentId: number) {
  const params: Record<string, Param> = { perAgent };
  if (perAgent) {
    const safeId = Math.floor(agentId);
    if (safeId < 0 || safeId > 100000) throw new Error("Invalid agentId");
    params.agentId = safeId;
  }
  return daemonGet("/v1/status", params);
}

export async function runAgentInfo(tokenId: number) {
  const safeId = Math.floor(tokenId);
  if (safeId < 0 || safeId > 100000) throw new Error("Invalid tokenId");
  return daemonGet("/v1/agent-info", { tokenId: safeId });
}
