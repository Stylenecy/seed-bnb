export function MetricBox({ label, value, color }: any) {
  return (
    <div className="bg-white dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800/50 flex flex-col justify-center shadow-sm dark:shadow-none">
      <span className="text-[10px] uppercase tracking-[0.1em] text-slate-500 font-bold mb-1">{label}</span>
      <span className={`text-sm font-mono font-bold ${color}`}>{value}</span>
    </div>
  );
}
