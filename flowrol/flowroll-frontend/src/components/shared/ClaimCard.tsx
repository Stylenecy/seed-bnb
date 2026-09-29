"use client";

import { motion } from 'framer-motion'
import { USDC_DECIMALS } from "@/lib/chain";
import type { Variants } from 'framer-motion'
import { Wallet, ArrowUpRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/utils'

const themeMap = {
    emerald: {
        bg: "bg-gradient-to-br from-white to-slate-50 dark:from-[#162032] dark:to-[#0A0F1C] border-slate-200 dark:border-slate-800/60",
        glow: "bg-gradient-to-bl from-emerald-300/20 to-emerald-500/10 dark:from-emerald-500/20 dark:to-emerald-400/10 group-hover:opacity-100 opacity-70",
        iconBox: "bg-emerald-50/50 dark:bg-white/5 border-emerald-100/50 dark:border-white/5",
        icon: "text-emerald-600 dark:text-emerald-400",
        button: "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 dark:from-emerald-600 dark:to-emerald-700 dark:hover:from-emerald-500 dark:hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/20",
        title: "text-slate-500 dark:text-slate-400",
        value: "text-slate-900 dark:text-white",
        unit: "text-slate-400 dark:text-slate-500"
    },
    blue: {
        bg: "bg-gradient-to-br from-white to-slate-50 dark:from-[#162032] dark:to-[#0A0F1C] border-slate-200 dark:border-slate-800/60",
        glow: "bg-gradient-to-bl from-blue-300/20 to-blue-500/10 dark:from-blue-500/20 dark:to-blue-400/10 group-hover:opacity-100 opacity-70",
        iconBox: "bg-blue-50/50 dark:bg-white/5 border-blue-100/50 dark:border-white/5",
        icon: "text-blue-600 dark:text-blue-400",
        button: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-500 dark:hover:to-blue-600 text-white shadow-lg shadow-blue-500/20",
        title: "text-slate-500 dark:text-slate-400",
        value: "text-slate-900 dark:text-white",
        unit: "text-slate-400 dark:text-slate-500"
    },
    amber: {
        bg: "bg-gradient-to-br from-white to-slate-50 dark:from-[#162032] dark:to-[#0A0F1C] border-slate-200 dark:border-slate-800/60",
        glow: "bg-gradient-to-bl from-amber-300/20 to-amber-500/10 dark:from-amber-500/20 dark:to-amber-400/10 group-hover:opacity-100 opacity-70",
        iconBox: "bg-amber-50/50 dark:bg-white/5 border-amber-100/50 dark:border-white/5",
        icon: "text-amber-600 dark:text-amber-400",
        button: "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500 text-slate-900 dark:text-white shadow-lg shadow-amber-500/20",
        title: "text-slate-500 dark:text-slate-400",
        value: "text-slate-900 dark:text-white",
        unit: "text-slate-400 dark:text-slate-500"
    },
    violet: {
        bg: "bg-gradient-to-br from-white to-slate-50 dark:from-[#162032] dark:to-[#0A0F1C] border-slate-200 dark:border-slate-800/60",
        glow: "bg-gradient-to-bl from-violet-300/20 to-violet-500/10 dark:from-violet-500/20 dark:to-violet-400/10 group-hover:opacity-100 opacity-70",
        iconBox: "bg-violet-50/50 dark:bg-white/5 border-violet-100/50 dark:border-white/5",
        icon: "text-violet-600 dark:text-violet-400",
        button: "bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-400 hover:to-violet-500 dark:from-violet-600 dark:to-violet-700 dark:hover:from-violet-500 dark:hover:to-violet-600 text-white shadow-lg shadow-violet-500/20",
        title: "text-slate-500 dark:text-slate-400",
        value: "text-slate-900 dark:text-white",
        unit: "text-slate-400 dark:text-slate-500"
    },

    "dark-emerald": {
        bg: "bg-gradient-to-br from-[#162032] to-[#0A0F1C] border-slate-800/60",
        glow: "bg-gradient-to-bl from-emerald-500/20 to-emerald-400/10 group-hover:opacity-100 opacity-70",
        iconBox: "bg-white/5 border-white/5",
        icon: "text-emerald-400",
        button: "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/20",
        title: "text-slate-400",
        value: "text-white",
        unit: "text-slate-500"
    },
    "dark-blue": {
        bg: "bg-gradient-to-br from-[#162032] to-[#0A0F1C] border-slate-800/60",
        glow: "bg-gradient-to-bl from-blue-500/20 to-blue-400/10 group-hover:opacity-100 opacity-70",
        iconBox: "bg-white/5 border-white/5",
        icon: "text-blue-400",
        button: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-500/20",
        title: "text-slate-400",
        value: "text-white",
        unit: "text-slate-500"
    },
    "dark-violet": {
        bg: "bg-gradient-to-br from-[#162032] to-[#0A0F1C] border-slate-800/60",
        glow: "bg-gradient-to-bl from-violet-500/20 to-violet-400/10 group-hover:opacity-100 opacity-70",
        iconBox: "bg-white/5 border-white/5",
        icon: "text-violet-400",
        button: "bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white shadow-lg shadow-violet-500/20",
        title: "text-slate-400",
        value: "text-white",
        unit: "text-slate-500"
    }
}

export type ThemeColor = keyof typeof themeMap;

interface ClaimCardProps {
    title?: string;
    balance: bigint | undefined;
    isLoading: boolean;
    buttonText?: string;
    theme?: ThemeColor;
    onAction: () => void;
    variants?: Variants;
    className?: string;
}

export function ClaimCard({
    title = "Available to Claim",
    balance,
    isLoading,
    buttonText = "Route & Claim",
    theme = "emerald",
    onAction,
    variants,
    className
}: ClaimCardProps) {
    const activeTheme = themeMap[theme] || themeMap.emerald;

    return (
        <motion.div
            variants={variants}
            className={`border rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] p-5 sm:p-6 lg:p-8 relative overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-slate-900/40 group flex flex-col justify-between min-h-[180px] sm:min-h-[220px] transition-colors ${activeTheme.bg} ${className || ''}`}
        >
            <div className={`absolute -right-10 -top-10 w-32 h-32 sm:w-48 sm:h-48 rounded-full blur-[2.5rem] sm:blur-[3rem] transition-all duration-700 pointer-events-none ${activeTheme.glow}`} />

            <div className="flex justify-between items-start relative z-10 mb-6 sm:mb-8 lg:mb-0">
                <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-colors backdrop-blur-md ${activeTheme.iconBox}`}>
                    <Wallet className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 transition-colors ${activeTheme.icon}`} />
                </div>

                <Button
                    onClick={onAction}
                    className={`rounded-full text-[9px] sm:text-[10px] lg:text-xs font-bold uppercase tracking-widest px-3 sm:px-4 lg:px-5 h-8 sm:h-9 lg:h-10 transition-all cursor-pointer border-none shrink-0 ${activeTheme.button}`}
                >
                    {buttonText} <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 ml-1.5" />
                </Button>
            </div>

            <div className="relative z-10 w-full min-w-0">
                <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-1.5 sm:mb-2 transition-colors truncate ${activeTheme.title}`}>
                    {title}
                </p>
                <div className="flex items-baseline gap-1.5 sm:gap-2 min-w-0 w-full">
                    <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter truncate transition-colors ${activeTheme.value}`}>
                        {isLoading ? "..." : formatMoney(balance ?? 0n, USDC_DECIMALS)}
                    </h2>
                    <span className={`text-sm sm:text-base lg:text-xl font-bold transition-colors shrink-0 ${activeTheme.unit}`}>
                        USDC
                    </span>
                </div>
            </div>
        </motion.div>
    )
}