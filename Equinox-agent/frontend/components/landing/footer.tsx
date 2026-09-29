"use client";

import Link from "next/link";
import { ArrowUp } from "lucide-react";

const navLeft = [
  { label: "HOME", href: "#top" },
  { label: "GITHUB", href: "https://github.com/EzraNahumury" },
  { label: "DASHBOARD", href: "/dashboard" },
  { label: "MANIFESTO", href: "/manifesto" },
  { label: "ONBOARDING", href: "/onboarding" },
];

const navRight = [
  { label: "BNB CHAIN DOCS", href: "https://docs.bnbchain.org/" },
  { label: "VENUS", href: "https://venus.io/" },
];

function backToTop() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function Footer() {
  return (
    <footer className="relative isolate overflow-hidden bg-bg pt-20 sm:pt-24">
      <div className="relative mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-start">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="grid size-7 place-items-center rounded-full ring-conic"
              >
                <span className="size-5 rounded-full bg-bg" />
              </span>
              <span
                className="text-sm font-semibold tracking-wide text-fg"
                style={{
                  fontFamily:
                    "var(--font-tech), ui-sans-serif, system-ui",
                }}
              >
                EQUINOX AGENT
              </span>
            </div>
          </div>

          {/* Nav column 1 */}
          <ul
            className="flex flex-col gap-3"
            style={{
              fontFamily:
                "var(--font-tech), ui-sans-serif, system-ui",
            }}
          >
            {navLeft.map((link) => {
              const external = /^https?:/.test(link.href);
              const Comp = external ? "a" : "a";
              return (
                <li key={link.label}>
                  <Comp
                    href={link.href}
                    {...(external
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                    className="text-[15px] font-semibold uppercase tracking-[0.08em] text-fg transition-colors hover:text-fg-muted"
                  >
                    {link.label}
                  </Comp>
                </li>
              );
            })}
          </ul>

          {/* Nav column 2 */}
          <ul
            className="flex flex-col gap-3"
            style={{
              fontFamily:
                "var(--font-tech), ui-sans-serif, system-ui",
            }}
          >
            {navRight.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[15px] font-semibold uppercase tracking-[0.08em] text-fg transition-colors hover:text-fg-muted"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Back to top button */}
          <button
            type="button"
            onClick={backToTop}
            className="group flex h-[150px] w-full items-center justify-center rounded-[24px] border border-border bg-white/[0.02] text-fg transition-colors hover:bg-white/[0.05] lg:w-[260px]"
            style={{
              fontFamily:
                "var(--font-tech), ui-sans-serif, system-ui",
            }}
          >
            <span className="flex items-center gap-3 text-lg font-medium">
              <ArrowUp className="size-5 transition-transform group-hover:-translate-y-0.5" />
              Back to top
            </span>
          </button>
        </div>

        {/* Big watermark */}
        <div
          aria-hidden
          className="pointer-events-none mt-12 select-none overflow-hidden text-center"
        >
          <span
            className="block bg-gradient-to-b from-white/[0.06] to-white/[0.01] bg-clip-text text-transparent"
            style={{
              fontFamily:
                "var(--font-tech), ui-sans-serif, system-ui",
              fontSize: "clamp(4rem, 16vw, 14rem)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 0.85,
            }}
          >
            EQUINOX AGENT
          </span>
        </div>

        {/* Copyright bottom bar */}
        <div className="relative mt-6 flex flex-col items-start justify-between gap-2 border-t border-border/60 py-6 text-xs text-fg-dim sm:flex-row sm:items-center">
          <p
            style={{
              fontFamily:
                "var(--font-tech), ui-sans-serif, system-ui",
            }}
          >
            © 2026 Equinox Agent. Self-repaying loans on BNB Chain.
          </p>
          <p
            style={{
              fontFamily:
                "var(--font-tech), ui-sans-serif, system-ui",
            }}
          >
            Venus · Lista · PancakeSwap · Greenfield manifesto.
          </p>
        </div>
      </div>
    </footer>
  );
}
