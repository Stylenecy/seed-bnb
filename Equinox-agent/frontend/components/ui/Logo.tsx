import { cn } from "@/lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="relative grid h-7 w-7 place-items-center">
        <svg viewBox="0 0 28 28" className="h-7 w-7" aria-hidden>
          <defs>
            <linearGradient id="eq-g" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ededeb" />
              <stop offset="100%" stopColor="#a6a6a1" />
            </linearGradient>
          </defs>
          <circle
            cx="14"
            cy="14"
            r="12"
            fill="none"
            stroke="url(#eq-g)"
            strokeWidth="1.4"
          />
          <path
            d="M5.5 18.2 Q14 11.2 22.5 18.2"
            fill="none"
            stroke="#e4f33d"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M5.5 14 Q14 7 22.5 14"
            fill="none"
            stroke="#ededeb"
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      </span>
      <span className="font-medium tracking-[-0.01em] text-[15px] text-ink-50">
        Equinox<span className="text-ink-400 font-normal"> Agent</span>
      </span>
    </div>
  );
}
