"use client";

import { flowLog } from "@/lib/utils";
import {
    Zap,
    ArrowRightLeft,
    Droplets,
    CheckCircle2,
    Loader2,
    Lock,
    Activity,
    ServerOff
} from "lucide-react";

interface LogEntry {
    id: string;
    timestamp: string;
    message: string;
}

interface SmartTimelineProps {
    logs: LogEntry[];
    isConnected: boolean;
}

export function SmartTimeline({ logs, isConnected }: SmartTimelineProps) {
    const hasPayday = logs.some(log => log.message.includes("[PAYDAY]"));

    flowLog("Rendering SmartTimeline with logs:", logs);

    return (
        <div className="flex flex-col relative ml-2 sm:ml-4 lg:ml-8 border-l-2 border-slate-200 dark:border-slate-800/50 pb-4 sm:pb-8">
            
            {/* Empty State or Log Mapping */}
            {logs.length === 0 ? (
                <div className="relative pl-5 sm:pl-8 pb-6 sm:pb-8 lg:pb-10 opacity-70">
                    <div className="absolute -left-[13px] sm:-left-[17px] top-0.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center z-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
                        <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500" />
                    </div>

                    <div className="flex flex-col bg-slate-50/50 dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-800/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                        <p className="text-sm sm:text-[15px] text-slate-500 dark:text-slate-400 italic">
                            No execution logs recorded for this session yet.
                        </p>
                    </div>
                </div>
            ) : (
                logs.map((log, index) => {
                    const isInit = log.message.includes("[INIT]");
                    const isRebalance = log.message.includes("[REBALANCE]");
                    const isLiquidity = log.message.includes("[LIQUIDITY]");
                    const isPayday = log.message.includes("[PAYDAY]");

                    let Icon = Zap;
                    let iconColor = "text-slate-500 dark:text-slate-400";
                    let bg = "bg-white dark:bg-slate-900";
                    let border = "border-slate-300 dark:border-slate-700";

                    if (isInit) {
                        Icon = Activity;
                        iconColor = "text-blue-500 dark:text-blue-400";
                        bg = "bg-blue-50 dark:bg-blue-500/10";
                        border = "border-blue-200 dark:border-blue-500/30";
                    } else if (isRebalance) {
                        Icon = ArrowRightLeft;
                        iconColor = "text-emerald-500 dark:text-emerald-400";
                        bg = "bg-emerald-50 dark:bg-emerald-500/10";
                        border = "border-emerald-200 dark:border-emerald-500/30";
                    } else if (isLiquidity) {
                        Icon = Droplets;
                        iconColor = "text-amber-500 dark:text-amber-400";
                        bg = "bg-amber-50 dark:bg-amber-500/10";
                        border = "border-amber-200 dark:border-amber-500/30";
                    } else if (isPayday) {
                        Icon = CheckCircle2;
                        iconColor = "text-yellow-600 dark:text-yellow-400";
                        bg = "bg-yellow-50 dark:bg-yellow-500/10";
                        border = "border-yellow-300 dark:border-yellow-500/50";
                    }

                    const isLatest = index === logs.length - 1;

                    return (
                        <div
                            key={log.id}
                            className={`relative pl-5 sm:pl-8 pb-6 sm:pb-8 lg:pb-10 transition-opacity duration-300 ${!isLatest ? "opacity-70" : "opacity-100"}`}
                        >
                            <div className={`absolute -left-[13px] sm:-left-[17px] top-0.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center z-10 ${bg} ${border} shadow-sm dark:shadow-none`}>
                                <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${iconColor}`} />
                            </div>

                            <div className="flex flex-col bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-none">
                                <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 dark:text-slate-500 mb-1.5 sm:mb-2 uppercase tracking-tight">
                                    {log.timestamp}
                                </span>
                                <p className={`text-xs sm:text-[15px] leading-relaxed ${isLatest ? "text-slate-900 dark:text-white font-medium" : "text-slate-600 dark:text-slate-300"}`}>
                                    {log.message.replace(/\[.*?\]\s*/, "")}
                                </p>
                            </div>
                        </div>
                    );
                })
            )}

            {/* Terminal status indicators */}
            <div className="relative pl-5 sm:pl-8 pt-1 sm:pt-2">
                {hasPayday ? (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="absolute -left-[11px] sm:-left-[13px] top-3 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-yellow-100 dark:bg-yellow-500/20 border-2 border-yellow-400 dark:border-yellow-500 flex items-center justify-center shadow-sm">
                            <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-600 dark:text-yellow-500" />
                        </div>
                        <p className="text-yellow-600 dark:text-yellow-500 font-medium text-xs sm:text-sm mt-3">
                            Cycle Complete. Waiting for next funding round.
                        </p>
                    </div>
                ) : !isConnected ? (
                    <div className="flex flex-col gap-1.5 sm:gap-2 animate-in fade-in duration-500">
                        <div className="absolute -left-[4px] top-[13px] w-2 h-2 rounded-full bg-rose-500" />
                        <p className="text-rose-500 dark:text-rose-400 text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-2">
                            <ServerOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                            Agent is offline. Waiting for connection...
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1.5 sm:gap-2 animate-in fade-in duration-500">
                        <div className="absolute -left-1 top-4 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <div className="absolute -left-[3px] top-[14px] w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-2">
                            <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin shrink-0" />
                            Agent continuously monitoring yields...
                        </p>
                    </div>
                )}
            </div>
            
        </div>
    );
}