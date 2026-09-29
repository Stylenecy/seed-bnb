"use client";

import { useRouter } from 'next/navigation'
import { USDC_DECIMALS } from "@/lib/chain";
import { motion, Variants } from 'framer-motion'
import {
    Lock,
    ArrowRight,
    Zap
} from 'lucide-react'
import { useEmployeeGroups } from '@/hooks/payroll/usePayrollQueries'
import { flowLog, formatMoney } from '@/lib/utils'
import { useAvailableBalance, useTotalLocked } from '@/hooks/vault/useVaultQueries'
import { useContractClient } from '@/hooks/useContractClient'
import { ClaimCard } from '@/components/shared/ClaimCard'
import { SalarySection } from '@/components/employee/SalarySection'
import { SectionTitle } from '@/components/shared/SectionTitle'
import Link from 'next/link'

export default function EmployeeDashboard() {
    const router = useRouter()
    const { address } = useContractClient()

    // Fetch account balances and active payrolls
    const { data: employeeGroups, isLoading: isLoadingEmployeeGroups } = useEmployeeGroups()
    const { data: availableBalance, isLoading: isLoadingAvailableBalance } = useAvailableBalance(address)
    const { data: totalLocked, isLoading: isLoadingTotalLocked } = useTotalLocked(address)

    flowLog("Employee Groups: ", employeeGroups);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] transition-colors duration-500 pt-6 sm:pt-8 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

                <SectionTitle
                    title="Dashboard"
                    description="Manage your claimable salary and advances across all employers." 
                />

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6"
                >
                    {/* Funds ready for withdrawal */}
                    <ClaimCard
                        title="Available to Claim"
                        balance={availableBalance}
                        isLoading={isLoadingAvailableBalance}
                        theme="emerald" 
                        buttonText="Route & Claim"
                        onAction={() => router.push('/claim')}
                        variants={itemVariants}
                        className="md:col-span-2 lg:col-span-5"
                    />

                    {/* Salary currently locked in the vault */}
                    <motion.div
                        variants={itemVariants}
                        className="md:col-span-1 lg:col-span-4 bg-white dark:bg-[#0f172a] rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between group hover:border-blue-200 dark:hover:border-blue-500/30 transition-colors min-h-[180px] sm:min-h-[220px] relative overflow-hidden"
                    >
                        <div className="absolute -left-10 -bottom-10 w-32 h-32 sm:w-40 sm:h-40 bg-blue-500/10 rounded-full blur-2xl sm:blur-3xl group-hover:bg-blue-500/20 transition-colors duration-700 pointer-events-none" />

                        <div className="flex justify-between items-start relative z-10 mb-6 sm:mb-8 lg:mb-0">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform duration-500 shrink-0">
                                <Lock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-slate-700 dark:text-slate-300" />
                            </div>
                            <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0">
                                Compounding
                            </div>
                        </div>

                        <div className="relative z-10 w-full min-w-0">
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-1.5 sm:mb-2 truncate">
                                Locked Salary
                            </p>
                            <div className="flex items-baseline gap-1.5 sm:gap-2 min-w-0 w-full">
                                <h2 className="text-3xl sm:text-4xl lg:text-3xl xl:text-4xl font-black text-slate-900 dark:text-white tracking-tighter truncate">
                                    {isLoadingTotalLocked ? "..." : formatMoney(totalLocked ?? 0n, USDC_DECIMALS)}
                                </h2>
                                <span className="text-sm sm:text-base font-bold text-slate-500 shrink-0">USDC</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Credit and advances management */}
                    <motion.div
                        variants={itemVariants}
                        className="md:col-span-1 lg:col-span-3 h-full"
                    >
                        <Link
                            href="/employee/credit-hub"
                            className="cursor-pointer group relative overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-6 lg:p-8 transition-all duration-500 hover:-translate-y-1.5 bg-white dark:bg-[#0f172a] shadow-xs border border-slate-200 dark:border-slate-800 min-h-[180px] sm:min-h-[220px] flex flex-col h-full justify-between"
                        >
                            <div className="absolute right-0 bottom-0 w-24 h-24 sm:w-32 sm:h-32 bg-emerald-500/10 rounded-full blur-[2rem] sm:blur-2xl group-hover:bg-emerald-500/20 transition-colors duration-500 pointer-events-none" />

                            <div className="relative z-20 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 shrink-0">
                                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-emerald-500" />
                                    </div>

                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-widest shrink-0">
                                        Active
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-1.5 tracking-tight truncate">
                                        Credit Hub
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs lg:text-sm leading-relaxed mb-4 sm:mb-6 line-clamp-2">
                                        Access liquidity instantly. Draw advances and manage debt before payday.
                                    </p>

                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] sm:text-[10px] lg:text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 transition-colors">
                                            Access Hub
                                        </span>
                                        <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center group-hover:translate-x-1.5 transition-transform duration-300 shrink-0">
                                            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-emerald-600 dark:text-emerald-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                </motion.div>

                {/* Individual payroll stream overview */}
                <div className='mt-10 sm:mt-16 border-t border-slate-200 dark:border-slate-800/80 pt-4 sm:pt-6 space-y-4 sm:space-y-5'>
                    <div className="space-y-1">
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                            My Salaries
                        </h3>
                        <p className="text-sm sm:text-base text-slate-500 font-medium">
                            View all active payroll groups.
                        </p>
                    </div>
                    <SalarySection />
                </div>

            </div>
        </div>
    )
}




