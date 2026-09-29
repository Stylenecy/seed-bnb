'use client';

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { motion, Variants } from 'framer-motion';

import { useTokenBalance, useNativeTokenBalance } from '@/hooks/token/useTokenQueries';
import { useContractClient } from '@/hooks/useContractClient';
import { ACTIVE_CHAIN } from '@/lib/chain';

import { ConnectWallet } from '@/components/onboarding/ConnectWallet';
import { Step1ClaimGas } from '@/components/onboarding/Step1ClaimGas';
import { Step2ClaimUSDC } from '@/components/onboarding/Step2ClaimUSDC';
import { LiveBalanceHeader } from '@/components/onboarding/LiveBalanceHeader';
import { OnboardingSuccessModal } from '@/components/onboarding/OnboardingSuccessModal';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function OnboardingFlow() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { contracts } = useContractClient();

  // BSC flow: connect → claim gas → claim test USDC. (Initia bridge, zap and
  // auto-sign steps were removed — no equivalent on BNB Chain.)
  const isWalletConnectedAndReady = !!address && chainId === ACTIVE_CHAIN.id;

  const { data: nativeBalance } = useNativeTokenBalance();
  const { data: usdcBalance } = useTokenBalance(contracts.USDC_ADDRESS);

  const hasGas = nativeBalance ? nativeBalance > 0n : false;
  const hasUSDC = usdcBalance ? usdcBalance > 0n : false;

  const connectComplete = isWalletConnectedAndReady;
  const gasComplete = connectComplete && hasGas;
  const usdcComplete = gasComplete && hasUSDC;

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#070b14] pt-8 sm:pt-12 pb-24 sm:pb-32 px-4 sm:px-6 font-sans overflow-hidden transition-colors duration-500">
      
      {/* Background glow effects - Scaled for mobile */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[300px] sm:h-[500px] opacity-20 pointer-events-none">
        <div className="absolute top-[-5%] sm:top-[-10%] left-[-5%] sm:left-[-10%] w-64 h-64 sm:w-96 sm:h-96 bg-emerald-500/20 rounded-full blur-[80px] sm:blur-[120px]" />
        <div className="absolute top-[10%] sm:top-[20%] right-[-5%] w-64 h-64 sm:w-96 sm:h-96 bg-slate-500/10 rounded-full blur-[80px] sm:blur-[120px]" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative max-w-3xl mx-auto space-y-8 sm:space-y-12"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center space-y-3 sm:space-y-4 px-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
            Get Your Wallet Ready
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Follow these simple steps to get the assets you need to start using Flowroll.
          </p>
        </motion.div>

        {isWalletConnectedAndReady && (
          <motion.div variants={itemVariants}>
            <LiveBalanceHeader
              step1Complete={gasComplete}
              step2Complete={usdcComplete}
              allSetupComplete={usdcComplete}
            />
          </motion.div>
        )}

        {/* Steps Timeline Container */}
        <motion.div variants={itemVariants} className="space-y-4 sm:space-y-6 relative">
          
          {/* Timeline Connector - adjusted left offset for mobile if icons scale */}
          <div className="absolute left-[1.6rem] sm:left-8 top-10 bottom-10 w-px bg-slate-200 dark:bg-slate-800 -z-10 hidden sm:block" />

          <ConnectWallet 
            isComplete={connectComplete} 
            evmAddress={address} 
          />

          <Step1ClaimGas 
            isComplete={gasComplete} 
            isUnlocked={connectComplete}
            evmAddress={address} 
          />
            <Step2ClaimUSDC 
              isComplete={usdcComplete} 
              isUnlocked={gasComplete} 
              evmAddress={address} 
            />

        </motion.div>

        <OnboardingSuccessModal isOpen={usdcComplete} />

      </motion.div>
    </div>
  );
}