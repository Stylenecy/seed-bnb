"use client";

import { useChainId, useSwitchChain } from "wagmi";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ACTIVE_CHAIN, CHAIN_LABEL } from "@/lib/chain";

interface NetworkSwitcherProps {
  className?: string;
}

// Single-network switcher: Flowroll runs on one BNB Smart Chain network
// (BSC testnet 97 by default). Replaces the Initia evm-1 / flowroll-4 menu.
export function NetworkSwitcher({ className = "" }: NetworkSwitcherProps) {
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const isCorrect = currentChainId === ACTIVE_CHAIN.id;

  const handleSwitch = () => {
    if (isCorrect) return;
    switchChain(
      { chainId: ACTIVE_CHAIN.id },
      {
        onSuccess: () => toast.success(`Switched to ${CHAIN_LABEL}`),
        onError: (error) => toast.error(`Failed to switch network: ${error.message}`),
      },
    );
  };

  return (
    <Button
      variant="outline"
      onClick={handleSwitch}
      className={`rounded-full px-3 sm:px-4 gap-1.5 sm:gap-2 bg-white dark:bg-[#0a0a0a] border-slate-200 dark:border-slate-800 shadow-none w-fit ${className}`}
    >
      <span className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 tracking-tight font-medium text-left">
        {isCorrect ? CHAIN_LABEL : `Switch to ${CHAIN_LABEL}`}
      </span>
      {isCorrect && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />}
    </Button>
  );
}
