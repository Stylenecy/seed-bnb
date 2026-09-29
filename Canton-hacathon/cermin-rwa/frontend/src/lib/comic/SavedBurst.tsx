import { motion } from 'framer-motion';
import { ComicTag } from './ComicTag';
import { SpeedBurst } from './SpeedBurst';
import { useOneShot } from './motion';

interface SavedBurstProps {
  /** Fire once each time this changes to a new non-null value — key it by the
   * rescue-event id so a restored position celebrates exactly once. No-op on
   * mount and under reduced motion. */
  trigger: unknown;
  /** Word to slam. Default "SAVED!". */
  label?: string;
  /** Tag / burst color. Default sage (the "protected" family). */
  color?: string;
  className?: string;
}

/**
 * The rescue celebration: a "SAVED!" comic tag punching in over sage
 * speed-lines with a squash-stretch pop, holding ~1s, then fading out and
 * unmounting. Overlays its positioned parent, decorative + non-interactive, and
 * renders nothing under `prefers-reduced-motion`.
 */
export function SavedBurst({ trigger, label = 'SAVED!', color = 'var(--color-sage)', className = '' }: SavedBurstProps) {
  const active = useOneShot(trigger, 1300);
  if (!active) return null;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-30 flex items-center justify-center ${className}`}
    >
      <motion.div
        className="relative flex items-center justify-center"
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: [0.3, 1.18, 1, 1], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.3, times: [0, 0.25, 0.8, 1], ease: 'easeOut' }}
      >
        <SpeedBurst
          seed={`saved-${String(trigger)}`}
          color={color}
          count={14}
          spread={48}
          opacity={0.7}
          className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2"
        />
        <ComicTag size={68} color={color} rotate={-3}>
          {label}
        </ComicTag>
      </motion.div>
    </div>
  );
}
