"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ScrollText, X } from "lucide-react";
import { mockPosition, mockUser } from "@/data/mock";
import { ClosePositionModal } from "@/components/modals/ClosePositionModal";

const TECH_FONT: React.CSSProperties = {
  fontFamily: "var(--font-tech), ui-sans-serif, system-ui",
};

export function DashboardHeader() {
  const [closeOpen, setCloseOpen] = useState(false);
  return (
    <>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div
            className="flex items-center gap-3 text-[12px] text-fg-dim"
            style={TECH_FONT}
          >
            <span>Welcome back, {mockUser.name}</span>
            <span aria-hidden className="text-fg-dim">·</span>
            <span className="font-mono uppercase tracking-[0.12em] text-fg-muted">
              Position #001284
            </span>
          </div>
          <h1
            className="text-[clamp(2rem,3.6vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.02em] text-fg"
            style={TECH_FONT}
          >
            Your agent is working.
          </h1>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Pill tone="brand">
              Balanced · LTV {Math.round(mockPosition.ltv * 100)}%
            </Pill>
            <Pill tone="muted">{mockPosition.mode}</Pill>
            <Pill tone="muted">Manifesto v{mockPosition.manifestoVersion}</Pill>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/manifesto"
            className="group inline-flex items-center gap-2 rounded-full border border-border-strong/60 bg-surface/40 px-4 py-2.5 text-[13px] text-fg-muted transition-all hover:-translate-y-[1px] hover:border-border-strong hover:text-fg"
            style={TECH_FONT}
          >
            <ScrollText size={14} />
            View manifesto
            <ChevronRight
              size={14}
              className="text-fg-dim transition-transform group-hover:translate-x-0.5"
            />
          </Link>
          <button
            type="button"
            onClick={() => setCloseOpen(true)}
            className="group inline-flex h-10 items-center gap-2 rounded-full border border-[var(--color-rose)]/40 bg-[var(--color-rose)]/[0.08] px-4 text-[13px] font-medium text-[var(--color-rose)] transition-all hover:-translate-y-[1px] hover:bg-[var(--color-rose)]/[0.14]"
            style={TECH_FONT}
          >
            <X size={14} />
            Close position
          </button>
        </div>
      </div>
      <ClosePositionModal open={closeOpen} onClose={() => setCloseOpen(false)} />
    </>
  );
}

function Pill({
  tone = "muted",
  children,
}: {
  tone?: "brand" | "muted";
  children: React.ReactNode;
}) {
  if (tone === "brand") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-fg"
        style={{
          background:
            "linear-gradient(135deg, rgba(145,129,245,0.18), rgba(67,97,252,0.08))",
          boxShadow: "0 0 0 1px rgba(145,129,245,0.35)",
          ...TECH_FONT,
        }}
      >
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full bg-violet-soft animate-pulse-soft"
          style={{ boxShadow: "0 0 6px rgba(145,129,245,0.9)" }}
        />
        {children}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center rounded-full border border-border-strong/60 bg-surface-2/40 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-fg-dim"
      style={TECH_FONT}
    >
      {children}
    </span>
  );
}
