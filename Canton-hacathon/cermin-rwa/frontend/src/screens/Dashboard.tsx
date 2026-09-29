import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { HealthStatus } from '../lib/health';
import type { Screen } from '../lib/router';
import { isBackendMode } from '../lib/backend';
import { formatBpsAsRate, formatDate, formatNumber, formatPercentBps, formatPrice, formatUsd } from '../lib/format';
import { MAX_LTV, strategyNameForTriggerBps } from '../lib/strategies';
import {
  selectCollateralValue,
  selectDefensePrice,
  selectHealthRatioBps,
  selectHealthStatus,
  selectNextCouponDate,
  selectProtectionFloorPrice,
  selectProtectionRunway,
  useCerminStore,
} from '../store';
import { ActivityFeed } from '../components/ActivityFeed';
import { HealthRing } from '../components/HealthRing';
import { NavBar } from '../components/NavBar';
import { OnboardingStepper } from '../components/OnboardingStepper';
import { PriceChart } from '../components/PriceChart';
import { PrivacyBadge } from '../components/PrivacyBadge';
import { CoinBurst, ComicTag, InkCard, Mascot, SavedBurst, type MascotPose } from '../lib/comic';

// The comic status stamp that pops over the hero ring — a first-person, warm
// reaction from Cermin, not a stoplight alarm.
const STATUS_STAMP: Record<HealthStatus, { label: string; color: string }> = {
  protected: { label: 'PROTECTED!', color: 'var(--color-sage)' },
  guarded: { label: 'GUARDED.', color: 'var(--color-amber)' },
  action: { label: 'ACTION!', color: 'var(--color-terracotta)' },
};

// The mascot companion beside the ring — pose + one line reacting to status.
const STATUS_MASCOT: Record<HealthStatus, { pose: MascotPose; copy: string }> = {
  protected: { pose: 'watch', copy: "All quiet. I'm watching your position so you don't have to." },
  guarded: { pose: 'watch', copy: "Keeping a closer eye now — you're still in a safe range." },
  action: { pose: 'shield', copy: "I'm stepping in. Your Shadow Vault has this covered." },
};

/** A number that gives a tiny squash-stretch pop when its value CHANGES (never
 * on first mount, so the dashboard doesn't bounce on load). Reduced motion is
 * honored globally via the App's `MotionConfig reducedMotion="user"`. */
function PopValue({ value, className = '' }: { value: string; className?: string }) {
  const [pulse, setPulse] = useState(0);
  const prev = useRef(value);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      prev.current = value;
      return;
    }
    if (prev.current !== value) {
      prev.current = value;
      setPulse((p) => p + 1);
    }
  }, [value]);

  return (
    <motion.span
      key={pulse}
      className={className}
      animate={pulse === 0 ? undefined : { scale: [0.82, 1.09, 1] }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{ display: 'inline-block' }}
    >
      {value}
    </motion.span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs tracking-wide text-foreground-faint">{label}</p>
      <p className="mt-0.5 font-display text-xl text-foreground tabular-nums">
        <PopValue value={value} />
      </p>
    </div>
  );
}

/** InkCard header: a comic-tag section label (+ optional Fraunces title / action
 * slot), mirroring the plain Card's eyebrow+title so the stat cards keep their
 * information design while gaining the comic voice. */
function CardHead({
  label,
  title,
  action,
  rotate = -2,
}: {
  label: string;
  title?: string;
  action?: ReactNode;
  rotate?: number;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
      <div>
        <ComicTag size={17} rotate={rotate} className="block">
          {label}
        </ComicTag>
        {title && <h3 className="mt-2 font-display text-lg text-foreground">{title}</h3>}
      </div>
      {action}
    </div>
  );
}

function StatusStamp({ status }: { status: HealthStatus }) {
  const { label, color } = STATUS_STAMP[status];
  return (
    <motion.div
      key={status}
      initial={{ scale: 0.5, rotate: -6 }}
      animate={{ scale: [0.5, 1.18, 0.95, 1], rotate: [-6, -3, -3, -3] }}
      transition={{ duration: 0.6, times: [0, 0.4, 0.72, 1], ease: 'easeOut' }}
    >
      <ComicTag size={36} color={color} ariaHidden>
        {label}
      </ComicTag>
    </motion.div>
  );
}

