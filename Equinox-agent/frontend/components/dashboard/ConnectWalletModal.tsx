"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { X, Mail, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface ConnectWalletModalProps {
  open: boolean;
  onClose: () => void;
}

const SOCIAL_PROVIDERS = [
  { id: "google", label: "Google", icon: <GoogleIcon /> },
  { id: "email", label: "Email", icon: <Mail size={15} /> },
  { id: "x", label: "X", icon: <XIcon /> },
];

const WALLETS = [
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    installed: true,
    icon: <CoinbaseIcon />,
  },
  {
    id: "binance-wallet",
    name: "Binance Wallet",
    installed: true,
    icon: <BinanceIcon />,
  },
  {
    id: "trust",
    name: "Trust Wallet",
    installed: true,
    icon: <TrustIcon />,
  },
  {
    id: "metamask",
    name: "MetaMask",
    installed: true,
    icon: <MetaMaskIcon />,
  },
  {
    id: "okx",
    name: "OKX Wallet",
    installed: true,
    icon: <OKXIcon />,
  },
];

export function ConnectWalletModal({ open, onClose }: ConnectWalletModalProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setConnecting(false);
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (!overlay || !panel) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = reduced ? 0.001 : 0.3;
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: dur });
    gsap.fromTo(
      panel,
      { y: 16, opacity: 0, scale: 0.985 },
      { y: 0, opacity: 1, scale: 1, duration: dur * 1.1, ease: "expo.out" }
    );
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const choose = (id: string) => {
    setSelected(id);
    setConnecting(true);
    window.setTimeout(() => {
      onClose();
    }, 1100);
  };

  if (typeof window === "undefined" || !open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Connect wallet"
        className="relative w-full max-w-[440px] overflow-hidden rounded-t-3xl bg-white text-[#0a0a0a] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.45)] sm:rounded-3xl"
        style={{ fontFamily: "var(--font-tech), ui-sans-serif, system-ui" }}
      >
        <div className="relative flex items-center justify-between px-6 pt-5">
          <span className="text-[10.5px] uppercase tracking-[0.18em] text-[#0a0a0a]/40">
            Equinox · BNB Chain
          </span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-[#0a0a0a]/55 transition-colors hover:bg-[#0a0a0a]/[0.06] hover:text-[#0a0a0a]"
          >
            <X size={15} />
          </button>
        </div>

        <h2 className="px-6 pt-4 text-center text-[20px] font-semibold tracking-tight text-[#0a0a0a]">
          Sign In
        </h2>

        {/* Email / Socials row */}
        <div className="px-6 pt-5">
          <div className="flex items-center gap-3 rounded-2xl border border-[#0a0a0a]/10 bg-white px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_4px_12px_-6px_rgba(0,0,0,0.08)]">
            <span className="text-[13.5px] font-medium text-[#0a0a0a]">
              Email / Socials
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              {SOCIAL_PROVIDERS.map((p) => {
                const isSelected = selected === `social-${p.id}`;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-label={p.label}
                    onClick={() => choose(`social-${p.id}`)}
                    disabled={connecting}
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-full transition-colors",
                      isSelected
                        ? "bg-[#0a0a0a] text-white"
                        : "text-[#0a0a0a] hover:bg-[#0a0a0a]/[0.05]"
                    )}
                  >
                    {p.icon}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 text-[11px] uppercase tracking-[0.18em] text-[#0a0a0a]/40">
          <span className="h-px flex-1 bg-[#0a0a0a]/10" />
          or
          <span className="h-px flex-1 bg-[#0a0a0a]/10" />
        </div>

        {/* Wallet list */}
        <div className="space-y-2 px-4 pb-5">
          {WALLETS.map((w) => {
            const isSelected = selected === `wallet-${w.id}`;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => choose(`wallet-${w.id}`)}
                disabled={connecting}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl border border-[#0a0a0a]/8 bg-white px-3.5 py-2.5 text-left transition-all",
                  "hover:border-[#0a0a0a]/20 hover:bg-[#0a0a0a]/[0.02]",
                  isSelected && "border-[#3b5bff]/40 bg-[#3b5bff]/[0.04]"
                )}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg">
                  {w.icon}
                </span>
                <span className="text-[14px] font-semibold text-[#0a0a0a]">
                  {w.name}
                </span>
                <span className="ml-auto inline-flex items-center gap-1 text-[11.5px] text-[#0a0a0a]/50">
                  {isSelected && connecting ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-[#0a0a0a]/20 border-t-[#3b5bff]" />
                      Connecting…
                    </>
                  ) : (
                    <>
                      <Check size={11} className="text-[#0a0a0a]/40" />
                      Installed
                    </>
                  )}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-[#0a0a0a]/8 bg-white px-3.5 py-2.5 text-left transition-colors hover:bg-[#0a0a0a]/[0.02]"
            onClick={onClose}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#0a0a0a]/5">
              <span className="inline-flex gap-0.5">
                <span className="size-1 rounded-full bg-[#0a0a0a]/55" />
                <span className="size-1 rounded-full bg-[#0a0a0a]/55" />
                <span className="size-1 rounded-full bg-[#0a0a0a]/55" />
              </span>
            </span>
            <span className="text-[14px] font-semibold text-[#0a0a0a]">
              More wallets
            </span>
            <ChevronRight
              size={16}
              className="ml-auto text-[#0a0a0a]/40 transition-transform group-hover:translate-x-0.5"
            />
          </button>
        </div>

        <div className="border-t border-[#0a0a0a]/8 bg-[#0a0a0a]/[0.02] px-6 py-3 text-center text-[11px] text-[#0a0a0a]/50">
          Powered by <span className="text-[#0a0a0a]">BNB Chain</span> · keys never leave your browser
        </div>
      </div>
    </div>,
    document.body
  );
}

/* Icons — small inline SVGs, no external deps */

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" width={15} height={15} aria-hidden>
      <path
        fill="#FFC107"
        d="M17.6 9.2c0-.6 0-1.2-.2-1.8H9v3.4h4.8c-.2 1.2-.8 2.2-1.8 2.9v2.4h2.9c1.7-1.6 2.7-3.9 2.7-6.9z"
      />
      <path
        fill="#FF3D00"
        d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.4c-.8.6-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.4C2.4 15.9 5.5 18 9 18z"
      />
      <path
        fill="#4CAF50"
        d="M3.9 10.5c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V4.3H.9C.3 5.7 0 7.3 0 9s.3 3.3.9 4.7l3-2.4z"
      />
      <path
        fill="#1976D2"
        d="M9 3.6c1.3 0 2.5.5 3.4 1.4l2.6-2.6C13.5.9 11.4 0 9 0 5.5 0 2.4 2.1.9 5.3l3 2.4C4.6 5.2 6.6 3.6 9 3.6z"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 18 18" width={13} height={13} aria-hidden>
      <path
        fill="currentColor"
        d="M11.1 7.6L17 0h-2l-5 6.6L5.5 0H0l6.1 8.8L0 18h2l5.4-7L12 18h5.4l-6.3-10.4zM3.4 1.5h1.5l9.3 14.6h-1.5L3.4 1.5z"
      />
    </svg>
  );
}

function CoinbaseIcon() {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#0052ff]">
      <span className="h-3.5 w-3.5 rounded-sm bg-white" />
    </span>
  );
}

function BinanceIcon() {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#f0b90b]">
      <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden fill="white">
        <path d="M12 3c-3 4-7 7-7 11a7 7 0 0 0 14 0c0-4-4-7-7-11zm0 17a6 6 0 0 1-6-6c0-3 2.5-5.4 6-9.5 3.5 4.1 6 6.5 6 9.5a6 6 0 0 1-6 6z" />
      </svg>
    </span>
  );
}

