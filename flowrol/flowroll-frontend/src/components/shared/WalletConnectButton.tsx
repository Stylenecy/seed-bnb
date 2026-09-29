"use client";

import { useIdentity, useWalletActions } from '@/hooks/identity/useIdentity';
import { Wallet, Loader2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WalletConnectButtonProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export default function WalletConnectButton({ 
  variant = 'full', 
  className = '' 
}: WalletConnectButtonProps) {
  const { isConnected, displayName, isLoading } = useIdentity();
  const { openConnect, openWallet } = useWalletActions();

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        // Loading State
        <motion.button
          key="loading"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          disabled
          className={`inline-flex items-center justify-center gap-2 sm:gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 cursor-wait shrink-0 ${variant === 'full' ? 'w-full sm:w-auto' : ''} ${className}`}
        >
          <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-slate-400 shrink-0" />
          <span className={`truncate ${variant === 'compact' ? 'hidden sm:inline-block' : ''}`}>
            Syncing...
          </span>
        </motion.button>
      ) : !isConnected ? (
        // Disconnected State
        <motion.button
          key="connect"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openConnect}
          className={`inline-flex items-center justify-center gap-2 sm:gap-2.5 px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all border border-slate-700/50 dark:border-none shrink-0 cursor-pointer ${variant === 'full' ? 'w-full sm:w-auto' : ''} ${className}`}
        >
          <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 dark:text-slate-500 shrink-0" />
          <span className={`truncate ${variant === 'compact' ? '//hidden sm:inline-block' : ''}`}>
            Connect Wallet
          </span>
        </motion.button>
      ) : (
        // Connected State
        <motion.button
          key="connected"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          layout
          onClick={openWallet}
          className={`group inline-flex items-center justify-center gap-2 sm:gap-3 p-1 sm:p-1.5 pr-3 sm:pr-4 rounded-full text-xs sm:text-sm font-medium bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-200 dark:hover:border-slate-500/30 hover:shadow-md hover:shadow-slate-500/5 transition-all duration-300 shrink-0 cursor-pointer ${variant === 'full' ? 'w-full sm:w-auto' : ''} ${className}`}
        >
          {/* Visual Avatar with Status Indicator */}
          <div className="relative shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 p-0.5 shadow-sm">
              <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                <span className="text-[10px] sm:text-[11px] text-slate-900 dark:text-white font-black">
                  {displayName?.charAt(0).toUpperCase() || 'W'}
                </span>
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 border-2 border-white dark:border-[#0a0c10] rounded-full shadow-xs" />
          </div>
          
          <div className={`flex flex-col items-start leading-none min-w-0 ${variant === 'compact' ? 'hidden sm:flex' : 'flex'}`}>
            <span className="text-slate-900 dark:text-white tracking-tight mb-0.5 truncate max-w-[90px] sm:max-w-[120px]">
              {displayName}
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
              Connected
            </span>
          </div>
          
          <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors ml-0.5 sm:ml-1 shrink-0" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}