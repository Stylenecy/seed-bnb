"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { HalftoneField } from "../visuals/halftone-field";
import { StackMarquee } from "./stack-marquee";

type Card = {
  title: string;
  href: string;
  external?: boolean;
  brand: "equinox-core" | "greenfield";
};

const CARDS: Card[] = [
  {
    title: "Audit-ready",
    href: "https://github.com/EzraNahumury",
    external: true,
    brand: "equinox-core",
  },
  {
    title: "Manifesto on BNB Greenfield",
    href: "https://docs.bnbchain.org/",
    external: true,
    brand: "greenfield",
  },
];

export function SecurityIntegrations() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;

      gsap.fromTo(
        ".si-title-line",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: ref.current, start: "top 78%" },
        }
      );

      gsap.fromTo(
        ".si-body",
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.25,
          ease: "expo.out",
          scrollTrigger: { trigger: ref.current, start: "top 78%" },
        }
      );

      gsap.fromTo(
        ".si-card",
        { opacity: 0, y: 60, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.15,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: ".si-cards", start: "top 80%" },
        }
      );

      gsap.fromTo(
        ".si-partners-label",
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "expo.out",
          scrollTrigger: { trigger: ".si-partners-label", start: "top 92%" },
        }
      );
    },
    { scope: ref }
  );

  return (
    <section
      id="security"
      ref={ref}
      className="relative isolate overflow-hidden pb-24 pt-28 sm:pt-36"
    >
      {/* Animated halftone bg covers the whole upper section */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[820px]">
        <HalftoneField />
        {/* Top mask */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-24"
          style={{
            background: "linear-gradient(to bottom, var(--color-bg), transparent)",
          }}
        />
        {/* Bottom mask */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-32"
          style={{
            background: "linear-gradient(to top, var(--color-bg), transparent)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-6 lg:px-10">
        {/* Header */}
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start lg:gap-16">
          <h2
            className="text-[clamp(2.4rem,5.4vw,4.6rem)] font-medium leading-[1.02] tracking-[-0.02em] text-fg"
            style={{
              fontFamily: "var(--font-tech), ui-sans-serif, system-ui",
            }}
          >
            <span className="si-title-line block overflow-hidden">
              <span className="inline-block">Security &</span>
            </span>
            <span className="si-title-line block overflow-hidden">
              <span className="inline-block">Integrations</span>
            </span>
          </h2>

          <div className="si-body flex max-w-md items-start gap-3 self-end">
            <span
              aria-hidden
              className="mt-[6px] grid size-5 place-items-center rounded-full border border-border-strong text-fg-dim"
            >
              <Plus className="size-3" />
            </span>
            <p
              className="text-sm leading-relaxed text-fg-muted sm:text-[15px]"
              style={{ fontFamily: "var(--font-tech), ui-sans-serif, system-ui" }}
            >
              Your collateral never leaves the position contract, the agent&apos;s
              behavior is pinned to an immutable manifesto on BNB Greenfield, and every
              borrow, lend, and defense event is recorded onchain. A formal
              third-party audit is scheduled ahead of mainnet launch on BNB Chain.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="si-cards mt-24 flex flex-wrap items-center justify-center gap-5 sm:gap-6">
          {CARDS.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              {...(c.external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="si-card group relative flex h-[270px] w-[238px] flex-col rounded-[20px] bg-white text-bg shadow-[0_24px_50px_-22px_rgba(0,0,0,0.55)] transition-transform duration-500 hover:-translate-y-1.5"
            >
              <div className="px-5 pt-5">
                <h3
                  className="text-[15px] font-semibold tracking-tight text-bg"
                  style={{
                    fontFamily: "var(--font-tech), ui-sans-serif, system-ui",
                  }}
                >
                  {c.title}
                </h3>
              </div>

              {/* Logo plate */}
              <div className="relative mx-5 mt-3 flex flex-1 items-center justify-center overflow-hidden rounded-[12px] bg-gradient-to-br from-[#f5f6fa] to-[#e6e9f1]">
                <BrandChip kind={c.brand} />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(15,15,15,0.06) 1px, transparent 1px)",
                    backgroundSize: "6px 6px",
                    maskImage:
                      "radial-gradient(ellipse at center, transparent 55%, black 90%)",
                    WebkitMaskImage:
                      "radial-gradient(ellipse at center, transparent 55%, black 90%)",
                  }}
                />
              </div>

              <div className="flex items-center justify-between px-5 pb-4 pt-4">
                <span
                  className="text-[14px] font-medium text-bg"
                  style={{
                    fontFamily: "var(--font-tech), ui-sans-serif, system-ui",
                  }}
                >
                  See Report
                </span>
                <span
                  aria-hidden
                  className="relative grid size-9 place-items-center overflow-hidden rounded-full text-white"
                >
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{ background: "var(--gradient-brand)" }}
                  />
                  <span
                    className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background:
                        "linear-gradient(0deg, rgba(255,255,255,0.35), rgba(255,255,255,0.35)), var(--gradient-brand)",
                    }}
                  />
                  <ArrowUpRight className="relative size-3.5 transition-transform duration-300 group-hover:translate-x-[1px] group-hover:-translate-y-[1px]" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Partners */}
      <div className="relative mt-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <p
            className="si-partners-label text-[clamp(1.4rem,2.6vw,2rem)] font-medium tracking-[-0.01em] text-fg"
            style={{
              fontFamily: "var(--font-tech), ui-sans-serif, system-ui",
            }}
          >
            Partners
          </p>
        </div>
        <div className="mt-7">
          <StackMarquee variant="bare" />
        </div>
      </div>
    </section>
  );
}

function BrandChip({ kind }: { kind: "equinox-core" | "greenfield" }) {
  if (kind === "equinox-core") {
    return (
      <div
        className="relative z-10 inline-flex items-center gap-2.5 rounded-full bg-white px-4 py-2 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_8px_22px_-12px_rgba(15,15,15,0.35)]"
        style={{
          fontFamily: "var(--font-tech), ui-sans-serif, system-ui",
        }}
      >
        <span
          aria-hidden
          className="grid size-6 place-items-center rounded-md text-[#0a0a0a]"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="8 5 3 12 8 19" />
            <polyline points="16 5 21 12 16 19" />
          </svg>
        </span>
        <span className="text-[14px] font-semibold tracking-tight text-[#0a0a0a]">
          Equinox <span className="font-medium text-[#0a0a0a]/65">Core</span>
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative z-10 inline-flex items-center gap-2.5 rounded-full bg-white px-4 py-2 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_8px_22px_-12px_rgba(15,15,15,0.35)]"
      style={{
        fontFamily: "var(--font-tech), ui-sans-serif, system-ui",
      }}
    >
      <span aria-hidden className="grid size-6 place-items-center text-[#0a0a0a]">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" strokeWidth="2" stroke="currentColor" strokeLinejoin="round">
          <path d="M12 2 3 7v10l9 5 9-5V7z" />
        </svg>
      </span>
      <span className="text-[14px] font-semibold tracking-tight text-[#0a0a0a]">
        BNB Greenfield <span className="font-medium text-[#0a0a0a]/65">pinned</span>
      </span>
    </div>
  );
}