interface DashboardProps {
  onNavigate: (screen: Screen) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const state = useCerminStore((s) => s);
  const { collateral, loan, shadowVault, guardPolicy, activity } = state;

  // Backend mode only: a freshly-connected user with no loan yet lands on the
  // empty state (claim the faucet, then borrow). Mock mode always has a loan, so
  // this branch is never taken there (Mode A unchanged).
  if (isBackendMode() && !state.hasLoan) {
    return <EmptyDashboard onNavigate={onNavigate} />;
  }

  const collateralValue = selectCollateralValue(state);
  const healthRatioBps = selectHealthRatioBps(state);
  const status = selectHealthStatus(state);
  const nextCouponDate = selectNextCouponDate();
  const floorPrice = selectProtectionFloorPrice(state);
  const runwayPercent = Math.round(selectProtectionRunway(state) * 100);
  const defensePriceValue = selectDefensePrice(state);
  const mascot = STATUS_MASCOT[status];

  // Fire the SAVED! celebration once per genuinely-new rescue event: key the
  // burst by the newest rescue-kind item's id (null when there are none), and
  // the kit's one-shot gate refuses to replay on re-render or on mount.
  const latestRescueId = activity.find((item) => item.kind === 'rescue')?.id ?? null;

  // "Borrowed against mUST N%" progress bar (Collateral card): today's LTV
  // (outstanding / collateral value) against the system-wide max LTV (~83%,
  // MAX_LTV) — how much of the never-lower-than-Aggressive ceiling is used.
  const ltv = collateralValue > 0 ? loan.outstanding / collateralValue : 0;
  const ltvPercent = Math.round(ltv * 100);
  const ltvBarFraction = Math.max(0, Math.min(1, ltv / MAX_LTV));

  return (
    <div className="bg-cermin-atmosphere min-h-dvh">
      <div className="mx-auto max-w-6xl px-6 pt-10 pb-28 sm:pt-14 md:pb-14">
        <NavBar current="dashboard" onNavigate={onNavigate} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Hero: the one number that rules the screen, with Cermin standing
                beside it as your companion, a status stamp that pops when the
                situation changes, and the SAVED! burst when a rescue lands. */}
            <InkCard as="section" noPadding className="relative px-6 py-9 sm:px-10">
              <SavedBurst trigger={latestRescueId} />
              <div className="flex flex-col items-center gap-6">
                <StatusStamp status={status} />
                <div className="flex flex-col items-center gap-7 sm:flex-row sm:items-center sm:justify-center sm:gap-10">
                  <HealthRing healthRatioBps={healthRatioBps} triggerRatioBps={guardPolicy.triggerRatioBps} status={status} />
                  <div className="flex max-w-[15rem] flex-col items-center gap-3 text-center sm:items-start sm:text-left">
                    <Mascot pose={mascot.pose} size={116} loading="eager" />
                    <p className="text-sm leading-relaxed text-foreground-muted">{mascot.copy}</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 border-t border-hairline pt-6">
                <Stat label="Protection floor" value={floorPrice > 0 ? formatPrice(floorPrice) : '—'} />
                <Stat label="Drop buffer" value={`${runwayPercent}%`} />
              </div>
            </InkCard>

            {/* Price chart, full-width: where the price is, where Cermin
                defends, where its own protection runs out. The chart owns
                its own state-aware caption underneath (Task 20 — coincident
                lines / breach / grace-period explanation, whichever applies). */}
            <InkCard as="section">
              <div className="mb-4">
                <ComicTag size={18} rotate={-2} className="block">
                  The line I defend
                </ComicTag>
              </div>
              <PriceChart
                points={state.priceHistory}
                defensePrice={defensePriceValue}
                floorPrice={floorPrice}
                vaultBalance={shadowVault.balance}
                status={status}
              />
            </InkCard>

