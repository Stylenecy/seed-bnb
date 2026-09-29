interface PrivacyBadgeProps {
  /** Defaults to the product's standard privacy line. */
  label?: string;
}

/**
 * "Only you can see this." Privacy is the product (see CLAUDE.md hard rule
 * #1) — this badge is how the UI keeps saying that quietly, without ever
 * shouting it. Used on the Shadow Vault card and anywhere else the pool
 * operator has no visibility.
 */
export function PrivacyBadge({ label = 'Only you control this' }: PrivacyBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline-strong bg-surface-sunken px-2.5 py-1 text-[11px] font-medium tracking-wide whitespace-nowrap text-gold-soft">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 4.5c-5.5 0-9 5-9.5 6.5.5 1.5 4 6.5 9.5 6.5s9-5 9.5-6.5C21 9.5 17.5 4.5 12 4.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="11" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      {label}
    </span>
  );
}
