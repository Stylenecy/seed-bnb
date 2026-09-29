"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ArrowUpRight, Lock, Activity, Wallet } from "lucide-react";
import { mockPosition, BNB_PRICE } from "@/data/mock";
import { formatUSD, formatBNB } from "@/lib/format";
import { WithdrawModal } from "@/components/modals/WithdrawModal";

const TECH: React.CSSProperties = {
  fontFamily: "var(--font-tech), ui-sans-serif, system-ui",
};

type Tone = "cyan" | "violet" | "brand";

const TONE_STYLES: Record<
  Tone,
  { glow: string; iconBg: string; iconBorder: string; iconText: string; value: string }
> = {
  cyan: {
    glow: "rgba(92,216,255,0.16)",
    iconBg: "rgba(92,216,255,0.10)",
    iconBorder: "rgba(92,216,255,0.35)",
    iconText: "#5cd8ff",
    value: "text-fg",
  },
  violet: {
    glow: "rgba(145,129,245,0.16)",
    iconBg: "rgba(145,129,245,0.12)",
    iconBorder: "rgba(145,129,245,0.40)",
    iconText: "#b6a8ff",
    value: "text-fg",
  },
  brand: {
    glow: "rgba(255,122,144,0.18)",
    iconBg: "rgba(255,122,144,0.12)",
    iconBorder: "rgba(255,122,144,0.40)",
    iconText: "#ff7a90",
    value: "text-[#ff9aae]",
  },
};

export function PositionCards() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-pcard]", {
        y: 24,
        opacity: 0,
        duration: 0.85,
        stagger: 0.09,
        ease: "expo.out",
      });
      // Hover lift via CSS handles its own, but rollup numbers
      gsap.utils.toArray<HTMLElement>("[data-rollup]").forEach((el) => {
        const target = Number(el.dataset.target ?? "0");
        const decimals = Number(el.dataset.decimals ?? "0");
        const prefix = el.dataset.prefix ?? "";
        const suffix = el.dataset.suffix ?? "";
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.4,
          ease: "expo.out",
          onUpdate: () => {
            el.textContent =
              prefix +
              obj.v.toLocaleString("en-US", {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              }) +
              suffix;
          },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <>
      <div ref={rootRef} className="grid gap-4 md:grid-cols-3">
        <PCard
          data-pcard
          eyebrow="Collateral"
          icon={<Lock size={14} />}
          tone="cyan"
          numericTarget={mockPosition.collateralBnb}
          numericSuffix=" BNB"
          subtitle={formatUSD(mockPosition.collateralUsd)}
          footer={
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-fg-dim">Stays whole</span>
              <span className="font-mono text-fg-muted tab-nums">
                @ ${BNB_PRICE.toFixed(2)}
              </span>
            </div>
          }
        />

        <PCard
          data-pcard
          eyebrow="Active debt"
          icon={<Activity size={14} />}
          tone="violet"
          numericTarget={mockPosition.activeDebtUsdt}
          numericPrefix="$"
          numericDecimals={2}
          subtitle="USDT · Venus"
          footer={
            <div className="flex items-center justify-between gap-3 text-[12px]">
              <span className="text-fg-dim">Agent managing</span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] uppercase tracking-[0.14em] text-violet-soft"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(145,129,245,0.18), rgba(67,97,252,0.10))",
                  boxShadow: "0 0 0 1px rgba(145,129,245,0.40)",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full bg-violet-soft animate-pulse-soft"
                  style={{ boxShadow: "0 0 6px rgba(145,129,245,0.9)" }}
                />
                Payoff 5mo 12d
              </span>
            </div>
          }
        />

        <PCard
          data-pcard
          eyebrow="Shadow wallet"
          icon={<Wallet size={14} />}
          tone="brand"
          numericTarget={mockPosition.shadowBalanceUsdt}
          numericPrefix="$"
          numericDecimals={2}
          subtitle="Spendable any time"
          footer={
            <button
              onClick={() => setWithdrawOpen(true)}
              className="group flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-[13px] font-medium text-white transition-transform hover:-translate-y-[1px]"
              style={{
                background: "var(--gradient-brand)",
                boxShadow:
                  "0 -4px 7px rgba(50,50,50,0.32) inset, 0 18px 36px -16px rgba(67,97,252,0.55)",
                ...TECH,
              }}
            >
              <span>Withdraw to wallet</span>
              <ArrowUpRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>
          }
        />
      </div>
      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
    </>
  );
}

function PCard({
  eyebrow,
  icon,
  tone,
  numericTarget,
  numericPrefix = "",
  numericSuffix = "",
  numericDecimals = 0,
  subtitle,
  footer,
  ...rest
}: {
  eyebrow: string;
  icon: React.ReactNode;
  tone: Tone;
  numericTarget: number;
  numericPrefix?: string;
  numericSuffix?: string;
  numericDecimals?: number;
  subtitle: string;
  footer?: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const t = TONE_STYLES[tone];
  return (
    <article
      {...rest}
      className="group relative overflow-hidden rounded-3xl border border-border-strong/60 bg-surface/45 p-6 backdrop-blur-md transition-all duration-500 will-change-transform hover:-translate-y-1 hover:border-border-strong"
      style={TECH}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 right-0 h-44 w-44 rounded-full blur-2xl"
        style={{ background: t.glow }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
        }}
      />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-8 w-8 place-items-center rounded-lg border"
            style={{
              background: t.iconBg,
              borderColor: t.iconBorder,
              color: t.iconText,
            }}
          >
            {icon}
          </span>
          <span className="text-[10.5px] uppercase tracking-[0.18em] text-fg-dim">
            {eyebrow}
          </span>
        </div>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-fg-dim">
          {new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
          })}
        </span>
      </div>

      <div className="relative mt-7 flex flex-col">
        <span
          data-rollup
          data-target={numericTarget}
          data-prefix={numericPrefix}
          data-suffix={numericSuffix}
          data-decimals={numericDecimals}
          className={`text-[clamp(2rem,2.6vw,2.4rem)] font-medium leading-none tracking-[-0.02em] tab-nums ${t.value}`}
        >
          {numericPrefix}
          {numericTarget.toLocaleString("en-US", {
            minimumFractionDigits: numericDecimals,
            maximumFractionDigits: numericDecimals,
          })}
          {numericSuffix}
        </span>
        <span className="mt-2.5 text-[13px] text-fg-dim">{subtitle}</span>
      </div>

      <div className="relative mt-7 border-t border-border/60 pt-4">{footer}</div>
    </article>
  );
}
