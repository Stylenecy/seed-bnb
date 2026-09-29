/**
 * Theme persistence — pure-ish helpers behind the dual-theme toggle
 * (Task 9). The resolution order (stored choice, else `prefers-color-
 * scheme`, else dark) is mirrored by hand in an inline script in
 * `index.html` so the theme is set before first paint (no flash of the
 * wrong theme); this module is the single source of truth for everything
 * that runs after React mounts (the toggle button, and any future reader).
 *
 * Every function takes its browser dependency (storage/matchMedia/document)
 * as an optional last argument so this stays trivially testable without a
 * DOM, and defaults to the real global for normal app use.
 */

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'cermin_theme';

/** The stored explicit choice, if any — `null` means "no preference saved yet". */
export function getStoredTheme(storage: Pick<Storage, 'getItem'> = localStorage): Theme | null {
  const value = storage.getItem(THEME_STORAGE_KEY);
  return value === 'light' || value === 'dark' ? value : null;
}

/** The OS/browser preference. Defaults to 'dark' unless the OS explicitly asks for light. */
export function getSystemTheme(matches: boolean = matchMediaPrefersLight()): Theme {
  return matches ? 'light' : 'dark';
}

function matchMediaPrefersLight(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: light)').matches
    : false;
}

/** Stored choice wins; otherwise fall back to the system preference. */
export function resolveInitialTheme(
  storage: Pick<Storage, 'getItem'> = localStorage,
  systemPrefersLight: boolean = matchMediaPrefersLight(),
): Theme {
  return getStoredTheme(storage) ?? getSystemTheme(systemPrefersLight);
}

/** Persists the choice and flips the `data-theme` attribute the CSS keys off. */
export function applyTheme(
  theme: Theme,
  doc: Pick<Document, 'documentElement'> = document,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  doc.documentElement.setAttribute('data-theme', theme);
  storage.setItem(THEME_STORAGE_KEY, theme);
}

/** Reads whatever theme is currently applied to the document (set pre-paint by index.html's inline script). */
export function readAppliedTheme(doc: Pick<Document, 'documentElement'> = document): Theme {
  return doc.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}
