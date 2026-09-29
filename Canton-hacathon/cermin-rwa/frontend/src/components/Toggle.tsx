interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

/**
 * A quiet pill switch — used for Coupon Sweep. No color-shouting, just a
 * position change. The visible track/thumb keep their original size and
 * colors exactly (dark theme stays byte-for-byte); the outer button just
 * grows its hit area to the 44x44 touch-target minimum via centering,
 * invisible padding rather than a bigger-looking switch.
 */
export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 min-w-11 shrink-0 items-center justify-center"
    >
      <span
        className={`relative h-7 w-12 rounded-full border transition-colors ${
          checked ? 'border-sage-dim bg-sage-dim' : 'border-hairline-strong bg-surface-sunken'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full transition-all ${
            checked ? 'left-6 bg-sage' : 'left-0.5 bg-foreground-faint'
          }`}
        />
      </span>
    </button>
  );
}
