"use client";

import { useState } from "react";
import { ArrowDownToLine, Check } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/Button";
import { mockPosition, mockUser } from "@/data/mock";
import { formatUSD, shortAddress } from "@/lib/format";

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
}

export function WithdrawModal({ open, onClose }: WithdrawModalProps) {
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState<"input" | "signing" | "success">("input");
  const max = mockPosition.shadowBalanceUsdt;

  const numeric = Number(amount) || 0;
  const valid = numeric > 0 && numeric <= max;

  const reset = () => {
    setAmount("");
    setStage("input");
  };

  const close = () => {
    onClose();
    setTimeout(reset, 250);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setStage("signing");
    setTimeout(() => setStage("success"), 1400);
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Withdraw from Shadow"
      subtitle={stage === "input" ? "Cash out USDT to your wallet anytime." : undefined}
      maxWidthClassName="max-w-[440px]"
    >
      {stage === "input" && (
        <form onSubmit={submit} className="space-y-5 px-6 pb-7 pt-5">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between text-[11.5px] uppercase tracking-[0.14em] text-ink-400">
              <span>Available</span>
              <span className="text-ink-200 font-mono tab-nums">
                {formatUSD(max)}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[28px] text-ink-400">$</span>
              <input
                type="number"
                value={amount}
                step="0.01"
                min="0"
                max={max}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-[40px] font-medium tracking-[-0.02em] text-ink-50 outline-none tab-nums placeholder:text-ink-500"
              />
              <button
                type="button"
                onClick={() => setAmount(String(max))}
                className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-ink-200 hover:bg-white/[0.05]"
              >
                Max
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.05] p-4 text-[12.5px] text-ink-300">
            <div className="flex items-center justify-between">
              <span>Destination</span>
              <span className="font-mono tab-nums text-ink-100">
                {shortAddress(mockUser.walletAddress)}
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span>Network fee</span>
              <span className="font-mono text-ink-100 tab-nums">~$0.01</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span>Equinox fee</span>
              <span className="font-mono text-[var(--color-accent)] tab-nums">
                $0.00
              </span>
            </div>
          </div>

          <Button type="submit" disabled={!valid} className="w-full" size="lg">
            <ArrowDownToLine size={15} />
            Confirm withdraw
          </Button>
        </form>
      )}

      {stage === "signing" && (
        <div className="px-6 pb-8 pt-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-full border-2 border-white/[0.06] border-t-[var(--color-accent)] animate-spin" />
          <p className="mt-5 text-[15px] text-ink-50">
            Confirm in your wallet…
          </p>
          <p className="mt-2 text-[12.5px] text-ink-400">
            Waiting for BNB Chain to confirm.
          </p>
        </div>
      )}

      {stage === "success" && (
        <div className="px-6 pb-7 pt-7 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--color-positive)]/15 text-[var(--color-positive)]">
            <Check size={20} />
          </div>
          <p className="mt-5 text-[18px] font-medium tracking-[-0.01em] text-ink-50">
            Withdrew {formatUSD(numeric)}
          </p>
          <p className="mt-2 text-[12.5px] text-ink-400">
            Funds will appear in your wallet in a few seconds.
          </p>
          <Button onClick={close} className="mt-6 w-full" size="md">
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
}
