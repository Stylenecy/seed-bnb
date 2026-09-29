'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, Info, Clock, ArrowUpRight } from 'lucide-react'
import { useAdvanceInfo } from '@/hooks/flowroll/useFlowrollQueries'

export function CreditTermsCard() {
    const { data: advanceInfo, isLoading } = useAdvanceInfo()

    const activeDebt = advanceInfo?.currentDebt ?? 0n
    const available = advanceInfo?.maxAvailableToDraw ?? 0n
    const feeBps = Number(advanceInfo?.currentFeeBps ?? 150n)
    
    const totalLimit = activeDebt + available
    const utilizationPercent = totalLimit > 0n 
        ? Number((activeDebt * 100n) / totalLimit) 
        : 0

    return (
        <div className="h-full bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-slate-800 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 lg:p-8 shadow-xs relative overflow-hidden flex flex-col">
            
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-sky-500/5 rounded-full blur-2xl sm:blur-3xl pointer-events-none" />

            <div className="mb-6 sm:mb-7 relative z-10">
                <div className="flex justify-between items-end mb-3 sm:mb-4 gap-2">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                        <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">
                            Credit Utilization
                        </span>
                    </div>
                    <span className={`text-xs sm:text-sm font-black tabular-nums shrink-0 ${activeDebt > 0n ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                        {isLoading ? "..." : `${utilizationPercent}%`}
                    </span>
                </div>
                
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${utilizationPercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full bg-emerald-500"
                    />
                </div>
            </div>

            <div className="h-px w-full bg-slate-100 dark:bg-slate-800/60 mb-6 sm:mb-7" />

            <div className="space-y-5 sm:space-y-6 lg:space-y-8 relative z-10 flex-1">
                
                <div className="flex items-start gap-3 sm:gap-4 lg:gap-5 group">
                    <div className="mt-0.5 sm:mt-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg sm:rounded-xl p-1.5 sm:p-2 border border-slate-100 dark:border-slate-700/50 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-colors shrink-0">
                        <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                    </div>
                    <div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">Fixed Protocol Fee</h4>
                        <p className="text-[11px] sm:text-xs lg:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mt-1 sm:mt-1.5">
                            Flowroll enforces a flat <span className="font-bold text-slate-700 dark:text-slate-300">{(feeBps / 100).toFixed(1)}%</span> execution fee on all advances. No recurring interest or hidden spreads.
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4 lg:gap-5 group">
                    <div className="mt-0.5 sm:mt-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg sm:rounded-xl p-1.5 sm:p-2 border border-slate-100 dark:border-slate-700/50 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-colors shrink-0">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                    </div>
                    <div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">Atomic Repayment</h4>
                        <p className="text-[11px] sm:text-xs lg:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mt-1 sm:mt-1.5">
                            Active debt is automatically settled via smart contract when the Payroll Dispatcher executes the next cycle.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-5 sm:mt-6 lg:mt-7 pt-4 sm:pt-5 lg:pt-6 border-t border-slate-100 dark:border-slate-800/60 relative z-10">
                <a
                    href="https://github.com/LanreAkintayo/flowroll-contract/#flowrollcredit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between w-full text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                    <span>Flowroll Credit Docs</span>
                    <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
            </div>

        </div>
    )
}