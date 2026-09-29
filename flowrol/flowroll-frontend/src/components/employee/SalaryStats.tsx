'use client'
import { USDC_DECIMALS } from "@/lib/chain";

import { 
    Lock, 
    Wallet, 
    TrendingUp, 
    AlertTriangle, 
    CheckCircle2, 
    Info 
} from 'lucide-react'
import { formatUnits } from 'viem'

import { useContractClient } from '@/hooks/useContractClient'
import { useTokenBalance } from '@/hooks/token/useTokenQueries'
import { useAdvanceInfo } from '@/hooks/flowroll/useFlowrollQueries'
import { formatMoney } from '@/lib/utils'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export function SalaryStats() {
    const { contracts } = useContractClient()
    const { data: usdcBalance, isLoading: isLoadingBalance } = useTokenBalance(contracts.USDC_ADDRESS)
    const { data: advanceInfo, isLoading: isLoadingAdvance } = useAdvanceInfo()

    const safeFormat = (amount?: bigint) => amount != null ? formatMoney(amount, USDC_DECIMALS) : "0.00"
    const exactFormat = (amount?: bigint) => amount != null ? formatUnits(amount, USDC_DECIMALS) : "0"

    const isDebtActive = (advanceInfo?.currentDebt ?? 0n) > 0n

    return (
        <TooltipProvider delayDuration={200}>
            <div className="w-full bg-white dark:bg-[#0a0c10] rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

                    <div className="p-4 sm:p-5 lg:p-6 xl:p-8 transition-colors hover:bg-slate-50/80 dark:hover:bg-[#0d1117] relative border-b sm:border-r lg:border-b-0 border-slate-200/60 dark:border-slate-800 flex flex-col justify-center min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 mb-2 sm:mb-4 w-fit relative">
                            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500 shrink-0" />
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest truncate">Pending Salary</span>
                            
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0 cursor-help outline-none" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-slate-900 dark:bg-slate-800 text-slate-200 text-xs font-medium p-3 rounded-xl shadow-xl border border-slate-700/50 leading-relaxed max-w-[240px] text-center">
                                    Your earned salary currently locked in Flowroll until payday.
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        
                        <div className="relative inline-flex items-baseline min-w-0 w-full">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-2xl sm:text-3xl lg:text-2xl xl:text-4xl font-bold tracking-tight text-slate-900 dark:text-white border-b-2 border-dashed border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-colors truncate cursor-help outline-none">
                                        {isLoadingAdvance ? "..." : safeFormat(advanceInfo?.pendingSalary)}
                                    </span>
                                </TooltipTrigger>
                                {!isLoadingAdvance && advanceInfo?.pendingSalary !== undefined && (
                                    <TooltipContent side="bottom" className="bg-slate-900 dark:bg-slate-800 text-slate-200 text-[10px] sm:text-xs font-mono font-medium py-1.5 px-2.5 rounded-lg shadow-xl border border-slate-700/50">
                                        {exactFormat(advanceInfo?.pendingSalary)} USDC
                                    </TooltipContent>
                                )}
                            </Tooltip>
                            <span className="text-slate-600 dark:text-slate-500 text-xs sm:text-sm font-medium ml-1.5 shrink-0">USDC</span>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5 lg:p-6 xl:p-8 transition-colors hover:bg-slate-50/80 dark:hover:bg-[#0d1117] relative border-b lg:border-r lg:border-b-0 border-slate-200/60 dark:border-slate-800 flex flex-col justify-center min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 mb-2 sm:mb-4 w-fit relative">
                            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest truncate">Wallet Balance</span>
                            
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0 cursor-help outline-none" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-slate-900 dark:bg-slate-800 text-slate-200 text-xs font-medium p-3 rounded-xl shadow-xl border border-slate-700/50 leading-relaxed max-w-[240px] text-center">
                                    The liquid funds currently available in your connected wallet.
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        <div className="relative inline-flex items-baseline min-w-0 w-full">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-2xl sm:text-3xl lg:text-2xl xl:text-4xl font-bold tracking-tight text-slate-900 dark:text-white border-b-2 border-dashed border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-colors truncate cursor-help outline-none">
                                        {isLoadingBalance ? "..." : safeFormat(usdcBalance)}
                                    </span>
                                </TooltipTrigger>
                                {!isLoadingBalance && usdcBalance !== undefined && (
                                    <TooltipContent side="bottom" className="bg-slate-900 dark:bg-slate-800 text-slate-200 text-[10px] sm:text-xs font-mono font-medium py-1.5 px-2.5 rounded-lg shadow-xl border border-slate-700/50">
                                        {exactFormat(usdcBalance)} USDC
                                    </TooltipContent>
                                )}
                            </Tooltip>
                            <span className="text-slate-600 dark:text-slate-500 text-xs sm:text-sm font-medium ml-1.5 shrink-0">USDC</span>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5 lg:p-6 xl:p-8 transition-colors hover:bg-slate-50/80 dark:hover:bg-[#0d1117] relative border-b sm:border-b-0 sm:border-r border-slate-200/60 dark:border-slate-800 flex flex-col justify-center min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 mb-2 sm:mb-4 w-fit relative">
                            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest truncate">Available Advance</span>
                            
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0 cursor-help outline-none" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-slate-900 dark:bg-slate-800 text-slate-200 text-xs font-medium p-3 rounded-xl shadow-xl border border-slate-700/50 leading-relaxed max-w-[240px] text-center">
                                    The maximum portion of your pending salary that you can withdraw early.
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        <div className="relative inline-flex items-baseline min-w-0 w-full">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-2xl sm:text-3xl lg:text-2xl xl:text-4xl font-bold tracking-tight text-slate-900 dark:text-white border-b-2 border-dashed border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-colors truncate cursor-help outline-none">
                                        {isLoadingAdvance ? "..." : safeFormat(advanceInfo?.maxAvailableToDraw)}
                                    </span>
                                </TooltipTrigger>
                                {!isLoadingAdvance && advanceInfo?.maxAvailableToDraw !== undefined && (
                                    <TooltipContent side="bottom" className="bg-slate-900 dark:bg-slate-800 text-slate-200 text-[10px] sm:text-xs font-mono font-medium py-1.5 px-2.5 rounded-lg shadow-xl border border-slate-700/50">
                                        {exactFormat(advanceInfo?.maxAvailableToDraw)} USDC
                                    </TooltipContent>
                                )}
                            </Tooltip>
                            <span className="text-slate-600 dark:text-slate-500 text-xs sm:text-sm font-medium ml-1.5 shrink-0">USDC</span>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5 lg:p-6 xl:p-8 transition-colors hover:bg-slate-50/80 dark:hover:bg-[#0d1117] relative flex flex-col justify-center min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 mb-2 sm:mb-4 w-fit relative">
                            {isDebtActive ? (
                                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                            ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                            )}
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest truncate">Active Debt</span>
                            
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0 cursor-help outline-none" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-slate-900 dark:bg-slate-800 text-slate-200 text-xs font-medium p-3 rounded-xl shadow-xl border border-slate-700/50 leading-relaxed max-w-[240px] text-center">
                                    Funds withdrawn early plus protocol fees. This will be automatically deducted on your next payday.
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        <div className="relative inline-flex items-baseline min-w-0 w-full">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className={`text-2xl sm:text-3xl lg:text-2xl xl:text-4xl font-bold tracking-tight border-b-2 border-dashed transition-colors truncate cursor-help outline-none ${isDebtActive ? 'text-amber-600 dark:text-amber-500 border-amber-200 dark:border-amber-900' : 'text-slate-900 dark:text-white border-transparent hover:border-slate-300 dark:hover:border-slate-700'}`}>
                                        {isLoadingAdvance ? "..." : safeFormat(advanceInfo?.currentDebt)}
                                    </span>
                                </TooltipTrigger>
                                {!isLoadingAdvance && advanceInfo?.currentDebt !== undefined && (
                                    <TooltipContent side="bottom" className="bg-slate-900 dark:bg-slate-800 text-slate-200 text-[10px] sm:text-xs font-mono font-medium py-1.5 px-2.5 rounded-lg shadow-xl border border-slate-700/50">
                                        {exactFormat(advanceInfo?.currentDebt)} USDC
                                    </TooltipContent>
                                )}
                            </Tooltip>
                            <span className={`${isDebtActive ? 'text-amber-600/70' : 'text-slate-600 dark:text-slate-500'} text-xs sm:text-sm font-medium ml-1.5 shrink-0`}>USDC</span>
                        </div>
                    </div>

                </div>
            </div>
        </TooltipProvider>
    )
}