            {/* Collateral, Loan, Strategy. */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <InkCard>
                <CardHead label="Collateral" title={collateral.instrumentId} />
                <div className="flex flex-col gap-4">
                  <Stat label="Face value" value={`${formatNumber(collateral.faceValue, 0)} mUST`} />
                  <Stat label="Current value" value={formatUsd(collateralValue)} />
                  <Stat label="Next coupon" value={formatDate(nextCouponDate)} />
                </div>
                <div className="mt-5">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-foreground-faint">Borrowed against mUST</span>
                    <span className="font-medium text-foreground tabular-nums">{ltvPercent}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-overlay">
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{ width: `${Math.round(ltvBarFraction * 100)}%` }}
                    />
                  </div>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-foreground-faint">
                  Locked · never sold. Its yield can pay down your loan for you.
                </p>
              </InkCard>

              <InkCard>
                <CardHead label="Loan" />
                <div className="flex flex-col gap-4">
                  <Stat label="Outstanding" value={formatUsd(loan.outstanding)} />
                  <Stat label="Rate" value={`${formatBpsAsRate(loan.rateBps)} APR`} />
                  <Stat
                    label={isBackendMode() ? 'Unlocked mUST' : 'Spendable'}
                    value={isBackendMode() ? `${formatNumber(state.mustBalance, 0)} mUST` : formatUsd(state.wallet.balance)}
                  />
                </div>
                <p className="mt-5 text-xs leading-relaxed text-foreground-faint">
                  Borrowed against your collateral. I keep it healthy so you never hear from a liquidator.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('borrow')}
                  className="mt-2 -ml-1 inline-flex min-h-11 items-center px-1 text-xs font-semibold tracking-wide text-gold-soft hover:text-gold"
                >
                  Borrow more →
                </button>
              </InkCard>

              <InkCard>
                <CardHead label="Strategy" title={strategyNameForTriggerBps(guardPolicy.triggerRatioBps)} action={<PrivacyBadge />} />
                <div className="flex flex-col gap-2.5 text-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-hairline pb-2.5">
                    <span className="text-foreground-faint">Shadow Vault</span>
                    <span className="font-display text-lg text-foreground tabular-nums">
                      <PopValue value={formatUsd(shadowVault.balance)} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-faint">Defend below</span>
                    <span className="font-medium text-foreground tabular-nums">{formatPercentBps(guardPolicy.triggerRatioBps)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-faint">Restore to</span>
                    <span className="font-medium text-foreground tabular-nums">{formatPercentBps(guardPolicy.targetRatioBps)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-faint">Max per rescue</span>
                    <span className="font-medium text-foreground tabular-nums">{formatUsd(guardPolicy.maxRepayPerEvent)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-faint">Coupon Sweep</span>
                    <span className={`font-medium ${guardPolicy.couponSweep ? 'text-sage' : 'text-foreground-faint'}`}>
                      {guardPolicy.couponSweep ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline-strong px-3 py-1 text-[11px] text-foreground-faint">
                    <span className={`h-1.5 w-1.5 rounded-full ${isBackendMode() ? 'bg-sage' : 'bg-foreground-faint'}`} />
                    {isBackendMode() ? 'Guard Agent · watching every 5s' : 'Simulation'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('vault')}
                    className="inline-flex min-h-11 items-center px-1 text-xs font-semibold tracking-wide text-gold-soft hover:text-gold"
                  >
                    Manage vault →
                  </button>
                </div>
              </InkCard>
            </div>
          </div>

          {/* Cermin's notes: the story stream, not a transaction log. */}
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

/**
 * Empty-state dashboard for a freshly-connected self-service user (backend mode):
 * no mUST yet -> a faucet CTA; has mUST but no loan -> a borrow CTA. Cermin
 * greets you as an illustrated comic teaching moment (mascot + the "post your
 * collateral" panel) with the existing CTA buttons.
 */
function EmptyDashboard({ onNavigate }: DashboardProps) {
  const mustBalance = useCerminStore((s) => s.mustBalance);
  const claimFaucet = useCerminStore((s) => s.claimFaucet);
  const activity = useCerminStore((s) => s.activity);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Faucet celebration key: bumped on a successful claim so the CoinBurst fires
  // exactly once per claim (deferred from Task A — the kit component was already
  // built and tested; this just wires it). The one-shot gate no-ops on mount
  // and under reduced motion, so a starting value of 0 never sprays coins.
  const [claimBurst, setClaimBurst] = useState(0);

  const hasFunds = mustBalance > 0;

  async function claim() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await claimFaucet();
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'The faucet is unavailable right now.');
      return;
    }
    setClaimBurst((n) => n + 1);
  }

  return (
    <div className="bg-cermin-atmosphere min-h-dvh">
      <div className="mx-auto max-w-6xl px-6 pt-10 pb-28 sm:pt-14 md:pb-14">
        <NavBar current="dashboard" onNavigate={onNavigate} />

        <OnboardingStepper current={hasFunds ? 'borrow' : 'faucet'} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <InkCard as="section" noPadding className="overflow-hidden">
              <div className="relative">
                <img
                  src="/comic/s1-post.webp"
                  alt="A borrower placing a glowing tokenized Treasury seal on a marble bank counter"
                  width={1376}
                  height={768}
                  loading="eager"
                  decoding="async"
                  className="h-40 w-full object-cover sm:h-52"
                />
                <div className="absolute -bottom-6 left-6">
                  <Mascot pose="watch" size={96} loading="eager" />
                </div>
              </div>
              <div className="relative px-6 pt-10 pb-10 text-center sm:px-10">
                {/* The faucet moment: gold coins spray on a successful claim.
                    Mounted at the card-content level (not inside the !hasFunds
                    branch) so it survives the claim flipping the card to its
                    "funded & ready" state — the burst celebrates over it. */}
                <CoinBurst trigger={claimBurst === 0 ? null : claimBurst} seed="faucet" />
                {!hasFunds ? (
                  <>
                    <ComicTag size={22} rotate={-2} color="var(--color-gold)">
                      Let&apos;s get you started
                    </ComicTag>
                    <h1 className="mt-3 font-display text-3xl text-foreground">Welcome. Let&apos;s fund your account.</h1>
                    <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-foreground-muted">
                      Claim some test mUST — a mock tokenized Treasury — and you&apos;ll have collateral to borrow
                      against. It&apos;s free, and it&apos;s all on BNB Chain testnet.
                    </p>
                    {error && <p className="mt-4 text-sm text-terracotta">{error}</p>}
                    <button
                      type="button"
                      onClick={claim}
                      disabled={busy}
                      className="mt-8 inline-flex min-h-12 items-center rounded-full bg-gold px-7 py-3 text-sm font-semibold text-on-gold transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      {busy ? 'Minting on BNB Chain…' : 'Claim 10,000 test mUST'}
                    </button>
                  </>
                ) : (
                  <>
                    <ComicTag size={22} rotate={-2} color="var(--color-sage)">
                      Funded &amp; ready
                    </ComicTag>
                    {claimBurst > 0 && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-sage">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M5 12.5 10 17l9-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Confirmed on BNB Chain
                      </p>
                    )}
                    <h1 className="mt-3 font-display text-3xl text-foreground">You&apos;re funded and ready.</h1>
                    <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-foreground-muted">
                      You hold <span className="font-semibold text-foreground">{formatNumber(mustBalance, 0)} mUST</span>{' '}
                      ({formatUsd(mustBalance)}). Borrow against it and I&apos;ll protect your position from liquidation
                      automatically.
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate('borrow')}
                      className="mt-8 inline-flex min-h-12 items-center rounded-full bg-gold px-7 py-3 text-sm font-semibold text-on-gold transition-opacity hover:opacity-90"
                    >
                      Borrow against your mUST
                    </button>
                  </>
                )}
              </div>
            </InkCard>
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
