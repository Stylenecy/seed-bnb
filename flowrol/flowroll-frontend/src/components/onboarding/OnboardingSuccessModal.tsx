'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, Building2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

interface OnboardingSuccessModalProps {
    isOpen: boolean;
}

export function OnboardingSuccessModal({ isOpen }: OnboardingSuccessModalProps) {
    const router = useRouter();
    const { setRole } = useAuthStore();

    const handleSelectRole = (selectedRole: "employer" | "employee") => {
        setRole(selectedRole); 
        router.push(`/${selectedRole}`);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/60 dark:bg-[#05070a]/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="relative w-full max-w-lg bg-white dark:bg-[#0a0a0a] rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 sm:p-10 overflow-hidden shadow-2xl"
                    >
                        {/* Ambient Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-24 sm:h-32 bg-emerald-500/5 blur-[40px] sm:blur-[50px] pointer-events-none" />

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-6 sm:mb-8 shrink-0">
                                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500" />
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-3 sm:mb-4">
                                Wallet Funded
                            </h2>

                            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mb-8 sm:mb-10 max-w-[280px] sm:max-w-xs mx-auto">
                                Your setup is complete. You now have the gas and USDC required to use Flowroll.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                                {/* Employer Option */}
                                <Button
                                    onClick={() => handleSelectRole('employer')}
                                    className="group relative w-full sm:w-1/2 h-14 sm:h-16 pl-2.5 sm:pl-3 pr-3 sm:pr-4 rounded-xl sm:rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold transition-all duration-300 hover:bg-slate-800 dark:hover:bg-slate-100 hover:-translate-y-1 cursor-pointer border-none flex items-center shadow-none"
                                >
                                    <div className="flex items-center w-full min-w-0">
                                        <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-800 dark:bg-slate-100 flex items-center justify-center">
                                            <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                        </div>

                                        <div className="flex-1 px-2.5 sm:px-3 text-left min-w-0">
                                            <span className="block text-xs sm:text-sm leading-none truncate">Employer</span>
                                        </div>

                                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-40 group-hover:translate-x-1 group-hover:opacity-100 transition-all shrink-0" />
                                    </div>
                                </Button>

                                {/* Employee Option */}
                                <Button
                                    onClick={() => handleSelectRole('employee')}
                                    variant="outline"
                                    className="group relative w-full sm:w-1/2 h-14 sm:h-16 pl-2.5 sm:pl-3 pr-3 sm:pr-4 rounded-xl sm:rounded-2xl bg-transparent border-slate-200 dark:border-slate-800 font-bold transition-all duration-300 hover:bg-slate-50 dark:hover:bg-[#0d1117] hover:-translate-y-1 cursor-pointer flex items-center shadow-none"
                                >
                                    <div className="flex items-center w-full min-w-0">
                                        <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                                            <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                        </div>

                                        <div className="flex-1 px-2.5 sm:px-3 text-left min-w-0">
                                            <span className="block text-xs sm:text-sm leading-none text-slate-900 dark:text-white truncate">Employee</span>
                                        </div>

                                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-slate-900 dark:group-hover:text-white transition-all shrink-0" />
                                    </div>
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}