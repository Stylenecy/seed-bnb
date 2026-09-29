"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ArrowRight, ScrollText, BookOpen, ShieldCheck, Sparkles } from "lucide-react";

const TECH: React.CSSProperties = {
  fontFamily: "var(--font-tech), ui-sans-serif, system-ui",
};

const LEARN_LINKS = [
  { label: "How it works", href: "/#how", icon: BookOpen },
  { label: "FAQ", href: "/#faq", icon: ScrollText },
  { label: "Risk disclosure", href: "/manifesto", icon: ShieldCheck },
];

/**
 * README §10 — Empty State
 * Shown when the user is signed in but hasPosition() === false.
 */
export function DashboardEmpty() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-de-eyebrow]", {
        y: 12,
        opacity: 0,
        duration: 0.6,
        ease: "expo.out",
      });
      gsap.from("[data-de-headline]", {
        y: 20,
        opacity: 0,
        duration: 0.85,
        delay: 0.08,
        ease: "expo.out",
      });
      gsap.from("[data-de-body]", {
        y: 12,
        opacity: 0,
        duration: 0.65,
        delay: 0.25,
        ease: "expo.out",
      });
      gsap.from("[data-de-cta]", {
        y: 12,
        opacity: 0,
        duration: 0.6,
        delay: 0.4,
        ease: "expo.out",
      });
      gsap.from("[data-de-learn]", {
        y: 18,
        opacity: 0,
        duration: 0.55,
        delay: 0.55,
        stagger: 0.08,
        ease: "expo.out",
      });
      // Floating decorative orb
      gsap.to("[data-de-orb]", {
        y: -12,
        duration: 3.4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      className="mx-auto w-full max-w-[860px] py-10 sm:py-14"
      style={TECH}
    >
      <article className="relative overflow-hidden rounded-[2rem] border border-border-strong/60 bg-surface/45 p-8 backdrop-blur-md sm:p-12">
        {/* Decorative atmosphere */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(60% 50% at 80% 20%, rgba(145,129,245,0.18), transparent 70%), radial-gradient(45% 35% at 20% 80%, rgba(255,122,144,0.10), transparent 70%)",
          }}
        />
        <div
          data-de-orb
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 grid h-28 w-28 place-items-center rounded-full will-change-transform"
          style={{
            background:
              "radial-gradient(circle, rgba(145,129,245,0.35), transparent 70%)",
            filter: "blur(12px)",
          }}
        />

        <div className="relative">
          <span
            data-de-eyebrow
            className="inline-flex items-center gap-2 rounded-full border border-border-strong/60 bg-surface-2/40 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-fg-muted"
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-violet-soft animate-pulse-soft"
              style={{ boxShadow: "0 0 6px rgba(145,129,245,0.9)" }}
            />
            Welcome to Equinox
          </span>
          <h1
            data-de-headline
            className="mt-5 text-[clamp(2rem,3.4vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.02em] text-fg"
          >
            No active position yet.
            <br />
            <span className="text-fg-muted">Let the agent get to work.</span>
          </h1>
          <p
            data-de-body
            className="mt-5 max-w-md text-[14.5px] leading-relaxed text-fg-muted"
          >
            Deposit BNB, pick a risk profile, and the agent borrows USDT,
            allocates to the best lend venues, and captures the spread to
            auto-repay your debt. You watch nothing.
          </p>

          <div data-de-cta className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/onboarding"
              className="group inline-flex h-12 items-center gap-3 rounded-full px-6 text-[14px] font-medium text-white transition-transform will-change-transform hover:-translate-y-[1px]"
              style={{
                background: "var(--gradient-brand)",
                boxShadow:
                  "0 -4px 7px rgba(50,50,50,0.32) inset, 0 22px 50px -18px rgba(67,97,252,0.55)",
              }}
            >
              <Sparkles size={15} />
              Open position
              <span
                aria-hidden
                className="grid size-7 place-items-center rounded-full bg-white/15"
              >
                <ArrowRight size={14} />
              </span>
            </Link>
            <span className="text-[12px] text-fg-dim">
              ~90 seconds · no seed phrase
            </span>
          </div>
        </div>
      </article>

      <div className="mt-8">
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-dim">
          Or learn more first
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {LEARN_LINKS.map((l) => {
            const Icon = l.icon;
            return (
              <li key={l.href} data-de-learn>
                <Link
                  href={l.href}
                  className="group flex items-center gap-3 rounded-2xl border border-border-strong/60 bg-surface/30 p-4 transition-all hover:-translate-y-[1px] hover:border-border-strong hover:bg-surface/50"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl border border-border-strong/60 bg-surface-2/40 text-fg-muted transition-colors group-hover:text-fg">
                    <Icon size={14} strokeWidth={1.8} />
                  </span>
                  <span className="text-[13.5px] text-fg">{l.label}</span>
                  <ArrowRight
                    size={14}
                    className="ml-auto text-fg-dim transition-all group-hover:translate-x-0.5 group-hover:text-fg-muted"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
