"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CreateGroupModal } from "@/components/employer/CreateGroupModal";
import { useEmployerGroups } from "@/hooks/payroll/usePayrollQueries";
import { GroupCard } from "@/components/employer/GroupCard";

interface GroupSectionProps {
  className?: string;
}

export default function GroupSection({ className = "" }: GroupSectionProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: employerGroups, isLoading } = useEmployerGroups();

  return (
    <div className={`mx-auto space-y-8 sm:space-y-12 ${className}`}>
      <div className="space-y-8 sm:space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="space-y-1 sm:space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Active Allocations
            </h3>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">
              Manage your payroll groups and agent settings.
            </p>
          </div>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl sm:rounded-md px-6 py-3 h-auto font-bold transition-all hover:shadow-xl shadow-slate-900/20 dark:shadow-white/5 group cursor-pointer"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            Create New Group
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-56 sm:h-64 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] sm:rounded-[2rem] animate-pulse"
                />
              ))}
            </div>
          ) : !employerGroups || employerGroups.length === 0 ? (
            <div className="bg-white dark:bg-[#0a0c10] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 md:p-20 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <FolderOpen className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Ready to deploy?
              </h3>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mb-6 sm:mb-8 max-w-xs">
                Create your first group to start automating your payroll with
                yield.
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full sm:w-auto bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#0d1117] text-slate-900 dark:text-white rounded-xl sm:rounded-md px-6 py-3 h-auto font-bold transition-all hover:shadow-md group cursor-pointer"
              >
                Get Started
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {[...employerGroups].reverse().map((group) => (
                <GroupCard key={group.groupId.toString()} group={group} />
              ))}
            </div>
          )}
        </motion.div>

        <CreateGroupModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    </div>
  );
}
