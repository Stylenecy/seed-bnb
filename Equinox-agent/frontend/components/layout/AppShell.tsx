"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ScrollText,
  Settings,
  Bell,
  ChevronDown,
  Menu,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";
import { ConnectWalletButton } from "@/components/dashboard/ConnectWalletButton";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/withdraw", label: "Withdraw", icon: Wallet },
  { href: "/manifesto", label: "Manifesto", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

const TECH_FONT: React.CSSProperties = {
  fontFamily: "var(--font-tech), ui-sans-serif, system-ui",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);

  // Entrance: sidebar slides in from the left, top bar fades, main fades up.
  useEffect(() => {
    if (!shellRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(".as-sidebar", {
        x: -12,
        opacity: 0,
        duration: 0.7,
        ease: "expo.out",
      });
      gsap.from(".as-topbar", {
        y: -8,
        opacity: 0,
        duration: 0.55,
        delay: 0.1,
        ease: "expo.out",
      });
      gsap.from(".as-main", {
        y: 14,
        opacity: 0,
        duration: 0.75,
        delay: 0.18,
        ease: "expo.out",
      });
    }, shellRef);
    return () => ctx.revert();
  }, []);

  // Cross-route fade-in for the main pane.
  useEffect(() => {
    if (!mainRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      mainRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, ease: "expo.out" }
    );
  }, [pathname]);

  return (
    <div
      ref={shellRef}
      className="relative flex min-h-screen flex-col bg-bg lg:flex-row"
      style={TECH_FONT}
    >
      {/* Ambient glow that picks up the brand gradient — kept very subtle. */}
      <div
        aria-hidden
        className="pointer-events-none fixed -top-32 right-[-10%] -z-0 h-[420px] w-[420px] rounded-full opacity-40 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgba(145,129,245,0.22), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-[-15%] left-[-10%] -z-0 h-[360px] w-[360px] rounded-full opacity-30 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgba(67,97,252,0.18), transparent 70%)",
        }}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "as-sidebar z-30 flex shrink-0 flex-col bg-bg/85 backdrop-blur-xl",
          "border-border-strong/60",
          "lg:sticky lg:top-0 lg:h-screen lg:w-[268px] lg:border-r"
        )}
      >
        <div className="flex items-center justify-between border-b border-border-strong/40 px-6 py-5 lg:border-b-0">
          <Link href="/" className="transition-opacity hover:opacity-80">
            <Logo />
          </Link>
          <button
            aria-label="Toggle menu"
            className="grid h-9 w-9 place-items-center rounded-full border border-border-strong text-fg-muted lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <ChevronDown size={16} className="rotate-180 transition-transform" /> : <Menu size={16} />}
          </button>
        </div>

        <nav
          className={cn(
            "flex-1 overflow-hidden lg:overflow-visible",
            mobileOpen ? "block" : "hidden lg:block"
          )}
        >
          <div className="px-3 pt-4">
            <div className="px-3.5 pb-3 text-[10.5px] uppercase tracking-[0.2em] text-fg-dim">
              Workspace
            </div>
            <ul className="space-y-1">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] transition-colors",
                        active
                          ? "text-fg"
                          : "text-fg-muted hover:text-fg"
                      )}
                    >
                      {active && (
                        <span
                          aria-hidden
                          className="absolute inset-0 rounded-xl"
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(145,129,245,0.18), rgba(67,97,252,0.10))",
                            boxShadow:
                              "0 0 0 1px rgba(145,129,245,0.35), 0 12px 30px -16px rgba(67,97,252,0.55)",
                          }}
                        />
                      )}
                      <span
                        className={cn(
                          "relative grid h-7 w-7 place-items-center rounded-lg border transition-colors",
                          active
                            ? "border-violet/50 text-white"
                            : "border-border-strong/70 bg-surface-2/40 text-fg-muted group-hover:text-fg"
                        )}
                        style={
                          active
                            ? {
                                background:
                                  "linear-gradient(135deg, rgba(145,129,245,0.35), rgba(67,97,252,0.25))",
                              }
                            : undefined
                        }
                      >
                        <Icon size={14} strokeWidth={1.8} />
                      </span>
                      <span className="relative">{item.label}</span>
                      {active && (
                        <span
                          aria-hidden
                          className="relative ml-auto h-1.5 w-1.5 rounded-full bg-violet-soft animate-pulse-soft"
                          style={{
                            boxShadow: "0 0 8px rgba(145,129,245,0.9)",
                          }}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mx-3 mt-7">
            <div className="px-3.5 pb-3 text-[10.5px] uppercase tracking-[0.2em] text-fg-dim">
              Agent
            </div>
            <div
              className="rounded-2xl border border-border-strong/60 bg-surface/45 p-4 backdrop-blur-md"
            >
              <div className="flex items-center gap-2 text-[12px] text-fg">
                <span
                  className="h-2 w-2 rounded-full bg-[var(--color-emerald)] animate-pulse-soft"
                  style={{ boxShadow: "0 0 8px rgba(22,217,168,0.9)" }}
                />
                Operating
              </div>
              <div className="mt-2 text-[11px] text-fg-dim">
                Manifesto v1.0.0 · pinned
              </div>
              <Link
                href="/manifesto"
                className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-violet-soft transition-colors hover:text-white"
              >
                View behavior rules
                <span aria-hidden>↗</span>
              </Link>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main */}
      <div className="relative flex-1">
        {/* Top bar */}
        <div className="as-topbar sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border-strong/40 bg-bg/75 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex flex-col leading-tight">
            <h1 className="text-[14.5px] font-medium tracking-[-0.005em] text-fg">
              {NAV.find((n) => n.href === pathname)?.label ?? "Dashboard"}
            </h1>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-fg-dim">
              <span
                className="h-1 w-1 rounded-full bg-[var(--color-emerald)] animate-pulse-soft"
              />
              Synced just now · v0.1.0
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ConnectWalletButton />
            <button
              aria-label="Notifications"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-border-strong/60 bg-surface-2/40 text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
            >
              <Bell size={15} />
              <span
                className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-violet-soft animate-pulse-soft"
                style={{ boxShadow: "0 0 6px rgba(145,129,245,0.95)" }}
              />
            </button>
          </div>
        </div>

        <main
          ref={mainRef}
          className="as-main relative z-10 px-5 py-8 sm:px-8 sm:py-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
