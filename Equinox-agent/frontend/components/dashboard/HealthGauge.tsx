"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { mockPosition, BNB_PRICE } from "@/data/mock";
import { formatUSD } from "@/lib/format";

const TECH: React.CSSProperties = {
  fontFamily: "var(--font-tech), ui-sans-serif, system-ui",
};

function statusForHF(hf: number) {
  if (hf >= 1.5)
    return { label: "Safe", color: "#16d9a8", soft: "#6cf2cc" };
  if (hf >= 1.3)
    return { label: "Caution", color: "#ffc46b", soft: "#ffd49a" };
  return { label: "Defense active", color: "#ff7a90", soft: "#ff9aae" };
}

export function HealthGauge() {
  const ref = useRef<HTMLDivElement | null>(null);
  const arcRef = useRef<SVGCircleElement | null>(null);
  const numRef = useRef<HTMLSpanElement | null>(null);

  const hf = mockPosition.healthFactor;
  const status = statusForHF(hf);

  // Map HF to 0..1 fill (cap at 2.5)
  const fill = Math.min(1, Math.max(0, (hf - 1.0) / 1.5));

  // Arc circumference
  const r = 86;
  const C = 2 * Math.PI * r;
  const dash = C * 0.75;
  const offset = dash * (1 - fill);

  useEffect(() => {
    const arc = arcRef.current;
    const num = numRef.current;
    if (!arc) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      arc.style.strokeDashoffset = String(offset);
      if (num) num.textContent = hf.toFixed(2);
      return;
    }
    gsap.fromTo(
      arc,
      { strokeDashoffset: dash },
      {
        strokeDashoffset: offset,
        duration: 1.6,
        ease: "expo.out",
      }
    );
    if (num) {
      const obj = { v: 0 };
      gsap.to(obj, {
        v: hf,
        duration: 1.5,
        ease: "expo.out",
        onUpdate: () => {
          num.textContent = obj.v.toFixed(2);
        },
      });
    }
  }, [offset, dash, hf]);

  return (
    <article
      ref={ref}
      className="relative overflow-hidden rounded-3xl border border-border-strong/60 bg-surface/45 p-6 backdrop-blur-md"
      style={TECH}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 right-[-15%] h-44 w-44 rounded-full blur-3xl"
        style={{ background: `${status.color}26` }}
      />
      <div className="relative flex items-center justify-between">
        <span className="text-[10.5px] uppercase tracking-[0.18em] text-fg-dim">
          Health Factor
        </span>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] uppercase tracking-[0.14em]"
          style={{
            color: status.color,
            background: `${status.color}1a`,
            boxShadow: `0 0 0 1px ${status.color}55`,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse-soft"
            style={{
              background: status.color,
              boxShadow: `0 0 6px ${status.color}cc`,
            }}
          />
          {status.label}
        </span>
      </div>

      <div className="relative mx-auto mt-4 flex h-[200px] w-full max-w-[240px] items-center justify-center">
        <svg
          viewBox="0 0 200 200"
          className="absolute inset-0 -rotate-[225deg]"
          aria-hidden
        >
          <defs>
            <linearGradient id="hf-track" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.03)" />
            </linearGradient>
            <linearGradient id="hf-fill" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor={status.color} />
              <stop offset="100%" stopColor={status.soft} />
            </linearGradient>
          </defs>
          <circle
            cx="100"
            cy="100"
            r="86"
            fill="none"
            stroke="url(#hf-track)"
            strokeWidth="10"
            strokeDasharray={`${dash} ${C}`}
            strokeLinecap="round"
          />
          <circle
            ref={arcRef}
            cx="100"
            cy="100"
            r="86"
            fill="none"
            stroke="url(#hf-fill)"
            strokeWidth="10"
            strokeDasharray={`${dash} ${C}`}
            strokeDashoffset={dash}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 14px ${status.color}90)`,
            }}
          />
        </svg>
        <div className="flex flex-col items-center">
          <span
            ref={numRef}
            className="text-[44px] font-medium leading-none tracking-tight tab-nums"
            style={{ color: status.color }}
          >
            0.00
          </span>
          <span className="mt-2 text-[11px] uppercase tracking-[0.18em] text-fg-dim">
            HF
          </span>
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-3 border-t border-border/60 pt-5">
        <Stat
          label="Liquidation"
          value={formatUSD(mockPosition.liquidationPrice, { decimals: 2 })}
        />
        <Stat
          label="BNB now"
          value={formatUSD(BNB_PRICE, { decimals: 2 })}
        />
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.16em] text-fg-dim">
        {label}
      </div>
      <div className="mt-1.5 font-mono text-[15px] text-fg tab-nums">{value}</div>
    </div>
  );
}
