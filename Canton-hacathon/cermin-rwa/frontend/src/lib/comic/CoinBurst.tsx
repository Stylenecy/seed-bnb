import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { buildCoinArcs } from './geometry';
import { useOneShot } from './motion';

interface CoinBurstProps {
  /** Fire the burst once each time this value changes to a new non-null value
   * (e.g. a faucet-claim counter). No-op on mount and under reduced motion. */
  trigger: unknown;
  /** Coins in the spray. Default 8. */
  count?: number;
  seed?: string;
  /** Positioning classes for the overlay origin (coins spray from its
   * center). Default centers on the parent (`absolute inset-0`). */
  className?: string;
}

/**
 * A short fountain of gold coins arcing up-and-out from a point — the faucet /
 * celebration micro-moment. Deterministic spray (seeded, no `Math.random`),
 * ~1s, then unmounts. Purely decorative and non-interactive; renders nothing
 * under `prefers-reduced-motion`.
 */
export function CoinBurst({ trigger, count = 8, seed = 'coin', className = '' }: CoinBurstProps) {
  const active = useOneShot(trigger, 1100);
  const coins = useMemo(() => buildCoinArcs({ count, seed: `${seed}-${String(trigger)}` }), [count, seed, trigger]);
  if (!active) return null;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-30 flex items-center justify-center ${className}`}
    >
      <div className="relative h-0 w-0">
        {coins.map((c, i) => (
          <motion.svg
            key={i}
            width={c.r * 2}
            height={c.r * 2}
            viewBox="-10 -10 20 20"
            className="absolute"
            style={{ left: -c.r, top: -c.r }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4, rotate: 0 }}
            animate={{
              x: [0, c.dx * 0.6, c.dx],
              y: [0, -c.lift, c.dy],
              opacity: [0, 1, 0],
              scale: [0.4, 1, 0.9],
              rotate: [0, c.spin * 0.5, c.spin],
            }}
            transition={{ duration: 0.95, delay: c.delay, times: [0, 0.35, 1], ease: 'easeOut' }}
          >
            <circle r="9" fill="var(--color-gold)" stroke="var(--color-ink-line)" strokeWidth="1.6" />
            <circle r="5.4" fill="none" stroke="var(--color-gold-soft)" strokeWidth="1.1" />
            <circle r="1.8" fill="var(--color-ink-line)" />
          </motion.svg>
        ))}
      </div>
    </div>
  );
}
