"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { useOnboardingQueries } from "@/hooks/onboarding/useOnboardingQueries";
import { useContractClient } from "@/hooks/useContractClient";
import { useTokenBalance } from "@/hooks/token/useTokenQueries";

import { Button } from "../ui/button";
import { RoleSelectionModal } from "./RoleSelectionModal";
import WalletConnectButton from "./WalletConnectButton";

export default function SmartHomeCTA() {
  const router = useRouter();
  
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const { address: evmAddress, contracts } = useContractClient();
  
  const { balances, isLoadingBalances } = useOnboardingQueries(evmAddress);
  const { data: usdcTokenBalance } = useTokenBalance(contracts.USDC_ADDRESS);

  if (!evmAddress) {
    return (
      <div className="w-full sm:w-auto">
        <WalletConnectButton variant="full" />
      </div>
    );
  }

  const hasGas = (balances?.gas ?? 0) > 0;
  const hasUSDC = (usdcTokenBalance ?? 0n) > 0n;
  const isOnboarded = hasGas && hasUSDC;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
      
      <div className="hidden sm:block">
        <WalletConnectButton variant="compact" />
      </div>

      <Button
        onClick={() => (isOnboarded ? setIsRoleModalOpen(true) : router.push("/onboarding"))}
        disabled={isLoadingBalances}
        className="group relative w-full sm:w-auto px-5 sm:px-6 rounded-xl sm:rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs sm:text-sm transition-all duration-300 hover:bg-slate-800 dark:hover:bg-slate-200 border-none shadow-none cursor-pointer shrink-0"
      >
        {isLoadingBalances ? (
          <span className="flex items-center justify-center break-words whitespace-normal text-center">
            Checking...
          </span>
        ) : isOnboarded ? (
          <span className="flex items-center justify-center gap-1.5 sm:gap-2 break-words whitespace-normal text-center">
            Launch App 
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-70 group-hover:translate-x-1 transition-transform shrink-0" />
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5 sm:gap-2 break-words whitespace-normal text-center">
            Complete Setup 
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-70 group-hover:translate-x-1 transition-transform shrink-0" />
          </span>
        )}
      </Button>

      <RoleSelectionModal 
        isOpen={isRoleModalOpen} 
        onClose={() => setIsRoleModalOpen(false)} 
      />
      
    </div>
  );
}