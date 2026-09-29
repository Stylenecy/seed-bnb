"use client";

/**
 * Wallet/auth status pill in the dashboard top bar.
 *
 * Reads the mock auth state from lib/auth.ts so it stays in sync with the
 * Login modal (set on landing) and the onboarding wizard (open position).
 *
 * Today it renders the in-house ConnectWalletModal. Swap to Privy by
 * installing @privy-io/react-auth with pnpm (Privy v3 needs the .pnpm
 * folder layout npm doesn't produce) and replacing the modal with a Privy
 * login() call.
 */

import { useState } from "react";
import { Wallet, LogOut } from "lucide-react";
import { cn } from "@/lib/cn";
import { ConnectWalletModal } from "./ConnectWalletModal";
import { auth } from "@/lib/auth";
import { useAuth } from "@/lib/useAuth";
import { mockUser } from "@/data/mock";

export function ConnectWalletButton() {
  const { signedIn } = useAuth();
  const [open, setOpen] = useState(false);

  if (signedIn) {
    return (
      <button
        type="button"
        onClick={() => {
          auth.signOut();
          window.location.href = "/";
        }}
        title="Sign out"
        className={cn(
          "group inline-flex h-10 items-center gap-2 rounded-full pl-3 pr-4 text-[13px] font-medium transition-all",
          "border border-[var(--color-positive)]/30 bg-[var(--color-positive)]/8 text-[var(--color-positive)] hover:bg-[var(--color-positive)]/15"
        )}
      >
        <span
          aria-hidden
          className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-positive)]/15"
        >
          <Wallet size={12} />
        </span>
        <span className="hidden sm:inline">{shortIdentity()}</span>
        <span className="sm:hidden">Connected</span>
        <LogOut
          size={13}
          className="ml-1 text-[var(--color-positive)]/60 transition-colors group-hover:text-[var(--color-positive)]"
        />
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex h-10 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] pl-3 pr-4 text-[13px] font-medium text-ink-50 transition-all hover:border-white/20 hover:bg-white/[0.05]"
      >
        <span
          aria-hidden
          className="grid h-6 w-6 place-items-center rounded-full bg-white/[0.06]"
        >
          <Wallet size={12} />
        </span>
        Connect Wallet
      </button>
      <ConnectWalletModal
        open={open}
        onClose={() => {
          setOpen(false);
          // Picking any provider in the in-house modal counts as a sign-in.
          auth.signIn();
        }}
      />
    </>
  );
}

function shortIdentity(): string {
  const email = mockUser.email;
  if (email && email.length <= 22) return email;
  const a = mockUser.walletAddress;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
