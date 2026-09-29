'use client';

import { Droplets, HandCoins } from 'lucide-react';

import { useNativeTokenBalance, useTokenBalance } from '@/hooks/token/useTokenQueries';
import { useContractClient } from '@/hooks/useContractClient';
import { formatMoney } from '@/lib/utils';
import { NATIVE_SYMBOL, USDC_DECIMALS } from '@/lib/chain';

interface LiveBalanceHeaderProps {
    step1Complete: boolean;
    step2Complete: boolean;
    allSetupComplete: boolean;
}

export function LiveBalanceHeader({
    step1Complete,
    step2Complete,
    allSetupComplete
}: LiveBalanceHeaderProps) {
    const { contracts } = useContractClient();

    const { data: usdcTokenBalance, isLoading: isLoadingUsdcTokenBalance } = useTokenBalance(contracts.USDC_ADDRESS);
    const { data: gas, isLoading: isLoadingGas } = useNativeTokenBalance();

    const safeFormat = (amount: bigint | undefined | null, decimals: number) => {
        return formatMoney(amount ?? 0n, decimals);
    };

    return (
        <div className="flex justify-center w-full mb-2 sm:mb-0 pb-2 sm:pb-4  px-2 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800/80 rounded-[1.25rem] sm:rounded-full p-2 w-full sm:w-auto">

                {/* Gas Balance - Always visible */}
                <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-6 py-2 min-w-0">
                    <div className={`p-2 sm:p-2.5 rounded-xl sm:rounded-full transition-colors duration-500 shrink-0 ${step1Complete ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}>
                        <Droplets className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex flex-col justify-center min-w-0 w-full">
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-0.5 sm:mb-1 truncate">{NATIVE_SYMBOL}</span>
                        <span className="text-xl sm:text-2xl font-black tracking-tighter text-slate-900 dark:text-white leading-none truncate">
                            {isLoadingGas ? '...' : safeFormat(gas, 18)}
                        </span>
                    </div>
                </div>

                <div className="w-full h-px sm:w-px sm:h-10 bg-slate-100 dark:bg-slate-800/80 my-1 sm:my-0 mx-auto sm:mx-0 shrink-0" />

                {/* USDC Balance - Always visible */}
                <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-6 py-2 sm:pr-8 min-w-0">
                    <div className={`p-2 sm:p-2.5 rounded-xl sm:rounded-full transition-colors duration-500 shrink-0 ${allSetupComplete ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}>
                        <HandCoins className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex flex-col justify-center min-w-0 w-full">
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-0.5 sm:mb-1 truncate">USDC</span>
                        <span className="text-xl sm:text-2xl font-black tracking-tighter text-slate-900 dark:text-white leading-none truncate">
                            {isLoadingUsdcTokenBalance ? '...' : safeFormat(usdcTokenBalance, USDC_DECIMALS)}
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}