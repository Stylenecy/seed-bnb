"use client";

import { useState } from "react";
import { USDC_DECIMALS } from "@/lib/chain";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatUnits, parseUnits } from "viem";
import { useVaultActions } from "@/hooks/vault/useVaultActions";
import {
  TransactionModal,
  TxState,
} from "@/components/shared/TransactionModal";
import { useAvailableBalance } from "@/hooks/vault/useVaultQueries";
import { useContractClient } from "@/hooks/useContractClient";

export function AllocationEngine() {
  const { address } = useContractClient();
  const { data: claimableBalance } = useAvailableBalance(address);

  const [claimInput, setClaimInput] = useState<string>("");
  const [savePct, setSavePct] = useState<number>(0);
  const [durationValue, setDurationValue] = useState<string>("30");
  const [durationType, setDurationType] = useState<string>("days");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txState, setTxState] = useState<TxState>("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [txError, setTxError] = useState<string>("");

  const numClaimInput = Number(claimInput) || 0;
  const vaultAmount = numClaimInput * (savePct / 100);
  const liquidAmount = numClaimInput - vaultAmount;

  const formatUSDC = (val: number) =>
    val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const formattedMax = claimableBalance
    ? Number(formatUnits(claimableBalance, USDC_DECIMALS)).toString()
    : "0";

  const { claim, claimAndSave } = useVaultActions();

  const handleInitiateClaim = () => {
    setTxState("review");
    setIsModalOpen(true);
  };

  const executeTransaction = async () => {
    setTxState("processing");
    setTxError("");

    try {
      const amountBigInt = parseUnits(claimInput, USDC_DECIMALS);
      let hash = "";

      if (savePct === 0) {
        hash = await claim.mutateAsync({ amount: amountBigInt });
      } else {
        let seconds = Number(durationValue);
        if (durationType === "minutes") seconds *= 60;
        if (durationType === "hours") seconds *= 3600;
        if (durationType === "days") seconds *= 86400;
        if (durationType === "months") seconds *= 2592000;

        hash = await claimAndSave.mutateAsync({
          amount: amountBigInt,
          savePct: savePct,
          durationInSeconds: seconds,
        });
      }

      setTxHash(hash);
      setTxState("success");
    } catch (error: any) {
      setTxError(error.message || "Transaction failed or was rejected.");
      setTxState("error");
    }
  };

  return (
    <div className="lg:col-span-7 flex flex-col h-full">
      <div className="bg-white dark:bg-[#0A0A0A] rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 dark:border-slate-800/80 relative overflow-hidden flex flex-col h-full shadow-xs">
        {/* Module Header */}
        <div className="px-5 sm:px-6 lg:px-8 pt-5 sm:pt-6 lg:pt-8 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-4 sm:h-4 text-slate-900 dark:text-white" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest truncate">
              Allocation Engine
            </h2>
          </div>
        </div>

        {/* Primary Value Input */}
        <div className="flex flex-col items-center justify-center pt-6 pb-6 px-5 sm:pt-8 sm:pb-8 sm:px-8 border-b border-slate-100 dark:border-slate-800/50 relative z-10">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-1 sm:mb-2 text-center">
            You are claiming
          </p>

          {/* Fluid Centered Input Container */}
          <div className="relative group flex items-center justify-center w-full my-2 sm:my-3">
            <div className="flex items-center justify-center max-w-full">
              <span className="text-4xl sm:text-5xl lg:text-6xl font-light text-slate-300 dark:text-slate-700 transition-colors group-focus-within:text-slate-900 dark:group-focus-within:text-white mr-1 sm:mr-1.5 shrink-0">
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={claimInput}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*\.?\d*$/.test(val)) {
                    if (val === "" || val === ".") {
                      setClaimInput(val);
                      return;
                    }

                    const numVal = parseFloat(val);
                    const maxVal = parseFloat(formattedMax.replace(/,/g, ""));

                    if (!isNaN(numVal) && !isNaN(maxVal) && numVal <= maxVal) {
                      setClaimInput(val);
                    }
                  }
                }}
                style={{ width: `${(claimInput.length || 4) + 0.5}ch` }}
                className="bg-transparent text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white text-left outline-none tabular-nums tracking-tighter placeholder:text-slate-200 dark:placeholder:text-slate-800 transition-all min-w-0 p-0"
                placeholder="0.00"
              />
            </div>
          </div>

          <button
            onClick={() => setClaimInput(formattedMax)}
            className="mt-2 sm:mt-4 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 sm:px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 max-w-full"
          >
            <span className="truncate">
              Balance: {formatUSDC(Number(formattedMax))} USDC
            </span>
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 shrink-0">
              Max
            </span>
          </button>
        </div>

        {/* Allocation Logic and UI */}
        <div className="p-5 sm:p-6 lg:p-8 flex flex-col relative z-10 flex-1">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
              <h3 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
                Routing Split
              </h3>

              {/* Preset allocation triggers */}
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl sm:rounded-xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
                {[0, 25, 50, 75, 100].map((pct) => {
                  const isMaxZero =
                    parseFloat(formattedMax.replace(/,/g, "")) === 0;

                  return (
                    <button
                      key={pct}
                      onClick={() => setSavePct(pct)}
                      disabled={isMaxZero}
                      className={`flex-1 sm:flex-none text-[10px] font-bold px-2 sm:px-3 py-1.5 sm:py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        savePct === pct
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:hover:text-slate-500"
                      }`}
                    >
                      {pct}%
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slider for granular allocation control */}
            <div className="relative w-full h-2.5 sm:h-3 bg-slate-100 dark:bg-slate-900 rounded-full mb-6 sm:mb-8 border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-slate-900 dark:bg-slate-300 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${savePct}%` }}
              />
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={savePct}
                onChange={(e) => setSavePct(Number(e.target.value))}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Split destination visualization */}
            <div className="flex flex-col sm:flex-row w-full sm:items-stretch bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-slate-800 rounded-[1rem] sm:rounded-[1.25rem] overflow-hidden transition-all">
              {/* Instant liquidity route */}
              <div className="flex-1 p-4 sm:p-5 bg-slate-50 dark:bg-[#0f0f0f] transition-all min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1.5 sm:mb-2 truncate">
                  <Wallet className="w-3 h-3 shrink-0" /> Liquid
                </p>
                <div className="flex items-baseline gap-1 sm:gap-1.5 min-w-0 w-full">
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none truncate">
                    {formatUSDC(liquidAmount)}
                  </p>
                  <span className="text-xs sm:text-sm font-medium text-slate-500 shrink-0">
                    USDC
                  </span>
                </div>
              </div>

              <div className="w-full h-px sm:w-px sm:h-auto bg-slate-200 dark:bg-slate-800 shrink-0" />

              {/* Yield-bearing vault route */}
              <div
                className={`flex-1 p-4 sm:p-5 transition-all duration-500 min-w-0 ${
                  savePct > 0
                    ? "bg-emerald-50/50 dark:bg-emerald-500/10"
                    : "bg-white dark:bg-[#0A0A0A]"
                }`}
              >
                <p
                  className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1.5 sm:mb-2 truncate ${savePct > 0 ? "text-slate-600 dark:text-slate-400" : "text-slate-500"}`}
                >
                  <TrendingUp className="w-3 h-3 shrink-0" /> Auto-Save
                </p>
                <div className="flex items-baseline gap-1 sm:gap-1.5 min-w-0 w-full">
                  <p
                    className={`text-xl sm:text-2xl font-bold tracking-tight tabular-nums leading-none truncate ${savePct > 0 ? "text-slate-700 dark:text-white" : "text-slate-600"}`}
                  >
                    {formatUSDC(vaultAmount)}
                  </p>
                  <span className="text-xs sm:text-sm font-medium text-slate-500 shrink-0">
                    USDC
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Vault lock configuration */}
          <AnimatePresence>
            {savePct > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-slate-50 dark:bg-[#0f0f0f] border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8">
                  <div className="flex gap-2.5 sm:gap-3 mb-4 sm:mb-5">
                    <div className="mt-0.5 shrink-0">
                      <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0 mt-0.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white mb-0.5 truncate">
                        Flowroll Vault Enabled
                      </h4>
                      <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 leading-snug">
                        Funds will be locked and accrue APY until the duration
                        expires.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 sm:mb-2 block truncate">
                        Duration
                      </label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={durationValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^\d*\.?\d*$/.test(val)) {
                            setDurationValue(val);
                          }
                        }}
                        className="bg-white dark:bg-[#0A0A0A] border-slate-200 dark:border-slate-800 h-9 sm:h-10 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus-visible:ring-1 focus-visible:ring-slate-300 dark:focus-visible:ring-slate-700 focus-visible:ring-offset-0 tabular-nums w-full"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 sm:mb-2 block truncate">
                        Time Unit
                      </label>
                      <Select
                        value={durationType}
                        onValueChange={setDurationType}
                      >
                        <SelectTrigger className="bg-white dark:bg-[#0A0A0A] border-slate-200 dark:border-slate-800 h-9 sm:h-10 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 focus:ring-offset-0 w-full">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#0A0A0A] border-slate-200 dark:border-slate-800">
                          <SelectItem
                            value="minutes"
                            className="cursor-pointer font-medium text-xs sm:text-sm"
                          >
                            Minutes
                          </SelectItem>
                          <SelectItem
                            value="hours"
                            className="cursor-pointer font-medium text-xs sm:text-sm"
                          >
                            Hours
                          </SelectItem>
                          <SelectItem
                            value="days"
                            className="cursor-pointer font-medium text-xs sm:text-sm"
                          >
                            Days
                          </SelectItem>
                          <SelectItem
                            value="months"
                            className="cursor-pointer font-medium text-xs sm:text-sm"
                          >
                            Months
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={handleInitiateClaim}
            disabled={numClaimInput <= 0}
            className={`w-full h-12 sm:h-14 mt-auto rounded-xl sm:rounded-2xl font-medium text-xs sm:text-sm lg:text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              savePct > 0
                ? "border bg-emerald-50/50 dark:bg-emerald-500/10 border-slate-200 dark:border-slate-500/20 text-slate-800 dark:text-emerald-50"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800"
            }`}
          >
            <span className="truncate">
              {savePct > 0
                ? `Execute: Claim & Route (${savePct}%)`
                : "Execute: Liquid Claim"}
            </span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2 shrink-0" />
          </Button>
        </div>
      </div>

      {/* Global Transaction Lifecycle Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        status={txState}
        title="Confirm Allocation"
        summaryLabel="Total Claiming"
        summaryAmount={`${formatUSDC(numClaimInput)} USDC`}
        details={[
          { label: "To Wallet", value: `${formatUSDC(liquidAmount)} USDC` },
          { label: "To Vault ", value: `${formatUSDC(vaultAmount)} USDC` },
          ...(savePct > 0
            ? [
                {
                  label: "Lock Duration",
                  value: `${durationValue} ${durationType}`,
                },
              ]
            : []),
        ]}
        hash={txHash}
        errorMessage={txError}
        onConfirm={executeTransaction}
        onClose={() => setTxState("idle")}
      />
    </div>
  );
}
