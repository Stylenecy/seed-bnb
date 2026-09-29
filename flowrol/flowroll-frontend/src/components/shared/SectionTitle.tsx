import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface SectionTitleProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  rightElement?: ReactNode;
}

export function SectionTitle({ 
  title, 
  description, 
  icon: Icon, 
  rightElement 
}: SectionTitleProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 sm:gap-6">
      
      {/* Header content */}
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2 sm:gap-3 font-montserrat">
          {Icon && <Icon className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 text-emerald-600 dark:text-emerald-400" />}
          <span className="truncate">{title}</span>
        </h1>
        
        {description && (
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 sm:mt-1.5 flex items-center gap-2 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      
      {/* Optional right-aligned actions */}
      {rightElement && (
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0 mt-1 sm:mt-0">
          {rightElement}
        </div>
      )}
      
    </div>
  );
}