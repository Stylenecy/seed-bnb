"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Shield,
  Flame,
  Scale,
  CalendarDays,
  Coins,
} from "lucide-react";
import { Stepper } from "./Stepper";
import { riskProfiles, mockUser, BNB_PRICE } from "@/data/mock";
import { formatUSD, formatBNB } from "@/lib/format";
import { cn } from "@/lib/cn";
import { auth } from "@/lib/auth";

const STEPS = ["Asset", "Amount", "Mode", "Payoff", "Risk", "Review"];

const TECH_FONT: React.CSSProperties = {
  fontFamily: "var(--font-tech), ui-sans-serif, system-ui",
};

const ASSETS = [
  {
    id: "bnb",
    name: "BNB",
    label: "BNB",
    balance: mockUser.bnbBalance,
    enabled: true,
    network: "Native",
  },
  {
    id: "slisbnb",
    name: "slisBNB",
    label: "Liquid-staked BNB",
    balance: 0,
    enabled: false,
    network: "Coming soon",
  },
  {
    id: "weth",
    name: "ETH",
    label: "Wrapped Ether",
    balance: 0,
    enabled: false,
    network: "Coming soon",
  },
  {
    id: "wbtc",
    name: "BTC",
    label: "Wrapped Bitcoin",
    balance: 0,
    enabled: false,
    network: "Coming soon",
  },
];

const MODES = [
  {
    id: "income",
    name: "Forever Income",
    icon: Sparkles,
    blurb: "Spread distributed as cash to your Shadow wallet. Debt rolls forever.",
    enabled: false,
  },
  {
    id: "auto",
    name: "Loan + Auto-Repay",
    icon: Shield,
    blurb: "Borrow once. Spread auto-pays your debt until it hits zero.",
    enabled: true,
    recommended: true,
  },
  {
    id: "yield",
    name: "Yield Maximizer",
    icon: Flame,
    blurb: "100% of recycle deployed for max APR. Higher variance.",
    enabled: false,
  },
];

const PAYOFFS = [
  { months: 3, label: "3 months" },
  { months: 6, label: "6 months" },
  { months: 12, label: "12 months" },
  { months: 24, label: "24 months" },
];

const RISK_ICONS = {
  conservative: Shield,
  balanced: Scale,
  aggressive: Flame,
};

interface State {
  asset: string;
  amount: number;
  mode: string;
  payoff: number;
  risk: "conservative" | "balanced" | "aggressive";
}

const BRAND_GRAD = "var(--gradient-brand)";

