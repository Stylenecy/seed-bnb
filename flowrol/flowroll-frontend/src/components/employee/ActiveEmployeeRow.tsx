"use client";

import { useState } from "react";
import { USDC_DECIMALS } from "@/lib/chain";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Copy,
  Check,
  MoreHorizontal,
  UserMinus,
  PencilLine,
} from "lucide-react";
import { formatUnits } from "viem";

import { useAgentStatus } from "@/hooks/router/useRouterQueries";
import { useAddressResolver } from "@/hooks/identity/useAddressResolver";
import type { DisbursementRecord } from "@/types";
import { ActiveEmployee } from "../employer/ActiveEmployeeRoster";

interface ActiveEmployeeRowProps {
  emp: ActiveEmployee;
  disbursementRecord: DisbursementRecord;
}

export function ActiveEmployeeRow({ emp, disbursementRecord }: ActiveEmployeeRowProps) {
  const [copied, setCopied] = useState(false);

  const { data: isAgentRunning } = useAgentStatus();
  const { resolvedName } = useAddressResolver(emp.address);

  const handleCopy = () => {
    navigator.clipboard.writeText(emp.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const displayName = resolvedName || (emp.username?.toLowerCase().endsWith(".init") ? emp.username : truncateAddress(emp.address));
  const formattedSalary = emp.salary ? formatUnits(BigInt(emp.salary), USDC_DECIMALS) : "0";

  return (
    <TableRow className="border-slate-100 dark:border-slate-800/60 bg-white dark:bg-transparent hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
      <TableCell className="py-4 sm:py-5 pl-4 sm:pl-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center shrink-0">
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="flex flex-col items-start gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                {displayName}
              </span>

              {isAgentRunning && (
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 px-1.5 sm:px-2 py-[2px] rounded-md flex items-center gap-1.5 shadow-xs whitespace-nowrap">
                  {disbursementRecord.executed ? "Paid" : "Yielding"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-0.5 max-w-full">
              <div className="group/tooltip relative flex items-center min-w-0">
                <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 px-1.5 sm:px-2 py-0.5 rounded-md cursor-default truncate">
                  {truncateAddress(emp.address)}
                </span>

                <div className="absolute bottom-full left-0 mb-1 hidden group-hover/tooltip:block z-50">
                  <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-mono py-1.5 px-2.5 rounded-lg shadow-xl whitespace-nowrap">
                    {emp.address}
                  </div>
                </div>
              </div>

              <button
                onClick={handleCopy}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800 shrink-0"
              >
                {copied ? (
                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell className="text-right py-4 sm:py-5">
        <div className="flex flex-col items-end">
          <span className="font-montserrat font-medium text-slate-900 dark:text-white text-xs sm:text-sm whitespace-nowrap">
            {Number(formattedSalary)?.toLocaleString()}
            <span className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 ml-1">
              USDC
            </span>
          </span>
        </div>
      </TableCell>

      {/* <TableCell className="text-right py-4 sm:py-5 pr-4 sm:pr-8">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 rounded-xl shadow-xl border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0f172a]"
          >
            <DropdownMenuItem className="gap-2 text-slate-700 dark:text-slate-300 font-medium cursor-pointer py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800">
              <PencilLine className="w-4 h-4 text-blue-500" />
              Modify Salary
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
            <DropdownMenuItem className="gap-2 text-rose-600 dark:text-rose-400 font-medium cursor-pointer py-2.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 focus:bg-rose-50 dark:focus:bg-rose-500/10">
              <UserMinus className="w-4 h-4" />
              Remove Employee
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell> */}
    </TableRow>
  );
}