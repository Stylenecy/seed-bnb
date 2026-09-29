"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { mockPosition, repaymentProgress } from "@/data/mock";
import { formatUSD } from "@/lib/format";

const TECH: React.CSSProperties = {
  fontFamily: "var(--font-tech), ui-sans-serif, system-ui",
};

export function RepaymentProgress() {
  const fillRef = useRef<HTMLDivElement | null>(null);
  const pctRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!fillRef.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      fillRef.current.style.width = `${repaymentProgress.percent}%`;
      if (pctRef.current) pctRef.current.textContent = `${repaymentProgress.percent}%`;
      return;
    }
    gsap.fromTo(
      fillRef.current,
      { width: 0 },
      {
        width: `${repaymentProgress.percent}%`,
        duration: 1.4,
        ease: "expo.out",
      }
    );
    if (pctRef.current) {
      const obj = { v: 0 };
      const el = pctRef.current;
      gsap.to(obj, {
        v: repaymentProgress.percent,
        duration: 1.4,
        ease: "expo.out",
        onUpdate: () => {
          el.textContent = `${Math.round(obj.v)}%`;
        },
      });
    }
  }, []);

  return (
    <article
      className="relative overflow-hidden rounded-3xl border border-border-strong/60 bg-surface/45 p-6 backdrop-blur-md"
      style={TECH}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 right-[-15%] h-44 w-56 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(145,129,245,0.22), transparent 70%)",
        }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <span className="text-[10.5px] uppercase tracking-[0.18em] text-fg-dim">
            Debt repayment
          </span>
          <h3 className="mt-2 text-[18px] font-medium tracking-[-0.01em] text-fg">
            On track to clear by{" "}
            <span className="text-fg-muted">
              {repaymentProgress.projectedPayoff}
            </span>
          </h3>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-emerald)]"
          style={{
            background: "rgba(22,217,168,0.12)",
            boxShadow: "0 0 0 1px rgba(22,217,168,0.4)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full bg-[var(--color-emerald)] animate-pulse-soft"
            style={{ boxShadow: "0 0 6px rgba(22,217,168,0.9)" }}
          />
          On schedule
        </span>
      </div>

      <div className="relative mt-7">
        <div className="flex items-baseline justify-between text-[12px]">
          <span className="text-fg-dim">
            <span ref={pctRef}>0%</span> repaid
          </span>
          <span className="font-mono tabular-nums text-fg-muted">
            {formatUSD(
              mockPosition.originalDebtUsdt - mockPosition.activeDebtUsdt
            )}{" "}
            of {formatUSD(mockPosition.originalDebtUsdt)}
          </span>
        </div>
        <div className="relative mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
          <div
            ref={fillRef}
            className="h-full rounded-full"
            style={{
              width: 0,
              background: "var(--gradient-brand)",
              boxShadow: "0 0 16px rgba(145,129,245,0.5)",
            }}
          />
          {/* tick marks */}
          {[25, 50, 75].map((t) => (
            <span
              key={t}
              className="absolute top-0 h-full w-px bg-bg/70"
              style={{ left: `${t}%` }}
              aria-hidden
            />
          ))}
        </div>
      </div>

      <div className="relative mt-8 grid grid-cols-2 gap-4 border-t border-border/60 pt-5 sm:grid-cols-4">
        <Stat label="Original" value={formatUSD(mockPosition.originalDebtUsdt)} />
        <Stat
          label="Current"
          value={formatUSD(mockPosition.activeDebtUsdt)}
          accent="violet"
        />
        <Stat
          label="Days active"
          value={`${mockPosition.daysActive}`}
          mono
        />
        <Stat
          label="Spread captured"
          value={formatUSD(mockPosition.spreadCapturedTotal)}
          accent="emerald"
        />
      </div>
    </article>
  );
}

function Stat({
  label,
  value,
  accent,
  mono,
}: {
  label: string;
  value: string;
  accent?: "violet" | "emerald";
  mono?: boolean;
}) {
  const color =
    accent === "violet"
      ? "text-violet-soft"
      : accent === "emerald"
        ? "text-[var(--color-emerald-soft)]"
        : "text-fg";
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.16em] text-fg-dim">
        {label}
      </div>
      <div
        className={`mt-1.5 ${mono ? "font-mono" : "tab-nums"} text-[16px] ${color}`}
      >
        {value}
      </div>
    </div>
  );
}