const SELECTED_CARD_STYLE: React.CSSProperties = {
  background:
    "linear-gradient(180deg, rgba(145,129,245,0.10) 0%, rgba(67,97,252,0.06) 100%)",
  boxShadow:
    "0 0 0 1px rgba(145,129,245,0.55), 0 24px 50px -22px rgba(67,97,252,0.45)",
};

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<State>({
    asset: "bnb",
    amount: 5,
    mode: "auto",
    payoff: 6,
    risk: "balanced",
  });

  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      el,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.55, ease: "expo.out" }
    );
  }, [step]);

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const profile = useMemo(
    () => riskProfiles.find((p) => p.id === state.risk)!,
    [state.risk]
  );
  const usdValue = state.amount * BNB_PRICE;
  const borrowed = usdValue * profile.ltv;
  const toUser = borrowed * 0.6;
  const toAgent = borrowed * 0.4;

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-10 py-10">
      <header className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.18em] text-fg-dim transition-colors hover:text-fg"
            style={TECH_FONT}
          >
            <ArrowLeft className="size-3.5" /> Back to home
          </Link>
          <Stepper steps={STEPS} current={step} />
        </div>
        <div>
          <div
            className="text-[11px] uppercase tracking-[0.18em] text-fg-dim"
            style={TECH_FONT}
          >
            Open a position
          </div>
          <h1
            className="mt-3 text-[clamp(2rem,4.4vw,3.4rem)] font-medium leading-[1.05] tracking-[-0.02em] text-fg"
            style={TECH_FONT}
          >
            {step === 0 && "Pick what you'll lock."}
            {step === 1 && "Decide how much."}
            {step === 2 && "Choose how the spread is used."}
            {step === 3 && "Tell the agent your timeline."}
            {step === 4 && "Set the agent's appetite."}
            {step === 5 && "One look before activation."}
          </h1>
        </div>
      </header>

      <div ref={panelRef} className="relative">
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {ASSETS.map((a) => {
              const active = state.asset === a.id;
              return (
                <button
                  key={a.id}
                  disabled={!a.enabled}
                  onClick={() =>
                    a.enabled && setState((s) => ({ ...s, asset: a.id }))
                  }
                  className={cn(
                    "group relative overflow-hidden rounded-[1.5rem] border p-6 text-left transition-all",
                    a.enabled
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-50",
                    active
                      ? "border-transparent"
                      : "border-border-strong bg-surface/40 backdrop-blur-md hover:border-violet/40 hover:bg-surface/60"
                  )}
                  style={active ? SELECTED_CARD_STYLE : undefined}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="grid h-11 w-11 place-items-center rounded-xl border border-border-strong bg-surface-2/60 font-mono text-[11px] text-fg-muted"
                      style={TECH_FONT}
                    >
                      {a.name.slice(0, 3)}
                    </span>
                    {a.enabled ? (
                      <span
                        className="text-[11px] uppercase tracking-[0.16em] text-fg-muted"
                        style={TECH_FONT}
                      >
                        Balance · {formatBNB(a.balance, 2)}
                      </span>
                    ) : (
                      <span
                        className="rounded-full border border-border bg-surface-2/40 px-2.5 py-1 text-[10.5px] uppercase tracking-[0.14em] text-fg-dim"
                        style={TECH_FONT}
                      >
                        {a.network}
                      </span>
                    )}
                  </div>
                  <h3
                    className="mt-8 text-[24px] font-medium tracking-tight text-fg"
                    style={TECH_FONT}
                  >
                    {a.name}
                  </h3>
                  <p className="text-[13px] text-fg-muted" style={TECH_FONT}>
                    {a.label}
                  </p>
                  {active && (
                    <div
                      className="absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full text-white"
                      style={{ background: BRAND_GRAD }}
                    >
                      <Check size={12} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-[1.5rem] border border-border-strong bg-surface/45 p-7 backdrop-blur-md">
              <div
                className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-fg-dim"
                style={TECH_FONT}
              >
                <span>Amount in BNB</span>
                <span className="font-mono tabular-nums text-fg-muted">
                  Max {formatBNB(mockUser.bnbBalance, 2)}
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-3">
                <input
                  type="number"
                  value={state.amount}
                  min={0.05}
                  max={mockUser.bnbBalance}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      amount: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-transparent text-[48px] font-medium tracking-[-0.02em] tabular-nums text-fg outline-none"
                  style={TECH_FONT}
                />
                <span className="text-[18px] text-fg-dim" style={TECH_FONT}>
                  BNB
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setState((s) => ({ ...s, amount: mockUser.bnbBalance }))
                  }
                  className="rounded-full border border-border-strong bg-surface-2/50 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-fg-muted transition-colors hover:border-violet/40 hover:text-fg"
                  style={TECH_FONT}
                >
                  Max
                </button>
              </div>
              <input
                type="range"
                min={0.05}
                max={mockUser.bnbBalance}
                step={0.05}
                value={state.amount}
                onChange={(e) =>
                  setState((s) => ({ ...s, amount: Number(e.target.value) }))
                }
                className="mt-6 w-full accent-violet"
                style={{ accentColor: "#9181f5" }}
              />
              <div
                className="mt-4 flex items-center justify-between text-[12px] text-fg-dim"
                style={TECH_FONT}
              >
                <span>≈ {formatUSD(usdValue)}</span>
                <span>Min · 0.05 BNB</span>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-border-strong bg-surface/45 p-7 backdrop-blur-md">
              <div
                className="text-[11px] uppercase tracking-[0.16em] text-fg-dim"
                style={TECH_FONT}
              >
                Projected at activation
              </div>
              <Mini k="Collateral value" v={formatUSD(usdValue)} />
              <Mini
                k="Borrow capacity"
                v={formatUSD(borrowed)}
                hint={`${Math.round(profile.ltv * 100)}% LTV`}
              />
              <Mini k="You receive" v={formatUSD(toUser)} accent />
              <Mini k="Agent recycles" v={formatUSD(toAgent)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 lg:grid-cols-3">
            {MODES.map((m) => {
              const active = state.mode === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  disabled={!m.enabled}
                  onClick={() =>
                    m.enabled && setState((s) => ({ ...s, mode: m.id }))
                  }
                  className={cn(
                    "relative overflow-hidden rounded-[1.5rem] border p-6 text-left transition-all",
                    m.enabled
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-45",
                    active
                      ? "border-transparent"
                      : "border-border-strong bg-surface/40 backdrop-blur-md hover:border-violet/40 hover:bg-surface/60"
                  )}
                  style={active ? SELECTED_CARD_STYLE : undefined}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "grid h-10 w-10 place-items-center rounded-xl border text-fg-muted",
                        active
                          ? "border-violet/50 text-white"
                          : "border-border-strong bg-surface-2/50"
                      )}
                      style={
                        active
                          ? {
                              background:
                                "linear-gradient(135deg, rgba(145,129,245,0.45), rgba(67,97,252,0.35))",
                            }
                          : undefined
                      }
                    >
                      <Icon size={16} />
                    </span>
                    {m.recommended && (
                      <span
                        className="rounded-full px-2.5 py-1 text-[10.5px] uppercase tracking-[0.14em] text-white"
                        style={{
                          background: BRAND_GRAD,
                          ...TECH_FONT,
                        }}
                      >
                        Recommended
                      </span>
                    )}
                    {!m.enabled && (
                      <span
                        className="rounded-full border border-border bg-surface-2/40 px-2.5 py-1 text-[10.5px] uppercase tracking-[0.14em] text-fg-dim"
                        style={TECH_FONT}
                      >
                        Coming soon
                      </span>
                    )}
                  </div>
                  <h3
                    className="mt-9 text-[19px] font-medium tracking-[-0.01em] text-fg"
                    style={TECH_FONT}
                  >
                    {m.name}
                  </h3>
                  <p
                    className="mt-2 text-[13.5px] leading-relaxed text-fg-muted"
                    style={TECH_FONT}
                  >
                    {m.blurb}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-[1.5rem] border border-border-strong bg-surface/45 p-7 backdrop-blur-md">
              <div
                className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-fg-dim"
                style={TECH_FONT}
              >
                <CalendarDays size={14} />
                Target payoff window
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PAYOFFS.map((p) => {
                  const active = state.payoff === p.months;
                  return (
                    <button
                      key={p.months}
                      onClick={() =>
                        setState((s) => ({ ...s, payoff: p.months }))
                      }
                      className={cn(
                        "rounded-2xl border px-3 py-5 text-center transition-colors",
                        active
                          ? "border-transparent text-fg"
                          : "border-border-strong bg-surface-2/40 text-fg-muted hover:border-violet/40 hover:text-fg"
                      )}
                      style={active ? SELECTED_CARD_STYLE : undefined}
                    >
                      <div
                        className="font-mono text-[24px] tabular-nums text-fg"
                        style={TECH_FONT}
                      >
                        {p.months}
                      </div>
                      <div
                        className="text-[11px] uppercase tracking-[0.14em] text-fg-dim"
                        style={TECH_FONT}
                      >
                        months
                      </div>
                    </button>
                  );
                })}
              </div>
              <p
                className="mt-6 text-[13px] text-fg-muted"
                style={TECH_FONT}
              >
                Target date ·{" "}
                <span className="text-fg">{formatDate(state.payoff)}</span>.
                The agent rebalances more aggressively if you fall behind schedule.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-border-strong bg-surface/45 p-7 backdrop-blur-md">
              <div
                className="text-[11px] uppercase tracking-[0.16em] text-fg-dim"
                style={TECH_FONT}
              >
                Why a window?
              </div>
              <p
                className="mt-4 text-[13.5px] leading-relaxed text-fg-muted"
                style={TECH_FONT}
              >
                Telling the agent your horizon lets it pick the right balance
                between safety and yield. Shorter = more aggressive rebalance,
                longer = lower variance.
              </p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-4 lg:grid-cols-3">
            {riskProfiles.map((p) => {
              const active = state.risk === p.id;
              const Icon = RISK_ICONS[p.id];
              return (
                <button
                  key={p.id}
                  onClick={() => setState((s) => ({ ...s, risk: p.id }))}
                  className={cn(
                    "relative overflow-hidden rounded-[1.5rem] border p-6 text-left transition-all",
                    active
                      ? "border-transparent"
                      : "border-border-strong bg-surface/40 backdrop-blur-md hover:border-violet/40 hover:bg-surface/60"
                  )}
                  style={active ? SELECTED_CARD_STYLE : undefined}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "grid h-10 w-10 place-items-center rounded-xl border text-fg-muted",
                        active
                          ? "border-violet/50 text-white"
                          : "border-border-strong bg-surface-2/50"
                      )}
                      style={
                        active
                          ? {
                              background:
                                "linear-gradient(135deg, rgba(145,129,245,0.45), rgba(67,97,252,0.35))",
                            }
                          : undefined
                      }
                    >
                      <Icon size={16} />
                    </span>
                    <span
                      className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-fg-dim"
                      style={TECH_FONT}
                    >
                      {p.glyph}
                    </span>
                  </div>
                  <h3
                    className="mt-7 text-[22px] font-medium tracking-[-0.01em] text-fg"
                    style={TECH_FONT}
                  >
                    {p.label}
                  </h3>
                  <p
                    className="mt-2 text-[13px] leading-relaxed text-fg-muted"
                    style={TECH_FONT}
                  >
                    {p.blurb}
                  </p>
                  <dl className="mt-6 space-y-2.5 border-t border-border pt-4 text-[12.5px]">
                    <Stat k="LTV" v={`${Math.round(p.ltv * 100)}%`} />
                    <Stat
                      k="Est. APY"
                      v={`${p.apyMin.toFixed(1)}–${p.apyMax.toFixed(1)}%`}
                      accent
                    />
                    <Stat
                      k="Liquidation @"
                      v={formatUSD(BNB_PRICE * (1 - p.liquidationDrop))}
                    />
                    <Stat
                      k="Lista / PancakeSwap"
                      v={`${Math.round(p.listaSplit * 100)} / ${Math.round(p.pancakeSplit * 100)}`}
                    />
                  </dl>
                </button>
              );
            })}
          </div>
        )}

        {step === 5 && (
          <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
            <div className="relative overflow-hidden rounded-[1.5rem] border border-border-strong bg-surface/45 p-7 backdrop-blur-md">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full opacity-50 blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(145,129,245,0.45), transparent 70%)",
                }}
              />
              <div
                className="relative text-[11px] uppercase tracking-[0.16em] text-fg-dim"
                style={TECH_FONT}
              >
                You&apos;re about to
              </div>
              <h2
                className="relative mt-3 text-[28px] font-medium tracking-[-0.015em] text-fg"
                style={TECH_FONT}
              >
                Deposit {state.amount.toLocaleString()} BNB{" "}
                <span className="text-fg-dim">· {formatUSD(usdValue)}</span>
              </h2>

              <ul className="relative mt-7 space-y-3 text-[13.5px]">
                <Confirm
                  icon={<Coins size={14} />}
                  k="Borrow"
                  v={`${formatUSD(borrowed)} USDT`}
                  hint={`Venus · ${Math.round(profile.ltv * 100)}% LTV`}
                />
                <Confirm
                  icon={<ArrowRight size={14} />}
                  k="To your wallet"
                  v={formatUSD(toUser)}
                  hint="60% of borrow · instant"
                  tone="accent"
                />
                <Confirm
                  icon={<Sparkles size={14} />}
                  k="Agent recycles"
                  v={formatUSD(toAgent)}
                  hint={`${Math.round(profile.listaSplit * 100)}% Lista · ${Math.round(profile.pancakeSplit * 100)}% PancakeSwap`}
                />
                <Confirm
                  icon={<CalendarDays size={14} />}
                  k="Target payoff"
                  v={`~${state.payoff} months`}
                  hint={formatDate(state.payoff)}
                />
                <Confirm
                  icon={<Shield size={14} />}
                  k="Liquidation price"
                  v={formatUSD(BNB_PRICE * (1 - profile.liquidationDrop))}
                  hint={`BNB now ${formatUSD(BNB_PRICE)}`}
                />
              </ul>

              <div className="relative mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
                <SecondaryButton onClick={prev} className="flex-1">
                  Back
                </SecondaryButton>
                <PrimaryButton
                  className="flex-[1.4]"
                  onClick={() => {
                    auth.openPosition();
                    window.location.href = "/dashboard";
                  }}
                >
                  <span>Confirm &amp; activate</span>
                  <ArrowRight className="size-4" />
                </PrimaryButton>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-border-strong bg-surface/45 p-6 backdrop-blur-md">
                <div
                  className="text-[11px] uppercase tracking-[0.16em] text-fg-dim"
                  style={TECH_FONT}
                >
                  Manifesto
                </div>
                <p
                  className="mt-3 text-[13.5px] leading-relaxed text-fg-muted"
                  style={TECH_FONT}
                >
                  This activation creates an immutable rule set on BNB Greenfield. Your
                  agent can never deviate from it.
                </p>
                <Link
                  href="/manifesto"
                  className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-violet-soft transition-colors hover:text-white"
                  style={TECH_FONT}
                >
                  Preview the rules <ArrowRight className="size-3.5" />
                </Link>
              </div>
              <div className="rounded-[1.5rem] border border-border-strong bg-surface/45 p-6 backdrop-blur-md">
                <div
                  className="text-[11px] uppercase tracking-[0.16em] text-fg-dim"
                  style={TECH_FONT}
                >
                  Gas
                </div>
                <div
                  className="mt-3 font-mono text-[20px] tabular-nums text-fg"
                  style={TECH_FONT}
                >
                  ~$0.01
                </div>
                <p
                  className="mt-1 text-[12.5px] text-fg-dim"
                  style={TECH_FONT}
                >
                  One transaction · signed in your wallet.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {step < 5 && (
        <div className="flex items-center justify-between gap-3 border-t border-border pt-6">
          <SecondaryButton onClick={prev} disabled={step === 0}>
            <ArrowLeft className="size-3.5" />
            Back
          </SecondaryButton>
          <div
            className="hidden font-mono text-[11px] uppercase tracking-[0.16em] text-fg-dim sm:block"
            style={TECH_FONT}
          >
            Step {String(step + 1).padStart(2, "0")} /{" "}
            {String(STEPS.length).padStart(2, "0")}
          </div>
          <PrimaryButton onClick={next}>
            Continue
            <ArrowRight className="size-4" />
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  className,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group inline-flex h-11 items-center justify-center gap-2.5 rounded-full px-5 text-sm font-medium text-white transition-transform will-change-transform",
        "hover:-translate-y-[1px] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      style={{
        background: BRAND_GRAD,
        boxShadow:
          "0 -4px 7px rgba(50,50,50,0.32) inset, 0 18px 36px -16px rgba(67,97,252,0.6)",
        ...TECH_FONT,
      }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  className,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border-strong bg-surface-2/40 px-5 text-sm font-medium text-fg-muted transition-colors hover:border-violet/40 hover:bg-surface-2/70 hover:text-fg",
        "disabled:cursor-not-allowed disabled:opacity-30",
        className
      )}
      style={TECH_FONT}
    >
      {children}
    </button>
  );
}

