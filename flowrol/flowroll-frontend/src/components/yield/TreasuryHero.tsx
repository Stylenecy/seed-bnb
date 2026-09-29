"use client";

import { useState, useEffect } from "react";
import { USDC_DECIMALS } from "@/lib/chain";
import { motion } from "framer-motion";
import { Timer, HandCoins, Lock } from "lucide-react";

import { usePayrollCycle, useLiveYield } from "@/hooks/router/useRouterQueries";
import { useContractClient } from "@/hooks/useContractClient";
import { formatMoney, formatDuration } from "@/lib/utils";

interface TreasuryHeroProps {
  cycleId: bigint;
}

export function TreasuryHero({ cycleId }: TreasuryHeroProps) {
  const { address } = useContractClient();
  
  const { data: cycleData } = usePayrollCycle(address, cycleId);
  const { data: liveYieldData } = useLiveYield(address, cycleId);

  const [timeRemaining, setTimeRemaining] = useState(0);
  const payDay = cycleData?.payDay ? Number(cycleData.payDay) : 0;

  const totalAssets = cycleData?.totalDeposited || 0n;
  const amountInReserve = cycleData?.idleBalance || 0n;
  const yieldEarned = liveYieldData?.netYield || 0n;

  const currentAllocation = totalAssets > amountInReserve 
    ? totalAssets - amountInReserve 
    : 0n;

  const inReservePercent = totalAssets > 0n ? (Number(amountInReserve) / Number(totalAssets)) * 100 : 0;
  const allocationPercent = totalAssets > 0n ? (Number(currentAllocation) / Number(totalAssets)) * 100 : 0;

  useEffect(() => {
    if (!payDay) return;

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = payDay - now;
      setTimeRemaining(diff > 0 ? diff : 0);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [payDay]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
      
      {/* Reserve telemetry */}
      <div className="col-span-1 bg-indigo-50 dark:bg-gradient-to-br dark:from-indigo-950/80 dark:to-slate-900 border border-indigo-100 dark:border-indigo-500/30 p-4 sm:p-6 lg:p-8 rounded-[1.5rem] sm:rounded-[24px] relative overflow-hidden flex flex-col justify-between dark:shadow-[0_0_30px_rgba(99,102,241,0.05)] min-h-[160px] sm:min-h-0">
        <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/50 dark:bg-indigo-500/10 rounded-full blur-2xl sm:blur-3xl -mr-8 -mt-8 sm:-mr-10 sm:-mt-10" />

        <div className="flex items-center gap-2.5 sm:gap-3 mb-5 sm:mb-6 relative z-10">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white dark:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm dark:shadow-none shrink-0">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-slate-900 dark:text-white font-bold text-sm sm:text-base truncate">Payroll Reserve</h3>
            <p className="text-slate-700/70 dark:text-indigo-300/70 text-[9px] sm:text-[11px] uppercase tracking-wider font-bold truncate">Secured Base</p>
          </div>
        </div>

        <div className="relative z-10 w-full min-w-0">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white truncate">
            {formatMoney(amountInReserve, USDC_DECIMALS)} <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">USDC</span>
          </p>
          <div className="mt-3 sm:mt-4 inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 shadow-sm dark:shadow-none max-w-full">
            <Timer className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
            <span className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
              {formatDuration(timeRemaining)} to Payday
            </span>
          </div>
        </div>
      </div>

      {/* Yield distribution visualizer */}
      <div className="col-span-1 xl:col-span-2 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 lg:p-8 rounded-[1.5rem] sm:rounded-[24px] flex flex-col justify-between shadow-sm dark:shadow-none min-h-[160px] sm:min-h-0">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="w-full sm:w-auto min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
              <HandCoins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-bold uppercase tracking-widest truncate">Total Yield Generated</h3>
            </div>
            <motion.p 
              key={yieldEarned.toString()} 
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight truncate"
            >
              +{formatMoney(yieldEarned, USDC_DECIMALS)} <span className="text-xs sm:text-sm font-sans font-medium text-emerald-600/60 dark:text-emerald-400/60">USDC</span>
            </motion.p>
          </div>
          
          <div className="text-left sm:text-right w-full sm:w-auto min-w-0 border-t border-slate-100 dark:border-slate-800/60 pt-3 sm:border-0 sm:pt-0 mt-1 sm:mt-0">
            <p className="text-slate-500 dark:text-slate-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-0.5 sm:mb-1 truncate">Active Capital</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">{formatMoney(currentAllocation, USDC_DECIMALS)} USDC</p>
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <div className="flex justify-between items-center text-[9px] sm:text-[11px] font-bold uppercase tracking-wider gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 sm:gap-1.5 truncate">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 shrink-0" /> Reserve ({inReservePercent.toFixed(0)}%)
            </span>
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 sm:gap-1.5 truncate text-right">
              Deployed Yield ({allocationPercent.toFixed(0)}%)
            </span>
          </div>
          <div className="h-2.5 sm:h-3 w-full bg-emerald-100 dark:bg-emerald-950 rounded-full overflow-hidden flex gap-0.5 shadow-inner">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${inReservePercent}%` }} 
              className="bg-emerald-500 h-full" 
              transition={{ duration: 1, ease: "easeOut" }} 
            />
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${allocationPercent}%` }} 
              className="bg-slate-400 dark:bg-slate-600 h-full" 
              transition={{ duration: 1, ease: "easeOut" }} 
            />
          </div>
        </div>
      </div>

    </div>
  );
}