// 'use client'

// import { useRouter } from 'next/navigation'
// import { motion, Variants } from 'framer-motion'
// import {
//     Lock,
//     ArrowRight,
//     Zap
// } from 'lucide-react'
// import { useEmployeeGroups } from '@/hooks/payroll/usePayrollQueries'
// import { flowLog, formatMoney } from '@/lib/utils'
// import { useAvailableBalance, useTotalLocked } from '@/hooks/vault/useVaultQueries'
// import { useContractClient } from '@/hooks/useContractClient'
// import { ClaimCard } from '@/components/shared/ClaimCard'
// import { SalarySection } from '@/components/employee/SalarySection'
// import { SectionTitle } from '@/components/shared/SectionTitle'
// import Link from 'next/link'

// export default function EmployeeDashboard() {
//     const router = useRouter()
//     const { address } = useContractClient()

//     // Fetch account balances and active payrolls
//     const { data: employeeGroups, isLoading: isLoadingEmployeeGroups } = useEmployeeGroups()
//     const { data: availableBalance, isLoading: isLoadingAvailableBalance } = useAvailableBalance(address)
//     const { data: totalLocked, isLoading: isLoadingTotalLocked } = useTotalLocked(address)

//     flowLog("Employee Groups: ", employeeGroups);

//     // Animation variants
//     const containerVariants = {
//         hidden: { opacity: 0 },
//         show: {
//             opacity: 1,
//             transition: { staggerChildren: 0.1 }
//         }
//     }

//     const itemVariants: Variants = {
//         hidden: { opacity: 0, y: 20 },
//         show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
//     }


//     return (
//         <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] transition-colors duration-500 pt-8 pb-20 px-4 sm:px-6 lg:px-8">
//             <div className="max-w-7xl mx-auto space-y-8">

//                 <SectionTitle
//                     title="Dashboard"
//                     description="Manage your claimable salary, advances across all employers." 
//                 />

//                 <motion.div
//                     variants={containerVariants}
//                     initial="hidden"
//                     animate="show"
//                     className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6"
//                 >
//                     {/* Funds ready for withdrawal */}
//                     <ClaimCard
//                         title="Available to Claim"
//                         balance={availableBalance}
//                         isLoading={isLoadingAvailableBalance}
//                         theme="emerald" 
//                         buttonText="Route & Claim"
//                         onAction={() => router.push('/claim')}
//                         variants={itemVariants}
//                         className="lg:col-span-5"
//                     />

//                     {/* Salary currently locked in the vault */}
//                     <motion.div
//                         variants={itemVariants}
//                         className="lg:col-span-4 bg-white dark:bg-[#0f172a] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between group hover:border-blue-200 dark:hover:border-blue-500/30 transition-colors min-h-[220px] relative overflow-hidden"
//                     >
//                         <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors duration-700 pointer-events-none" />

//                         <div className="flex justify-between items-start relative z-10 mb-8 lg:mb-0">
//                             <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform duration-500 shrink-0">
//                                 <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700 dark:text-slate-300" />
//                             </div>
//                             <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0">
//                                 Compounding
//                             </div>
//                         </div>

//                         <div className="relative z-10">
//                             <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-2">
//                                 Locked Salary
//                             </p>
//                             <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
//                                 <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter break-all">
//                                     {isLoadingTotalLocked ? "..." : formatMoney(totalLocked ?? 0n, USDC_DECIMALS)}
//                                 </h2>
//                                 <span className="text-sm sm:text-base font-bold text-slate-500">USDC</span>
//                             </div>
//                         </div>
//                     </motion.div>

//                     {/* Credit and advances management */}
//                     <motion.div
//                         variants={itemVariants}
//                         className="lg:col-span-3 h-full"
//                     >
//                         <Link
//                             href="/employee/credit-hub"
//                             className="cursor-pointer group relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 transition-all duration-500 hover:-translate-y-1.5 bg-white dark:bg-[#0f172a] shadow-xs border border-slate-200 dark:border-slate-800 min-h-[220px] flex flex-col h-full justify-between"
//                         >
//                             <div className="absolute right-0 bottom-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors duration-500 pointer-events-none" />

//                             <div className="relative z-20 flex flex-col h-full justify-between">
//                                 <div className="flex justify-between items-start mb-4">
//                                     <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 shrink-0">
//                                         <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
//                                     </div>

//                                     <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-widest shrink-0">
//                                         Active
//                                     </div>
//                                 </div>

//                                 <div>
//                                     <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">
//                                         Credit Hub
//                                     </h3>
//                                     <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
//                                         Access liquidity instantly. Draw advances and manage debt before payday.
//                                     </p>

//                                     <div className="flex items-center gap-2">
//                                         <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 transition-colors">
//                                             Access Hub
//                                         </span>
//                                         <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center group-hover:translate-x-1.5 transition-transform duration-300">
//                                             <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-500" />
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </Link>
//                     </motion.div>

//                 </motion.div>

//                 {/* Individual payroll stream overview */}
//                 <div className='mt-16 border-t border-slate-200 dark:border-slate-800/80 pt-4 space-y-5'>
//                     <div className="space-y-1">
//                         <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
//                             My Salaries
//                         </h3>
//                         <p className="text-slate-500 font-medium">
//                             View all active payroll groups.
//                         </p>
//                     </div>
//                     <SalarySection />
//                 </div>

//             </div>
//         </div>
//     )
// }