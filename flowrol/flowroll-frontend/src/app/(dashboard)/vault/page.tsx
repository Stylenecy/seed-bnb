"use client";

import { useState } from "react";
import { USDC_DECIMALS } from "@/lib/chain";
import { useRouter } from "next/navigation";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { Cpu, ArrowRight, Lock, ShieldCheck } from "lucide-react";

import {
  useAutoSaveCycles,
  useAvailableBalance,
} from "@/hooks/vault/useVaultQueries";
import { useContractClient } from "@/hooks/useContractClient";
import { useTokenBalance } from "@/hooks/token/useTokenQueries";
import { flowLog, formatMoney } from "@/lib/utils";

import { AutoSaveCard } from "@/components/employee/AutoSaveCard";
import { EmployeeVaultEngine } from "@/components/employee/EmployeeVaultEngine";
import { ClaimCard } from "@/components/shared/ClaimCard";
import { useAuthStore } from "@/store/authStore";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { WalletFundingModal } from "@/components/shared/WalletFundingModal";

export default function EmployeeVaultPage() {
  const router = useRouter();
  const { address, contracts } = useContractClient();
  const { role } = useAuthStore();

  // UI State for the Agent Command Center
  const [selectedCycleId, setSelectedCycleId] = useState<bigint | null>(null);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);

  // Protocol Data Synchronization
  const { data: autoSaveCycles, isLoading } = useAutoSaveCycles(address);
  const { data: availableBalance, isLoading: isLoadingAvailableBalance } =
    useAvailableBalance(address);
  const { data: tokenBalance, isLoading: isLoadingTokenBalance } =
    useTokenBalance(contracts.USDC_ADDRESS as `0x${string}`);

  // Interaction Handlers
  const openAgentCenter = (cycleId: bigint) => setSelectedCycleId(cycleId);
  const closeAgentCenter = () => setSelectedCycleId(null);

  // Aggregate Metrics logic
  const totalValueLocked =
    autoSaveCycles?.reduce((acc, cycle) => acc + cycle.amountSaved, 0n) || 0n;
  const formattedTVL = formatMoney(totalValueLocked, USDC_DECIMALS);

  // Staggered Animation Orchestration
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  // flowLog("Vault State:", { role, autoSaveCycles });

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] transition-colors duration-500 pt-8 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <SectionTitle
            title="Global Vault"
            description="Yield Agent Online & Managing Assets"
          />

          {/* Main Interaction Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6"
          >
            {/* Liquidity post-disbursement */}
            <ClaimCard
              className="lg:col-span-4"
              title="Available to Claim"
              balance={availableBalance}
              isLoading={isLoadingAvailableBalance}
              theme="dark-emerald"
              buttonText="Route & Claim"
              onAction={() => router.push("/claim")}
              variants={itemVariants}
            />

            {/* On-chain wallet liquidity */}
            <ClaimCard
              title="Wallet Balance"
              balance={tokenBalance}
              isLoading={isLoadingTokenBalance}
              theme="emerald"
              buttonText="Fund Wallet"
              onAction={() => setIsFundModalOpen(true)}
              variants={itemVariants}
              className="md:col-span-2 lg:col-span-5"
            />

            {/* Protocol Documentation Teaser */}
            <motion.div
              variants={itemVariants}
              className="lg:col-span-3 cursor-pointer group relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 transition-all duration-500 hover:-translate-y-1.5 bg-white dark:bg-[#0f172a] shadow-xs border border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-500/30 min-h-[220px]"
            >
              <div className="absolute right-0 bottom-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors duration-500 pointer-events-none" />

              <div className="flex flex-col h-full justify-between relative z-20">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 shrink-0">
                    <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-bold uppercase tracking-widest shrink-0">
                    Auto-Yield
                  </div>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">
                    How it Works
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
                    Salary autosaves are routed to top DeFi protocols to
                    automatically accrue yield.
                  </p>
                  <a
                    href="https://github.com/LanreAkintayo/flowroll-contract/#flowroll-contract"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 w-fit"
                  >
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
                      Read Docs
                    </span>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center group-hover:translate-x-1.5 transition-transform duration-300">
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-500" />
                    </div>
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Active Yield Registry */}
          <div className="mt-10 sm:mt-16 border-t border-slate-200 dark:border-slate-800/80 pt-6 sm:pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 truncate">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />
                  Vault Positions
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 sm:mt-1.5 truncate">
                  Autosave cycles currently accruing yield via the Flowroll
                  Agent.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="w-full text-center py-12 sm:py-16 lg:py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col items-center justify-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 border-[3px] sm:border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium px-4">
                  Syncing vault positions...
                </p>
              </div>
            ) : !autoSaveCycles || autoSaveCycles.length === 0 ? (
              <div className="w-full text-center py-12 sm:py-16 lg:py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col items-center justify-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
                  No active positions
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium px-4 max-w-sm">
                  You haven&apos;t locked any autosave cycles yet. Active yields
                  will appear here.
                </p>
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 items-start"
              >
                {[...autoSaveCycles].reverse().map((cycle) => (
                  <motion.div
                    variants={itemVariants}
                    key={cycle.cycleId.toString()}
                  >
                    <AutoSaveCard
                      autoSaveCycle={cycle}
                      onOpenAgent={() => openAgentCenter(cycle.cycleId)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Agent Control Overlay */}
      <AnimatePresence>
        {selectedCycleId !== null && (
          <EmployeeVaultEngine
            cycleId={selectedCycleId}
            onClose={closeAgentCenter}
          />
        )}
      </AnimatePresence>

      <WalletFundingModal
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
      />
    </>
  );
}
