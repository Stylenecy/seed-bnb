/** Adapted from apps/web/components/LancePanel.tsx — static "buy" state with
 *  representative on-chain numbers. Buy/redeem toggle + preview + CTA. */
export function LancePanel() {
  return (
    <div className="glass space-y-4 rounded-2xl p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-anton text-lg uppercase tracking-tight text-neon">$LANCE</h2>
        <span className="font-mono text-xs text-muted-foreground">~1,000 LANCE / CELO</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
          <div className="text-muted-foreground">Your $LANCE</div>
          <div className="mt-0.5 font-mono text-sm font-semibold text-cream">140</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
          <div className="text-muted-foreground">Your CELO</div>
          <div className="mt-0.5 font-mono text-sm font-semibold text-cream">3.2</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-[0.7rem]">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-1.5">
          <div className="text-muted-foreground">Supply</div>
          <div className="mt-0.5 font-mono font-semibold text-cream">48,200</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-1.5">
          <div className="text-muted-foreground">Pool</div>
          <div className="mt-0.5 font-mono font-semibold text-cream">48.20 CELO</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-1.5">
          <div className="text-muted-foreground">Backed</div>
          <div className="mt-0.5 font-mono font-semibold text-neon">100%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-neon/40 bg-neon/15 px-3 py-2.5 text-center text-sm font-semibold capitalize text-neon">buy</div>
        <div className="rounded-xl border border-white/10 px-3 py-2.5 text-center text-sm font-semibold capitalize text-muted-foreground">redeem</div>
      </div>

      <label className="block space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Spend CELO</span>
          <span className="font-mono text-xs text-muted-foreground">Max: 3.2</span>
        </div>
        <div className="flex w-full items-center rounded-xl border border-border bg-card/60 px-4 py-3 text-cream">1.0</div>
      </label>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground">
        You receive ≈ <span className="font-mono text-cream">1,000</span> $LANCE
      </div>

      <div className="w-full rounded-xl bg-primary px-4 py-3 text-center font-semibold text-primary-foreground shadow-glow">
        Buy $LANCE
      </div>
    </div>
  );
}
