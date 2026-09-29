import { useState } from 'react';
import { applyTheme, readAppliedTheme, type Theme } from '../lib/theme';

/**
 * Subtle sun/moon icon toggle (Task 9). Reads whatever theme index.html's
 * inline script already applied pre-paint — never recomputes it — so
 * there's a single source of truth for "what theme is this". A 44x44
 * touch target with a small visible glyph, matching the rest of the nav's
 * quiet, unshouty controls.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => readAppliedTheme());

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={theme === 'light'}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-hairline-strong text-foreground-faint transition-colors hover:bg-surface-sunken hover:text-foreground-muted"
    >
      {theme === 'dark' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M12 2.5v2.6M12 18.9v2.6M4.2 4.2l1.85 1.85M17.95 17.95l1.85 1.85M2.5 12h2.6M18.9 12h2.6M4.2 19.8l1.85-1.85M17.95 6.05l1.85-1.85"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20.2 15.2A8.6 8.6 0 0 1 8.8 3.8a9 9 0 1 0 11.4 11.4Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
