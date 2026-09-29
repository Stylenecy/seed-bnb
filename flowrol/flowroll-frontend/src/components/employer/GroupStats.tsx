"use client";

import { useState, useEffect } from "react";
import { USDC_DECIMALS } from "@/lib/chain";
import { formatUnits } from "viem";
import {
  Activity,
  Clock,
  DollarSign,
  Layers,
  Wallet,
  AlertTriangle,
  ServerOff,
  Terminal,
  ChevronDown,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Server,
} from "lucide-react";

import {
  useGroupDetails,
  useTotalPayroll,
} from "@/hooks/payroll/usePayrollQueries";
import { useTokenBalance } from "@/hooks/token/useTokenQueries";
import { useContractClient } from "@/hooks/useContractClient";
import { flowLog, formatDuration, formatTimestamp } from "@/lib/utils";
import {
  useAgentStatus,
  useLiveYield,
  usePayrollCycle,
} from "@/hooks/router/useRouterQueries";
import { Button } from "../ui/button";

interface GroupStatsProps {
  groupId: bigint;
  showTerminal?: boolean;
  onToggleTerminal?: () => void;
}

export function GroupStats({
  groupId,
  showTerminal,
  onToggleTerminal,
}: GroupStatsProps) {
  const { contracts, address } = useContractClient();
  const { data: group, isLoading: loadingGroup } = useGroupDetails(
    address,
    groupId,
  );
  const { data: totalPayroll, isLoading: loadingPayroll } =
    useTotalPayroll(groupId);
  const { data: cycleData, isLoading: loadingCycle } = usePayrollCycle(
    address,
    group?.activeCycleId,
  );
  const { data: tokenBalance, isLoading: loadingBalance } = useTokenBalance(
    contracts.USDC_ADDRESS as `0x${string}`,
  );

  const { data: yieldData } = useLiveYield(address, group?.activeCycleId);
  const { data: isAgentRunning } = useAgentStatus();

  const [timeRemaining, setTimeRemaining] = useState(0);
  const payDay = cycleData?.payDay ? Number(cycleData.payDay) : 0;

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

  // if (loadingGroup || loadingPayroll || loadingBalance || loadingCycle) {
  //   return (
  //     <div className="w-full bg-white dark:bg-[#0a0c10] rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800/80 shadow-xs p-6 sm:p-8 mb-8 flex items-center justify-center h-[120px] sm:h-[160px]">
  //       <div className="flex items-center gap-2 sm:gap-3 text-slate-400 dark:text-slate-600 animate-pulse">
  //         <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
  //         <span className="text-xs sm:text-sm font-medium">
  //           Syncing on-chain data...
  //         </span>
  //       </div>
  //     </div>
  //   );
  // }

  const duration = formatDuration(timeRemaining);

  const formatMoney = (amount: bigint | undefined, decimal: number = 6) => {
    const rawValue = amount ? Number(formatUnits(amount, USDC_DECIMALS)) : 0;
    const exact = rawValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const compact = new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(rawValue);

    return { exact, compact };
  };

  const payroll = formatMoney(totalPayroll);
  const balance = formatMoney(tokenBalance);
  const yieldAmount = formatMoney(yieldData?.netYield);
  const isLoss = yieldData?.isLoss ?? false;

  const hasActiveCycle = group?.activeCycleId !== 0n;
  const isPaydayReached = hasActiveCycle && timeRemaining <= 0;
  const isEngineActive = hasActiveCycle && isAgentRunning && !isPaydayReached;
  const isEngineOffline = hasActiveCycle && !isAgentRunning && !isPaydayReached;

  const isInsufficient = Boolean(
    tokenBalance && totalPayroll && tokenBalance < totalPayroll,
  );

  flowLog("cycleData.isActive is ", cycleData);

  return (
    <div className="w-full bg-slate-200/60 dark:bg-slate-700/50 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200/60 dark:border-slate-700/50 shadow-[0_2px_10px_rgb(0,0,0,0.02)] mb-8 overflow-hidden">
      {/* 6-Grid Configuration */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px">
        {/* 1. Wallet Balance */}
        <div className="bg-white dark:bg-[#0a0c10] p-4 sm:p-6 xl:p-8 transition-colors hover:bg-slate-50/80 dark:hover:bg-[#0d1117] relative flex flex-col justify-between w-full min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2.5 text-slate-500 mb-2 sm:mb-4 min-w-0">
            <Wallet
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isInsufficient ? "text-amber-500" : "text-teal-500"}`}
            />
            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest truncate">
              Wallet Balance
            </span>
          </div>

          <div
            tabIndex={0}
            className="group/num relative flex sm:inline-flex items-baseline cursor-pointer max-w-full min-w-0 focus:outline-none"
          >
            <span
              className={`text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-montserrat font-bold tracking-tight border-b-2 border-dashed truncate ${
                isInsufficient
                  ? "text-amber-600 dark:text-amber-500 border-amber-200 dark:border-amber-900"
                  : "text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 group-hover/num:border-slate-400 group-focus/num:border-slate-400 transition-colors"
              }`}
            >
              {balance.compact}
            </span>
            <span
              className={`${isInsufficient ? "text-amber-400" : "text-slate-600 dark:text-slate-500"} text-[10px] sm:text-sm font-medium ml-1.5 shrink-0`}
            >
              USDC
            </span>

            <div className="absolute top-full left-0 mt-2 z-50 opacity-0 invisible group-hover/num:opacity-100 group-hover/num:visible group-focus/num:opacity-100 group-focus/num:visible translate-y-1 group-hover/num:translate-y-0 group-focus/num:translate-y-0 transition-all duration-200 max-w-[calc(100vw-3rem)] sm:max-w-[300px]">
              <div className="bg-slate-900 dark:bg-slate-800 text-white text-[10px] sm:text-xs font-mono font-medium py-1.5 px-2.5 rounded-lg shadow-xl flex items-center min-w-0">
                <span className="truncate">{balance.exact}</span>
                <span className="ml-1 shrink-0">USDC</span>
              </div>
            </div>
          </div>
          {isInsufficient && (
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 xl:top-8 xl:right-8 group/alert cursor-help shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 animate-pulse" />
              <div className="absolute top-full right-0 mt-2 hidden group-hover/alert:block z-50 w-32 sm:w-48">
                <div className="bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-amber-400 text-[10px] sm:text-xs font-semibold py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg shadow-xl text-center sm:text-left break-words whitespace-normal">
                  Insufficient funds for next cycle
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Total Payroll */}
        <div className="bg-white dark:bg-[#0a0c10] p-4 sm:p-6 xl:p-8 transition-colors hover:bg-slate-50/80 dark:hover:bg-[#0d1117] flex flex-col justify-between w-full min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2.5 text-slate-500 mb-2 sm:mb-4 min-w-0">
            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-violet-500 dark:text-violet-400" />
            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest truncate">
              Total Payroll
            </span>
          </div>

          <div
            tabIndex={0}
            className="group/num relative flex sm:inline-flex items-baseline cursor-help max-w-full min-w-0 focus:outline-none"
          >
            <span className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-montserrat font-bold text-slate-900 dark:text-white tracking-tight border-b-2 border-dashed border-slate-200 dark:border-slate-800 group-hover/num:border-slate-400 group-focus/num:border-slate-400 transition-colors truncate">
              {payroll.compact}
            </span>
            <span className="text-slate-600 dark:text-slate-500 text-[10px] sm:text-sm font-medium ml-1.5 shrink-0">
              USDC
            </span>

            <div className="absolute top-full left-0 mt-2 z-50 opacity-0 invisible group-hover/num:opacity-100 group-hover/num:visible group-focus/num:opacity-100 group-focus/num:visible translate-y-1 group-hover/num:translate-y-0 group-focus/num:translate-y-0 transition-all duration-200 max-w-[calc(100vw-3rem)] sm:max-w-[300px]">
              <div className="bg-slate-900 dark:bg-slate-800 text-white text-[10px] sm:text-xs font-mono font-medium py-1.5 px-2.5 rounded-lg shadow-xl flex items-center min-w-0">
                <span className="truncate">{payroll.exact}</span>
                <span className="ml-1 shrink-0">USDC</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Net Yield */}
        <div className="bg-white dark:bg-[#0a0c10] p-4 sm:p-6 xl:p-8 transition-colors hover:bg-slate-50/80 dark:hover:bg-[#0d1117] flex flex-col justify-between w-full min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2.5 text-slate-500 mb-2 sm:mb-4 min-w-0">
            {isLoss ? (
              <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-slate-600 dark:text-slate-500" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-emerald-500" />
            )}
            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest truncate">
              Yield Earned
            </span>
          </div>

          <div
            tabIndex={0}
            className="group/num relative flex sm:inline-flex items-baseline cursor-help max-w-full min-w-0 focus:outline-none"
          >
            <span
              className={`text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-montserrat font-bold tracking-tight border-b-2 border-dashed transition-colors truncate ${
                isLoss
                  ? "text-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-800 group-hover/num:border-slate-400 dark:group-hover/num:border-slate-600 group-focus/num:border-slate-400 dark:group-focus/num:border-slate-600"
                  : "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 group-hover/num:border-emerald-400 group-focus/num:border-emerald-400"
              }`}
            >
              {isLoss ? "-" : "+"}
              {yieldAmount.compact}
            </span>
            <span
              className={`text-[10px] sm:text-sm font-medium ml-1.5 shrink-0 ${
                isLoss
                  ? "text-slate-600 dark:text-slate-500"
                  : "text-emerald-600 dark:text-emerald-400/70"
              }`}
            >
              USDC
            </span>

            <div className="absolute top-full left-0 mt-2 z-50 opacity-0 invisible group-hover/num:opacity-100 group-hover/num:visible group-focus/num:opacity-100 group-focus/num:visible translate-y-1 group-hover/num:translate-y-0 group-focus/num:translate-y-0 transition-all duration-200 max-w-[calc(100vw-3rem)] sm:max-w-[300px]">
              <div className="bg-slate-900 dark:bg-slate-800 text-white text-[10px] sm:text-xs font-mono font-medium py-1.5 px-2.5 rounded-lg shadow-xl flex items-center min-w-0">
                <span className="truncate">
                  {isLoss ? "-" : "+"}
                  {yieldAmount.exact}
                </span>
                <span className="ml-1 shrink-0">USDC</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Time to Payday */}
        <div className="bg-white dark:bg-[#0a0c10] p-4 sm:p-6 xl:p-8 transition-colors hover:bg-slate-50/80 dark:hover:bg-[#0d1117] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2.5 text-slate-500 mb-2 sm:mb-4">
            <Clock
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isPaydayReached ? "text-amber-500" : "text-blue-500"}`}
            />
            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest truncate">
              Time to Payday
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-montserrat font-bold tracking-tight text-slate-900 dark:text-white truncate">
              {duration}
            </span>
          </div>
        </div>

        {/* 5. Active Epoch */}
        <div className="bg-white dark:bg-[#0a0c10] p-4 sm:p-6 xl:p-8 transition-colors hover:bg-slate-50/80 dark:hover:bg-[#0d1117] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2.5 text-slate-500 mb-2 sm:mb-4">
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-indigo-500 dark:text-indigo-400" />
            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest truncate">
              Active Epoch
            </span>
          </div>
          <div className="flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-slate-600 dark:text-slate-500 text-sm sm:text-xl font-medium">
              #
            </span>
            <span className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-montserrat font-bold text-slate-900 dark:text-white tracking-tight">
              {group?.activeCycleId?.toString() || "0"}
            </span>
          </div>
        </div>

        {/* 6. Yield Engine State Block */}
        <div
          className={`p-4 sm:p-6 xl:p-8 transition-colors flex flex-col justify-between relative overflow-hidden h-full ${
            isEngineActive
              ? "bg-emerald-50/60 dark:bg-emerald-500/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
              : isPaydayReached
                ? "bg-amber-50/60 dark:bg-amber-500/5 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                : isEngineOffline
                  ? "bg-rose-50/60 dark:bg-rose-500/5 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  : "bg-slate-50/60 dark:bg-[#0d1117] hover:bg-slate-50 dark:hover:bg-[#121820]"
          }`}
        >
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 mb-2 sm:mb-4 relative z-10 min-w-0">
              {isEngineActive ? (
                <Server className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-emerald-500" />
              ) : isPaydayReached ? (
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-amber-500" />
              ) : isEngineOffline ? (
                <ServerOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-rose-500" />
              ) : (
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-slate-400" />
              )}
              <span className="text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest truncate">
                Yield Engine
              </span>
            </div>

            <div className="relative z-10 flex items-center gap-1.5 sm:gap-2.5 mt-0 sm:mt-1 min-w-0">
              {isPaydayReached ? (
                <span className="text-amber-700 dark:text-amber-500 font-semibold tracking-wide text-[10px] sm:text-[11px] lg:text-sm truncate">
                  Payday Reached
                </span>
              ) : isEngineActive ? (
                <span className="text-emerald-700 dark:text-emerald-500 font-semibold tracking-wide text-[10px] sm:text-[11px] lg:text-sm truncate">
                  Active
                </span>
              ) : isEngineOffline ? (
                <span className="text-rose-700 dark:text-rose-500 font-semibold tracking-wide text-[10px] sm:text-[11px] lg:text-sm truncate">
                  Agent Offline
                </span>
              ) : (
                <>
                  <div className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 lg:h-3 lg:w-3 shrink-0">
                    <span className="relative inline-flex rounded-full h-full w-full bg-slate-400 dark:bg-slate-600" />
                  </div>
                  <span className="text-slate-600 dark:text-slate-400 tracking-wide text-[10px] sm:text-[11px] lg:text-sm truncate">
                    Idle
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Terminal Action */}
          {(cycleData?.isActive || isPaydayReached) && (
            <Button
              onClick={onToggleTerminal}
              variant="ghost"
              className={`relative z-10 mt-3 sm:mt-5 lg:mt-6 flex items-center justify-between w-full px-2 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-2.5 text-[9px] sm:text-[10px] lg:text-xs font-semibold rounded-lg sm:rounded-xl transition-all border h-auto ${
                isEngineActive
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                  : isPaydayReached
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                    : isEngineOffline
                      ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                      : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 dark:border-slate-700 hover:bg-slate-500/20 dark:hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 min-w-0">
                <Terminal className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 shrink-0" />
                <span className="truncate">
                  {showTerminal ? "Hide Logs" : "View Engine"}
                </span>
              </span>
              <ChevronDown
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 shrink-0 transition-transform duration-300 ${showTerminal ? "rotate-180" : ""}`}
              />
            </Button>
          )}

          {/* Ambient Glow Effects */}
          {isEngineActive && (
            <div className="absolute -bottom-10 -right-10 w-24 h-24 sm:w-40 sm:h-40 bg-emerald-400/10 dark:bg-emerald-500/10 rounded-full blur-2xl sm:blur-3xl pointer-events-none" />
          )}
          {isPaydayReached && (
            <div className="absolute -bottom-10 -right-10 w-24 h-24 sm:w-40 sm:h-40 bg-amber-400/10 dark:bg-amber-500/10 rounded-full blur-2xl sm:blur-3xl pointer-events-none" />
          )}
          {isEngineOffline && (
            <div className="absolute -bottom-10 -right-10 w-24 h-24 sm:w-40 sm:h-40 bg-rose-400/10 dark:bg-rose-500/10 rounded-full blur-2xl sm:blur-3xl pointer-events-none" />
          )}
        </div>
      </div>
    </div>
  );
}
