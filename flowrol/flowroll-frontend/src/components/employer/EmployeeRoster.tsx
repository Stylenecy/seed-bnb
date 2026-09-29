"use client";

import { useState, useRef } from "react";
import { USDC_DECIMALS } from "@/lib/chain";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, ChevronRight, Zap, Loader2 } from "lucide-react";
import { parseUnits } from "viem";
import { toast } from "sonner";

import {
  useGroupDetails,
  useGroupEmployees,
} from "@/hooks/payroll/usePayrollQueries";
import { useTokenActions } from "@/hooks/token/useTokenActions";
import { useContractClient } from "@/hooks/useContractClient";
import { usePayrollActions } from "@/hooks/payroll/usePayrollActions";
import { useAllowance } from "@/hooks/token/useTokenQueries";

import { AddEmployeeModal } from "./AddEmployeeModal";
import { DraftEmployeeRow } from "./DraftEmployeeRow";
import type { Employee } from "@/types";
import { flowLog } from "@/lib/utils";

export function EmployeeRoster({ groupId }: { groupId: bigint }) {
  const { address, contracts } = useContractClient();
  const { setupPayroll } = usePayrollActions();
  const { approveToken } = useTokenActions(
    contracts.USDC_ADDRESS as `0x${string}`,
  );

  const { data: group } = useGroupDetails(address, groupId);
  const { data: employees, isLoading: loadingEmployees } =
    useGroupEmployees(groupId);
  const { data: allowance } = useAllowance(
    contracts.USDC_ADDRESS as `0x${string}`,
    contracts.PAYROLL_MANAGER_ADDRESS as `0x${string}`,
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [stagedEmployees, setStagedEmployees] = useState<Employee[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const kickstartRef = useRef<HTMLDivElement>(null);

  const handleConfirmAdd = (newEmployees: Employee[]) => {
    setStagedEmployees([...newEmployees]);
    setIsAddModalOpen(false);

    setTimeout(() => {
      kickstartRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);
  };

  const removeStagedEmployee = (indexToRemove: number) => {
    setStagedEmployees(
      stagedEmployees.filter((_, idx) => idx !== indexToRemove),
    );
  };

  const handleKickstartPayroll = async () => {
    if (!group || stagedEmployees.length === 0) return;

    setIsSubmitting(true);

    try {
      const totalRaw = stagedEmployees.reduce(
        (sum, emp) => sum + Number(emp.salary),
        0,
      );
      const totalUSDC = parseUnits(totalRaw.toString(), USDC_DECIMALS);

      const employeeAddresses = stagedEmployees.map(
        (emp) => emp.address as `0x${string}`,
      );
      const employeeSalaries = stagedEmployees.map((emp) =>
        parseUnits(emp.salary.toString(), USDC_DECIMALS),
      );

      const currentAllowance = allowance ?? 0n;

      flowLog("Current allowance: ", currentAllowance);

      if (currentAllowance < totalUSDC) {
        toast.loading("Approving USDC spend...", { id: "payroll-tx" });
        await approveToken.mutateAsync({
          spender: contracts.PAYROLL_MANAGER_ADDRESS as `0x${string}`,
          amount: totalUSDC,
        });
      }

      toast.loading("Setting up the payroll engine...", { id: "payroll-tx" });

      await setupPayroll.mutateAsync({
        groupId,
        employees: employeeAddresses,
        salaries: employeeSalaries,
      });

      toast.success("Payroll engine kickstarted!", { id: "payroll-tx" });
      setStagedEmployees([]);
    } catch (err: any) {
      const isUserRejection =
        err.message?.includes("User rejected") || err.code === 4001;
      toast.error(
        isUserRejection
          ? "Transaction cancelled by user"
          : "Transaction failed",
        { id: "payroll-tx" },
      );
      if (!isUserRejection) {
        console.error("Payroll Kickstart Error:", err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingEmployees) {
    return (
      <div className="w-full bg-white dark:bg-[#0a0c10] rounded-[2rem] border border-slate-100 dark:border-slate-800/80 shadow-sm p-6 overflow-hidden">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-48 bg-slate-100 dark:bg-slate-800/50 rounded-lg mb-8" />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex justify-between items-center py-4 border-b border-slate-50 dark:border-slate-800/50"
            >
              <div className="flex gap-4">
                <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800/50 rounded-full" />
                <div className="h-10 w-32 bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
              </div>
              <div className="h-10 w-24 bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasStaged = stagedEmployees.length > 0;
  const isEmpty = (!employees || employees.length === 0) && !hasStaged;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] dark:shadow-none hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-all rounded-xl h-11 px-5 flex items-center gap-2 font-medium cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Add Employees
        </Button>
      </div>

      {isEmpty ? (
        <div className="w-full bg-white dark:bg-[#0a0c10] rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_rgb(0,0,0,0.02)] p-6 sm:p-12 md:p-20 flex flex-col items-center justify-center text-center transition-all">
          <div className="relative mb-4 sm:mb-6">
            <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 blur-2xl sm:blur-[2rem] rounded-full scale-150 opacity-50" />
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl sm:rounded-3xl flex items-center justify-center rotate-3 hover:rotate-6 transition-transform duration-500">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 dark:text-blue-400" />
            </div>
          </div>

          <h3 className="font-montserrat text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            No team members yet
          </h3>

          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1.5 sm:mt-2 mb-6 sm:mb-8 max-w-[400px] leading-relaxed px-2">
            Add your first employee to start automating their yield and salary
            streams.
          </p>

          <Button
            variant="outline"
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto h-11 sm:h-12 px-6 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-semibold group bg-transparent text-sm sm:text-base"
          >
            Add First Employee
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform shrink-0" />
          </Button>
        </div>
      ) : (
        <div className="w-full bg-white dark:bg-[#0a0c10] rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden transition-all">
          <div className="w-full overflow-x-auto pb-4 no-scrollbar">
            <Table className="min-w-[500px] w-full">
              <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                <TableRow className="border-slate-100 dark:border-slate-800">
                  <TableHead className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 py-4 sm:py-5 pl-4 sm:pl-8 whitespace-nowrap">
                    Employee
                  </TableHead>
                  <TableHead className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 py-4 sm:py-5 text-right whitespace-nowrap">
                    Base Salary
                  </TableHead>
                  <TableHead className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 py-4 sm:py-5 text-right pr-4 sm:pr-8 whitespace-nowrap">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stagedEmployees.map((emp, idx) => (
                  <DraftEmployeeRow
                    key={emp.address}
                    emp={emp}
                    onRemove={() => removeStagedEmployee(idx)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {hasStaged && (
        <div
          ref={kickstartRef}
          className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0a0c10] backdrop-blur-xl p-4 sm:p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6 relative overflow-hidden rounded-b-[1.5rem] sm:rounded-b-[2rem]"
        >
          <div className="flex items-start sm:items-center md:items-start lg:items-center gap-3 sm:gap-4 md:gap-5 z-10 w-full md:w-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-center shrink-0 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 dark:from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400 fill-emerald-600/20 dark:fill-emerald-400/20" />
            </div>

            <div className="flex-1">
              <h3 className="font-montserrat font-medium text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">
                Ready to Kickstart Payroll
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-400 mt-1 sm:mt-2 max-w-lg leading-relaxed">
                Staging{" "}
                <span className="font-medium text-slate-900 dark:text-slate-200">
                  {stagedEmployees.length} new employee(s)
                </span>
                . This requires a smart contract signature and will allocate
                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 mx-1 sm:mx-1.5 shadow-sm whitespace-nowrap">
                  {stagedEmployees
                    .reduce((sum, emp) => sum + Number(emp.salary), 0)
                    .toLocaleString()}{" "}
                  USDC
                </span>
                for the upcoming cycle.
              </p>
            </div>
          </div>

          <div className="flex items-center w-full md:w-auto z-10 pt-4 md:pt-0 border-t md:border-0 border-slate-100 dark:border-slate-800/60 mt-1 sm:mt-2 md:mt-0 shrink-0">
            <Button
              onClick={handleKickstartPayroll}
              disabled={isSubmitting}
              className="h-11 sm:h-12 px-4 sm:px-6 lg:px-8 text-sm sm:text-base bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] dark:shadow-none hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] disabled:opacity-70 disabled:cursor-not-allowed transition-all rounded-xl font-medium flex items-center justify-center gap-2 w-full md:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 animate-spin shrink-0" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 fill-amber-500 shrink-0" />
                  <span>Kickstart Payroll</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        groupId={groupId}
        onConfirm={handleConfirmAdd}
      />
    </div>
  );
}