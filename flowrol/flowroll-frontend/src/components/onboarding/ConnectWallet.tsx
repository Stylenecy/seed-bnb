"use client";

import { Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import { NetworkSwitcher } from "@/components/shared/NetworkSwitcher";
import WalletConnectButton from "../shared/WalletConnectButton";
import { CHAIN_LABEL } from "@/lib/chain";

interface ConnectWalletProps {
  isComplete: boolean;
  evmAddress?: `0x${string}`;
}

export function ConnectWallet({ isComplete, evmAddress }: ConnectWalletProps) {
  // If we have an address but it's not marked complete, they are on the wrong network
  const isWrongNetwork = !!evmAddress && !isComplete;

  return (
    <div
      className={`relative rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 lg:p-8 transition-colors duration-300 bg-white dark:bg-[#0a0a0a] border flex flex-col w-full min-w-0 `}
    >
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between w-full min-w-0">
        <div className="flex gap-3 sm:gap-5 items-start sm:items-center w-full min-w-0">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
              isComplete
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500"
                : isWrongNetwork
                  ? "bg-amber-50 dark:bg-amber-500/10 text-amber-500"
                  : "bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400"
            }`}
          >
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : isWrongNetwork ? (
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </div>

          <div className="flex flex-col justify-center min-w-0 w-full">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {isComplete
                ? "Wallet Connected"
                : isWrongNetwork
                  ? "Switch Network"
                  : "Connect Wallet"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 leading-relaxed max-w-md  sm:whitespace-normal">
              {isComplete
                ? "Your wallet is securely connected to the correct network."
                : isWrongNetwork
                  ? `Please switch to ${CHAIN_LABEL} to proceed.`
                  : "Connect your EVM wallet to start the setup process."}
            </p>
          </div>
        </div>

        {!isComplete && (
          <div className="flex items-center w-full sm:w-auto shrink-0 mt-3 sm:mt-0">
            {isWrongNetwork ? (
              /* Show the network switcher if they are connected but on the wrong network */
              <div className="w-full sm:w-auto">
                <NetworkSwitcher />
              </div>
            ) : (
              /* Otherwise, show the connect button */
              <div className="w-full sm:w-auto">
                <WalletConnectButton variant="compact" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
