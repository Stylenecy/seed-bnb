"use client";

import { HandCoins, CheckCircle2, Loader2, Lock } from "lucide-react";
import { USDC_DECIMALS } from "@/lib/chain";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useOnboardingActions } from "@/hooks/onboarding/useOnboardingActions";
import { useWalletActions } from "@/hooks/identity/useIdentity";
import { flowLog, formatMoney } from "@/lib/utils";
import { parseUnits } from "viem";

interface Step2ClaimProps {
  isComplete: boolean;
  isUnlocked: boolean;
  evmAddress?: `0x${string}`;
}

export function Step2ClaimUSDC({
  isComplete,
  isUnlocked,
  evmAddress,
}: Step2ClaimProps) {
  const { claimUSDC } = useOnboardingActions(evmAddress);
  const { openConnect } = useWalletActions();

  const amountToClaim = 2000;
  const parsedAmount = parseUnits(amountToClaim.toString(), USDC_DECIMALS);

  const handleClaimAction = async () => {
    if (!evmAddress) {
      openConnect();
      return;
    }

    if (claimUSDC.isPending) return;

    const toastId = toast.loading("Minting test USDC...");

    try {
      await claimUSDC.mutateAsync();
      toast.success("USDC claimed successfully!", { id: toastId });
    } catch (error: any) {
      console.error("Claim simulation failed:", error);
      toast.error(error.message || "Claim failed. Please try again.", {
        id: toastId,
      });
    }
  };
  flowLog("Is it unlocked?", isUnlocked);
  return (
    <div
      className={`relative rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 lg:p-8 transition-colors duration-300 bg-white dark:bg-[#0a0a0a] border flex flex-col w-full min-w-0 ${
        !isUnlocked
          ? "opacity-50 pointer-events-none border-slate-100 dark:border-slate-900 grayscale"
          : isComplete
            ? ""
            : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between w-full min-w-0">
        <div className="flex gap-3 sm:gap-5 items-start sm:items-center w-full min-w-0">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
              !isUnlocked
                ? "bg-slate-50 dark:bg-slate-900/50 text-slate-400"
                : isComplete
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500"
                  : "bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400"
            }`}
          >
            {!isUnlocked ? (
              <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : isComplete ? (
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <HandCoins className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </div>

          <div className="flex flex-col justify-center min-w-0 w-full">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white tracking-tight ">
              Claim Testnet USDC
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 leading-relaxed max-w-md  sm:whitespace-normal">
              Claim {formatMoney(parsedAmount, USDC_DECIMALS)} USDC to test out
              Flowroll&apos;s yield routing and payroll execution.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto shrink-0 mt-1 sm:mt-0">
          <Button
            onClick={handleClaimAction}
            disabled={!isUnlocked || isComplete || claimUSDC.isPending}
            className={`w-full sm:w-auto h-10 sm:h-12 px-6 sm:px-8 rounded-xl font-bold cursor-pointer transition-colors duration-300 border-none text-xs sm:text-sm ${
              !isUnlocked
                ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                : isComplete
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 opacity-80 cursor-default"
                  : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200"
            }`}
          >
            {claimUSDC.isPending && (
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin mr-1.5 sm:mr-2 shrink-0" />
            )}
            <span className="">
              {!isUnlocked
                ? "Locked"
                : isComplete
                  ? "Claimed"
                  : `Claim ${formatMoney(parsedAmount, USDC_DECIMALS)} USDC`}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
