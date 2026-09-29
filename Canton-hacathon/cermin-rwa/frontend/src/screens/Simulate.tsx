import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { isBackendMode } from '../lib/backend';
import type { Screen } from '../lib/router';
import { formatPercentBps, formatUsd } from '../lib/format';
import { selectCollateralValue, selectHealthRatioBps, selectHealthStatus, useCerminStore } from '../store';
import { ActivityFeed } from '../components/ActivityFeed';
import { HealthRing } from '../components/HealthRing';
import { NavBar } from '../components/NavBar';
import { ComicTag, InkCard, SavedBurst, useOneShot } from '../lib/comic';

// How long the ring is allowed to sit in the amber/terracotta zone before I
// "notice" and step in — long enough for judges to see the dip, short
// enough to still read as automatic, not manual.
const GUARD_REACTION_MS = 900;

interface SimulateProps {
  onNavigate: (screen: Screen) => void;
}

/**
 * A compact "CRASH!" onomatopoeia that pops near the ring the moment the Health
 * Ratio enters the action zone (one-shot per breach entry). Driven by the
 * comic kit's `useOneShot`, so it skips on mount, fires once per genuinely-new
 * breach, and no-ops entirely under `prefers-reduced-motion`.
 */
function CrashPop({ trigger }: { trigger: unknown }) {
  const active = useOneShot(trigger, 900);
  if (!active) return null;
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute -top-2 -right-2 z-20"
      initial={{ scale: 0.3, rotate: -14, opacity: 0 }}
      animate={{ scale: [0.3, 1.2, 1, 1], rotate: [-14, -8, -8, -8], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 0.9, times: [0, 0.3, 0.7, 1], ease: 'easeOut' }}
    >
      <ComicTag size={30} color="var(--color-terracotta)">
        Crash!
      </ComicTag>
    </motion.div>
  );
}

/**
 * Screen 5 — Simulation mode, framed as the comic "Market Lab" (docs/03-ux.md,
 * docs/04-scope.md §Demo). Slide the price down; when the Health Ratio
 * crosses the Guard Trigger, a "CRASH!" pops near the ring and GuardRepay fires
 * on its own a beat later — ring dips to terracotta, then the feed prints the
 * rescue sentence, then the ring returns to green with a "SAVED!" burst.
 * Entirely client-side: this screen only ever calls `setPrice` / `guardRepay` /
 * `payCoupon` / `resetDemo` on the store — the guard and coupon math lives in
 * `lib/health.ts` / the store, never duplicated here.
 */
