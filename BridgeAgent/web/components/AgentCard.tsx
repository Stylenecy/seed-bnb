/**
 * Agent identity hero. Asymmetric layout: meta column on the left, giant
 * agentId number anchoring the right. Below: a horizontal stat strip with
 * tabular numerals. Reads as a single deliberate composition, not a card-
 * within-a-card.
 */

import type { AgentSnapshot, AgentStats } from "@/lib/data";
import { ADDRESSES } from "@/lib/contracts";
import { activeChain, CHAIN_LABEL } from "@/lib/chain";
import { fmtBps } from "@/lib/format";
import { Address } from "./Address";

export function AgentCard({
  agent,
  stats,
}: {
  agent: AgentSnapshot;
  stats: AgentStats;
}) {
  const winRate =
    stats.totalTrades > 0
      ? ((stats.winningTrades / stats.totalTrades) * 100).toFixed(1) + "%"
      : "—";

  const netBps = Number(stats.netPnlBps);
  const netSign = netBps > 0 ? "positive" : netBps < 0 ? "negative" : "neutral";

  return (
    <section
      aria-labelledby="agent-heading"
      className="relative overflow-hidden border-y border-moss-900 bg-gradient-to-b from-moss-950 to-[#0c1612] py-14 sm:py-20"
    >
      {/* Faint vertical rule on the left, terminal-ticker style. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-8 left-6 w-px bg-gradient-to-b from-transparent via-moss-700/60 to-transparent sm:left-10"
      />

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 sm:px-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-20">
        {/* LEFT — meta column */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-moss-400">
              <span>ERC-8004</span>
              <span className="text-moss-700">/</span>
              <span>Identity Token</span>
            </div>
            <h2
              id="agent-heading"
              className="mt-3 font-serif text-3xl italic text-bone/95 sm:text-4xl"
            >
              An autonomous agent,{" "}
              <span className="not-italic font-mono text-moss-50">
                on chain
              </span>
              .
            </h2>
          </div>

          <dl className="grid grid-cols-1 gap-x-12 gap-y-6 sm:grid-cols-2">
            <Field label="Owner" mono>
              {agent.owner ? (
                <Address value={agent.owner} label="owner address" />
              ) : (
                "—"
              )}
            </Field>

            <Field label="Venue">
              <span className="text-moss-100">{agent.venue ?? "—"}</span>
            </Field>

            <Field label="Identity Registry" mono>
              <Address
                value={ADDRESSES.identityRegistry}
                label="IdentityRegistry contract"
              />
            </Field>

            <Field label="Trade Journal" mono>
              <Address
                value={ADDRESSES.tradeJournal}
                label="TradeJournal contract"
              />
            </Field>

            {agent.agentURI && (
              <Field label="Agent URI" mono className="sm:col-span-2">
                <a
                  href={agent.agentURI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-quiet truncate text-xs text-moss-200 hover:text-moss-50"
                  title={agent.agentURI}
                >
                  {agent.agentURI}
                </a>
              </Field>
            )}
          </dl>
        </div>

        {/* RIGHT — colossal #N block */}
        <div className="relative flex flex-col items-start lg:items-end">
          <div className="text-[10px] uppercase tracking-[0.28em] text-moss-400">
            Agent
          </div>
          <div className="relative mt-1">
            <span
              aria-hidden
              className="absolute -left-1 top-0 font-display text-[6rem] leading-[0.85] tracking-tighter text-moss-800/60 select-none sm:text-[8rem]"
            >
              #
            </span>
            <span className="block pl-10 font-display text-[7rem] font-medium leading-[0.85] tracking-tighter text-moss-50 tabular-nums sm:pl-14 sm:text-[10rem] lg:text-[12rem]">
              {agent.agentId.toString()}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-moss-400">
            <span>{CHAIN_LABEL}</span>
            <span className="text-moss-700">·</span>
            <span className="tabular-nums">chain {activeChain.id}</span>
          </div>
        </div>
      </div>

      {/* Stat strip — a horizontal ribbon not a 3-up grid. Better visual
          rhythm against the hero number. */}
      <div className="mx-auto mt-14 max-w-6xl border-t border-moss-900 sm:mt-20">
        <dl className="grid grid-cols-3 divide-x divide-moss-900">
          <Stat label="Trades" value={stats.totalTrades.toString()} />
          <Stat label="Win Rate" value={winRate} />
          <Stat
            label="Net PnL"
            value={fmtBps(stats.netPnlBps)}
            sign={netSign}
          />
        </dl>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
  mono = false,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[10px] uppercase tracking-[0.22em] text-moss-400">
        {label}
      </dt>
      <dd
        className={`mt-2 text-sm ${mono ? "font-mono" : ""} text-moss-100`}
      >
        {children}
      </dd>
    </div>
  );
}

function Stat({
  label,
  value,
  sign = "neutral",
}: {
  label: string;
  value: string;
  sign?: "positive" | "negative" | "neutral";
}) {
  const tone =
    sign === "positive"
      ? "text-moss-300"
      : sign === "negative"
      ? "text-rose-300"
      : "text-moss-50";

  return (
    <div className="px-6 py-8 sm:px-10 sm:py-10">
      <dt className="text-[10px] uppercase tracking-[0.28em] text-moss-400">
        {label}
      </dt>
      <dd
        className={`mt-3 font-display text-4xl font-medium tabular-nums leading-none tracking-tight sm:text-5xl ${tone}`}
      >
        {value}
      </dd>
    </div>
  );
}
