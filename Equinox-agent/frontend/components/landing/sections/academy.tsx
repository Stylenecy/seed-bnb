"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Eye,
  Bot,
  Lock,
  Cpu,
  Plus,
  Shield,
} from "lucide-react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";

const tabs = [
  { icon: BookOpen, label: "Getting Started", iconClass: "text-amber-600" },
  { icon: Eye, label: "How spread works", iconClass: "text-[#0a0a0a]/55" },
  { icon: Bot, label: "Agent & Manifesto", iconClass: "text-emerald-600" },
  { icon: Lock, label: "Defense engine", iconClass: "text-amber-500" },
  { icon: Cpu, label: "Risk profiles", iconClass: "text-[#0a0a0a]/55" },
  { icon: Plus, label: "And more", disabled: true },
];

const articles = [
  {
    title: "Equinox in 60 seconds",
    body:
      "Sign in, deposit BNB, pick Balanced (LTV 55%). The agent borrows USDT on Venus, allocates to Lista and PancakeSwap, and the spread auto-repays your debt — every block.",
  },
  {
    title: "How spread capture works",
    body:
      "Borrow APR on Venus is lower than lend APR on Lista and PancakeSwap. The agent locks the differential continuously and applies it to your active debt. No manual repayment ever.",
  },
  {
    title: "Reading your Manifesto",
    body:
      "Every position pins a manifesto to BNB Greenfield: LTV target, max LTV, defense thresholds, recycle ratio, buffer, allocation caps. The agent cannot deviate — verify any time from the dashboard.",
  },
];

export function Academy() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;

      // Title: char-level slide-up from line mask
      gsap.fromTo(
        ".academy-char",
        { yPercent: 110, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          stagger: 0.04,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: ref.current, start: "top 78%" },
        }
      );

      // CTA: scale + fade
      gsap.fromTo(
        ".academy-cta",
        { opacity: 0, y: 22, scale: 0.92 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.85,
          ease: "expo.out",
          scrollTrigger: { trigger: ref.current, start: "top 72%" },
        }
      );

      // Tabs: stagger with slight scale bounce
      gsap.fromTo(
        ".academy-tab",
        { opacity: 0, y: 18, scale: 0.92 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.06,
          duration: 0.7,
          ease: "back.out(1.6)",
          scrollTrigger: { trigger: ".academy-tabs", start: "top 82%" },
        }
      );

      // Cards: tilt-fade-up with overlap
      gsap.fromTo(
        ".academy-card",
        { opacity: 0, y: 60, scale: 0.94, rotateX: 8 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          stagger: 0.12,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: ".academy-grid", start: "top 85%" },
        }
      );

      // Inner card content (title + body) staggers separately
      gsap.fromTo(
        ".academy-card-title",
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.12,
          duration: 0.7,
          delay: 0.4,
          ease: "expo.out",
          scrollTrigger: { trigger: ".academy-grid", start: "top 85%" },
        }
      );
      gsap.fromTo(
        ".academy-card-body",
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.12,
          duration: 0.7,
          delay: 0.55,
          ease: "expo.out",
          scrollTrigger: { trigger: ".academy-grid", start: "top 85%" },
        }
      );

      // Cards parallax — subtle vertical drift on scroll
      const cards = gsap.utils.toArray<HTMLElement>(".academy-card");
      cards.forEach((card, i) => {
        gsap.to(card, {
          y: -10 - i * 4,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.5,
          },
        });
      });

      return () => {
        ScrollTrigger.getAll().forEach((st) => {
          if (st.trigger && ref.current?.contains(st.trigger as Element)) {
            st.kill();
          }
        });
      };
    },
    { scope: ref }
  );

  return (
    <section
      id="academy"
      ref={ref}
      className="relative bg-white pb-24 pt-16 sm:pb-28 sm:pt-20 lg:pb-32 lg:pt-24"
    >
      <div className="mx-auto max-w-[1320px] px-6 sm:px-10 lg:px-16">
        <h2
          className="text-center text-[clamp(2rem,5vw,4.4rem)] font-medium leading-[1.05] tracking-[-0.02em] text-[#0a0a0a]"
          style={{
            fontFamily:
              "var(--font-tech), ui-sans-serif, system-ui, -apple-system",
          }}
        >
          <span className="inline-flex overflow-hidden align-baseline">
            {"Academy".split("").map((ch, i) => (
              <span
                key={i}
                className="academy-char inline-block will-change-transform"
              >
                {ch}
              </span>
            ))}
          </span>
        </h2>

        <div className="academy-cta mt-8 flex justify-center">
          <Link
            href="https://github.com/EzraNahumury"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2.5 rounded-full bg-white py-1.5 pl-5 pr-1.5 ring-1 ring-[#0a0a0a]/10 text-[#0a0a0a] shadow-sm transition-all hover:shadow-md hover:ring-[#0a0a0a]/20"
          >
            <span className="text-sm font-medium">Go to documents</span>
            <span
              aria-hidden
              className="grid size-9 place-items-center rounded-full text-white shadow-[0_-4px_8px_rgba(255,255,255,0.25)_inset]"
              style={{ background: "var(--gradient-brand)" }}
            >
              <ArrowRight className="size-4" />
            </span>
          </Link>
        </div>

        <div className="academy-tabs mt-14 flex flex-wrap items-center justify-center gap-3 lg:mt-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <div
                key={tab.label}
                className={`academy-tab inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 ring-1 transition-colors ${
                  tab.disabled
                    ? "bg-[#0a0a0a]/[0.02] text-[#0a0a0a]/40 ring-[#0a0a0a]/5"
                    : "bg-white text-[#0a0a0a] ring-[#0a0a0a]/10 hover:ring-[#0a0a0a]/20"
                }`}
              >
                <Icon
                  className={`size-4 ${
                    tab.disabled
                      ? "text-[#0a0a0a]/30"
                      : tab.iconClass ?? "text-[#0a0a0a]/55"
                  }`}
                />
                <span
                  className="text-sm font-medium"
                  style={{
                    fontFamily:
                      "var(--font-tech), ui-sans-serif, system-ui",
                  }}
                >
                  {tab.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="academy-grid mt-12 grid grid-cols-1 gap-5 md:grid-cols-3 lg:mt-14">
          {articles.map((article) => (
            <article
              key={article.title}
              className="academy-card group relative flex flex-col overflow-hidden rounded-[1.75rem] bg-[#0a0a0a]/[0.04] p-6 pb-16 will-change-transform transition-colors hover:bg-[#0a0a0a]/[0.06] sm:p-7 sm:pb-20 [transform-style:preserve-3d]"
            >
              <div className="grid size-10 place-items-center rounded-full bg-[#0a0a0a] text-white">
                <Shield className="size-4" strokeWidth={1.6} />
              </div>

              <h3
                className="academy-card-title mt-6 text-base font-semibold leading-snug text-[#0a0a0a] sm:text-lg"
                style={{
                  fontFamily:
                    "var(--font-tech), ui-sans-serif, system-ui",
                }}
              >
                {article.title}
              </h3>
              <p
                className="academy-card-body mt-3 text-sm leading-relaxed text-[#0a0a0a]/60"
                style={{
                  fontFamily:
                    "var(--font-tech), ui-sans-serif, system-ui",
                }}
              >
                {article.body}
              </p>

              <div className="absolute bottom-5 right-5 grid size-9 place-items-center rounded-full bg-white text-[#0a0a0a] ring-1 ring-[#0a0a0a]/10 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                <ArrowUpRight className="size-4" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
