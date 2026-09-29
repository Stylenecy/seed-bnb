// Shared agent tool registry for the dashboard chat runtimes.
//
// Both the Gemini adapter and the Hermes/Claude (OpenAI-compatible) adapter
// expose THIS same constrained set of tools. Every handler calls the read-only
// musashi-core daemon over HTTP (via lib/musashi-cli) — never a shell — so the
// agent surface is byte-identical across runtimes and safe to expose publicly.

import {
  runGates,
  runScan,
  runSearch,
  runDiscover,
  runStatus,
  runAgentInfo,
  daemonGet,
} from "./musashi-cli";

// ─── arg coercion helpers (models send loosely-typed JSON) ───────────────────

export function num(args: Record<string, unknown>, key: string, fallback: number): number {
  const v = args[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return fallback;
}

export function str(args: Record<string, unknown>, key: string): string {
  const v = args[key];
  return typeof v === "string" ? v : "";
}

export function bool(args: Record<string, unknown>, key: string): boolean {
  const v = args[key];
  return v === true || v === "true";
}

// ─── tool definitions ────────────────────────────────────────────────────────

export type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

export interface ToolDef {
  name: string;
  description: string;
  /** JSON Schema object — valid for both Gemini functionDeclarations and OpenAI tools. */
  parameters: Record<string, unknown>;
  handler: ToolHandler;
}

export const AGENT_TOOLS: ToolDef[] = [
  {
    name: "musashi_search",
    description:
      "Resolve a token name or ticker (e.g. 'PEPE', 'YUP') to its address + chain. Always call this FIRST when the user gives a symbol instead of an 0x address.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Ticker or name to search" },
        limit: { type: "number", description: "Max matches (1-20, default 5)" },
      },
      required: ["query"],
    },
    handler: async (args) => runSearch(str(args, "query"), num(args, "limit", 5)),
  },
  {
    name: "musashi_gates",
    description:
      "Run the 7-gate elimination pipeline on a token. Gate 1 fail = honeypot/safety issue (instant FAIL). Gate 6 is advisory only.",
    parameters: {
      type: "object",
      properties: {
        token: { type: "string", description: "0x... contract address" },
        chain_id: {
          type: "number",
          description: "Chain ID: 56=BSC (default), 1=ETH, 137=Polygon, 42161=Arbitrum, 8453=Base, 16661=0G",
        },
      },
      required: ["token", "chain_id"],
    },
    handler: async (args) => runGates(str(args, "token"), num(args, "chain_id", 1)),
  },
  {
    name: "musashi_scan",
    description: "Discover, score, and rank new tokens on a chain. Use chain_id=0 for all chains.",
    parameters: {
      type: "object",
      properties: {
        chain_id: { type: "number" },
        limit: { type: "number", description: "Max candidates (1-50, default 10)" },
        run_gates: { type: "boolean", description: "Also run gate pipeline on top results" },
      },
      required: ["chain_id"],
    },
    handler: async (args) =>
      runScan(num(args, "chain_id", 0), num(args, "limit", 10), bool(args, "run_gates")),
  },
  {
    name: "musashi_discover",
    description: "Raw new-pool discovery on a chain. Less filtering than scan.",
    parameters: {
      type: "object",
      properties: {
        chain_id: { type: "number" },
        limit: { type: "number", description: "Max candidates (1-50, default 20)" },
      },
      required: ["chain_id"],
    },
    handler: async (args) => runDiscover(num(args, "chain_id", 0), num(args, "limit", 20)),
  },
  {
    name: "musashi_hunt",
    description:
      "End-to-end strike funnel: gather + score + deep gates on top survivors. Rate-limit safe.",
    parameters: {
      type: "object",
      properties: {
        chain_id: { type: "number" },
        top: { type: "number", description: "How many survivors to deep-gate (1-10, default 3)" },
      },
      required: ["chain_id"],
    },
    handler: async (args) => {
      const chain = Math.floor(num(args, "chain_id", 8453));
      const top = Math.min(10, Math.max(1, Math.floor(num(args, "top", 3))));
      return daemonGet("/v1/hunt", { chain, top });
    },
  },
  {
    name: "musashi_status",
    description: "MUSASHI agent reputation summary (total strikes, win rate, return).",
    parameters: {
      type: "object",
      properties: {
        per_agent: { type: "boolean" },
        agent_id: { type: "number", description: "Agent token id (default 0 = MUSASHI)" },
      },
    },
    handler: async (args) => runStatus(bool(args, "per_agent"), num(args, "agent_id", 0)),
  },
  {
    name: "musashi_history",
    description: "Past strike outcomes for an agent (feeds self-calibration).",
    parameters: {
      type: "object",
      properties: {
        agent_id: { type: "number" },
        limit: { type: "number" },
      },
    },
    handler: async (args) => {
      const agent = Math.floor(num(args, "agent_id", 0));
      const limit = Math.min(50, Math.max(1, Math.floor(num(args, "limit", 12))));
      return daemonGet("/v1/history", { agentId: agent, limit });
    },
  },
  {
    name: "musashi_agent_info",
    description: "INFT state for an agent token: owner, version, storage root, oracle.",
    parameters: {
      type: "object",
      properties: { token_id: { type: "number" } },
    },
    handler: async (args) => runAgentInfo(num(args, "token_id", 0)),
  },
  {
    name: "musashi_journal_check",
    description:
      "Cache check: was this token analyzed recently? Returns previous verdict if hit, or 'miss'.",
    parameters: {
      type: "object",
      properties: {
        token: { type: "string" },
        chain_id: { type: "number" },
        age: { type: "string", description: "fresh|early|established (default early = 6h window)" },
      },
      required: ["token", "chain_id"],
    },
    handler: async (args) => {
      const token = str(args, "token");
      const chain = num(args, "chain_id", 1);
      const age = str(args, "age") || "early";
      return daemonGet("/v1/journal/check", { token, chain, age });
    },
  },
];

export const TOOL_BY_NAME = new Map(AGENT_TOOLS.map((t) => [t.name, t]));

// ─── shared SSE emit interface (runtime → chat route) ────────────────────────

export interface SSEEmit {
  text(content: string): void;
  tool(name: string, input: unknown): void;
  toolResult(name: string, output: unknown, error?: string): void;
  /** turnHistory shape is runtime-specific (Gemini contents vs OpenAI messages). */
  done(meta: { result: string; turnHistory: unknown }): void;
  error(message: string): void;
}
