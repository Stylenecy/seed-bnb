"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { WithdrawModal } from "@/components/modals/WithdrawModal";
import { Button } from "@/components/ui/Button";
import { mockPosition } from "@/data/mock";
import { formatUSD } from "@/lib/format";

export default function WithdrawPage() {
  const [open, setOpen] = useState(false);
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[640px] space-y-8">
        <div>
          <span className="text-[11px] uppercase tracking-[0.16em] text-ink-400">
            Shadow wallet
          </span>
          <h1 className="mt-2 text-[28px] font-medium tracking-[-0.015em] text-ink-50">
            Pull profit to your wallet.
          </h1>
          <p className="mt-2 text-[13.5px] text-ink-300">
            Shadow holds USDT that built up from collateral appreciation and
            spread overflow. Withdraw any amount, any time. No fees from us.
          </p>
        </div>

        <article className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-[var(--bg-card)]/55 p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-12 right-0 h-44 w-44 rounded-full bg-[var(--color-accent)]/14 blur-2xl"
          />
          <span className="text-[11px] uppercase tracking-[0.16em] text-ink-400">
            Available
          </span>
          <div className="mt-3 text-[44px] font-medium leading-none tracking-tight text-[var(--color-accent)] tab-nums">
            {formatUSD(mockPosition.shadowBalanceUsdt)}
          </div>
          <div className="mt-1 text-[12.5px] text-ink-400">USDT · spendable</div>

          <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/[0.04] pt-5 text-[12.5px]">
            <Mini k="Network fee" v="~$0.01" />
            <Mini k="Equinox fee" v="$0.00" accent />
          </div>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => setOpen(true)} className="flex-1" size="lg">
              Withdraw
              <ArrowUpRight size={16} />
            </Button>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-[13px] text-ink-100 hover:bg-white/[0.04]"
            >
              Back to dashboard
            </Link>
          </div>
        </article>
      </div>

      <WithdrawModal open={open} onClose={() => setOpen(false)} />
    </AppShell>
  );
}

function Mini({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-4">
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400">
        {k}
      </div>
      <div
        className={`mt-1.5 font-mono text-[15px] tab-nums ${
          accent ? "text-[var(--color-accent)]" : "text-ink-50"
        }`}
      >
        {v}
      </div>
    </div>
  );
}
