"use client";

import { Droplets, CheckCircle2, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useOnboardingActions } from "@/hooks/onboarding/useOnboardingActions";
import { useWalletActions } from "@/hooks/identity/useIdentity";
import { FAUCET_URL, IS_TESTNET, NATIVE_SYMBOL } from "@/lib/chain";

interface Step1ClaimGasProps {
  isComplete: boolean;
  isUnlocked: boolean;
  evmAddress?: `0x${string}`;
}

export function Step1ClaimGas({
  isComplete,
  isUnlocked,
  evmAddress,
}: Step1ClaimGasProps) {
  const { claimFreeGas } = useOnboardingActions(evmAddress);
  const { openConnect } = useWalletActions();
  const isTestnet = IS_TESTNET;
  const symbol = NATIVE_SYMBOL;

  // Synced with FAUCET_NATIVE_AMOUNT (default 0.005) in /api/faucet
  const amountToClaim = 0.005;

  const handleAction = async () => {
    if (!evmAddress) {
      openConnect();
      return;
    }

    if (claimFreeGas.isPending) return;

    const toastId = "gas-claim-tx";

    try {
      toast.loading(`Requesting native ${symbol} from faucet...`, {
        id: toastId,
      });

      await claimFreeGas.mutateAsync();

      toast.success(`${symbol} claimed successfully!`, { id: toastId });
    } catch (error: any) {
      const errorMessage =
        error?.shortMessage ||
        error?.message ||
        `Failed to claim ${symbol}. Please try again.`;
      toast.error(errorMessage, { id: toastId });
    }
  };
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
        {/* Left side: Icon & Text */}
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
              <Droplets className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </div>
          <div className="flex flex-col justify-center min-w-0 w-full">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white tracking-tight ">
              Claim Network Gas
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 leading-relaxed max-w-md sm:whitespace-normal">
              Fund your address with native gas to execute transactions on
              Flowroll.
            </p>

            {/* Official BNB Chain testnet faucet */}
            {isTestnet && (
              <a
                href={FAUCET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-[11px] sm:text-xs text-blue-700 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline mt-1.5 sm:mt-1 block w-fit truncate ${!isUnlocked ? "pointer-events-none cursor-default" : ""}`}
              >
                Request more tBNB from the BNB Chain faucet
              </a>
            )}
          </div>
        </div>

        {/* Right side: Button */}
        <div className="w-full sm:w-auto shrink-0 mt-1 sm:mt-0">
          <Button
            onClick={handleAction}
            disabled={!isUnlocked || isComplete || claimFreeGas.isPending}
            className={`w-full sm:w-auto h-10 sm:h-12 px-6 sm:px-8 rounded-xl font-bold cursor-pointer transition-colors duration-300 border-none text-xs sm:text-sm ${
              !isUnlocked
                ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                : isComplete
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 opacity-80 cursor-default"
                  : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200"
            }`}
          >
            {claimFreeGas.isPending && (
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin mr-1.5 sm:mr-2 shrink-0" />
            )}
            <span className="truncate">
              {!isUnlocked
                ? "Locked"
                : isComplete
                  ? "Gas Claimed"
                  : `Claim ${amountToClaim} ${symbol}`}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
