import { useEffect, useState, type ReactNode } from 'react';
import { isBackendMode } from '../lib/backend';
import {
  computeHealthRatioBps,
  healthStatus,
  maxOutstandingForRatioBps,
  STATUS_LABEL,
  targetBpsForTriggerBps,
} from '../lib/health';
import {
  buildStrategyLiveCopy,
  CUSTOM_TRIGGER_MAX_BPS,
  CUSTOM_TRIGGER_MIN_BPS,
  CUSTOM_TRIGGER_STEP_BPS,
  STRATEGIES,
  STRATEGY_TRIGGER_BPS,
  strategyIdForTriggerBps,
  strategyNameForTriggerBps,
  type Strategy,
  type StrategyId,
} from '../lib/strategies';
import type { Screen } from '../lib/router';
import { formatNumber, formatPercentBps, formatUsd } from '../lib/format';
import { selectCollateralValue, useCerminStore } from '../store';
import { NavBar } from '../components/NavBar';
import { Toggle } from '../components/Toggle';
import { CoinBurst, ComicTag, InkCard, Mascot, SpeechBubble, usePrefersReducedMotion } from '../lib/comic';

// The three wizard steps, as comic-tag crumbs across the top (numeral + label).
// Bangers-cased by ComicTag; the copy itself never changes the flow — the store
// still only sees the step index.
const STEP_LABELS = ['1 Amount', '2 Strategy', '3 Confirm'];

interface BorrowFlowProps {
  onNavigate: (screen: Screen) => void;
}

/**
 * Screen 3 — Borrow flow. Max 3 steps per docs/03-ux.md: (1) loan amount
 * against your existing collateral, with a live Health Ratio preview and
 * the "what if price drops 10%?" line; (2) Guard Trigger strategy cards +
 * Coupon Sweep; (3) confirm. Nothing is written to the store until the
 * final confirm — all preview math reuses the same pure functions the
 * store uses (`computeHealthRatioBps` / `healthStatus`), never re-derived
 * here.
 *
 * Guard Trigger step: named strategy cards (lib/strategies.ts is the one
 * source of truth for strategy -> bps, Amendment 4) replace the old raw
 * percent chips. Picking a card is just a friendlier way to arrive at a
 * `triggerBps` number — the store still only ever sees that number via
 * `setGuardTrigger`, unchanged.
 */
