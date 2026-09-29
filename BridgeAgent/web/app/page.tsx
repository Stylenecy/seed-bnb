/**
 * BridgeAgent status page. Server-rendered at request time (revalidate=30s)
 * so reads come straight from BNB Smart Chain via viem. The page is the
 * proof-of-work for the trading agent: identity (ERC-8004), live trade
 * ledger (TradeJournal), and a verification panel for skeptical viewers.
 */

import { AgentCard } from "@/components/AgentCard";
import { LiveBadge } from "@/components/LiveBadge";
import { TradesTable } from "@/components/TradesTable";
import { VerifyPanel } from "@/components/VerifyPanel";
import { Wordmark } from "@/components/Wordmark";
import { DEFAULT_AGENT_ID } from "@/lib/contracts";
import { activeChain, CHAIN_LABEL } from "@/lib/chain";
import { fetchAgent, fetchTrades, summarize } from "@/lib/data";

export const revalidate = 30; // re-fetch live chain data at most every 30s

type SearchParams = Promise<{ agent?: string }>;

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const agentId =
    params.agent && /^\d+$/.test(params.agent)
      ? BigInt(params.agent)
      : DEFAULT_AGENT_ID;

  const readAtMs = Date.now();

  const [agent, trades] = await Promise.all([
    fetchAgent(agentId),
    fetchTrades(agentId),
  ]);
  const stats = summarize(trades);

  return (
    <div className="relative z-10">
      {/* HEADER — wordmark + live indicator */}
      <header className="border-b border-moss-900 bg-moss-950/80 backdrop-blur supports-[backdrop-filter]:bg-moss-950/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5 sm:px-10">
          <Wordmark />
          <LiveBadge readAtMs={readAtMs} />
        </div>
      </header>

      {/* HERO TITLE — single editorial line above the agent showcase */}
      <section className="mx-auto max-w-6xl px-6 pb-2 pt-14 sm:px-10 sm:pt-20">
        <p className="text-[10px] uppercase tracking-[0.32em] text-moss-400">
          Status · {CHAIN_LABEL}
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-medium leading-[1.05] tracking-tight text-moss-50 sm:text-5xl lg:text-6xl">
          Autonomous perps,{" "}
          <span className="font-serif italic text-bone/95">
            anchored
          </span>{" "}
          on BNB Chain.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-moss-300">
          BridgeAgent is a non-custodial CLI trading agent. Every settled
          trade is mirrored to the on-chain{" "}
          <span className="font-mono text-moss-100">TradeJournal</span>; the
          identity below is an{" "}
          <span className="font-mono text-moss-100">ERC-8004</span> NFT this
          agent owns. No dashboard. No custody. No trust required.
        </p>
      </section>

      {/* AGENT IDENTITY — full-bleed asymmetric hero card */}
      <div className="mt-12 sm:mt-16">
        <AgentCard agent={agent} stats={stats} />
      </div>

      {/* TRADES — append-only ledger */}
      <section
        aria-label="Trades"
        className="mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-24"
      >
        <div className="mb-8 flex items-baseline justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-moss-400">
              Append-only ledger
            </p>
            <h2 className="mt-2 font-display text-2xl font-medium tracking-tight text-moss-50 sm:text-3xl">
              Trades
              <span className="ml-3 align-baseline font-mono text-base text-moss-400 tabular-nums">
                ({stats.totalTrades})
              </span>
            </h2>
          </div>
          <p className="hidden max-w-xs text-right text-xs leading-relaxed text-moss-400 sm:block">
            Mirrored from the agent's local close-path to the{" "}
            <span className="font-mono text-moss-200">TradeJournal</span>{" "}
            contract every 60s. Click any row for detail.
          </p>
        </div>
        <TradesTable trades={trades} />
      </section>

      {/* VERIFY — collapsed disclosure with cast snippet */}
      <VerifyPanel agentId={agentId} />

      {/* FOOTER */}
      <footer className="border-t border-moss-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-xs text-moss-400 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <span>
            BridgeAgent · verifiable agentic trading on BNB Chain
          </span>
          <span className="font-mono text-moss-500">chain {activeChain.id}</span>
        </div>
      </footer>
    </div>
  );
}
