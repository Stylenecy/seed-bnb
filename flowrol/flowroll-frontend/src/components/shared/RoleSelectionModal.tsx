'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ArrowRight, X, User } from 'lucide-react';

import { useAuthStore } from '@/store/authStore';

interface RoleSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function RoleSelectionModal({ isOpen, onClose }: RoleSelectionModalProps) {
    const router = useRouter();
    
    // Component state
    const [mounted, setMounted] = useState(false);
    const { setRole } = useAuthStore();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSelectRole = (role: 'employer' | 'employee') => {
        setRole(role);
        onClose();
        router.push(`/${role}`);
    };

    // Prevent hydration mismatch by only rendering the portal on the client
    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/80 dark:bg-[#05070a]/90 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="relative z-10 w-full max-w-3xl bg-white dark:bg-[#0a0a0a] rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-5 sm:p-8 lg:p-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        <div className="relative z-10 flex items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4 shrink-0">
                            <div className="min-w-0">
                                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tighter break-words whitespace-normal">
                                    Select Workspace
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm lg:text-base mt-1 sm:mt-1.5 break-words whitespace-normal leading-relaxed">
                                    Choose your entry point into the Flowroll protocol.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full overflow-y-auto custom-scrollbar pb-2">
                            
                            {/* Employer Card */}
                            <button
                                onClick={() => handleSelectRole("employer")}
                                className="group relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-[1.25rem] sm:rounded-3xl bg-slate-900 dark:bg-white border border-slate-800 dark:border-slate-200 transition-all duration-300 hover:-translate-y-1 cursor-pointer shadow-none"
                            >
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-800 dark:bg-slate-100 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform shrink-0">
                                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 dark:text-slate-500" />
                                </div>
                                <span className="text-base sm:text-lg font-bold text-white dark:text-slate-900 break-words whitespace-normal text-center">
                                    Employer
                                </span>
                                <div className="mt-3 sm:mt-4 flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-slate-500">
                                    Enter <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>

                            {/* Employee Card */}
                            <button
                                onClick={() => handleSelectRole("employee")}
                                className="group relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-[1.25rem] sm:rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer shadow-none"
                            >
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform border border-slate-100 dark:border-slate-700 shrink-0">
                                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-400" />
                                </div>
                                <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white break-words whitespace-normal text-center">
                                    Employee
                                </span>
                                <div className="mt-3 sm:mt-4 flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase tracking-widest font-black text-slate-400">
                                    Enter <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>
                            
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}