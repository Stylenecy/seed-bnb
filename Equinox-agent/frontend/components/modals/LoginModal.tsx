"use client";

import Link from "next/link";
import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/Button";
import { auth } from "@/lib/auth";

const PROVIDERS = [
  {
    id: "google",
    name: "Continue with Google",
    icon: (
      <svg viewBox="0 0 18 18" className="h-4.5 w-4.5" width={18} height={18} aria-hidden>
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
    ),
  },
  {
    id: "apple",
    name: "Continue with Apple",
    icon: (
      <svg viewBox="0 0 18 18" className="h-4.5 w-4.5" width={18} height={18} aria-hidden fill="currentColor">
        <path d="M12.6 9.5c0-2.1 1.7-3.1 1.8-3.2-.9-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7s-1.6-.7-2.6-.7c-1.3 0-2.6.8-3.2 2-1.4 2.4-.4 5.9 1 7.9.7 1 1.5 2.1 2.6 2 1 0 1.4-.7 2.7-.7s1.6.7 2.7.6c1.1 0 1.8-1 2.5-1.9.8-1.1 1.1-2.2 1.1-2.3-.1-.1-2.1-.8-2.1-3.2zM10.6 2.8C11.2 2.1 11.6 1.1 11.5 0c-.9.1-2 .6-2.6 1.3-.5.6-1 1.5-.9 2.5 1 .1 2-.4 2.6-1z" />
      </svg>
    ),
  },
];

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  // README §2: after the user picks a provider, frontend decides where to
  // route. With our mock state, a fresh sign-in (no existing position) goes
  // to the onboarding wizard; an existing user lands on /dashboard.
  const finishSignIn = () => {
    auth.signIn();
    onClose();
    const target = auth.hasPosition() ? "/dashboard" : "/onboarding";
    window.location.href = target;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidthClassName="max-w-[440px]"
      hideClose={false}
      title="Welcome to Equinox"
      subtitle="No wallet to install. No seed phrase to lose."
    >
      <div className="px-6 pb-7 pt-5">
        <div className="space-y-2.5">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={finishSignIn}
              className="group flex w-full items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5 text-left transition-all hover:border-white/20 hover:bg-white/[0.04]"
            >
              <span className="flex items-center gap-3 text-[14px] text-ink-50">
                {p.icon}
                {p.name}
              </span>
              <ArrowRight
                size={16}
                className="text-ink-400 transition-all group-hover:translate-x-0.5 group-hover:text-ink-100"
              />
            </button>
          ))}

          <div className="my-2 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-ink-400">
            <span className="h-px flex-1 bg-white/[0.06]" />
            or
            <span className="h-px flex-1 bg-white/[0.06]" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              finishSignIn();
            }}
            className="space-y-2.5"
          >
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.16em] text-ink-400">
                Email
              </span>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 focus-within:border-[var(--color-accent)]/60 focus-within:bg-white/[0.04]">
                <Mail size={15} className="text-ink-400" />
                <input
                  type="email"
                  required
                  placeholder="you@somewhere.com"
                  className="w-full bg-transparent text-[14px] text-ink-50 placeholder:text-ink-500 focus:outline-none"
                />
              </div>
            </label>
            <Button type="submit" className="w-full" size="md">
              Continue with email
            </Button>
          </form>
        </div>

        <div className="mt-7 flex items-start gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.015] p-4">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
          <p className="text-[12.5px] leading-relaxed text-ink-300">
            Equinox uses <span className="text-ink-100">non-custodial BNB Chain wallets</span>.
            Your keys never leave the browser. We can&apos;t move your funds.{" "}
            <Link href="/manifesto" className="text-ink-100 underline-offset-4 hover:underline">
              How it works
            </Link>
            .
          </p>
        </div>
      </div>
    </Modal>
  );
}
