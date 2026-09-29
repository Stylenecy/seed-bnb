'use client'

import { Wallet } from 'lucide-react'
import { useEmployeeGroups } from '@/hooks/payroll/usePayrollQueries'
import EmployeeGroupCard from '@/components/employee/EmployeeGroupCard'

export function SalarySection() {
    const { data: employeeGroups, isLoading } = useEmployeeGroups()

    return (
        <div className="w-full space-y-4 sm:space-y-5">
            {isLoading ? (
                <div className="w-full text-center py-12 sm:py-16 lg:py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col items-center justify-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium px-4">
                        Fetching your wealth portfolio...
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {[...(employeeGroups || [])].toReversed().map((group, idx) => (
                            <EmployeeGroupCard
                                key={`${group.employerAddress}-${group.groupId.toString()}`}
                                group={group}
                                index={idx}
                            />
                        ))}
                    </div>

                    {(!employeeGroups || employeeGroups.length === 0) && (
                        <div className="w-full text-center py-12 sm:py-16 lg:py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[1.5rem] sm:rounded-[2rem] flex flex-col items-center justify-center">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                                <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 dark:text-slate-500" />
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
                                No active streams
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 font-medium px-4 max-w-sm">
                                No active payroll streams found for this wallet. Wait for your employer to stage your allocation.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}