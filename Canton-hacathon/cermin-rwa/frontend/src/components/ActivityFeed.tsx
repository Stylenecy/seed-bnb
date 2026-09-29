import { AnimatePresence, motion } from 'framer-motion';
import type { ActivityItem, ActivityKind } from '../store';
import { formatRelativeTime } from '../lib/format';

interface ActivityFeedProps {
  items: ActivityItem[];
}

// Restrained glyphs, not an icon-font — each is a quiet marker, not a badge
// competing for attention.
const KIND_MARK: Record<ActivityKind, string> = {
  welcome: '◈',
  rescue: '◆',
  coupon: '●',
  vault: '◇',
  borrow: '▲',
};

const KIND_COLOR_CLASS: Record<ActivityKind, string> = {
  welcome: 'text-gold',
  rescue: 'text-sage',
  coupon: 'text-gold-soft',
  vault: 'text-gold',
  borrow: 'text-foreground-muted',
};

/**
 * "Protection is a story, not a log" (docs/03-ux.md). Every entry is a
 * first-person sentence from Cermin, newest first — never a raw event dump.
 */
export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-foreground-faint">
        Nothing to report yet. I'll let you know the moment something changes.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex gap-3 border-b border-hairline py-4 last:border-none"
          >
            <span className={`mt-0.5 text-sm ${KIND_COLOR_CLASS[item.kind]}`} aria-hidden="true">
              {KIND_MARK[item.kind]}
            </span>
            <div className="flex-1">
              <p className="text-sm leading-relaxed text-foreground-muted">{item.message}</p>
              <p className="mt-1 text-xs text-foreground-faint">{formatRelativeTime(item.at)}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
