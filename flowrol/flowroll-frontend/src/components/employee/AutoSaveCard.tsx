'use client'

import { useState, useEffect } from "react"
import { USDC_DECIMALS } from "@/lib/chain";
import { motion } from "framer-motion"
import { Unlock, Cpu, ChevronRight, Lock, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"

import { usePayrollCycle, useLiveYield } from "@/hooks/router/useRouterQueries"
import { useContractClient } from "@/hooks/useContractClient"
import { AutoSaveCycle } from "@/types"
import { formatMoney, formatTimestamp } from "@/lib/utils"

interface AutosavePositionCardProps {
    autoSaveCycle: AutoSaveCycle
    onOpenAgent: () => void
}

export function AutoSaveCard({ autoSaveCycle, onOpenAgent }: AutosavePositionCardProps) {
    const { address } = useContractClient()

    const { data: liveYield } = useLiveYield(address, autoSaveCycle.cycleId)

    const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Math.floor(Date.now() / 1000))
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    const epochStr = autoSaveCycle.cycleId.toString().padStart(2, '0')
    const principalStr = formatMoney(autoSaveCycle.amountSaved, USDC_DECIMALS)

    const unlockTime = Number(autoSaveCycle.startTime) + Number(autoSaveCycle.duration)
    const isLocked = autoSaveCycle.isActive && (now < unlockTime)
    const payTime = formatTimestamp(unlockTime, true) // Passed 'true' for compact mobile formatting if available

    const currentValue = liveYield ? formatMoney(liveYield.totalValue, USDC_DECIMALS) : principalStr
    const yieldEarned = liveYield ? formatMoney(liveYield.netYield, USDC_DECIMALS) : "0.00"
    const isLoss = liveYield?.isLoss ?? false

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-5 lg:p-6 flex flex-col bg-white dark:bg-[#0A0A0A] rounded-[1.5rem] sm:rounded-[24px] transition-all duration-300 shadow-xs hover:shadow-md border border-slate-200 dark:border-white/10 h-full"
        >
            <div className="flex justify-between items-start mb-5 sm:mb-6 gap-2">
                <span className="px-2 sm:px-2.5 py-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-[9px] sm:text-[10px] font-mono font-bold rounded-md tracking-widest shrink-0">
                    EPOCH-{epochStr}
                </span>

                <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-widest shrink-0 ${isLocked
                        ? "bg-slate-50 dark:bg-white/5 text-slate-500"
                        : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}>
                    {isLocked ? <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <Unlock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                    {isLocked ? "Locked" : "Unlocked"}
                </div>
            </div>

            <div className="mb-5 sm:mb-6 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 sm:mb-1.5 truncate">
                    Net Vault Value
                </p>
                <div className="flex items-baseline gap-1 sm:gap-1.5 min-w-0 w-full">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums truncate">
                        {currentValue}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-400 shrink-0">USDC</span>
                </div>
            </div>

            <div className="flex flex-col gap-2 sm:gap-2.5 p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-[#111111] border border-slate-100 dark:border-slate-800/80 mb-5 sm:mb-6">
                <div className="flex justify-between items-center text-[11px] sm:text-xs gap-2">
                    <span className="text-slate-500 font-medium truncate">Principal</span>
                    <span className="text-slate-900 dark:text-white font-semibold font-mono truncate">${principalStr}</span>
                </div>
                <div className="w-full h-px bg-slate-200 dark:bg-slate-800" />
                <div className="flex justify-between items-center text-[11px] sm:text-xs gap-2">
                    <span className="text-slate-500 font-medium truncate">Yield Earned</span>
                    <span className={`font-semibold font-mono truncate ${isLoss ? "text-slate-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {isLoss ? "-" : "+"}{yieldEarned}
                    </span>
                </div>
            </div>

            <div className="mt-auto flex flex-col gap-3 sm:gap-4 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] lg:text-xs font-medium text-slate-500 dark:text-slate-400 px-1 min-w-0 w-full">
                    <CalendarDays className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="truncate">{isLocked ? "Unlocks on" : "Unlocked since"} {payTime}</span>
                </div>

                <Button
                    onClick={onOpenAgent}
                    className="w-full h-10 sm:h-11 flex items-center justify-between bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl transition-all group shrink-0"
                >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 dark:text-blue-600" />
                        <span className="text-[11px] sm:text-xs font-bold">Agent Center</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
        </motion.div>
    )
}