"use client";

/**
 * Append-only trade ledger. Each row is clickable and expands to reveal
 * off-chain trade detail (coin, side, entry/exit prices, duration). The
 * detail fetch is best-effort — when it returns null the row shows a
 * graceful "off-chain detail unavailable" line so the page never blocks.
 *
 * Client component because of the row-expand interaction. Trade data is
 * passed in as a prop from the server-rendered parent.
 */

import { useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { activeChain } from "@/lib/chain";
import { fmtBps, fmtHash, fmtTimestamp, fmtRelative } from "@/lib/format";
import type { TradeRecord } from "@/lib/data";
import { CopyButton } from "./CopyButton";

const explorer = activeChain.blockExplorers!.default.url;

export function TradesTable({ trades }: { trades: TradeRecord[] }) {
  if (trades.length === 0) {
    return (
      <div className="border border-dashed border-moss-800 bg-moss-950 p-16 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-moss-400">
          No trades on chain yet
        </p>
        <p className="mt-3 text-sm text-moss-300">
          Settled trades will appear here as they're mirrored to TradeJournal.
        </p>
      </div>
    );
  }

  return (
    <div className="-mx-6 sm:mx-0">
      <header className="hidden grid-cols-[1fr_1.4fr_auto_auto] items-baseline gap-6 border-b border-moss-900 px-6 pb-4 text-[10px] uppercase tracking-[0.22em] text-moss-400 sm:grid sm:px-0">
        <span>Closed At</span>
        <span>Trade Hash</span>
        <span className="text-right">PnL</span>
        <span className="w-4" aria-hidden />
      </header>

      <ol className="divide-y divide-moss-900/80">
        {trades.map((t, idx) => (
          <TradeRow key={`${t.tradeHash}-${idx}`} trade={t} index={idx} />
        ))}
      </ol>
    </div>
  );
}

function TradeRow({ trade, index }: { trade: TradeRecord; index: number }) {
  const [open, setOpen] = useState(false);

  const sign = trade.pnlBps > 0n ? "+" : trade.pnlBps < 0n ? "" : "";
  const tone =
    trade.pnlBps > 0n
      ? "text-moss-300"
      : trade.pnlBps < 0n
      ? "text-rose-300"
      : "text-moss-200";

  return (
    <li
      className="group animate-ticker-rise"
      style={{ animationDelay: `${Math.min(index * 30, 240)}ms` }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="grid w-full grid-cols-[auto_1fr_auto] items-baseline gap-3 px-6 py-5 text-left transition-colors hover:bg-moss-900/40 sm:grid-cols-[1fr_1.4fr_auto_auto] sm:gap-6 sm:px-0 sm:py-6"
      >
        {/* mobile-only PnL pill at top-left for at-a-glance scanning */}
        <span
          className={`font-display text-2xl font-medium tabular-nums tracking-tight sm:hidden ${tone}`}
        >
          {sign}
          {fmtBps(trade.pnlBps).replace(/^[+-]/, "")}
        </span>

        <div className="flex flex-col gap-0.5 sm:contents">
          <span className="font-mono text-sm text-moss-100 tabular-nums">
            {fmtTimestamp(trade.closedAt)}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-moss-400 sm:hidden">
            {fmtRelative(trade.closedAt)}
          </span>
        </div>

        <span className="hidden items-center gap-2 sm:flex">
          <span className="font-mono text-sm text-moss-100" title={trade.tradeHash}>
            {fmtHash(trade.tradeHash)}
          </span>
          <CopyButton value={trade.tradeHash} label="trade hash" />
        </span>

        <span
          className={`hidden font-display text-2xl font-medium tabular-nums tracking-tight sm:inline ${tone}`}
        >
          {sign}
          {fmtBps(trade.pnlBps).replace(/^[+-]/, "")}
        </span>

        <ChevronDown
          className={`h-4 w-4 text-moss-500 transition-transform duration-200 ${
            open ? "rotate-180 text-moss-200" : ""
          }`}
          strokeWidth={2}
        />
      </button>

      {/* Expand panel: CSS-only smooth height transition via grid-rows trick. */}
      <div className="expand-enter" data-open={open}>
        <div>
          <ExpandedDetail trade={trade} />
        </div>
      </div>
    </li>
  );
}

function ExpandedDetail({ trade }: { trade: TradeRecord }) {
  return (
    <div className="border-l-2 border-moss-700 bg-moss-950/60 px-6 pb-6 pt-2 sm:ml-0 sm:px-0 sm:pb-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_1fr] sm:gap-12">
        {/* Off-chain detail block (currently always shows the fallback —
            see lib/data.ts fetchTradeDetail comment for the wiring point). */}
        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-[0.22em] text-moss-400">
            Off-chain detail
          </div>
          <p className="text-sm leading-relaxed text-moss-300">
            <span className="text-moss-200">Off-chain detail unavailable.</span>{" "}
            The TradeJournal record is on-chain; full trade fields (coin,
            side, entry, exit) live at the agent's URI and aren't fetched
            in this preview build.
          </p>
        </div>

        {/* On-chain detail block — what's actually verifiable. */}
        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-[0.22em] text-moss-400">
            On-chain record
          </div>
          <dl className="space-y-2 text-sm">
            <DetailRow label="Trade Hash">
              <a
                href={`${explorer}/address/${trade.tradeHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link-quiet inline-flex items-center gap-1 font-mono text-moss-100 hover:text-moss-50"
              >
                <span>{fmtHash(trade.tradeHash)}</span>
                <ArrowUpRight className="h-3 w-3 text-moss-500" />
              </a>
            </DetailRow>
            <DetailRow label="PnL (bps)">
              <span className="font-mono tabular-nums text-moss-100">
                {trade.pnlBps.toString()}
              </span>
            </DetailRow>
            <DetailRow label="Closed at">
              <span className="font-mono tabular-nums text-moss-100">
                {fmtTimestamp(trade.closedAt)}
              </span>
            </DetailRow>
            <DetailRow label="Agent ID">
              <span className="font-mono tabular-nums text-moss-100">
                #{trade.agentId.toString()}
              </span>
            </DetailRow>
          </dl>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-moss-900/60 pb-2 last:border-0">
      <dt className="text-xs text-moss-400">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
