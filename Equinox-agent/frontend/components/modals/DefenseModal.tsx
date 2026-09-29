"use client";

import { ShieldAlert } from "lucide-react";
import { Modal } from "./Modal";
import type { ActivityEvent } from "@/data/mock";

interface DefenseModalProps {
  open: boolean;
  onClose: () => void;
  event?: ActivityEvent;
}

export function DefenseModal({ open, onClose }: DefenseModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidthClassName="max-w-[520px]"
      title="Defense triggered"
      subtitle="Mar 15, 2026 · 14:22 UTC"
    >
      <div className="px-6 pb-7 pt-5 space-y-6">
        <div className="flex items-start gap-4 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/8 p-4">
          <ShieldAlert
            size={20}
            className="mt-0.5 shrink-0 text-[var(--color-danger)]"
          />
          <div>
            <p className="text-[14px] text-ink-50">
              BNB price dropped −20% in 18 minutes.
            </p>
            <p className="mt-1 text-[12.5px] text-ink-300">
              Health Factor crossed the 1.30 threshold. Defense executed
              autonomously — your collateral never moved.
            </p>
          </div>
        </div>

        <Section title="Trigger">
          <Row k="BNB price" v="$700 → $560" hint="−20%" />
          <Row k="HF before / after" v="1.28 → 1.55" hint="Restored" tone="positive" />
        </Section>

        <Section title="Actions taken">
          <Row k="Withdrew Lista" v="$462" />
          <Row k="Unwound PancakeSwap LP" v="$96" />
          <Row k="Repaid Venus" v="$558" tone="accent" />
        </Section>

        <Section title="Result">
          <Row k="Collateral" v="5 BNB" hint="Untouched" tone="positive" />
          <Row k="Debt" v="$1,923 → $1,365" tone="accent" />
          <Row k="Defense reward" v="$2.79" hint="Paid to caller" />
        </Section>

        <p className="text-[12px] text-ink-400">
          Allocations are being rebuilt from spread capture. Your position is
          back to a healthy LTV.
        </p>
      </div>
    </Modal>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-[10.5px] uppercase tracking-[0.18em] text-ink-400">
        {title}
      </p>
      <div className="overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.015]">
        {children}
      </div>
    </div>
  );
}

function Row({
  k,
  v,
  hint,
  tone,
}: {
  k: string;
  v: string;
  hint?: string;
  tone?: "positive" | "accent";
}) {
  const color =
    tone === "positive"
      ? "text-[var(--color-positive)]"
      : tone === "accent"
        ? "text-[var(--color-accent)]"
        : "text-ink-50";
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.04] px-4 py-3 last:border-0">
      <span className="text-[13px] text-ink-200">{k}</span>
      <div className="flex items-baseline gap-3">
        <span className={`font-mono text-[13.5px] tab-nums ${color}`}>{v}</span>
        {hint && (
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-400">
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}
