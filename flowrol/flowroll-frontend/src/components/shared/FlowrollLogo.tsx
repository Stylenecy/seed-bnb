interface FlowrollLogoProps {
  className?: string;
}

export default function FlowrollLogo({ className = "" }: FlowrollLogoProps) {
  return (
    <div className={`relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-900 dark:bg-white shadow-sm transition-transform duration-300 group-hover:scale-105 group-active:scale-95 shrink-0 ${className}`}>
      <svg
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
        className="w-4 h-4 sm:w-[22px] sm:h-[22px] text-white dark:text-slate-900 shrink-0"
      >
        <circle
          cx="14"
          cy="14"
          r="13"
          stroke="currentColor"
          strokeWidth="2.5"
          className="opacity-90"
        />
        <path
          d="M9 14 C9 10 12 8 14 8 C16 8 19 10 19 14"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M9 14 C9 18 12 20 14 20 C16 20 19 18 19 14"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="14" cy="14" r="2.5" fill="#10b981" />
      </svg>
    </div>
  );
}