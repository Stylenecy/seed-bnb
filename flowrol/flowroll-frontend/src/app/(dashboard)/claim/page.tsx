"use client";

import { formatUnits } from "viem";
import { USDC_DECIMALS } from "@/lib/chain";
import { AllocationEngine } from "@/components/employee/AllocationEngine";
import { OmnichainBridge } from "@/components/employee/OmnichainBridge";
import { useAvailableBalance } from "@/hooks/vault/useVaultQueries";
import { useContractClient } from "@/hooks/useContractClient";
import { useTokenBalance } from "@/hooks/token/useTokenQueries";
import { SectionTitle } from "@/components/shared/SectionTitle";

export default function ClaimHubPage() {
  // Identity and protocol context
  const { address, contracts } = useContractClient();

  // Global state synchronization
  const { data: claimableBalance } = useAvailableBalance(address);
  const { data: walletBalance } = useTokenBalance(contracts.USDC_ADDRESS);

  // Data presentation formatting
  const formattedMax = claimableBalance
    ? Number(formatUnits(claimableBalance, USDC_DECIMALS)).toString()
    : "0";
  const formattedWalletBalance = walletBalance
    ? Number(formatUnits(walletBalance, USDC_DECIMALS)).toString()
    : "0";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] transition-colors duration-500 pt-4 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page header and liquidity overview */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
          <SectionTitle
            title="Liquidity Hub"
            description="Route, save, and bridge your payroll seamlessly."
          />

          <div className="flex flex-col sm:flex-row sm:items-center bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-slate-800 rounded-[1rem] sm:rounded-[1.25rem] overflow-hidden w-full sm:w-fit">
            <div className="px-5 py-4 sm:px-8 sm:py-5 bg-slate-50/50 dark:bg-slate-900/20 min-w-0 w-full sm:w-auto sm:min-w-[200px]">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 sm:mb-2 truncate">
                Total Claimable
              </p>
              <div className="flex items-baseline gap-2 min-w-0">
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums leading-none truncate">
                  {formattedMax}
                </p>
                <span className="text-xs sm:text-sm font-medium text-slate-400 shrink-0">
                  USDC
                </span>
              </div>
            </div>

            {/* Slightly taller divider to match the new spacious layout */}
            <div className="w-full h-px sm:w-px sm:h-14 bg-slate-200 dark:bg-slate-800 shrink-0" />

            <div className="px-5 py-4 sm:px-8 sm:py-5 min-w-0 w-full sm:w-auto sm:min-w-[200px]">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 sm:mb-2 leading-none truncate">
                Wallet Balance
              </p>
              <div className="flex items-baseline gap-2 min-w-0">
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums leading-none truncate">
                  {formattedWalletBalance}
                </p>
                <span className="text-xs sm:text-sm font-medium text-slate-400 shrink-0">
                  USDC
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Core interaction modules */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <AllocationEngine />
          <OmnichainBridge />
        </div>
      </div>
    </div>
  );
}
