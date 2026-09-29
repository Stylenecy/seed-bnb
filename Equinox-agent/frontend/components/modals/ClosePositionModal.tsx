"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/Button";
import { mockPosition } from "@/data/mock";
import { formatUSD } from "@/lib/format";
import { auth } from "@/lib/auth";

interface ClosePositionModalProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  "Unwinding Lista position",
  "Unwinding PancakeSwap LP",
  "Repaying Venus debt",
  "Returning collateral",
];

export function ClosePositionModal({ open, onClose }: ClosePositionModalProps) {
  const [stage, setStage] = useState<"preview" | "executing" | "done">("preview");
  const [stepIdx, setStepIdx] = useState(0);

  const close = () => {
    onClose();
    setTimeout(() => {
      setStage("preview");
      setStepIdx(0);
    }, 250);
  };

  const confirm = () => {
    setStage("executing");
    setStepIdx(0);
    const interval = window.setInterval(() => {
      setStepIdx((idx) => {
        if (idx >= STEPS.length - 1) {
          window.clearInterval(interval);
          window.setTimeout(() => setStage("done"), 600);
          return idx + 1;
        }
        return idx + 1;
      });
    }, 700);
  };

  // README §6 success state: actual position-close is committed when the
  // user dismisses the success screen, so the modal can fully render
  // "Settled. Wallet restored." before the dashboard flips to empty state.
  const finishAndHome = () => {
    auth.closePosition();
    window.location.href = "/";
  };
  const finishAndReopen = () => {
    auth.closePosition();
    window.location.href = "/onboarding";
  };

  const total = mockPosition.allocations.lista + mockPosition.allocations.pancake;
  const surplus = total - mockPosition.activeDebtUsdt;

  return (
    <Modal
      open={open}
      onClose={close}
      title={stage === "done" ? "Position closed" : "Close position"}
      subtitle={
        stage === "preview"
          ? "Preview of the unwind. You can cancel any time before signing."
          : undefined
      }
      maxWidthClassName="max-w-[520px]"
    >
      {stage === "preview" && (
        <div className="space-y-5 px-6 pb-7 pt-5">
          <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
            <Row k="Current debt" v={formatUSD(mockPosition.activeDebtUsdt)} />
            <Row
              k="Available from agent"
              v={formatUSD(total)}
              detail={`Lista ${formatUSD(mockPosition.allocations.lista)} · PancakeSwap ${formatUSD(mockPosition.allocations.pancake)}`}
            />
            <Row
              k="Surplus returned"
              v={`+ ${formatUSD(surplus)}`}
              tone="accent"
            />
          </div>

          <div className="space-y-2 rounded-2xl border border-white/[0.05] bg-white/[0.015] p-4 text-[12.5px]">
            <Bullet>Debt fully repaid via agent allocations.</Bullet>
            <Bullet>Surplus {formatUSD(surplus)} USDT sent to your wallet.</Bullet>
            <Bullet>
              Collateral{" "}
              <span className="font-mono text-ink-100 tab-nums">
                {mockPosition.collateralBnb.toLocaleString()} BNB
              </span>{" "}
              returned in full.
            </Bullet>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={close} className="flex-1">
              Cancel
            </Button>
            <Button onClick={confirm} className="flex-1">
              Confirm close
              <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      )}

      {stage === "executing" && (
        <div className="space-y-3 px-6 pb-7 pt-5">
          {STEPS.map((label, i) => {
            const status =
              i < stepIdx ? "done" : i === stepIdx ? "active" : "pending";
            return (
              <div
                key={label}
                className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.015] px-4 py-3"
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full border ${
                    status === "done"
                      ? "border-[var(--color-positive)]/40 bg-[var(--color-positive)]/15 text-[var(--color-positive)]"
                      : status === "active"
                        ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
                        : "border-white/[0.08] bg-white/[0.02] text-ink-400"
                  }`}
                >
                  {status === "done" ? (
                    <Check size={13} />
                  ) : status === "active" ? (
                    <span className="h-2 w-2 rounded-full bg-current animate-pulse-soft" />
                  ) : (
                    <span className="font-mono text-[10px]">{i + 1}</span>
                  )}
                </span>
                <span
                  className={`text-[13.5px] ${
                    status === "pending" ? "text-ink-500" : "text-ink-100"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {stage === "done" && (
        <div className="px-6 pb-7 pt-5 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--color-positive)]/15 text-[var(--color-positive)]">
            <Check size={22} />
          </div>
          <h3 className="mt-5 text-[20px] font-medium tracking-[-0.01em] text-ink-50">
            Settled. Wallet restored.
          </h3>
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.06] text-left">
            <Row k="Deposited" v="5.00 BNB" />
            <Row k="Returned" v="5.00 BNB" tone="positive" />
            <Row k="Surplus paid out" v={formatUSD(surplus)} tone="accent" />
            <Row k="Total time" v="4 months 12 days" />
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={finishAndHome} className="flex-1">
              Back to home
            </Button>
            <Button onClick={finishAndReopen} className="flex-1">
              Open a new position
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Row({
  k,
  v,
  tone,
  detail,
}: {
  k: string;
  v: string;
  tone?: "accent" | "positive";
  detail?: string;
}) {
  const color =
    tone === "accent"
      ? "text-[var(--color-accent)]"
      : tone === "positive"
        ? "text-[var(--color-positive)]"
        : "text-ink-50";
  return (
    <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-3 last:border-0">
      <div>
        <div className="text-[13px] text-ink-200">{k}</div>
        {detail && (
          <div className="mt-1 text-[11.5px] text-ink-400">{detail}</div>
        )}
      </div>
      <span className={`font-mono text-[14px] tab-nums ${color}`}>{v}</span>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-ink-200">
      <span
        className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--color-accent)]"
        aria-hidden
      />
      <span>{children}</span>
    </div>
  );
}