export function Simulate({ onNavigate }: SimulateProps) {
  const state = useCerminStore((s) => s);
  const setPrice = useCerminStore((s) => s.setPrice);
  const resetDemo = useCerminStore((s) => s.resetDemo);
  const payCoupon = useCerminStore((s) => s.payCoupon);
  const { collateral, loan, shadowVault, guardPolicy, activity } = state;

  const collateralValue = selectCollateralValue(state);
  const healthRatioBps = selectHealthRatioBps(state);
  const status = selectHealthStatus(state);
  const price = collateral.price;

  const reactionTimer = useRef<number | null>(null);

  // Fire the SAVED! celebration once per genuinely-new rescue event — keyed by
  // the newest rescue-kind item's id (null when there are none), exactly the
  // Dashboard pattern; the kit's one-shot gate refuses to replay on re-render
  // or on mount.
  const latestRescueId = activity.find((item) => item.kind === 'rescue')?.id ?? null;

  // "CRASH!" pop: bump a key once each time the status ENTERS the action zone
  // (a fresh breach), so the onomatopoeia fires on the breach edge, not on
  // every price tick while already breached.
  const prevStatus = useRef(status);
  const [breachKey, setBreachKey] = useState(0);
  useEffect(() => {
    const was = prevStatus.current;
    prevStatus.current = status;
    if (status === 'action' && was !== 'action') {
      setBreachKey((n) => n + 1);
    }
  }, [status]);

  // The rescue moment: wait a beat after the ratio dips below the trigger,
  // then let the store's own GuardRepay fire. Re-runs on every price tick so
  // a still-moving slider keeps resetting the "notice" clock (debounced),
  // and stops on its own once the ratio is back above the trigger.
  useEffect(() => {
    if (reactionTimer.current !== null) {
      window.clearTimeout(reactionTimer.current);
      reactionTimer.current = null;
    }
    if (status === 'action') {
      reactionTimer.current = window.setTimeout(() => {
        useCerminStore.getState().guardRepay();
        reactionTimer.current = null;
      }, GUARD_REACTION_MS);
    }
    return () => {
      if (reactionTimer.current !== null) window.clearTimeout(reactionTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, price]);

  function jumpTo(next: number) {
    setPrice(Math.round(next * 100) / 100);
  }

  return (
    <div className="bg-cermin-atmosphere min-h-dvh">
      <div className="mx-auto max-w-6xl px-6 pt-10 pb-28 sm:pt-14 md:pb-14">
        <NavBar current="simulate" onNavigate={onNavigate} />

        <div className="mb-6">
          <ComicTag size={28} rotate={-2} className="block">
            Market Lab
          </ComicTag>
          <p className="mt-1 text-sm text-foreground-muted">
            Slide the price and watch me react — nothing here touches the real ledger.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <InkCard as="section" noPadding className="relative px-6 py-10 sm:px-10">
              {/* The rescue celebration lands once the store's GuardRepay adds a
                  fresh rescue event to the feed. */}
              <SavedBurst trigger={latestRescueId} />
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="relative">
                  <HealthRing healthRatioBps={healthRatioBps} triggerRatioBps={guardPolicy.triggerRatioBps} status={status} />
                  <CrashPop trigger={breachKey === 0 ? null : breachKey} />
                </div>
                <p className="max-w-sm text-sm text-foreground-muted">
                  {status === 'action'
                    ? "Your ratio just dipped below my trigger. I'm about to step in..."
                    : "Slide the price and watch me react in real time — this doesn't touch the real ledger."}
                </p>
              </div>
            </InkCard>

            <InkCard as="section">
              <div className="mb-4">
                <ComicTag size={16} rotate={-2} className="block">
                  Simulation · not on ledger
                </ComicTag>
                <h3 className="mt-2 font-display text-lg text-foreground">Market simulator</h3>
              </div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="price-slider" className="text-sm text-foreground-muted">
                  {collateral.instrumentId} price
                </label>
                <span className="font-display text-2xl text-foreground tabular-nums">
                  ${price.toFixed(2)}{' '}
                  <span className="text-sm text-foreground-faint">({formatUsd(collateralValue)} collateral)</span>
                </span>
              </div>
              <input
                id="price-slider"
                type="range"
                min={0.5}
                max={1.3}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="mt-3 w-full accent-terracotta"
              />
              <div className="mt-1 flex justify-between text-xs text-foreground-faint">
                <span>$0.50</span>
                <span>$1.30</span>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => resetDemo()}
                  className="flex min-h-11 items-center rounded-full border border-hairline-strong px-4 py-2 text-sm text-foreground-muted transition-colors hover:bg-surface-overlay"
                >
                  Reset demo
                </button>
                <button
                  type="button"
                  onClick={() => jumpTo(price * 0.9)}
                  className="flex min-h-11 items-center rounded-full border border-hairline-strong px-4 py-2 text-sm text-foreground-muted transition-colors hover:bg-surface-overlay"
                >
                  Drop price 10%
                </button>
                <button
                  type="button"
                  onClick={() => jumpTo(0.76)}
                  className="flex min-h-11 items-center rounded-full border border-hairline-strong px-4 py-2 text-sm text-foreground-muted transition-colors hover:bg-surface-overlay"
                >
                  Run the rescue scenario ($0.76)
                </button>
                {/* The coupon beat (docs/04-scope.md demo step 4): with Coupon
                    Sweep on (Vault screen), outstanding shrinks by 112.50 and
                    the feed prints the sweep sentence — all store math. Hidden
                    in backend mode, where the store's payCoupon is a no-op and
                    the coupon is issued on-ledger via payDemoCoupon instead. */}
                {!isBackendMode() && (
                  <button
                    type="button"
                    onClick={() => payCoupon()}
                    className="flex min-h-11 items-center rounded-full border border-hairline-strong px-4 py-2 text-sm text-foreground-muted transition-colors hover:bg-surface-overlay"
                  >
                    Fast-forward to coupon date
                  </button>
                )}
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-hairline pt-5 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-foreground-faint">Health Ratio</dt>
                  <dd className="mt-0.5 font-display text-lg text-foreground tabular-nums">
                    {formatPercentBps(healthRatioBps)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-foreground-faint">Outstanding</dt>
                  <dd className="mt-0.5 font-display text-lg text-foreground tabular-nums">{formatUsd(loan.outstanding)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-foreground-faint">Shadow Vault</dt>
                  <dd className="mt-0.5 font-display text-lg text-foreground tabular-nums">
                    {formatUsd(shadowVault.balance)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-foreground-faint">Guard Trigger</dt>
                  <dd className="mt-0.5 font-display text-lg text-foreground tabular-nums">
                    {formatPercentBps(guardPolicy.triggerRatioBps)}
                  </dd>
                </div>
              </dl>
            </InkCard>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-1">
            {/* A small illustrated aside on desktop only — Cermin meeting one
                dip in the market. Decorative, so it's kept out of the mobile
                flow where vertical space is precious. */}
            <div className="hidden overflow-hidden rounded-2xl border-2 border-ink-line lg:block">
              <img
                src="/comic/h3-onedip.webp"
                alt="Cermin meeting a single dip in the market with a raised shield"
                width={1376}
                height={768}
                loading="lazy"
                decoding="async"
                className="aspect-[16/9] w-full object-cover"
              />
            </div>
            <InkCard className="lg:sticky lg:top-10">
              <h2 className="mb-4">
                <ComicTag size={20} rotate={-2} className="block">
                  Cermin&apos;s notes
                </ComicTag>
              </h2>
              <ActivityFeed items={activity} />
            </InkCard>
          </div>
        </div>
      </div>
    </div>
  );
}
