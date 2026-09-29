import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { mockPosition } from "@/data/mock";

const PARAMS = [
  { k: "LTV target", v: "55%", hint: "Borrowed / collateral value" },
  { k: "LTV maximum", v: "65%", hint: "Hard ceiling before forced rebalance" },
  { k: "Defense threshold (HF)", v: "1.30", hint: "Below: defense triggers" },
  { k: "Warning threshold (HF)", v: "1.50", hint: "Below: agent warns user" },
  { k: "Recycle ratio", v: "30–50%", hint: "Dynamic, based on yield delta" },
  { k: "Buffer minimum", v: "10% of debt", hint: "Always reserved" },
];

const ROUTING = [
  { k: "Borrow source", v: "Venus" },
  { k: "Lend max — Lista", v: "60% of recycle" },
  { k: "Lend max — PancakeSwap", v: "40% of recycle" },
  { k: "Rebalance trigger", v: "0.5% APR delta" },
];

export default function ManifestoPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[920px] space-y-10">
        <header className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
              <ShieldCheck size={18} />
            </span>
            <div>
              <h1 className="text-[26px] font-medium tracking-[-0.015em] text-ink-50">
                Manifesto
              </h1>
              <p className="text-[13px] text-ink-400">
                The rules your agent cannot break.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="positive" dot>
              Verified — unchanged since activation
            </Badge>
            <Badge tone="muted">Balanced · Loan + Auto-Repay</Badge>
            <Badge tone="muted">v{mockPosition.manifestoVersion}</Badge>
          </div>
        </header>

        <Section
          title="Parameters"
          intro="The numbers your agent obeys. Set at activation, immutable thereafter."
          rows={PARAMS}
        />
        <Section
          title="Routing policy"
          intro="Where your money can go. Anything outside this list is impossible."
          rows={ROUTING}
        />

        <article className="overflow-hidden rounded-3xl border border-white/[0.06] bg-[var(--bg-card)]/55 p-6">
          <h3 className="text-[15px] font-medium tracking-[-0.005em] text-ink-50">
            BNB Greenfield storage
          </h3>
          <p className="mt-2 text-[13px] text-ink-300">
            The manifesto is stored as a JSON blob on BNB Greenfield. The hash below is
            committed on-chain — any change would require redeploying the
            position and explicit consent from you.
          </p>
          <div className="mt-5 grid gap-2 rounded-2xl border border-white/[0.05] bg-white/[0.015] p-4 font-mono text-[12px] text-ink-200">
            <div className="flex items-center justify-between">
              <span className="text-ink-400">hash</span>
              <span className="tab-nums">{mockPosition.manifestoHash}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-400">blob</span>
              <span className="tab-nums">wal://1f0e9b…cda</span>
            </div>
          </div>
          <Link
            href="#"
            className="mt-5 inline-flex items-center gap-2 text-[13px] text-[var(--color-accent)] hover:underline underline-offset-4"
          >
            View raw file
            <ArrowUpRight size={14} />
          </Link>
        </article>
      </div>
    </AppShell>
  );
}

function Section({
  title,
  intro,
  rows,
}: {
  title: string;
  intro: string;
  rows: { k: string; v: string; hint?: string }[];
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-[18px] font-medium tracking-[-0.01em] text-ink-50">
          {title}
        </h2>
        <p className="mt-1 text-[13px] text-ink-400">{intro}</p>
      </div>
      <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-[var(--bg-card)]/55">
        {rows.map((r) => (
          <div
            key={r.k}
            className="flex items-center justify-between border-b border-white/[0.04] px-5 py-4 last:border-0"
          >
            <div>
              <div className="text-[13.5px] text-ink-100">{r.k}</div>
              {r.hint && (
                <div className="mt-1 text-[11.5px] text-ink-400">{r.hint}</div>
              )}
            </div>
            <span className="font-mono text-[14px] text-ink-50 tab-nums">{r.v}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
