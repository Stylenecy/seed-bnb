import { describe, expect, it } from 'vitest';
import { stepOneShot } from './motion';

/**
 * Jsdom-free tests for `useOneShot`'s state machine (Task A review follow-up).
 * This project's vitest env is `node` — no DOM, no fake timers needed — so the
 * hook's transition rule is extracted into the pure `stepOneShot` and exercised
 * directly, the same "test the pure logic" pattern `lib/chart.ts` / the comic
 * geometry helpers use. Covers: skip-on-mount, fire-once-on-change, and inert
 * under reduced motion.
 */
describe('stepOneShot — useOneShot transition rule', () => {
  it('skips on mount: the first observed value equals the seeded prev, so it never fires', () => {
    // The hook seeds `prev` to the initial trigger; the first effect sees next === prev.
    expect(stepOneShot('rescue-1', 'rescue-1', false)).toEqual({ prev: 'rescue-1', fire: false });
    expect(stepOneShot(null, null, false)).toEqual({ prev: null, fire: false });
    expect(stepOneShot(0, 0, false)).toEqual({ prev: 0, fire: false });
  });

  it('fires once when the trigger changes to a new non-null value', () => {
    expect(stepOneShot(null, 'rescue-1', false)).toEqual({ prev: 'rescue-1', fire: true });
    expect(stepOneShot('rescue-1', 'rescue-2', false)).toEqual({ prev: 'rescue-2', fire: true });
    expect(stepOneShot(1, 2, false)).toEqual({ prev: 2, fire: true });
  });

  it('does not fire when the trigger changes to a null value (a cleared burst key)', () => {
    expect(stepOneShot('rescue-1', null, false)).toEqual({ prev: null, fire: false });
    expect(stepOneShot('rescue-1', undefined, false)).toEqual({ prev: undefined, fire: false });
  });

  it('is inert under reduced motion — it advances prev but never fires', () => {
    expect(stepOneShot(null, 'rescue-1', true)).toEqual({ prev: 'rescue-1', fire: false });
    expect(stepOneShot(1, 2, true)).toEqual({ prev: 2, fire: false });
  });

  it('does not re-fire while the trigger stays the same after firing', () => {
    const first = stepOneShot(null, 'rescue-1', false);
    expect(first.fire).toBe(true);
    // A re-render with the same trigger: prev is now 'rescue-1', next is 'rescue-1'.
    expect(stepOneShot(first.prev, 'rescue-1', false)).toEqual({ prev: 'rescue-1', fire: false });
  });

  it('advancing prev after an inert (reduced-motion) change means the next real change still fires', () => {
    // Simulate reduced motion flipping off between two distinct triggers: the
    // inert step still remembers the value, so a later change is a genuine change.
    const inert = stepOneShot(null, 'rescue-1', true);
    expect(inert).toEqual({ prev: 'rescue-1', fire: false });
    expect(stepOneShot(inert.prev, 'rescue-2', false)).toEqual({ prev: 'rescue-2', fire: true });
  });
});
