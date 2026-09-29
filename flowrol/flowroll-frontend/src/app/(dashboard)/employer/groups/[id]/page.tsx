"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Hash, Zap, CheckCircle2 } from "lucide-react";

import { useContractClient } from "@/hooks/useContractClient";
import {
  useGroupDetails,
  useGroupEmployeesWithSalaries,
} from "@/hooks/payroll/usePayrollQueries";
import {
  useAgentStatus,
  useAgentSync,
  usePayrollCycle,
} from "@/hooks/router/useRouterQueries";
import { useDisbursementRecord } from "@/hooks/dispatcher/useDispatcherQueries";

import PageShell from "@/components/shared/PageShell";
import { GroupStats } from "@/components/employer/GroupStats";
import { EmployeeRoster } from "@/components/employer/EmployeeRoster";
import { ActiveEmployeeRoster } from "@/components/employer/ActiveEmployeeRoster";
import { AgentCommandCenter } from "@/components/employer/AgentCommandCenter";
import { flowLog } from "@/lib/utils";

export default function GroupDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const groupId = BigInt(id as string);
  const { address } = useContractClient();

  // System state and agent synchronization
  const { data: isAgentRunning } = useAgentStatus();
  const { data: payrollCycle } = usePayrollCycle(address, groupId);
  useAgentSync(groupId);

  // Local UI state
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  // Data fetching: Group registry and on-chain records
  const { data: group, isLoading: loadingGroup } = useGroupDetails(
    address,
    groupId,
  );
  const { data: employeesWithSalary, isLoading: loadingEmployees } =
    useGroupEmployeesWithSalaries(groupId);
  const { data: disbursementRecord } = useDisbursementRecord(
    address,
    group?.activeCycleId,
  );

  // Derived logic for conditional rendering
  const isPageLoading = loadingGroup || loadingEmployees;
  const hasActiveEmployees =
    employeesWithSalary && employeesWithSalary.length > 0;

  flowLog("Payroll cycle record:", payrollCycle);

  if (isPageLoading) {
    return (
      <PageShell>
        <div className="animate-pulse space-y-8">
          <div className="space-y-4">
            <div className="h-4 w-24 bg-slate-200 rounded-md" />
            <div className="h-10 w-64 bg-slate-200 rounded-lg" />
          </div>
          <div className="h-[120px] bg-slate-100 rounded-2xl" />
        </div>
      </PageShell>
    );
  }

  return (
    <div className="min-h-screen">
      <PageShell>
        {/* Navigation */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-6 sm:mb-8 group w-fit"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Groups
        </button>

        {/* Identity and Status Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 sm:gap-6 mb-8 sm:mb-10">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2 sm:mb-3">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[10px] sm:text-xs font-semibold tracking-wider uppercase">
                <Hash className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 dark:text-slate-500" />
                ID: {id}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight font-montserrat truncate">
              {group?.name || "Unnamed Group"}
            </h1>
          </div>

          {disbursementRecord?.executed ? (
            <div className="w-fit flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest shrink-0">
              <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Disbursed
            </div>
          ) : (
            <div className="w-fit flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest shadow-sm shrink-0">
              Active
            </div>
          )}
        </div>

        {/* Protocol Metrics */}
        <GroupStats
          groupId={groupId}
          showTerminal={isTerminalOpen}
          onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
        />

        {/* Conditional Roster Management */}
        {hasActiveEmployees ? (
          <div className="mt-8 sm:mt-12 space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-montserrat">
                Active Team
              </h2>
              {isAgentRunning && !disbursementRecord?.executed && (
                <span className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-2.5 sm:px-3 py-1 rounded-full flex items-center gap-1.5 shrink-0">
                  {employeesWithSalary.length} Yielding
                </span>
              )}
            </div>
            {disbursementRecord && (
              <ActiveEmployeeRoster
                employees={employeesWithSalary}
                disbursementRecord={disbursementRecord}
              />
            )}
          </div>
        ) : (
          <div className="mt-8 sm:mt-12 space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-montserrat">
                Setup Roster
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Stage employees to initialize the payroll cycle.
              </p>
            </div>
            <EmployeeRoster groupId={groupId} />
          </div>
        )}
      </PageShell>

      {/* Global Command Center */}
      {isTerminalOpen && (
        <AgentCommandCenter
          groupId={groupId}
          onClose={() => setIsTerminalOpen(false)}
        />
      )}

      {/* Layout spacer for docked terminal */}
      {isTerminalOpen && <div className="h-[40vh] w-full" />}
    </div>
  );
}
