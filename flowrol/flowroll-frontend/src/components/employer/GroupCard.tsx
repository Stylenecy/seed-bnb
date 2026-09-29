"use client";

import { useState } from "react";
import { USDC_DECIMALS } from "@/lib/chain";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Activity,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";

import type { PayrollGroup } from "@/types";
import { formatDuration, formatMoney, formatTimestamp } from "@/lib/utils";
import { useContractClient } from "@/hooks/useContractClient";
import { useDisbursementRecord } from "@/hooks/dispatcher/useDispatcherQueries";
import { usePayrollCycle } from "@/hooks/router/useRouterQueries";

interface GroupCardProps {
  group: PayrollGroup;
}

export function GroupCard({ group }: GroupCardProps) {
  const { address } = useContractClient();
  const { data: disbursementRecord } = useDisbursementRecord(
    address,
    group.activeCycleId,
  );
  const { data: cycleData } = usePayrollCycle(address, group.activeCycleId);

  const [isHovered, setIsHovered] = useState(false);
  const groupIdStr = group.groupId.toString();

  const isEngineActive = group.activeCycleId !== 0n;
  const isExecuted = disbursementRecord?.executed ?? false;
  const formattedTotal = formatMoney(group.totalPayroll, USDC_DECIMALS);

  let badgeColor =
    "bg-amber-100/80 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30";
  let badgeContent = "Setup Required";

  if (isEngineActive) {
    if (isExecuted) {
      badgeColor =
        "bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30";
      badgeContent = "Disbursed";
    } else {
      badgeColor =
        "bg-blue-100/80 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30";
      badgeContent = "Active";
    }
  }

  return (
    <Link
      href={`/employer/groups/${groupIdStr}`}
      className="block outline-none"
    >
      <motion.div
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group relative bg-white dark:bg-[#0a0c10] border border-slate-200/80 dark:border-slate-800 rounded-[1.5rem] sm:rounded-[2rem] p-1 transition-all duration-300 hover:border-violet-200 dark:hover:border-violet-500/30 hover:shadow-sm hover:shadow-violet-900/5 dark:hover:shadow-violet-500/5"
      >
        <div className="rounded-[1.25rem] sm:rounded-[1.75rem] p-4 sm:p-6 h-full border border-transparent group-hover:bg-white dark:group-hover:bg-[#0d1117] transition-colors flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6 sm:mb-8 gap-3">
            <div className="min-w-0 flex-1">
              <h4 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white mb-2 sm:mb-3 tracking-tight capitalize truncate">
                {group.name}
              </h4>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${badgeColor}`}
                >
                  {isEngineActive && isExecuted && (
                    <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  )}
                  <span className="whitespace-nowrap">{badgeContent}</span>
                </span>

                {isEngineActive && (
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1 sm:gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg  whitespace-nowrap">
                    <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />{" "}
                    Epoch #{group.activeCycleId.toString()}
                  </span>
                )}
              </div>
            </div>

            <div
              className={`shrink-0 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 ${
                isHovered
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-slate-900/20 translate-x-1"
                  : "bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800"
              }`}
            >
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-auto">
            <div className="bg-slate-50/50 dark:bg-slate-800/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 dark:border-slate-800 shadow-xs min-w-0">
              <p className="text-[9px] sm:text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1 truncate">
                {isEngineActive ? "Payday" : "Cycle Duration"}
              </p>
              <p className="text-slate-900 dark:text-white font-medium flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm lg:text-base truncate">
                {isEngineActive ? (
                  <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-500 shrink-0" />
                )}
                <span className=" w-full">
                  {isEngineActive ? (
                    cycleData?.payDay ? (
                      <>
                        <span className="sm:hidden">
                          {formatTimestamp(cycleData.payDay, true)}
                        </span>

                        <span className="hidden sm:inline">
                          {formatTimestamp(cycleData.payDay)}
                        </span>
                      </>
                    ) : (
                      "Loading..."
                    )
                  ) : (
                    formatDuration(Number(group.cycleDuration))
                  )}
                </span>
              </p>
            </div>

            <div className="bg-slate-50/50 dark:bg-slate-800/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 dark:border-slate-800 shadow-xs min-w-0">
              <p className="text-[9px] sm:text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-1 truncate">
                Total Payroll
              </p>
              <p className="text-slate-900 dark:text-white font-medium tracking-tight text-xs sm:text-sm lg:text-base truncate">
                {formattedTotal}{" "}
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                  USDC
                </span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
