"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { nav } from "@/lib/content";
import { cn } from "@/lib/cn";
import { LoginModal } from "@/components/modals/LoginModal";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useGSAP(
    () => {
      gsap.from(".nav-item", {
        y: -14,
        opacity: 0,
        stagger: 0.06,
        delay: 0.1,
        duration: 0.7,
        ease: "expo.out",
      });
    },
    { scope: wrapperRef }
  );

  useGSAP(
    () => {
      if (!mobilePanelRef.current) return;
      if (open) {
        gsap.fromTo(
          mobilePanelRef.current,
          { opacity: 0, y: -8 },
          { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }
        );
        gsap.fromTo(
          mobilePanelRef.current.querySelectorAll(".m-link"),
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, stagger: 0.05, duration: 0.35, ease: "power3.out" }
        );
      }
    },
    { dependencies: [open] }
  );

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        scrolled
          ? "border-b border-border-strong/60 bg-bg/65 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="relative mx-auto flex h-16 max-w-[1400px] items-center px-4 sm:h-20 sm:px-8">
        {/* Left — primary links */}
        <nav className="hidden items-center gap-1 md:flex">
          {nav.links.slice(0, 3).map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              className="nav-item rounded-full px-3 py-1.5 text-[12px] uppercase tracking-[0.16em] text-fg-muted transition-colors hover:text-fg"
            >
              {i === 1 ? (
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden className="text-fg-dim">▸</span>
                  {l.label}
                </span>
              ) : (
                l.label
              )}
            </a>
          ))}
          {nav.links.slice(3).map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="nav-item rounded-full px-3 py-1.5 text-[12px] uppercase tracking-[0.16em] text-fg-muted transition-colors hover:text-fg"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Centered brand */}
        <Link
          href="#top"
          className="nav-item absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 text-sm font-semibold tracking-tight"
        >
          <span
            aria-hidden
            className="grid size-7 place-items-center rounded-full ring-conic"
          >
            <span className="size-5 rounded-full bg-bg" />
          </span>
          <span className="hidden sm:inline">{nav.brand}</span>
        </Link>

        {/* Right — CTA pill */}
        <div className="ml-auto hidden md:block">
          <span className="nav-item inline-block">
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="group inline-flex items-center gap-2.5 rounded-full px-5 py-2 text-sm font-medium text-white shadow-[0_-4px_7px_rgba(50,50,50,0.32)_inset] transition-transform hover:-translate-y-[1px]"
              style={{ background: "var(--gradient-brand)" }}
            >
              <span>{nav.cta.label}</span>
              <span
                aria-hidden
                className="grid size-6 place-items-center rounded-full bg-white/15"
              >
                <ArrowUpRight className="size-3.5" />
              </span>
            </button>
          </span>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto grid size-9 place-items-center rounded-full border border-border-strong bg-white/[0.04] text-fg md:hidden"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {open && (
        <div
          ref={mobilePanelRef}
          className="border-t border-border bg-bg/95 px-4 pb-5 pt-3 backdrop-blur-xl md:hidden"
        >
          <div className="flex flex-col gap-1">
            {nav.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="m-link rounded-2xl px-4 py-3 text-sm uppercase tracking-wider text-fg-muted transition-colors hover:bg-white/[0.04] hover:text-fg"
              >
                {l.label}
              </a>
            ))}
            <div className="m-link mt-2 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setLoginOpen(true);
                }}
                className="group inline-flex items-center gap-2.5 rounded-full px-5 py-2 text-sm font-medium text-white shadow-[0_-4px_7px_rgba(50,50,50,0.32)_inset]"
                style={{ background: "var(--gradient-brand)" }}
              >
                <span>{nav.cta.label}</span>
                <span
                  aria-hidden
                  className="grid size-6 place-items-center rounded-full bg-white/15"
                >
                  <ArrowUpRight className="size-3.5" />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
