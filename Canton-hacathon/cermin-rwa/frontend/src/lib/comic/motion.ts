import { useEffect, useRef, useState } from 'react';

/**
 * Reduced-motion detection for the comic kit's JS-driven celebrations
 * (CoinBurst / SavedBurst) and the mascot bob. The global CSS in index.css
 * already neutralizes CSS transitions/animations under
 * `prefers-reduced-motion: reduce`, but a JS one-shot that mounts particles
 * and unmounts them on a timer isn't a CSS transition — it must check the
 * preference itself and no-op. `prefersReducedMotion()` is the pure read
 * (unit-tested via a matchMedia stub); the hook subscribes so a mid-session
 * OS change is respected.
 */

const QUERY = '(prefers-reduced-motion: reduce)';

/** True when the user asked for reduced motion. Safe in SSR / node (returns
 * false when `window`/`matchMedia` is unavailable — the render-smoke path). */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(QUERY).matches;
}

/** React hook wrapper: re-renders if the OS preference flips mid-session. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(QUERY);
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

export interface OneShotStep {
  /** The value `useOneShot` should remember as "last seen" after this step. */
  prev: unknown;
  /** Whether the celebration should fire on this step. */
  fire: boolean;
}

/**
 * Pure state-machine step for `useOneShot`, extracted so the skip-on-mount /
 * fire-once-on-change / inert-under-reduced-motion rules can be unit-tested
 * without a DOM (this project's vitest env is `node`). Given the last-seen
 * trigger, the incoming trigger, and the reduced-motion preference, it returns
 * the next remembered value and whether the burst fires:
 *   - unchanged trigger        -> remember it, never fire (covers mount, where
 *                                 the hook seeds `prev` to the initial trigger);
 *   - changed to a null value  -> remember it, never fire (a cleared trigger);
 *   - changed under reduced m. -> remember it, never fire (celebration no-ops);
 *   - changed to a new non-null value -> remember it, fire once.
 */
export function stepOneShot(prev: unknown, next: unknown, reduced: boolean): OneShotStep {
  if (next === prev) return { prev, fire: false };
  return { prev: next, fire: !reduced && next != null };
}

/**
 * One-shot celebration gate. Returns `true` for `durationMs` each time
 * `trigger` CHANGES to a new non-null value — never on the initial mount (so a
 * dashboard that loads with an old rescue already in the feed doesn't replay
 * the burst) and never under reduced motion (the celebration simply no-ops).
 * Drives `CoinBurst` / `SavedBurst`: pass the rescue-event id as `trigger` and
 * the burst fires exactly once per genuinely-new event. The transition rule
 * lives in the pure `stepOneShot` above (unit-tested); this hook is the thin
 * React wrapper that owns the timer.
 */
export function useOneShot(trigger: unknown, durationMs: number): boolean {
  const reduced = usePrefersReducedMotion();
  const prev = useRef(trigger);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const step = stepOneShot(prev.current, trigger, reduced);
    prev.current = step.prev;
    if (!step.fire) return;
    setActive(true);
    const id = setTimeout(() => setActive(false), durationMs);
    return () => clearTimeout(id);
  }, [trigger, reduced, durationMs]);

  return active;
}
