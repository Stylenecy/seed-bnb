"use client";

import { motion } from 'framer-motion'
import { USDC_DECIMALS } from "@/lib/chain";
import { ShieldCheck, Activity, Loader2, Flame } from 'lucide-react'

import { usePoolDetails, usePoolData } from '@/hooks/router/useRouterQueries'
import { formatMoney } from '@/lib/utils'

export interface PoolEntry {
  pool: `0x${string}`;
  isActive: boolean;
  isStablePair: boolean;
}

interface VaultCardProps {
  cycleId: bigint | undefined;
  poolIndex: bigint;
  poolEntry: PoolEntry;
}

export function VaultCard({ cycleId, poolIndex, poolEntry }: VaultCardProps) {
  const { data: details, isLoading: loadingDetails } = usePoolDetails(poolEntry.pool);
  const { data: allocation, isLoading: loadingAllocation } = usePoolData(cycleId, poolIndex, poolEntry.pool);

  const isLoading = loadingDetails || loadingAllocation;
  
  const formattedIndex = poolIndex?.toString().padStart(2, '0') || "00";
  const apy = details?.apyBps ? (Number(details.apyBps) / 100).toFixed(1) : "0.0";
  const balanceUsdc = allocation?.valueUsdc ? formatMoney(allocation.valueUsdc, USDC_DECIMALS) : "0.00";
  const sharesAmount = allocation?.shares ? formatMoney(allocation.shares, USDC_DECIMALS) : "0.00";

  const isStable = details?.isStablePair ?? poolEntry.isStablePair;
  const Icon = isStable ? ShieldCheck : Activity;
  
  const iconBg = isStable ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-blue-50 dark:bg-blue-500/10";
  const iconColor = isStable ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400";
  const iconBorder = isStable ? "border-emerald-200 dark:border-emerald-500/20" : "border-blue-200 dark:border-blue-500/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-[#0A0A0A] rounded-[1.25rem] sm:rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col relative overflow-hidden h-full"
    >
      <div className="p-4 sm:p-6 pb-6 sm:pb-8 flex-1">
        <div className="flex justify-between items-start mb-6 sm:mb-8 gap-2">
          
          {/* Asset identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border ${iconBorder} ${iconBg}`}>
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
            </div>
            <div className="min-w-0">
              <h4 className="text-slate-900 dark:text-white text-xs sm:text-sm font-bold flex items-center gap-2 truncate">
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin text-slate-500 shrink-0" />
                ) : (
                  details?.poolName || "Flowroll Vault"
                )}
              </h4>
              <p className="text-slate-500 dark:text-slate-500 text-[9px] sm:text-[10px] font-bold mt-0.5 uppercase tracking-widest truncate">
                {details?.symbol || "VAULT SHARES"}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {!isLoading && (
              <span className="text-slate-500 dark:text-slate-600 text-[9px] sm:text-[10px] font-mono font-medium tracking-widest">
                PID-{formattedIndex}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col min-w-0">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1 sm:mb-1.5">
            Live Allocation
          </p>
          <div className="flex items-baseline gap-1.5 w-full">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight truncate">
              {balanceUsdc}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-600 shrink-0">USDC</span>
          </div>
        </div>
      </div>

      {/* Vault yield telemetry */}
      <div className="bg-slate-50/50 dark:bg-[#0f0f0f] border-t border-slate-200 dark:border-slate-800/80 p-4 sm:p-5">
        <div className="flex justify-between items-center gap-2">
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-0.5 sm:mb-1">Yield Rate</p>
            <div className="flex items-center gap-1 sm:gap-1.5">
              {apy !== "0.0" && <Flame className="w-3 h-3 text-emerald-500 shrink-0" />}
              <p className={`text-xs sm:text-sm font-bold tabular-nums truncate ${apy === "0.0" ? "text-slate-500 dark:text-slate-600" : "text-emerald-600 dark:text-emerald-400"}`}>
                {apy === "0.0" ? "NO YIELD" : `${apy}% APY`}
              </p>
            </div>
          </div>

          <div className="text-right min-w-0">
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-0.5 sm:mb-1">Asset Shares</p>
            <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums truncate">
              {sharesAmount}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}