function Mini({
  k,
  v,
  hint,
  accent,
}: {
  k: string;
  v: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="mt-4 flex items-center justify-between border-t border-border pt-4 first-of-type:mt-6 first-of-type:border-t-0 first-of-type:pt-6">
      <div>
        <div className="text-[12.5px] text-fg-muted" style={TECH_FONT}>
          {k}
        </div>
        {hint && (
          <div className="mt-0.5 text-[11px] text-fg-dim" style={TECH_FONT}>
            {hint}
          </div>
        )}
      </div>
      <span
        className={cn(
          "font-mono text-[15px] tabular-nums",
          accent ? "text-violet-soft" : "text-fg"
        )}
        style={TECH_FONT}
      >
        {v}
      </span>
    </div>
  );
}

function Stat({
  k,
  v,
  accent,
}: {
  k: string;
  v: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-fg-dim" style={TECH_FONT}>
        {k}
      </span>
      <span
        className={cn(
          "font-mono tabular-nums",
          accent ? "text-violet-soft" : "text-fg-muted"
        )}
        style={TECH_FONT}
      >
        {v}
      </span>
    </div>
  );
}

function Confirm({
  icon,
  k,
  v,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  k: string;
  v: string;
  hint: string;
  tone?: "accent";
}) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface-2/40 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-xl border border-border-strong bg-surface-2/60 text-fg-muted">
          {icon}
        </span>
        <div>
          <div className="text-fg" style={TECH_FONT}>
            {k}
          </div>
          <div className="mt-0.5 text-[11.5px] text-fg-dim" style={TECH_FONT}>
            {hint}
          </div>
        </div>
      </div>
      <span
        className={cn(
          "font-mono text-[15px] tabular-nums",
          tone === "accent" ? "text-violet-soft" : "text-fg"
        )}
        style={TECH_FONT}
      >
        {v}
      </span>
    </li>
  );
}

function formatDate(monthsFromNow: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsFromNow);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}
