"use client";

import { useState } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Wallet, AlertCircle, Copy, Check } from "lucide-react";
import type { Employee } from "@/types";

interface DraftEmployeeRowProps {
  emp: Employee;
  onRemove: () => void;
}

export function DraftEmployeeRow({ emp, onRemove }: DraftEmployeeRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(emp.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // UI state derived cleanly
  const displayName = emp.username?.toLowerCase().endsWith(".init") 
    ? emp.username 
    : truncateAddress(emp.address);

  return (
    <TableRow className="border-slate-100 dark:border-slate-800/60 bg-amber-50/30 dark:bg-amber-500/5 hover:bg-amber-50/60 dark:hover:bg-amber-500/10 transition-colors group">
      
      <TableCell className="py-5 pl-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-white dark:border-slate-800 shadow-sm flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900 dark:text-white text-sm">
                {displayName}
              </span>
              
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-[2px] rounded flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Staged
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="group/tooltip relative flex items-center">
                <span className="font-mono text-slate-500 dark:text-slate-400 text-xs bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 px-2 py-0.5 rounded-md cursor-default shadow-sm">
                  {truncateAddress(emp.address)}
                </span>
                
                <div className="absolute bottom-full left-0 mb-1 hidden group-hover/tooltip:block z-50">
                  <div className="bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-mono py-1.5 px-2.5 rounded-lg shadow-xl whitespace-nowrap">
                    {emp.address}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleCopy}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1 rounded-md hover:bg-white dark:hover:bg-slate-800"
                title="Copy full address"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </TableCell>
      
      <TableCell className="py-5">
        <div className="flex flex-col items-end">
          <span className="font-montserrat font-medium text-slate-700 dark:text-slate-300 text-sm">
            {Number(emp.salary).toLocaleString()} 
            <span className="text-xs font-medium text-slate-500 dark:text-slate-500 ml-1">USDC</span>
          </span>
        </div>
      </TableCell>
      
      <TableCell className="text-right py-5 pr-8">
        <div className="flex justify-end gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onRemove}
            className="h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
      
    </TableRow>
  );
}