function TrustIcon() {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#0500ff]">
      <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden fill="white">
        <path d="M12 4a8 8 0 0 0-8 8v6a2 2 0 0 0 3.6 1.2L9 17.5l1.4 1.7a2 2 0 0 0 3.2 0l1.4-1.7 1.4 1.7A2 2 0 0 0 20 18v-6a8 8 0 0 0-8-8zm-3 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
      </svg>
    </span>
  );
}

function MetaMaskIcon() {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#f6851b]">
      <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden fill="white">
        <path d="M21 3l-7 5 1.4-3.3L21 3zM3 3l7 5L8.6 4.7 3 3zm15.3 13.8l-2 3 4.3 1.2.7-4.2h-3zM2.7 16.8l.7 4.2 4.3-1.2-2-3h-3zM8 11l-1.4 2.1 4.3.2-.1-4.6L8 11zm8 0l-2.8-2.3L13 13.3l4.3-.2L16 11zm-8.4 8.7L10 18.5l-2.1-1.7-.3 2.9zm5.8-1.2l2.6 1.2-.3-2.9-2.3 1.7z" />
      </svg>
    </span>
  );
}

function OKXIcon() {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-lg bg-black p-1.5">
      <span className="grid h-full w-full grid-cols-3 gap-[1px]">
        {[0, 1, 0, 1, 1, 1, 0, 1, 0].map((v, i) => (
          <span
            key={i}
            className={cn(
              "rounded-[1px]",
              v ? "bg-white" : "bg-transparent"
            )}
          />
        ))}
      </span>
    </span>
  );
}
