import { useState } from 'react';
import { isBackendMode } from '../lib/backend';
import type { Screen } from '../lib/router';
import { formatPercentBps, formatUsd } from '../lib/format';
import { strategyNameForTriggerBps } from '../lib/strategies';
import { selectProtectionRunway, useCerminStore } from '../store';
import { ActivityFeed } from '../components/ActivityFeed';
import { NavBar } from '../components/NavBar';
import { PrivacyBadge } from '../components/PrivacyBadge';
import { Toggle } from '../components/Toggle';
import { CoinBurst, ComicTag, InkCard, Mascot } from '../lib/comic';

interface VaultProps {
  onNavigate: (screen: Screen) => void;
}

/**
 * Gate for the top-up "Add" button, exported for tests. Any positive amount is
 * allowed; the mock-mode wallet cap does NOT apply in backend (live) mode —
 * there is no on-ledger wallet, TopUp just credits the vault on the ledger.
 * `backendMode` defaults to the build-time `isBackendMode()`; tests pass it
 * explicitly to drive both branches.
 */
export function isTopUpDisabled(amount: string, walletBalance: number, backendMode: boolean = isBackendMode()): boolean {
  const n = Number(amount);
  if (!(n > 0)) return true;
  return !backendMode && n > walletBalance;
}

/** Section header for the top-up / withdraw InkCards: a comic-tag label over a
 * Fraunces title, mirroring the Card eyebrow+title these replaced. */
function InkHead({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-4">
      <ComicTag size={16} rotate={-2} className="block">
        {label}
      </ComicTag>
      <h3 className="mt-2 font-display text-lg text-foreground">{title}</h3>
    </div>
  );
}

/**
 * Screen 4 — Shadow Vault, framed as your "war chest". Balance (privately
 * badged) in a hero InkCard with the vault illustration and a mascot reacting
 * to whether it's funded; top-up / withdraw as InkCards (a coin burst on a
 * successful top-up); the protection-runway sentence: "Your vault can absorb an
 * N% price drop" — N always comes from `selectProtectionRunway` (store.ts),
 * never re-derived here — and the quiet Coupon Sweep toggle (docs/03-ux.md §4;
 * hidden in backend mode, where the policy is fixed on the seeded ledger and
 * the store's setCouponSweep is a no-op). Also shows the active Guard Trigger
 * read-only, with its strategy name reverse-mapped from the bps via
 * `strategyNameForTriggerBps` (lib/strategies.ts) — a custom pick that doesn't
 * match a named preset simply reads "Custom". Changing the trigger still only
 * happens in the Borrow flow.
 */
