'use client'

import { useState, useEffect } from 'react'
import { USDC_DECIMALS } from "@/lib/chain";
import { motion } from 'framer-motion'
import { Unlock, Lock, Copy, Check, Zap, Wallet, Building2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { useAddressResolver } from '@/hooks/identity/useAddressResolver'
import { usePayrollCycle } from '@/hooks/router/useRouterQueries'
import { useDisbursementRecord } from '@/hooks/dispatcher/useDispatcherQueries'
import { flowLog, formatDuration, formatMoney, truncateAddress } from '@/lib/utils'
import type { EmployeePayrollGroup } from '@/types'

interface EmployeeGroupCardProps {
    group: EmployeePayrollGroup
    index: number
}

export default function EmployeeGroupCard({ group, index }: EmployeeGroupCardProps) {
    const [copied, setCopied] = useState(false)
    const [timeRemaining, setTimeRemaining] = useState(0)

    // Identity and protocol state synchronization
    const { resolvedName: initUsername } = useAddressResolver(group.employerAddress)
    const { data: payrollCycle } = usePayrollCycle(group.employerAddress as `0x${string}`, group.activeCycleId)
    const { data: disbursementRecord } = useDisbursementRecord(group.employerAddress as `0x${string}`, group.activeCycleId)

    const handleCopy = () => {
        navigator.clipboard.writeText(group.employerAddress)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const payDay = payrollCycle?.payDay ? Number(payrollCycle.payDay) : 0
    const hasActiveCycle = group.activeCycleId !== 0n

    // Orchestrate real-time countdown to settlement
    useEffect(() => {
        if (!hasActiveCycle || !payDay) {
            setTimeRemaining(0)
            return
        }

        const updateCountdown = () => {
            const now = Math.floor(Date.now() / 1000)
            const diff = payDay - now
            setTimeRemaining(diff > 0 ? diff : 0)
        }

        updateCountdown()
        const interval = setInterval(updateCountdown, 1000)
        return () => clearInterval(interval)
    }, [payDay, hasActiveCycle])

    // UI state machine transitions
    const isPastPayday = hasActiveCycle && timeRemaining === 0
    const needsManualTrigger = isPastPayday && (!disbursementRecord || !disbursementRecord.executed)
    const fundsAvailable = isPastPayday && disbursementRecord?.executed
    const durationString = formatDuration(timeRemaining)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 * index, ease: [0.23, 1, 0.32, 1] }}
            className="group relative flex flex-col bg-white dark:bg-[#0A0A0A] rounded-[1.5rem] sm:rounded-[24px] overflow-hidden transition-all duration-500 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
        >
            {/* Header: Identity and Lifecycle Status */}
            <div className="p-4 sm:p-5 lg:p-6 pb-4 sm:pb-5">
                <div className="flex flex-row justify-between items-start gap-3 sm:gap-4 mb-5 sm:mb-6">
                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800 shrink-0">
                            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-900 dark:text-white" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <h3 className="text-lg sm:text-xl font-medium text-slate-900 dark:text-white leading-tight truncate">
                                    {group.name || "Payroll Stream"}
                                </h3>
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] sm:text-xs font-medium text-slate-500 uppercase tracking-widest shrink-0 hidden sm:inline-block">
                                    ID: {group.groupId.toString()}
                                </span>
                            </div>
                            <div
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 mt-0.5 sm:mt-1 cursor-pointer group/copy w-fit"
                            >
                                <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 group-hover/copy:text-slate-900 dark:group-hover/copy:text-white transition-colors truncate max-w-[120px] sm:max-w-none">
                                    {initUsername ? `${initUsername}.init` : truncateAddress(group.employerAddress)}
                                </span>
                                {copied ? (
                                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                ) : (
                                    <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-300 dark:text-slate-600 group-hover/copy:text-slate-900 dark:group-hover/copy:text-white transition-colors shrink-0" />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest shrink-0">
                        {!hasActiveCycle ? (
                            <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-1 sm:gap-1.5 p-1 rounded-md">
                                <Clock className="w-3 h-3" /> <span className="hidden sm:inline">Waiting</span>
                            </div>
                        ) : isPastPayday ? (
                            <div className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 flex items-center gap-1 sm:gap-1.5 p-1 rounded-md">
                                <Unlock className="w-3 h-3" /> <span className="hidden sm:inline">Unlocked</span>
                            </div>
                        ) : (
                            <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center gap-1 sm:gap-1.5 shadow-sm p-1 rounded-md">
                                <Lock className="w-3 h-3" /> <span className="hidden sm:inline">Locked</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Salary Metrics */}
                <div className="mt-2 min-w-0">
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 sm:mb-2 truncate">Net Salary</p>
                    <div className="flex items-baseline gap-1 sm:gap-1.5 min-w-0 w-full">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                            {group.employeeSalary ? formatMoney(group.employeeSalary, USDC_DECIMALS) : "0.00"}
                        </h2>
                        <span className="text-[10px] sm:text-xs lg:text-sm font-medium text-slate-400 dark:text-slate-500 shrink-0">USDC</span>
                    </div>
                </div>
            </div>

            <div className="h-[1px] w-full bg-slate-100 dark:bg-slate-800/50" />

            {/* Lifecycle State Rendering */}
            <div className="p-4 sm:p-5 lg:p-6 bg-slate-50/50 dark:bg-[#0f0f0f] flex-1 flex flex-col justify-center">
                {!hasActiveCycle ? (
                    <div className="flex items-center gap-2.5">
                        <span className="text-[9px] sm:text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest truncate">Awaiting Employer Setup</span>
                    </div>
                ) : timeRemaining > 0 ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 min-w-0">
                        <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-[9px] sm:text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest">Time to Payday</span>
                        </div>
                        <span className="text-xs sm:text-sm lg:text-base font-medium text-slate-900 dark:text-white tabular-nums tracking-tight truncate">
                            {durationString}
                        </span>
                    </div>
                ) : needsManualTrigger ? (
                    <div className="flex flex-col gap-2 sm:gap-3">
                        <span className="font-medium text-slate-500 text-[10px] sm:text-[11px] lg:text-xs truncate">Settlement taking too long?</span>
                        <Button
                            variant="outline"
                            className="h-10 sm:h-12 w-full border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-medium transition-all text-xs sm:text-sm cursor-pointer"
                        >
                            <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-green-500 shrink-0" /> Trigger Manually
                        </Button>
                    </div>
                ) : fundsAvailable ? (
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">Funds Available</span>
                            <span className="text-[10px] sm:text-[11px] lg:text-xs font-medium text-slate-500 mt-0.5 truncate">Check your dashboard balance</span>
                        </div>
                    </div>
                ) : null}
            </div>
        </motion.div>
    )
}