import { CircleCheck, Sparkles, ShieldCheck } from "lucide-react";

export function HeroPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-8 -z-10 rounded-[2rem] bg-gradient-to-br from-violet/15 via-transparent to-emerald/10 blur-2xl" />

      <div className="rounded-[1.6rem] border border-border-strong bg-surface/85 p-5 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-violet/15 text-violet-soft">
              <Sparkles className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-fg-dim">
                Withdrawal request · #038
              </span>
              <span className="text-sm font-medium text-fg">
                Arisan Tetangga RT 03 · Round 3
              </span>
            </div>
          </div>
          <span className="rounded-full border border-emerald/30 bg-emerald/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-soft">
            Fast-track
          </span>
        </div>

        <div className="mt-5 flex items-baseline justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-fg-dim">
              Requested by
            </p>
            <p className="text-sm text-fg">Dewi · 5GrwvaEF...sQ4Q</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-fg-dim">Amount</p>
            <p className="text-xl font-semibold tracking-tight text-fg">
              500 <span className="text-fg-muted">POT</span>
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-bg/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-fg-dim">
              Requester Agent · Confidence
            </p>
            <p className="font-mono text-xs text-emerald-soft">0.92</p>
          </div>
          <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet via-cyan to-emerald"
              style={{ width: "92%" }}
            />
          </div>
          <ul className="mt-4 space-y-2 text-xs text-fg-muted">
            <li className="flex items-center gap-2">
              <CircleCheck className="size-3.5 text-emerald-soft" />
              <span>Deposit history · 100% on-time (3/3 rounds)</span>
            </li>
            <li className="flex items-center gap-2">
              <CircleCheck className="size-3.5 text-emerald-soft" />
              <span>Reputation · 812 / 1000 (Platinum)</span>
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-violet-soft" />
              <span>Emergency flag verified · medical</span>
            </li>
          </ul>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {[
            { name: "Alice", v: "approve" },
            { name: "Bob", v: "approve" },
            { name: "Charlie", v: "approve" },
            { name: "Eko", v: "pending" },
          ].map((m, i) => (
            <div
              key={m.name}
              className="rounded-xl border border-border bg-bg/40 p-3"
            >
              <div className="mb-2 grid size-7 place-items-center rounded-full bg-gradient-to-br from-violet/30 to-emerald/20 text-[10px] font-medium text-fg">
                {m.name[0]}
              </div>
              <p className="text-[10px] uppercase tracking-wider text-fg-dim">
                {m.name}
              </p>
              <p
                className={
                  m.v === "approve"
                    ? "text-[11px] font-medium text-emerald-soft"
                    : "text-[11px] font-medium text-amber"
                }
              >
                {m.v === "approve" ? "Approved" : "Pending"}
                {i === 0 && " · 1.2×"}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl border border-border bg-bg/40 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-fg-dim">
            Challenge window
          </p>
          <p className="font-mono text-xs text-fg">11h 42m remaining</p>
        </div>
      </div>
    </div>
  );
}
