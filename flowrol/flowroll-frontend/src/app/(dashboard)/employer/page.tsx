"use client";

import { useState, useMemo } from "react";
import { USDC_DECIMALS } from "@/lib/chain";
import { motion, Variants } from "framer-motion";
import { ArrowRight, Layers, ShieldCheck, X, Info } from "lucide-react";

import { useRouter } from "next/navigation";

import { useEmployerGroups } from "@/hooks/payroll/usePayrollQueries";
import { useTokenBalance } from "@/hooks/token/useTokenQueries";
import { useContractClient } from "@/hooks/useContractClient";
import { flowLog, formatMoney } from "@/lib/utils";

import { ClaimCard } from "@/components/shared/ClaimCard";
import GroupSection from "@/components/employer/GroupSection";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { WalletFundingModal } from "@/components/shared/WalletFundingModal";

export default function EmployerDashboard() {
  const router = useRouter();
  const { contracts } = useContractClient();

  const [isYieldModalOpen, setIsYieldModalOpen] = useState(false);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);

  const { data: employerGroups, isLoading } = useEmployerGroups();
  const { data: usdcBalance, isLoading: isLoadingBalance } = useTokenBalance(
    contracts.USDC_ADDRESS,
  );

  const totalLockedBigInt = useMemo(() => {
    return (
      employerGroups?.reduce((sum, group) => sum + group.totalPayroll, 0n) || 0n
    );
  }, [employerGroups]);

  const formattedTotalLocked = formatMoney(totalLockedBigInt, USDC_DECIMALS);

  const formattedBalance = usdcBalance ? formatMoney(usdcBalance, USDC_DECIMALS) : "0.00";

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] transition-colors duration-500 pt-6 sm:pt-8 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <SectionTitle
          title="Employer Dashboard"
          description="Manage Assets and View Active Allocations"
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6"
        >
          <ClaimCard
            title="Wallet Balance"
            balance={usdcBalance}
            isLoading={isLoadingBalance}
            theme="emerald"
            buttonText="Fund Wallet"
            onAction={() => setIsFundModalOpen(true)}
            variants={itemVariants}
            className="md:col-span-2 lg:col-span-5"
          />

          <motion.div
            variants={itemVariants}
            className="md:col-span-1 lg:col-span-4 bg-white dark:bg-[#0a0c10] rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-violet-200 dark:hover:border-violet-500/30 transition-colors"
          >
            <div className="flex justify-between items-start mb-6 sm:mb-0">
              <div className="bg-slate-50 dark:bg-slate-900 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900 dark:text-white" />
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Earning
              </div>
            </div>

            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-[0.2em] mb-1.5 sm:mb-2">
                Allocated Capital
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-3xl xl:text-4xl font-black text-slate-900 dark:text-white tracking-tighter truncate">
                ${isLoading ? "..." : formattedTotalLocked}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1.5 sm:mt-2">
                Total payroll locked in yield vaults
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            onClick={() => setIsYieldModalOpen(true)}
            className="md:col-span-1 lg:col-span-3 cursor-pointer group relative overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 transition-all duration-500 hover:-translate-y-2 bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex flex-col h-full justify-between relative z-20">
              <div className="mb-6 sm:mb-8">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-emerald-50 dark:border-emerald-500/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500" />
                </div>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2 tracking-tight">
                  Strategy Hub
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
                  Learn how the Flowroll Engine optimizes your capital.
                </p>

                <a
                  href="https://github.com/LanreAkintayo/flowroll#implementation-details"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 w-fit"
                >
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-600">
                    Explore Mechanics
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100/50 dark:bg-emerald-500/10 flex items-center justify-center group-hover:translate-x-2 transition-transform duration-300">
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                  </div>
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <GroupSection />
      </div>

      <WalletFundingModal
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
      />
    </div>
  );
}
