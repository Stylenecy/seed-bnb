"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { mockPosition } from "@/data/mock";
import { formatUSD } from "@/lib/format";

const TECH: React.CSSProperties = {
  fontFamily: "var(--font-tech), ui-sans-serif, system-ui",
};

export function AllocationCard() {
  const listaFillRef = useRef<HTMLDivElement | null>(null);
  const pancakeFillRef = useRef<HTMLDivElement | null>(null);

  const total = mockPosition.allocations.lista + mockPosition.allocations.pancake;
  const listaPct = (mockPosition.allocations.lista / total) * 100;
  const pancakePct = 100 - listaPct;

  useEffect(() => {
    const s = listaFillRef.current;
    const c = pancakeFillRef.current;
    if (!s || !c) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      s.style.width = `${listaPct}%`;
      c.style.width = `${pancakePct}%`;
      return;
    }
    gsap.fromTo(
      s,
      { width: 0 },
      { width: `${listaPct}%`, duration: 1.2, ease: "expo.out" }
    );
    gsap.fromTo(
      c,
      { width: 0 },
      { width: `${pancakePct}%`, duration: 1.2, ease: "expo.out", delay: 0.1 }
    );
  }, [listaPct, pancakePct]);

  return (
    <article
      className="relative overflow-hidden rounded-3xl border border-border-strong/60 bg-surface/45 p-6 backdrop-blur-md"
      style={TECH}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] uppercase tracking-[0.18em] text-fg-dim">
          Agent allocation
        </span>
        <span className="font-mono text-[12px] text-fg-muted tab-nums">
          {formatUSD(total)} deployed
        </span>
      </div>

      <div className="mt-6 flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
        <div
          ref={listaFillRef}
          className="h-full"
          style={{
            width: 0,
            background:
              "linear-gradient(90deg, #b6a8ff, #9181f5)",
            boxShadow: "inset 0 0 6px rgba(145,129,245,0.4)",
          }}
        />
        <div
          ref={pancakeFillRef}
          className="h-full"
          style={{
            width: 0,
            background:
              "linear-gradient(90deg, #7df0ff, #5cd8ff)",
            boxShadow: "inset 0 0 6px rgba(92,216,255,0.45)",
          }}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <AllocationRow
          dot="#9181f5"
          glow="rgba(145,129,245,0.7)"
          name="Lista"
          venue="USDT lending"
          amount={mockPosition.allocations.lista}
          pct={listaPct}
          apr="6.2%"
        />
        <AllocationRow
          dot="#5cd8ff"
          glow="rgba(92,216,255,0.7)"
          name="PancakeSwap"
          venue="USDT/USDC LP"
          amount={mockPosition.allocations.pancake}
          pct={pancakePct}
          apr="9.8%"
        />
      </div>
    </article>
  );
}

function AllocationRow({
  dot,
  glow,
  name,
  venue,
  amount,
  pct,
  apr,
}: {
  dot: string;
  glow: string;
  name: string;
  venue: string;
  amount: number;
  pct: number;
  apr: string;
}) {
  return (
    <div className="rounded-2xl border border-border-strong/60 bg-surface-2/40 p-4 transition-colors hover:border-border-strong">
      <div className="flex items-center gap-2">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: dot, boxShadow: `0 0 6px ${glow}` }}
        />
        <span className="text-[13.5px] text-fg">{name}</span>
        <span className="ml-auto font-mono text-[11px] text-fg-dim tab-nums">
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="mt-3 font-mono text-[18px] text-fg tab-nums">
        {formatUSD(amount)}
      </div>
      <div className="mt-1 flex items-center justify-between text-[11.5px] text-fg-dim">
        <span>{venue}</span>
        <span className="font-mono text-[var(--color-emerald-soft)] tab-nums">
          {apr} APR
        </span>
      </div>
    </div>
  );
}
