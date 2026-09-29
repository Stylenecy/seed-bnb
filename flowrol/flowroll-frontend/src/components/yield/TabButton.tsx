export function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 ${active
        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow-md border border-slate-200 dark:border-slate-700/50"
        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent"
        }`}
    >
      {icon} <span>{label}</span>
    </button>
  );
}