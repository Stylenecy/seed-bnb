"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types";
import { useIdentity, useWalletActions } from "@/hooks/identity/useIdentity";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Server,
  Building,
  User,
  Wallet,
  ShieldCheck,
  Clock,
  ArrowRightLeft,
  Vault,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { useOnboardingQueries } from "@/hooks/onboarding/useOnboardingQueries";
import { useContractClient } from "@/hooks/useContractClient";
import { Button } from "@/components/ui/button";
import { useTokenBalance } from "@/hooks/token/useTokenQueries";

export default function HomePage() {
  const router = useRouter();
  const { isConnected, isLoading } = useIdentity();
  const { openConnect } = useWalletActions();
  const { role, setRole } = useAuthStore();
  const { address: evmAddress, contracts } = useContractClient();
  const { data: usdcTokenBalance } = useTokenBalance(contracts.USDC_ADDRESS);

  const { balances, isLoadingBalances } = useOnboardingQueries(evmAddress);

  const isOnboarded = balances.gas > 0 && (usdcTokenBalance ?? 0n) > 0n;

  function handleRoleSelect(selected: UserRole) {
    setRole(selected);
    if (!isConnected) {
      openConnect();
      return;
    }
    router.push(`/${selected}`);
  }

  return (
    <div>
      <Navbar />
      <div className="relative min-h-[calc(100vh-80px)] sm:min-h-[calc(100vh-80px)] flex flex-col justify-center sm:items-center overflow-hidden bg-slate-50 dark:bg-[#070b14] transition-colors duration-500 pt-8 pb-16 sm:py-0">
        {/* Background ambient glow - Scaled for mobile */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[10%] sm:-top-[20%] -left-[10%] w-[80%] sm:w-[50%] h-[50%] sm:h-[60%] rounded-full bg-violet-400/20 dark:bg-violet-900/20 blur-[80px] sm:blur-[120px]"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
            className="absolute top-[30%] sm:top-[20%] -right-[10%] w-[90%] sm:w-[60%] h-[60%] sm:h-[70%] rounded-full bg-teal-400/20 dark:bg-teal-900/20 blur-[80px] sm:blur-[120px]"
          />
        </div>

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-12 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col max-w-2xl w-full mx-auto lg:mx-0"
            >
              <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/60 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 backdrop-blur-md mb-5 sm:mb-6 w-fit shadow-sm">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                  Omnichain Payroll Protocol
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tighter text-slate-900 dark:text-white mb-4 sm:mb-6 leading-[1.15] sm:leading-[1.1]">
                Payroll that <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-teal-500 dark:from-violet-400 dark:to-teal-400 pb-1 inline-block">
                  pays for itself.
                </span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-8 sm:mb-10 max-w-xl pr-4 sm:pr-0">
                Payroll is your biggest expense. On Flowroll, it is also your
                newest income stream.
              </p>

              {/* Action Area */}
              {isOnboarded ? (
                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                  <RoleCard
                    title="Employer"
                    description="Fund payroll once, let yield cover the costs."
                    icon={<Building className="w-5 h-5 sm:w-6 sm:h-6" />}
                    onSelect={() => handleRoleSelect("employer")}
                    disabled={isLoading}
                  />
                  <RoleCard
                    title="Employee"
                    description="Claim salary or leave it earning yield."
                    icon={<User className="w-5 h-5 sm:w-6 sm:h-6" />}
                    onSelect={() => handleRoleSelect("employee")}
                    disabled={isLoading}
                  />
                </div>
              ) : (
                <div className="w-full sm:w-fit">
                  <Button
                    onClick={() => router.push("/onboarding")}
                    disabled={isLoadingBalances}
                    className="group relative w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 rounded-xl sm:rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold transition-all duration-300 hover:bg-slate-800 dark:hover:bg-slate-200 border-none shadow-none cursor-pointer"
                  >
                    <span className="flex items-center justify-center gap-2 text-sm sm:text-base">
                      Get Started{" "}
                      <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="hidden lg:flex justify-center relative w-full h-[500px]"
            >
              <ProtocolVisualizer />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Visualizer Component ─────────────────────────────────────────────────────

function ProtocolVisualizer() {
  return (
    <div className="relative w-full max-w-lg h-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/60 dark:border-slate-800/60 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] p-6 overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-200/50 dark:border-slate-700/50 pb-4">
        <ArrowRightLeft className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
          Flowroll Yield Engine
        </span>
      </div>

      <div className="relative flex-1 w-full flex items-center justify-center">
        {/* SVG Animated Lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 400 300"
          preserveAspectRatio="none"
        >
          {/* Path: Deposit to Yield */}
          <FlowPath d="M 60,150 C 120,150 140,75 200,75" color="#10b981" />
          {/* Path: Deposit to Reserve */}
          <FlowPath d="M 60,150 C 120,150 140,225 200,225" color="#6366f1" />
          {/* Path: Yield to Payday */}
          <FlowPath
            d="M 200,75 C 260,75 280,150 340,150"
            color="#10b981"
            delay={1.5}
          />
          {/* Path: Reserve to Payday */}
          <FlowPath
            d="M 200,225 C 260,225 280,150 340,150"
            color="#6366f1"
            delay={1.5}
          />
        </svg>

        {/* Nodes */}
        <VisualizerNode
          icon={
            <Wallet className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          }
          label="Deposit"
          sub="Employer"
          position="left-[5%] top-1/2 -translate-y-1/2"
          glowColor="bg-slate-500/20"
        />

        <VisualizerNode
          icon={
            <Vault className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          }
          label="Yield Vaults"
          sub="Generating APY"
          position="left-1/2 top-[15%] -translate-x-1/2"
          glowColor="bg-emerald-500/20 dark:bg-emerald-500/30"
          border="border-emerald-200 dark:border-emerald-500/30"
          animDelay={0.5}
        />

        <VisualizerNode
          icon={
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          }
          label="Reserve"
          sub="Secured Base"
          position="left-1/2 bottom-[15%] -translate-x-1/2"
          glowColor="bg-indigo-500/20 dark:bg-indigo-500/30"
          border="border-indigo-200 dark:border-indigo-500/30"
          animDelay={1}
        />

        <VisualizerNode
          icon={
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          }
          label="Payday"
          sub="Distribution"
          position="right-[5%] top-1/2 -translate-y-1/2"
          glowColor="bg-amber-500/20 dark:bg-amber-500/30"
          border="border-amber-200 dark:border-amber-500/30"
          animDelay={1.5}
        />
      </div>
    </div>
  );
}

function FlowPath({
  d,
  color,
  delay = 0,
}: {
  d: string;
  color: string;
  delay?: number;
}) {
  return (
    <>
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-slate-200 dark:text-slate-800"
      />
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay }}
      />
    </>
  );
}

function VisualizerNode({
  icon,
  label,
  sub,
  position,
  glowColor,
  border = "border-slate-200 dark:border-slate-700",
  animDelay = 0,
}: any) {
  return (
    <motion.div
      animate={{ y: [-5, 5, -5] }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay: animDelay,
      }}
      className={`absolute ${position} flex flex-col items-center gap-2`}
    >
      <div
        className={`relative w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border ${border} flex items-center justify-center shadow-sm z-10`}
      >
        <div
          className={`absolute inset-0 rounded-2xl ${glowColor} blur-md -z-10`}
        />
        {icon}
      </div>
      <div className="text-center">
        <p className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          {label}
        </p>
        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
          {sub}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Cards ────────────────────────────────────────────────────────────────────

function RoleCard({ title, description, icon, onSelect, disabled }: any) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className="
        group text-left p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[20px] relative overflow-hidden flex flex-col w-full min-w-0
        bg-white dark:bg-slate-900/40 backdrop-blur-md
        border border-white/60 dark:border-slate-800/60
        hover:border-violet-300 dark:hover:border-violet-500/50 
        hover:bg-white/60 dark:hover:bg-slate-800/50
        active:scale-[0.97] active:bg-violet-50/50 dark:active:bg-slate-800/80 active:shadow-inner
        shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-none
        hover:shadow-[0_8px_30px_rgba(124,58,237,0.1)] dark:hover:shadow-[0_8px_30px_rgba(124,58,237,0.15)]
        transition-all duration-200 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
        disabled:opacity-50 disabled:cursor-wait disabled:active:scale-100
      "
    >
      <div className="relative z-10 w-full min-w-0">
        <div className="flex items-start justify-between w-full mb-4 sm:mb-5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-100 dark:bg-violet-900/50 border border-violet-200 dark:border-violet-700/30 flex items-center justify-center group-hover:scale-110 group-active:scale-95 group-hover:bg-violet-200 dark:group-hover:bg-violet-800/50 transition-all duration-300 shrink-0">
            <span className="text-violet-600 dark:text-violet-300">{icon}</span>
          </div>

          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-violet-500 group-active:bg-violet-600 group-hover:text-white transition-colors duration-300 shrink-0">
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 -rotate-45 group-hover:rotate-0 group-active:translate-x-1 transition-transform duration-300" />
          </div>
        </div>

        <h2 className="text-lg sm:text-xl text-slate-900 dark:text-white font-bold mb-1.5 sm:mb-2 truncate">
          {title}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed truncate sm:whitespace-normal sm:break-words">
          {description}
        </p>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-teal-500/0 group-hover:from-violet-500/5 dark:group-hover:from-violet-500/10 group-hover:to-transparent transition-all duration-500 z-0" />
    </button>
  );
}
