"use client";

import { X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface WalletFundingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletFundingModal({ isOpen, onClose }: WalletFundingModalProps) {
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-md bg-white dark:bg-[#0a0a0a] rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-2xl overflow-hidden flex flex-col gap-0 [&>button]:hidden">
        
        {/* Header */}
        <div className="relative z-10 flex items-start sm:items-center justify-between mb-5 sm:mb-6 gap-4 shrink-0">
          <div className="min-w-0 w-full">
            <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tighter break-words whitespace-normal">
              Wallet Funding
            </DialogTitle>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center text-center w-full">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-5 sm:mb-6 shrink-0 border border-blue-100 dark:border-blue-500/20">
            <Info className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500" />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 break-words whitespace-normal">
            Feature in Development
          </h3>

          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8 break-words whitespace-normal">
            Direct fiat and crypto funding is coming soon. For now, please utilize the{" "}
            <span className="font-bold text-slate-900 dark:text-slate-200">
              testnet faucet allocation
            </span>{" "}
            provided to you during onboarding to test out the payroll mechanics.
          </p>

          <Button
            onClick={onClose}
            className="w-full h-11 sm:h-12 rounded-xl font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none shadow-none text-xs sm:text-sm cursor-pointer shrink-0"
          >
            Understood
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}