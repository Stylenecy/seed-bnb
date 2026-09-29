'use client'

import { SectionTitle } from '@/components/shared/SectionTitle'
import { CreditTermsCard } from '@/components/employee/CreditTermsCard'
import { SalaryStats } from '@/components/employee/SalaryStats'
import { WithdrawAdvanceCard } from '@/components/employee/WithdrawAdvanceCard'

export default function MySalariesPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#05070a] transition-colors duration-500 pt-8 pb-20 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500/20">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Page header and context */}
                <SectionTitle
                    title="Credit Hub"
                    description="Access your pending salary instantly and manage your active debt."
                />

                {/* Key protocol metrics and user balances */}
                <SalaryStats />

                {/* Primary interaction layer: Withdrawal engine and credit terms */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Main action terminal for advances and repayments */}
                    <WithdrawAdvanceCard />

                    {/* Collateral info and protocol documentation */}
                    <div className="lg:col-span-5">
                        <CreditTermsCard />
                    </div>

                </div>
            </div>
        </div>
    )
}