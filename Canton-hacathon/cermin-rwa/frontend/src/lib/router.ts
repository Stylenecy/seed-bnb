import { useEffect, useState } from 'react';

/**
 * The app screens per docs/03-ux.md — unchanged set, five flat screens, no
 * nested routes (a tiny hash-based router, not react-router: this stays
 * small on purpose). Task 19 adds a public Landing page in FRONT of them:
 * `/` (empty hash) is now Landing, and every app screen lives under
 * `#/app/...` instead of a bare `#/...`. Legacy bare hashes (`#/dashboard`,
 * `#/borrow`, `#/vault`, `#/simulate`, `#/onboarding`) still resolve to the
 * right screen AND get silently rewritten to their `#/app/...` home (via
 * `history.replaceState`, no extra back-button entry) so old bookmarks and
 * deep links keep working without ever showing a stale URL shape.
 */
export type Screen = 'onboarding' | 'dashboard' | 'borrow' | 'vault' | 'simulate';
export type View = 'landing' | 'app';

export interface Route {
  view: View;
  /** Only meaningful when `view === 'app'`; a stable 'dashboard' placeholder otherwise. */
  screen: Screen;
}

const VALID_SCREENS: readonly Screen[] = ['onboarding', 'dashboard', 'borrow', 'vault', 'simulate'];

function isScreen(value: string): value is Screen {
  return (VALID_SCREENS as readonly string[]).includes(value);
}

/** `#/app/borrow/` -> `app/borrow`; `#dashboard` -> `dashboard`; `#`/`` -> ``. */
export function stripHash(hash: string): string {
  return hash.replace(/^#\/?/, '').replace(/\/+$/, '');
}

/** The canonical `#/app/...` hash for a screen — dashboard's home is the bare `#/app`. */
export function appHash(screen: Screen): string {
  return screen === 'dashboard' ? '#/app' : `#/app/${screen}`;
}

/**
 * A legacy bare-screen path (`dashboard`, `borrow`, `vault`, `simulate`,
 * `onboarding`) -> its new `#/app/...` home, or `null` if `raw` isn't a
 * legacy path at all (already `app`/`app/...`, empty, or unrecognized).
 */
export function legacyRedirectTarget(raw: string): string | null {
  return isScreen(raw) ? appHash(raw) : null;
}

/**
 * Pure hash-path -> Route mapping (no browser side effects), the single
 * source of truth both `useRoute` and its tests read. Doesn't perform the
 * legacy rewrite itself — callers do that first and re-parse the result.
 */
export function parseRoute(raw: string): Route {
  if (raw === 'app') return { view: 'app', screen: 'dashboard' };
  if (raw.startsWith('app/')) {
    const sub = raw.slice(4);
    return { view: 'app', screen: isScreen(sub) ? sub : 'dashboard' };
  }
  if (isScreen(raw)) return { view: 'app', screen: raw }; // legacy bare hash
  return { view: 'landing', screen: 'dashboard' };
}

/** Reads the current hash, silently normalizing a legacy bare hash to its
 * `#/app/...` home before resolving the route. */
function readRoute(): Route {
  const raw = stripHash(window.location.hash);
  const legacy = legacyRedirectTarget(raw);
  if (legacy) {
    window.history.replaceState(null, '', legacy);
    return parseRoute(stripHash(legacy));
  }
  return parseRoute(raw);
}

export function useRoute(): [Route, (screen: Screen) => void] {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (next: Screen) => {
    const target = appHash(next);
    if (window.location.hash !== target) {
      window.location.hash = target.slice(1); // assigning `.hash` re-adds the `#`
    }
    setRoute({ view: 'app', screen: next });
  };

  return [route, navigate];
}
