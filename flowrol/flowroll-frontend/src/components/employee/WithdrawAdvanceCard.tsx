"use client";

import { useState, useEffect } from "react";
import { USDC_DECIMALS } from "@/lib/chain";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowDownCircle } from "lucide-react";
import { formatUnits, parseUnits } from "viem";
import { toast } from "sonner";

import { useContractClient } from "@/hooks/useContractClient";
import { useAdvanceInfo } from "@/hooks/flowroll/useFlowrollQueries";
import { useFlowrollActions } from "@/hooks/flowroll/useFlowrollActions";
import { useAllowance } from "@/hooks/token/useTokenQueries";
import { useTokenActions } from "@/hooks/token/useTokenActions";
import { formatMoney, flowLog } from "@/lib/utils";

type ActionTab = "withdraw" | "repay";

export function WithdrawAdvanceCard() {
  const { address: evmAddress, contracts } = useContractClient();

  const { data: advanceInfo, isLoading: isLoadingAdvance } = useAdvanceInfo();
  const { requestSalary, repayDebt } = useFlowrollActions(evmAddress);

  const { data: allowance } = useAllowance(
    contracts.USDC_ADDRESS,
    contracts.FLOWROLL_CREDIT_ADDRESS,
  );
  const { approveToken } = useTokenActions(contracts.USDC_ADDRESS);

  const [activeTab, setActiveTab] = useState<ActionTab>("withdraw");
  const [rawAmount, setRawAmount] = useState<string>("");

  const currentDebtRaw = advanceInfo?.currentDebt ?? 0n;
  const availableToRequestRaw = advanceInfo?.maxAvailableToDraw ?? 0n;
  const feeBps = Number(advanceInfo?.currentFeeBps ?? 0n);

  const isDebtActive = currentDebtRaw > 0n;
  const isWithdraw = activeTab === "withdraw";
  const maxContextualAmount = isWithdraw
    ? availableToRequestRaw
    : currentDebtRaw;

  let numericAmountRaw = 0n;
  try {
    if (rawAmount && !isNaN(Number(rawAmount))) {
      numericAmountRaw = parseUnits(rawAmount, USDC_DECIMALS);
    }
  } catch (e) {
    numericAmountRaw = 0n;
  }

  const needsApproval = !isWithdraw && (allowance ?? 0n) < numericAmountRaw;
  const exceedsMax = numericAmountRaw > maxContextualAmount;
  const isInputActive = numericAmountRaw > 0n;

  useEffect(() => {
    if (!isDebtActive && activeTab === "repay") setActiveTab("withdraw");
  }, [isDebtActive, activeTab]);

  const handleAction = async () => {
    if (!evmAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (numericAmountRaw <= 0n || exceedsMax) return;

    const toastId = isWithdraw ? "withdraw-advance-tx" : "repay-debt-tx";

    try {
      if (isWithdraw) {
        toast.loading("Preparing withdrawal...", { id: toastId });
        await requestSalary.mutateAsync(numericAmountRaw);
        toast.success("Liquidity secured! Funds sent to wallet.", {
          id: toastId,
        });
      } else {
        if (needsApproval) {
          toast.loading("Approving USDC spend...", { id: toastId });
          await approveToken.mutateAsync({
            spender: contracts.FLOWROLL_CREDIT_ADDRESS as `0x${string}`,
            amount: numericAmountRaw,
          });
          toast.loading("Approval successful! Settling debt...", {
            id: toastId,
          });
        } else {
          toast.loading("Preparing repayment...", { id: toastId });
        }

        await repayDebt.mutateAsync({
          employee: evmAddress,
          amountInBaseUnits: numericAmountRaw,
        });

        toast.success("Debt settled! Your credit health has improved.", {
          id: toastId,
        });
      }

      setRawAmount("");
    } catch (error: any) {
      const errorMessage =
        error?.shortMessage || error?.message || "Transaction failed.";
      toast.error(errorMessage, { id: toastId });
    }
  };

  const handlePercentageClick = (percent: number) => {
    if (maxContextualAmount <= 0n) return;
    const calculated = (maxContextualAmount * BigInt(percent)) / 100n;
    setRawAmount(formatUnits(calculated, USDC_DECIMALS));
  };

  return (
    <div className="lg:col-span-7 bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-slate-800 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm relative overflow-hidden flex flex-col h-full">
      <div className="absolute top-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-b from-slate-50 dark:from-slate-800/30 to-transparent pointer-events-none" />

      <div className="p-5 sm:p-6 lg:p-8 border-b border-slate-100 dark:border-slate-800/80 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
              {isWithdraw ? (
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
              ) : (
                <ArrowDownCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                {isWithdraw ? "Withdraw Advance" : "Repay Active Debt"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {isWithdraw
                  ? "Access earned liquidity instantly."
                  : "Settle your credit balance early."}
              </p>
            </div>
          </div>

          {isDebtActive && (
            <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 w-full sm:w-fit shrink-0">
              <button
                onClick={() => setActiveTab("withdraw")}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${isWithdraw ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Withdraw
              </button>
              <button
                onClick={() => setActiveTab("repay")}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${!isWithdraw ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Repay
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1 flex flex-col relative z-10">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-1 sm:gap-0 px-1">
            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
              {isWithdraw ? "Amount to Draw" : "Amount to Repay"}
            </label>
            <span className="text-[10px] hidden sm:block font-bold text-slate-400 uppercase tracking-wider truncate">
              {isWithdraw ? "Available: " : "Debt Balance: "}
              <span className="text-slate-700 dark:text-slate-300 font-mono">
                {isLoadingAdvance
                  ? "..."
                  : `${formatMoney(maxContextualAmount, USDC_DECIMALS)} USDC`}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                onClick={() => handlePercentageClick(percent)}
                disabled={maxContextualAmount <= 0n || isLoadingAdvance}
                className="flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-slate-800 disabled:opacity-50 uppercase tracking-widest"
              >
                {percent === 100 ? "MAX" : `${percent}%`}
              </button>
            ))}
          </div>

          <div
            className={`relative flex items-center bg-white dark:bg-[#0d1117] border rounded-xl sm:rounded-2xl transition-all duration-200 ${exceedsMax ? "border-rose-500" : "border-slate-200 dark:border-slate-800 focus-within:border-slate-400 dark:focus-within:border-slate-600"}`}
          >

            <input
              type="text"
              inputMode="decimal"
              value={rawAmount}
              onChange={(e) => {
                const val = e.target.value;

                if (/^\d*\.?\d*$/.test(val)) {
                  if (val === "" || val === ".") {
                    setRawAmount(val);
                    return;
                  }

                  try {
                    const inputBigInt = parseUnits(val, USDC_DECIMALS);

                    if (inputBigInt <= maxContextualAmount) {
                      setRawAmount(val);
                    }
                  } catch {}
                }
              }}
              placeholder="0.00"
              autoComplete="off"
              className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-xl sm:text-2xl font-bold tabular-nums py-4 sm:py-5 pl-4 sm:pl-6 pr-16 sm:pr-20 text-slate-900 dark:text-white"
            />
            <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">
                USDC
              </span>
            </div>
          </div>
        </div>

        {isInputActive && !exceedsMax && (
          <div className="flex-1 min-h-[140px] sm:min-h-[160px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="bg-slate-50/50 dark:bg-[#0d1117]/50 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800/60 p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {isWithdraw ? (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest gap-2">
                        <span className="truncate">Gross Request</span>
                        <span className="font-mono text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                          {formatMoney(numericAmountRaw, USDC_DECIMALS)} USDC
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest gap-2">
                        <span className="truncate">Protocol Fee</span>
                        <span className="font-mono text-xs sm:text-sm font-medium text-rose-500 truncate">
                          -
                          {formatMoney(
                            (numericAmountRaw * BigInt(feeBps)) / 10000n,
                            USDC_DECIMALS,
                          )}{" "}
                          USDC
                        </span>
                      </div>
                      <div className="h-px w-full border-t border-dashed border-slate-200 dark:border-slate-700" />
                      <div className="flex justify-between items-end gap-2">
                        <span className="text-[10px] sm:text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest truncate">
                          Net Receive
                        </span>
                        <span className="font-mono text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
                          {formatMoney(
                            numericAmountRaw -
                              (numericAmountRaw * BigInt(feeBps)) / 10000n,
                            USDC_DECIMALS,
                          )}{" "}
                          USDC
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest gap-2">
                        <span className="truncate">Current Debt</span>
                        <span className="font-mono text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                          {formatMoney(currentDebtRaw, USDC_DECIMALS)} USDC
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest gap-2">
                        <span className="truncate">Repayment</span>
                        <span className="font-mono text-xs sm:text-sm font-medium text-blue-500 truncate">
                          -{formatMoney(numericAmountRaw, USDC_DECIMALS)} USDC
                        </span>
                      </div>
                      <div className="h-px w-full border-t border-dashed border-slate-200 dark:border-slate-700" />
                      <div className="flex justify-between items-end gap-2">
                        <span className="text-[10px] sm:text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest truncate">
                          Remaining
                        </span>
                        <span className="font-mono text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                          {formatMoney(
                            currentDebtRaw - numericAmountRaw,
                            USDC_DECIMALS,
                          )}{" "}
                          USDC
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        <div className="pt-2 sm:pt-4 mt-auto">
          <button
            onClick={handleAction}
            disabled={
              numericAmountRaw <= 0n ||
              exceedsMax ||
              requestSalary.isPending ||
              repayDebt.isPending ||
              approveToken.isPending
            }
            className={`w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 active:scale-[0.98] ${
              isWithdraw
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
                : "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            }`}
          >
            {requestSalary.isPending ||
            repayDebt.isPending ||
            approveToken.isPending ? (
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
              <>
                {isWithdraw
                  ? "Sign & Withdraw"
                  : needsApproval
                    ? "Approve & Repay"
                    : "Sign & Repay Debt"}
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-70 shrink-0" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}