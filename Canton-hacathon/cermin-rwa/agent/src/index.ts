/**
 * Guard Agent entry point: wires up config -> a Ledger implementation -> the
 * poll loop (guard.ts). Keep this file thin — all logic lives in guard.ts /
 * health.ts / ledger.ts so it can be unit tested without a running process.
 */

import { createGuardState, runGuardCycle } from "./guard.js";
import { MockLedger, type Ledger } from "./ledger.js";
import { EvmLedger } from "./evmLedger.js";

function env(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v !== undefined && v !== "") return v;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required env var: ${name}`);
}

function buildLedger(): Ledger {
  const mock = env("MOCK_LEDGER", "true").toLowerCase() === "true";
  if (mock) {
    console.log("[cermin-guard-agent] MOCK_LEDGER=true — using in-memory MockLedger (no network).");
    // No demo scenario is seeded here on purpose: MockLedger is exercised by
    // the test suite. A real run talks to the CerminRWA contract on BNB Chain.
    return new MockLedger();
  }
  const chainId = Number(env("CHAIN_ID", "97"));
  const ledger = new EvmLedger({
    rpcUrl: env("BSC_RPC_URL", "https://data-seed-prebsc-1-s1.bnbchain.org:8545"),
    chainId,
    cerminRwaAddress: env("CERMIN_RWA_ADDRESS") as `0x${string}`,
    guardAgentPrivateKey: env("GUARD_AGENT_PRIVATE_KEY") as `0x${string}`,
  });
  console.log(`[cermin-guard-agent] BNB Chain (chainId ${chainId}) — Guard Agent ${ledger.guardAgentAddress}.`);
  return ledger;
}

function main(): void {
  const ledger = buildLedger();
  const state = createGuardState();
  const pollMs = Number(env("POLL_MS", "5000"));

  console.log(`[cermin-guard-agent] Guard Agent watching every ${pollMs}ms.`);

  // On-chain txs can outlast one poll interval — never overlap cycles.
  let running = false;
  const tick = (): void => {
    if (running) return;
    running = true;
    runGuardCycle(ledger, state, console.log)
      .catch((err) => {
        console.error("[cermin-guard-agent] guard cycle failed:", err);
      })
      .finally(() => {
        running = false;
      });
  };

  tick();
  setInterval(tick, pollMs);
}

main();
