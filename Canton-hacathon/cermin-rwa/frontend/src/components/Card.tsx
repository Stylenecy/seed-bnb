import type { ReactNode } from 'react';

interface CardProps {
  /** Small label above the title, e.g. "COLLATERAL". */
  eyebrow?: string;
  title?: string;
  /** Right-aligned slot next to the title — typically a PrivacyBadge. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * The one card shape used everywhere on the dashboard: a quiet ink surface,
 * a hairline border, generous padding. No drop shadows fighting for
 * attention — depth comes from the subtle inset highlight only.
 */
export function Card({ eyebrow, title, action, children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-hairline bg-surface-raised p-6 shadow-card sm:p-7 ${className}`}
    >
      {(eyebrow || title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div>
            {eyebrow && (
              <p className="text-xs font-semibold tracking-[0.14em] text-foreground-faint uppercase">{eyebrow}</p>
            )}
            {title && <h3 className="mt-1 font-display text-lg text-foreground">{title}</h3>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
