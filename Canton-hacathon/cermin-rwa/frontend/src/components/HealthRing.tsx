import { motion } from 'framer-motion';
import { STATUS_LABEL, type HealthStatus } from '../lib/health';
import { formatPercentBps } from '../lib/format';

interface HealthRingProps {
  healthRatioBps: number;
  triggerRatioBps: number;
  status: HealthStatus;
  size?: number;
}

const STATUS_STROKE: Record<HealthStatus, string> = {
  protected: 'var(--color-sage)',
  guarded: 'var(--color-amber)',
  action: 'var(--color-terracotta)',
};

const STATUS_TEXT_CLASS: Record<HealthStatus, string> = {
  protected: 'text-sage',
  guarded: 'text-amber',
  action: 'text-terracotta',
};

const STATUS_DOT_CLASS: Record<HealthStatus, string> = {
  protected: 'bg-sage',
  guarded: 'bg-amber',
  action: 'bg-terracotta',
};

// 200% is drawn as a full ring — this keeps the gauge calm and legible
// across the whole demo range (126%–166%) instead of looking either empty
// or maxed out.
const VISUAL_CAP_BPS = 20_000;

/**
 * The hero of the whole app (docs/03-ux.md: "one number rules the screen").
 * A closed, serene ring — not a screaming gauge — with a quiet tick mark at
 * the Guard Trigger so the trigger point is legible without being alarming.
 */
export function HealthRing({ healthRatioBps, triggerRatioBps, status, size = 260 }: HealthRingProps) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeBps = Number.isFinite(healthRatioBps) ? healthRatioBps : VISUAL_CAP_BPS;
  const fraction = Math.max(0, Math.min(1, safeBps / VISUAL_CAP_BPS));
  const triggerFraction = Math.max(0, Math.min(1, triggerRatioBps / VISUAL_CAP_BPS));
  const center = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} stroke="var(--color-surface-overlay)" strokeWidth={strokeWidth} fill="none" />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          stroke={STATUS_STROKE[status]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: circumference * (1 - fraction) }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>

      {/* Guard Trigger tick — a quiet reference mark, not an alarm. */}
      <div className="pointer-events-none absolute inset-0" style={{ transform: `rotate(${triggerFraction * 360}deg)` }}>
        <div className="absolute top-0.5 left-1/2 h-3 w-[3px] -translate-x-1/2 rounded-full bg-foreground-faint/50" />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
        <span className="font-display text-5xl text-foreground tabular-nums">{formatPercentBps(healthRatioBps)}</span>
        <span className="text-xs font-medium tracking-[0.18em] text-foreground-faint uppercase">Health Ratio</span>
        <span
          className={`mt-1 inline-flex items-center gap-1.5 rounded-full border border-hairline-strong px-3 py-1 text-sm font-semibold ${STATUS_TEXT_CLASS[status]}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASS[status]}`} />
          {STATUS_LABEL[status]}
        </span>
      </div>
    </div>
  );
}