export function BorrowFlow({ onNavigate }: BorrowFlowProps) {
  const state = useCerminStore((s) => s);
  const borrow = useCerminStore((s) => s.borrow);
  const setGuardTrigger = useCerminStore((s) => s.setGuardTrigger);
  const setCouponSweep = useCerminStore((s) => s.setCouponSweep);
  const originateLoan = useCerminStore((s) => s.originateLoan);

  const collateralValue = selectCollateralValue(state);
  const { collateral, loan, guardPolicy } = state;
  // Backend mode originates a REAL loan (locks collateral, creates Loan +
  // GuardPolicy + ShadowVault). It is single-loan per borrower, so a user who
  // already has one is sent to a short "you're already borrowing" state.
  const backendOriginate = isBackendMode();
  const alreadyBorrowing = backendOriginate && state.hasLoan;

  const reduced = usePrefersReducedMotion();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Confirm celebration: while `finishing` is true a brief success card with a
  // coin burst covers the screen, then we navigate to the dashboard as today.
  // This also guards against a double-submit and, crucially, avoids re-rendering
  // the live wizard after the store mutation (which would double-count the
  // just-applied borrow amount into a false "blocked" preview).
  const [finishing, setFinishing] = useState(false);
  const [step, setStep] = useState(0);
  const [borrowAmount, setBorrowAmount] = useState(0);
  // Opens on the card matching the current policy — for a fresh loan that
  // is DEFAULT_STRATEGY_ID (Balanced): the seeded policy's trigger equals
  // the default strategy's trigger, an invariant pinned by a cross-check
  // test in store.test.ts so the two can't silently drift apart.
  const [strategyId, setStrategyId] = useState<StrategyId>(() => strategyIdForTriggerBps(guardPolicy.triggerRatioBps));
  // The recommended/current strategy starts expanded so a first-time user
  // sees why it's suggested without needing to tap anything first.
  const [expandedId, setExpandedId] = useState<StrategyId | null>(() => strategyIdForTriggerBps(guardPolicy.triggerRatioBps));
  const [customBps, setCustomBps] = useState(() =>
    Math.min(CUSTOM_TRIGGER_MAX_BPS, Math.max(CUSTOM_TRIGGER_MIN_BPS, guardPolicy.triggerRatioBps)),
  );
  const [couponSweep, setCouponSweepLocal] = useState(guardPolicy.couponSweep);

  const triggerBps = strategyId === 'custom' ? customBps : STRATEGY_TRIGGER_BPS[strategyId];

  // Slider cap: never let a new draw start below the lowest offered Guard
  // Trigger (Aggressive, 120%). The ratio math lives in lib/health.ts —
  // only the present-as-$50-steps rounding is UI concern here.
  const maxAdditional = Math.max(
    0,
    Math.floor((maxOutstandingForRatioBps(collateralValue, CUSTOM_TRIGGER_MIN_BPS) - loan.outstanding) / 50) * 50,
  );

  // Preview target follows the chosen trigger with the same restore spread
  // the store's setGuardTrigger applies on confirm (Amendment 3: the
  // Protected threshold IS the policy's target, not a fixed 150%).
  const targetBps = targetBpsForTriggerBps(triggerBps);

  const newOutstanding = loan.outstanding + borrowAmount;
  const newRatioBps = computeHealthRatioBps(collateralValue, newOutstanding);
  const newStatus = healthStatus(newRatioBps, triggerBps, targetBps);
  const drop10RatioBps = computeHealthRatioBps(collateralValue * 0.9, newOutstanding);
  const drop10Status = healthStatus(drop10RatioBps, triggerBps, targetBps);

  // A combination that would start below the chosen Guard Trigger can't be
  // confirmed — Cermin would have to step in on day one.
  const confirmBlocked = newStatus === 'action';

  // Success ending: a brief coin burst, then navigate to the dashboard exactly
  // as today. Under reduced motion the burst no-ops, so skip the hold and go
  // straight there. `finishing` keeps the Confirm button inert during the hold
  // so the mock-mode write can't be replayed by a second click. The 1s timer
  // lives in an effect with cleanup so navigating away during the hold can't
  // leave a stray callback that later hijacks navigation (review fix).
  useEffect(() => {
    if (!finishing) return;
    const t = window.setTimeout(() => onNavigate('dashboard'), 1000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishing]);

  function celebrateAndGo() {
    if (reduced) {
      onNavigate('dashboard');
      return;
    }
    setFinishing(true);
  }

  async function confirm() {
    if (confirmBlocked || submitting || finishing) return;
    if (backendOriginate) {
      // Live origination: one atomic self-service borrow (collateral is the
      // borrower's faucet mUST; principal is the chosen amount; the strategy card
      // becomes the real GuardPolicy trigger + couponSweep).
      if (borrowAmount <= 0) {
        setSubmitError('Choose an amount to borrow.');
        return;
      }
      setSubmitting(true);
      setSubmitError(null);
      const result = await originateLoan({
        collateralAmount: collateral.faceValue,
        principal: borrowAmount,
        triggerRatioBps: triggerBps,
        couponSweep,
      });
      setSubmitting(false);
      if (result.ok) {
        celebrateAndGo();
      } else {
        setSubmitError(result.error ?? 'Could not open your loan. Please try again.');
      }
      return;
    }
    if (borrowAmount > 0) borrow(borrowAmount);
    if (triggerBps !== guardPolicy.triggerRatioBps) setGuardTrigger(triggerBps);
    if (couponSweep !== guardPolicy.couponSweep) setCouponSweep(couponSweep);
    celebrateAndGo();
  }

  // Tapping an unselected card selects it and opens its details. Tapping the
  // already-selected card toggles its details closed/open without changing
  // the selection — either way, at most one card is expanded at a time, and
  // selecting is never itself an advance-the-step action (Continue is the
  // only primary CTA).
  function handleCardTap(id: StrategyId) {
    if (strategyId !== id) {
      setStrategyId(id);
      setExpandedId(id);
      return;
    }
    setExpandedId((cur) => (cur === id ? null : id));
  }

  // Success hold: a brief "loan opened" card with a coin burst, then navigate.
  // Rendered instead of the wizard so the store mutation the Confirm just made
  // can't flash a stale/double-counted preview behind the celebration.
  if (finishing) {
    return (
      <div className="bg-cermin-atmosphere min-h-dvh">
        <div className="mx-auto max-w-2xl px-6 pt-10 pb-28 sm:pt-14 md:pb-14">
          <NavBar current="borrow" onNavigate={onNavigate} />
          <ConfirmSuccess borrowed={borrowAmount > 0} />
        </div>
      </div>
    );
  }

  if (alreadyBorrowing) {
    return (
      <div className="bg-cermin-atmosphere min-h-dvh">
        <div className="mx-auto max-w-2xl px-6 pt-10 pb-28 sm:pt-14 md:pb-14">
          <NavBar current="borrow" onNavigate={onNavigate} />
          <InkCard as="section">
            <div className="flex items-start gap-4">
              <Mascot pose="shield" size={72} className="mt-1 shrink-0" />
              <div>
                <ComicTag size={18} rotate={-2} className="block">
                  All set
                </ComicTag>
                <h2 className="mt-2 font-display text-lg text-foreground">You already have a loan open</h2>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                  You&apos;re borrowing against your collateral right now, and I&apos;m watching it. One loan at a time
                  keeps things simple — head back to your dashboard to see how it&apos;s doing. — Cermin
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="mt-6 inline-flex min-h-11 items-center rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-on-gold transition-opacity hover:opacity-90"
                >
                  Back to dashboard
                </button>
              </div>
            </div>
          </InkCard>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cermin-atmosphere min-h-dvh">
      <div className="mx-auto max-w-2xl px-6 pt-10 pb-28 sm:pt-14 md:pb-14">
        <NavBar current="borrow" onNavigate={onNavigate} />

        {/* Comic step crumbs: ComicTag numeral + label above an ink progress
            track. Current/done steps read in gold; upcoming steps dim. */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-2">
            {STEP_LABELS.map((label, i) => (
              <ComicTag
                key={label}
                size={15}
                rotate={i === step ? -2 : 0}
                color={i <= step ? 'var(--color-gold)' : 'var(--color-foreground-faint)'}
                style={{ opacity: i <= step ? 1 : 0.55 }}
              >
                {label}
              </ComicTag>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-gold' : 'bg-hairline-strong'}`} />
            ))}
          </div>
        </div>

        <InkCard as="section">
          {step === 0 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs font-semibold tracking-[0.14em] text-foreground-faint uppercase">
                  Your collateral
                </p>
                <h2 className="mt-1 font-display text-lg text-foreground">{collateral.instrumentId}</h2>
                <p className="mt-1 text-sm text-foreground-muted">
                  {formatNumber(collateral.faceValue, 0)} mUST{' '}
                  {backendOriginate ? 'ready to post as collateral' : 'already posted'}, worth{' '}
                  {formatUsd(collateralValue)}.
                </p>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <label htmlFor="borrow-amount" className="text-sm text-foreground-muted">
                    {backendOriginate ? 'How much would you like to borrow?' : 'How much more would you like to borrow?'}
                  </label>
                  <span className="font-display text-2xl text-foreground tabular-nums">{formatUsd(borrowAmount)}</span>
                </div>
                <input
                  id="borrow-amount"
                  type="range"
                  min={0}
                  max={maxAdditional}
                  step={50}
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(Number(e.target.value))}
                  className="mt-3 w-full accent-gold"
                />
                <div className="mt-1 flex justify-between text-xs text-foreground-faint">
                  <span>$0</span>
                  <span>{formatUsd(maxAdditional)}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-hairline bg-surface-sunken p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-muted">Your Health Ratio would be</span>
                  <span className="font-display text-xl text-foreground tabular-nums">{formatPercentBps(newRatioBps)}</span>
                </div>
                <p className="mt-1 text-xs text-foreground-faint">
                  New outstanding: {formatUsd(newOutstanding)} · {STATUS_LABEL[newStatus]}
                </p>
                <div className="mt-3 border-t border-hairline pt-3">
                  <p className="text-xs text-foreground-faint">
                    If price dropped 10% right after, you'd sit at{' '}
                    <span className="font-semibold text-foreground-muted">{formatPercentBps(drop10RatioBps)}</span> —{' '}
                    {STATUS_LABEL[drop10Status].toLowerCase()}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-7">
              <div>
                <p className="text-sm text-foreground-muted">
                  Set your Guard Trigger — the Health Ratio where I step in and repay from your Shadow Vault. Tap a
                  card to see what it means for you.
                </p>
                <div className="mt-4 flex flex-col gap-3">
                  {STRATEGIES.map((strategy) => (
                    <StrategyCard
                      key={strategy.id}
                      strategy={strategy}
                      selected={strategyId === strategy.id}
                      expanded={expandedId === strategy.id}
                      onTap={() => handleCardTap(strategy.id)}
                      triggerBps={strategy.triggerBps ?? customBps}
                      outstanding={newOutstanding}
                      customBps={customBps}
                      onCustomBpsChange={setCustomBps}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl border border-hairline bg-surface-sunken p-5">
                <div>
                  <p className="text-sm font-medium text-foreground">Coupon Sweep</p>
                  <p className="mt-1 text-xs leading-relaxed text-foreground-faint">
                    When your Treasury pays its quarterly coupon, send it straight into your loan instead of your
                    wallet — a self-repaying loan.
                  </p>
                </div>
                <Toggle checked={couponSweep} onChange={setCouponSweepLocal} label="Coupon Sweep" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              {/* Cermin summarizes the plan in first person from a speech bubble
                  — every figure below is a value already computed above (no new
                  math): the amount, the previewed status, and the chosen trigger. */}
              <div className="flex items-start gap-3 sm:gap-4">
                <Mascot pose={confirmBlocked ? 'shield' : 'watch'} size={72} className="mt-1 shrink-0" />
                <SpeechBubble tail="left" tailOffset="26px" className="flex-1 text-left">
                  <p className="text-sm leading-relaxed text-foreground-muted">
                    {borrowAmount > 0
                      ? `Here's the plan: you'll owe ${formatUsd(newOutstanding)} at ${formatPercentBps(
                          newRatioBps,
                        )} — ${STATUS_LABEL[newStatus].toLowerCase()}. If it ever slips to ${formatPercentBps(
                          triggerBps,
                        )} (${strategyNameForTriggerBps(triggerBps)}), I repay from your Shadow Vault to bring you back. — Cermin`
                      : `No new borrowing — just tuning your protection. I'll step in at ${formatPercentBps(
                          triggerBps,
                        )} (${strategyNameForTriggerBps(triggerBps)}) and keep you safe. — Cermin`}
                  </p>
                </SpeechBubble>
              </div>
              <dl className="flex flex-col gap-3 rounded-2xl border border-hairline bg-surface-sunken p-5 text-sm">
                <Row label="New outstanding" value={formatUsd(newOutstanding)} />
                <Row label="Health Ratio" value={formatPercentBps(newRatioBps)} />
                <Row label="If price drops 10%" value={`${formatPercentBps(drop10RatioBps)} · ${STATUS_LABEL[drop10Status]}`} />
                <Row label="Guard Trigger" value={`${formatPercentBps(triggerBps)} · ${strategyNameForTriggerBps(triggerBps)}`} />
                <Row label="Coupon Sweep" value={couponSweep ? 'On' : 'Off'} />
              </dl>
              {confirmBlocked && (
                <CautionCard tag="Hold on">
                  This would start below your Guard Trigger — I&apos;d have to step in on day one. Borrow a little
                  less, or pick a lower trigger. — Cermin
                </CautionCard>
              )}
              {submitError && <CautionCard tag="Hmm">{submitError}</CautionCard>}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex min-h-11 items-center rounded-full px-4 py-2 text-sm text-foreground-faint transition-colors hover:text-foreground-muted disabled:opacity-0"
            >
              Back
            </button>
            {step < 2 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(2, s + 1))}
                className="flex min-h-11 items-center rounded-full bg-surface-overlay px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-overlay-strong"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={confirm}
                disabled={confirmBlocked || submitting || finishing}
                className="flex min-h-11 items-center rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-on-gold transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {submitting ? (backendOriginate ? 'Submitting to BNB Chain…' : 'Opening…') : finishing ? 'Opening…' : 'Confirm'}
              </button>
            )}
          </div>
        </InkCard>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-foreground-faint">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

/**
 * The Review step's terracotta warning, dressed as a comic caution panel: the
 * same terracotta text on the same sunken surface (contrast unchanged from what
 * shipped), now framed with a 2px terracotta ink line, a hard offset shadow,
 * and a small Bangers caution tag. Used for both the confirm-blocked message
 * and any live-origination error.
 */
function CautionCard({ tag, children }: { tag: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-terracotta bg-surface-sunken p-4 shadow-[3px_3px_0_var(--color-terracotta-dim)]">
      <ComicTag size={15} color="var(--color-terracotta)" className="mb-1 block">
        {tag}
      </ComicTag>
      <p className="text-sm leading-relaxed text-terracotta">{children}</p>
    </div>
  );
}

/**
 * The "loan opened" moment shown during the brief hold before navigating to the
 * dashboard: Cermin, a "DONE!" tag, and a gold coin burst. The burst is armed
 * by a mount effect (trigger flips null -> 'go' after mount) so the kit's
 * skip-on-mount one-shot still fires exactly once; under reduced motion it
 * no-ops and this is just a calm confirmation card (and `confirm()` skips the
 * hold entirely, navigating straight through).
 */
function ConfirmSuccess({ borrowed }: { borrowed: boolean }) {
  const [fire, setFire] = useState<string | null>(null);
  useEffect(() => {
    setFire('go');
  }, []);
  return (
    <InkCard as="section" className="relative">
      <CoinBurst trigger={fire} seed="borrow" />
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <Mascot pose="shield" size={96} loading="eager" />
        <ComicTag size={32} color="var(--color-sage)">
          Done!
        </ComicTag>
        {isBackendMode() && (
          <p className="-mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-sage">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12.5 10 17l9-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Confirmed on BNB Chain
          </p>
        )}
        <p className="max-w-xs text-sm leading-relaxed text-foreground-muted">
          {borrowed ? "Your loan is open and I'm watching it now." : "Your protection is set — I'm watching it now."}
        </p>
      </div>
    </InkCard>
  );
}

interface StrategyCardProps {
  strategy: Strategy;
  selected: boolean;
  expanded: boolean;
  onTap: () => void;
  /** The trigger this card currently represents — a fixed value for named strategies, the live picker value for Custom. */
  triggerBps: number;
  /** The previewed loan's outstanding (post step-0 borrow amount), so every card's live sentence reflects what confirming would actually set. */
  outstanding: number;
  customBps: number;
  onCustomBpsChange: (bps: number) => void;
}

/**
 * One Guard Trigger strategy — collapsed it shows name + one-line Cermin
 * summary + the trigger % as secondary info; expanded it adds the three
 * live sentences (when I step in / what it means / what I do) and, for
 * Custom, the granular slider. Selected state is never color-only: a filled
 * check mark, a heavier name weight, an ink frame AND a hard offset comic
 * shadow (the InkCard vocabulary) all change together, so the chosen card
 * reads as a stamped-in panel. Border width is constant (2px) across states so
 * selecting never nudges the layout.
 */
function StrategyCard({
  strategy,
  selected,
  expanded,
  onTap,
  triggerBps,
  outstanding,
  customBps,
  onCustomBpsChange,
}: StrategyCardProps) {
  const copy = buildStrategyLiveCopy(triggerBps, outstanding);

  return (
    <div
      className={`rounded-2xl border-2 transition-[border-color,box-shadow,background-color] ${
        selected
          ? 'border-ink-line bg-surface-overlay/60 shadow-[3px_3px_0_var(--color-ink-line)]'
          : 'border-hairline-strong bg-surface-sunken hover:border-foreground-faint'
      }`}
    >
      <button
        type="button"
        onClick={onTap}
        aria-pressed={selected}
        aria-expanded={expanded}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left transition-transform active:scale-[0.98]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <SelectionMark selected={selected} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-sm text-foreground ${selected ? 'font-semibold' : 'font-medium'}`}>{strategy.name}</span>
              {strategy.recommended && (
                <span className="rounded-full bg-sage-dim px-1.5 py-0.5 text-[10px] font-semibold text-sage">Recommended</span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-foreground-faint">{strategy.summary}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm text-foreground-muted tabular-nums">{formatPercentBps(triggerBps)}</span>
          <Chevron expanded={expanded} />
        </div>
      </button>

      {/* CSS grid 0fr -> 1fr technique: animates the row track, not an
          intrinsic height, so there's no layout-shift jank; transform/
          opacity only inside. 200ms sits inside the 150-300ms band, and
          the project-wide prefers-reduced-motion rule (index.css) already
          collapses every transition-duration to ~0 when requested.
          `inert` while collapsed: the content stays in the DOM for the
          animation, but a keyboard user can't Tab into the invisible
          Custom slider and screen readers skip it entirely. */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
        inert={!expanded}
      >
        <div className="overflow-hidden">
          <div
            className={`flex flex-col gap-3 px-5 pb-5 text-xs leading-relaxed transition-opacity duration-200 ${
              expanded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex flex-col gap-3 border-t border-hairline pt-4">
              <DetailBlock label="When I step in" text={copy.stepsIn} />
              <DetailBlock label="What it means" text={strategy.meaning} />
              <DetailBlock label="What I do" text={copy.restores} />
            </div>

            {strategy.id === 'custom' && (
              <div className="rounded-xl border border-hairline bg-surface-raised p-4">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="custom-trigger" className="text-xs text-foreground-faint">
                    Your Guard Trigger
                  </label>
                  <span className="font-display text-lg text-foreground tabular-nums">{formatPercentBps(customBps)}</span>
                </div>
                <input
                  id="custom-trigger"
                  type="range"
                  min={CUSTOM_TRIGGER_MIN_BPS}
                  max={CUSTOM_TRIGGER_MAX_BPS}
                  step={CUSTOM_TRIGGER_STEP_BPS}
                  value={customBps}
                  onChange={(e) => onCustomBpsChange(Number(e.target.value))}
                  className="mt-3 w-full accent-gold"
                />
                <div className="mt-1 flex justify-between text-[11px] text-foreground-faint">
                  <span>{formatPercentBps(CUSTOM_TRIGGER_MIN_BPS)} · most borrowing room</span>
                  <span>{formatPercentBps(CUSTOM_TRIGGER_MAX_BPS)} · earliest protection</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.1em] text-foreground-faint uppercase">{label}</p>
      <p className="mt-1 text-foreground-muted">{text}</p>
    </div>
  );
}

function SelectionMark({ selected }: { selected: boolean }) {
  if (selected) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
        <circle cx="12" cy="12" r="10" className="fill-gold" />
        <path
          d="M7.5 12.5 10.5 15.5 16.5 9"
          stroke="var(--color-on-gold)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 text-hairline-strong">
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 text-foreground-faint transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