export function Vault({ onNavigate }: VaultProps) {
  const state = useCerminStore((s) => s);
  const topUpVault = useCerminStore((s) => s.topUpVault);
  const withdrawVault = useCerminStore((s) => s.withdrawVault);
  const setCouponSweep = useCerminStore((s) => s.setCouponSweep);
  const { shadowVault, wallet, guardPolicy, activity } = state;

  const runway = selectProtectionRunway(state);
  const runwayPercent = Math.round(runway * 100);
  const funded = shadowVault.balance > 0;

  const [topUpAmount, setTopUpAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  // Coin burst on a successful top-up (bumped only when the top-up goes
  // through; the button gate guarantees success when it's clickable).
  const [topUpBurst, setTopUpBurst] = useState(0);

  function handleTopUp() {
    const amount = Number(topUpAmount);
    if (amount > 0) {
      topUpVault(amount);
      setTopUpAmount('');
      setTopUpBurst((n) => n + 1);
    }
  }

  function handleWithdraw() {
    const amount = Number(withdrawAmount);
    if (amount > 0) {
      withdrawVault(amount);
      setWithdrawAmount('');
    }
  }

  return (
    <div className="bg-cermin-atmosphere min-h-dvh">
      <div className="mx-auto max-w-6xl px-6 pt-10 pb-28 sm:pt-14 md:pb-14">
        <NavBar current="vault" onNavigate={onNavigate} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Hero: your war chest. Balance + runway on the left, the vault
                illustration and Cermin reacting to whether it's stocked on the
                right (stacks on mobile). */}
            <InkCard as="section">
              <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2.5">
                    <ComicTag size={18} rotate={-2}>
                      Your war chest
                    </ComicTag>
                    <PrivacyBadge />
                  </div>
                  <p className="text-xs tracking-wide text-foreground-faint">Balance</p>
                  <p className="mt-1 font-display text-4xl text-foreground tabular-nums">{formatUsd(shadowVault.balance)}</p>

                  {/* The single most reassuring sentence in the product (docs/03-ux.md). */}
                  <p className="mt-5 max-w-md text-sm leading-relaxed text-foreground-muted">
                    Your vault can absorb a <span className="font-semibold text-sage">{runwayPercent}%</span> price drop
                    before I&apos;d need more than what&apos;s in here.
                  </p>

                  <div className="mt-5 flex max-w-md items-center justify-between border-t border-hairline pt-4">
                    <span className="text-xs tracking-wide text-foreground-faint">Guard Trigger</span>
                    <span className="text-sm font-medium text-foreground tabular-nums">
                      {formatPercentBps(guardPolicy.triggerRatioBps)} ·{' '}
                      {strategyNameForTriggerBps(guardPolicy.triggerRatioBps)}
                    </span>
                  </div>
                </div>

                {/* Illustrated aside: the private-vault panel + Cermin's read on
                    the balance. The mascot art carries a baked ink-dark
                    background faded by a radial mask, so it sits cleanly on the
                    card surface in either theme. */}
                <div className="shrink-0 sm:w-56">
                  <div className="overflow-hidden rounded-2xl border-2 border-ink-line">
                    <img
                      src="/comic/s3-vault.webp"
                      alt="A vault of shadow money only you control"
                      width={1376}
                      height={768}
                      loading="lazy"
                      decoding="async"
                      className="h-28 w-full object-cover"
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2.5">
                    <Mascot pose={funded ? 'shield' : 'watch'} size={52} className="shrink-0" />
                    <p className="text-sm leading-relaxed text-foreground-muted">
                      {funded ? "I'm ready." : 'Fund me and I can act.'}
                    </p>
                  </div>
                </div>
              </div>
            </InkCard>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InkCard className="relative">
                <InkHead label="Top up" title="Add funds" />
                {/* Live (backend) mode has no on-ledger wallet — TopUp just credits
                    the vault on the ledger — so don't gate on (or show) a wallet
                    balance that is always 0 there. Mock mode keeps the wallet flow
                    byte-identical (the demo parachute). */}
                {isBackendMode() ? (
                  <p className="text-xs text-foreground-faint">Add funds to your Shadow Vault on the ledger.</p>
                ) : (
                  <p className="text-xs text-foreground-faint">Wallet balance: {formatUsd(wallet.balance)}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    placeholder="0.00"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-hairline-strong bg-surface-sunken px-3 py-2 text-base text-foreground outline-none focus:border-gold sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleTopUp}
                    disabled={isTopUpDisabled(topUpAmount, wallet.balance)}
                    className="flex min-h-11 shrink-0 items-center rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-on-gold transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
                {!isBackendMode() && (
                  <button
                    type="button"
                    onClick={() => setTopUpAmount(String(wallet.balance))}
                    className="flex min-h-11 items-center text-xs text-foreground-faint hover:text-foreground-muted"
                  >
                    Use full wallet balance
                  </button>
                )}
                <CoinBurst trigger={topUpBurst === 0 ? null : topUpBurst} seed="vault" />
              </InkCard>

              <InkCard>
                <InkHead label="Withdraw" title="Take funds out" />
                <p className="text-xs text-foreground-faint">Vault balance: {formatUsd(shadowVault.balance)}</p>
                <div className="mt-4 flex gap-2">
                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-hairline-strong bg-surface-sunken px-3 py-2 text-base text-foreground outline-none focus:border-gold sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleWithdraw}
                    disabled={!(Number(withdrawAmount) > 0) || Number(withdrawAmount) > shadowVault.balance}
                    className="flex min-h-11 shrink-0 items-center rounded-xl border border-hairline-strong px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-overlay disabled:opacity-40"
                  >
                    Withdraw
                  </button>
                </div>
                <p className="mt-2 text-xs text-foreground-faint">
                  Less in your vault means a smaller price drop it can absorb.
                </p>
              </InkCard>
            </div>

            {/* Coupon Sweep lives here too (not only in the Borrow flow) so
                the self-repaying mode can be flipped any time. Same quiet
                block as the Borrow flow's step 2. */}
            {!isBackendMode() && (
              <InkCard className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Coupon Sweep</p>
                  <p className="mt-1 text-xs leading-relaxed text-foreground-faint">
                    When your Treasury pays its quarterly coupon, I&apos;ll send it straight into your loan instead of
                    your wallet — a loan that pays itself off.
                  </p>
                </div>
                <Toggle checked={guardPolicy.couponSweep} onChange={setCouponSweep} label="Coupon Sweep" />
              </InkCard>
            )}
          </div>

          <div className="lg:col-span-1">
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
