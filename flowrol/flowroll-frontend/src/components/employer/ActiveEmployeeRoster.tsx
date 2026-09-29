"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { DisbursementRecord } from "@/types";
import { ActiveEmployeeRow } from "../employee/ActiveEmployeeRow";

export interface ActiveEmployee {
  address: string;
  username?: string | null;
  salary: bigint;
}

interface ActiveEmployeeRosterProps {
  employees: ActiveEmployee[];
  disbursementRecord: DisbursementRecord;
}

export function ActiveEmployeeRoster({
  employees,
  disbursementRecord
}: ActiveEmployeeRosterProps) {
  return (
    <div className="w-full bg-white dark:bg-[#0a0c10] rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden transition-all">
      <div className="w-full overflow-x-auto no-scrollbar">
        <Table className="min-w-[500px] w-full">
          
          {/* Roster Header */}
          <TableHeader className="bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-sm">
            <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
              <TableHead className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 py-4 sm:py-5 pl-4 sm:pl-8 whitespace-nowrap">
                Employee
              </TableHead>
              <TableHead className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 py-4 sm:py-5 text-right whitespace-nowrap">
                Base Salary
              </TableHead>
              <TableHead className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 py-4 sm:py-5 text-right pr-4 sm:pr-8 whitespace-nowrap">
                {/* Manage */}
              </TableHead>
            </TableRow>
          </TableHeader>

          {/* Roster Body */}
          <TableBody>
            {employees.map((emp) => (
              <ActiveEmployeeRow 
                key={emp.address} 
                emp={emp} 
                disbursementRecord={disbursementRecord} 
              />
            ))}
          </TableBody>
          
        </Table>
      </div>
    </div>
  );
}