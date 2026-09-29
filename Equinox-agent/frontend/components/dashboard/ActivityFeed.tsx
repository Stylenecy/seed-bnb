"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  Zap,
  RefreshCw,
  Wallet,
  ShieldAlert,
  Coins,
  ArrowDownLeft,
} from "lucide-react";
import {
  activityFeed,
  type ActivityEvent,
  type ActivityKind,
} from "@/data/mock";
import { formatUSD, relativeTime } from "@/lib/format";
import { DefenseModal } from "@/components/modals/DefenseModal";

const TECH: React.CSSProperties = {
  fontFamily: "var(--font-tech), ui-sans-serif, system-ui",
};

const KIND_META: Record<
  ActivityKind,
  { icon: React.ComponentType<{ size?: number }>; color: string; ring: string; bg: string }
> = {
  spread: {
    icon: Zap,
    color: "#b6a8ff",
    ring: "rgba(145,129,245,0.40)",
    bg: "rgba(145,129,245,0.10)",
  },
  rebalance: {
    icon: RefreshCw,
    color: "#5cd8ff",
    ring: "rgba(92,216,255,0.35)",
    bg: "rgba(92,216,255,0.08)",
  },
  shadow: {
    icon: Wallet,
    color: "#ff9aae",
    ring: "rgba(255,122,144,0.40)",
    bg: "rgba(255,122,144,0.10)",
  },
  defense: {
    icon: ShieldAlert,
    color: "#ff7a90",
    ring: "rgba(255,122,144,0.45)",
    bg: "rgba(255,122,144,0.12)",
  },
  deposit: {
    icon: Coins,
    color: "#ffd49a",
    ring: "rgba(255,196,107,0.40)",
    bg: "rgba(255,196,107,0.10)",
  },
  withdraw: {
    icon: ArrowDownLeft,
    color: "#c9d3cf",
    ring: "rgba(255,255,255,0.18)",
    bg: "rgba(255,255,255,0.04)",
  },
};

const FILTERS = [
  { id: "all" as const, label: "All" },
  { id: "spread" as const, label: "Spread" },
  { id: "rebalance" as const, label: "Rebalance" },
  { id: "defense" as const, label: "Defense" },
];

export function ActivityFeed() {
  const [filter, setFilter] = useState<
    "all" | "spread" | "defense" | "rebalance"
  >("all");
  const [defenseEvent, setDefenseEvent] = useState<ActivityEvent | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const filtered =
    filter === "all"
      ? activityFeed
      : activityFeed.filter((e) => e.kind === filter);

  // Stagger fade-in on filter change.
  useEffect(() => {
    if (!listRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      listRef.current.children,
      { y: 8, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.45,
        stagger: 0.04,
        ease: "expo.out",
      }
    );
  }, [filter]);

  return (
    <>
      <article
        className="overflow-hidden rounded-3xl border border-border-strong/60 bg-surface/45 backdrop-blur-md"
        style={TECH}
      >
        <header className="flex items-center justify-between gap-3 border-b border-border/60 px-6 py-4">
          <div>
            <h3 className="text-[15px] font-medium tracking-[-0.005em] text-fg">
              Agent activity
            </h3>
            <p className="text-[12px] text-fg-dim">
              Live stream — every move the agent makes
            </p>
          </div>
          <div className="hidden items-center gap-1 rounded-full border border-border-strong/60 bg-surface-2/40 p-1 sm:flex">
            {FILTERS.map(({ id, label }) => {
              const active = filter === id;
              return (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className={`relative rounded-full px-3 py-1.5 text-[12px] transition-colors ${
                    active ? "text-fg" : "text-fg-dim hover:text-fg-muted"
                  }`}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(145,129,245,0.20), rgba(67,97,252,0.12))",
                        boxShadow: "0 0 0 1px rgba(145,129,245,0.35)",
                      }}
                    />
                  )}
                  <span className="relative">{label}</span>
                </button>
              );
            })}
          </div>
        </header>

        <ul ref={listRef} className="divide-y divide-border/60">
          {filtered.map((evt) => {
            const meta = KIND_META[evt.kind];
            const Icon = meta.icon;
            const clickable = evt.kind === "defense";
            const Wrapper: React.ElementType = clickable ? "button" : "div";
            return (
              <li key={evt.id}>
                <Wrapper
                  onClick={
                    clickable ? () => setDefenseEvent(evt) : undefined
                  }
                  className={`flex w-full items-start gap-4 px-6 py-4 text-left transition-colors ${
                    clickable ? "hover:bg-surface-2/40" : ""
                  }`}
                >
                  <span
                    className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                    style={{
                      background: meta.bg,
                      boxShadow: `0 0 0 1px ${meta.ring}`,
                      color: meta.color,
                    }}
                  >
                    <Icon size={15} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="text-[14px] text-fg">{evt.title}</span>
                      <span className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-fg-dim">
                        {relativeTime(evt.timestamp)}
                      </span>
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-fg-dim">
                      {evt.detail}
                    </p>
                  </div>
                  {evt.amount !== undefined && (
                    <span
                      className="shrink-0 font-mono text-[13.5px] tab-nums"
                      style={{ color: meta.color }}
                    >
                      +{formatUSD(evt.amount)}
                    </span>
                  )}
                </Wrapper>
              </li>
            );
          })}
        </ul>

        <footer className="border-t border-border/60 px-6 py-3">
          <button className="text-[12.5px] text-fg-muted transition-colors hover:text-fg">
            Load older activity →
          </button>
        </footer>
      </article>

      <DefenseModal
        open={!!defenseEvent}
        onClose={() => setDefenseEvent(null)}
        event={defenseEvent ?? undefined}
      />
    </>
  );
}
