/**
 * Guard Trigger strategy presets — the single source of truth for
 * strategy name -> bps (global-constraints.md Amendment 4, BINDING: names,
 * values, and order). The Borrow flow's step 1 renders this list as cards;
 * the Vault screen reverse-looks-up the active policy's bps to show the
 * strategy name read-only. No other module should hardcode these numbers.
 *
 * These are display-only presets — the store still only ever knows about
 * `triggerRatioBps` (a plain number). Picking a card is just a friendlier
 * way to arrive at that number; `setGuardTrigger` and the rest of the
 * store/math are untouched.
 */

import { BPS_SCALE, collateralFloorForRatioBps, targetBpsForTriggerBps } from './health';
import { formatPercentBps, formatUsd } from './format';

export type StrategyId = 'conservative' | 'balanced' | 'aggressive' | 'custom';
export type NamedStrategyId = Exclude<StrategyId, 'custom'>;

/**
 * The three named triggers as a typed lookup (Amendment 4 values) — lets
 * callers resolve a named strategy's bps without non-null assertions, and
 * keeps `STRATEGIES` below reading from the same numbers.
 */
export const STRATEGY_TRIGGER_BPS = {
  conservative: 15_000,
  balanced: 13_000,
  aggressive: 12_000,
} as const satisfies Record<NamedStrategyId, number>;

export interface Strategy {
  id: StrategyId;
  name: string;
  /** Guard Trigger in bps. `null` for Custom — the user picks their own via the granular picker. */
  triggerBps: number | null;
  /** Collapsed-card copy: one first-person Cermin line, shown next to the trigger %. */
  summary: string;
  /** Expanded-card copy: the borrowing-room vs early-protection tradeoff, one line. */
  meaning: string;
  /** Only Balanced carries this (Amendment 4): default selection + "Recommended" chip. */
  recommended?: boolean;
}

/** Amendment 4 — BINDING order: Conservative, Balanced, Aggressive, Custom. */
export const STRATEGIES: Strategy[] = [
  {
    id: 'conservative',
    name: 'Conservative',
    triggerBps: STRATEGY_TRIGGER_BPS.conservative,
    summary: 'I step in early, at the first wobble.',
    meaning: 'Smallest borrowing room, calmest sleep — I protect you well before things get tight.',
  },
  {
    id: 'balanced',
    name: 'Balanced',
    triggerBps: STRATEGY_TRIGGER_BPS.balanced,
    summary: 'I keep a steady middle ground — early enough to feel safe, roomy enough to be useful.',
    meaning: 'I balance your borrowing room with early protection — the setting most people are comfortable with.',
    recommended: true,
  },
  {
    id: 'aggressive',
    name: 'Aggressive',
    triggerBps: STRATEGY_TRIGGER_BPS.aggressive,
    summary: 'Maximum borrowing room — I act closer to the edge.',
    meaning: 'You can borrow more against your collateral, but I wait longer before stepping in.',
  },
  {
    id: 'custom',
    name: 'Custom',
    triggerBps: null,
    summary: "You set the line, and I hold it — anywhere from cautious to aggressive.",
    meaning: 'You choose exactly where I step in, trading borrowing room for earlier protection however feels right.',
  },
];

/**
 * Amendment 4: Balanced is the default selection. Typed as a named id (not
 * the full StrategyId) — the default can never be Custom, which has no
 * fixed trigger, so callers may index STRATEGY_TRIGGER_BPS with it.
 */
export const DEFAULT_STRATEGY_ID: NamedStrategyId = 'balanced';

/** Custom picker range (Amendment 4: user-picked 12000-15000 bps, i.e. 120%-150%). */
export const CUSTOM_TRIGGER_MIN_BPS = 12_000;
export const CUSTOM_TRIGGER_MAX_BPS = 15_000;
export const CUSTOM_TRIGGER_STEP_BPS = 100;

/**
 * Max system-wide LTV (loan-to-value = outstanding / collateral value),
 * derived from the tightest Guard Trigger this UI ever offers
 * (`CUSTOM_TRIGGER_MIN_BPS`, 120%): LTV = 1 / ratio, so 1 / 1.2 ≈ 83.3%.
 * Task 17's Dashboard Collateral card uses this as the ceiling for its
 * "Borrowed against mUST" progress bar — a single source so the ~83%
 * figure can never drift from the actual Aggressive-strategy floor.
 */
export const MAX_LTV = BPS_SCALE / CUSTOM_TRIGGER_MIN_BPS;

const NAMED_STRATEGIES = STRATEGIES.filter(
  (s): s is Strategy & { triggerBps: number } => s.triggerBps !== null,
);

/** Named strategy whose fixed trigger matches `triggerBps`, if any — used to preselect the right card when the Borrow flow opens against an existing policy. */
export function strategyForTriggerBps(triggerBps: number): Strategy | undefined {
  return NAMED_STRATEGIES.find((s) => s.triggerBps === triggerBps);
}

/** Read-only reverse mapping for the Vault screen: an unnamed bps value (from a Custom pick) always reads as "Custom". */
export function strategyNameForTriggerBps(triggerBps: number): string {
  return strategyForTriggerBps(triggerBps)?.name ?? 'Custom';
}

/**
 * Which strategy card a Guard Trigger bps belongs to when the Borrow flow
 * opens against an existing policy: an exact Amendment 4 value opens on
 * its named card; anything inside the Custom range is a prior custom pick
 * and opens on Custom; anything this UI can't represent at all (a trigger
 * outside 120-150%, e.g. an oddly seeded ledger policy) falls back to the
 * recommended default rather than a silently clamped custom value.
 */
export function strategyIdForTriggerBps(triggerBps: number): StrategyId {
  const named = strategyForTriggerBps(triggerBps);
  if (named) return named.id;
  if (triggerBps >= CUSTOM_TRIGGER_MIN_BPS && triggerBps <= CUSTOM_TRIGGER_MAX_BPS) return 'custom';
  return DEFAULT_STRATEGY_ID;
}

export interface StrategyLiveCopy {
  /** "When I step in": today's numbers translated from the trigger %. */
  stepsIn: string;
  /** "What I do": the repay-to-target behavior. */
  restores: string;
}

/**
 * Builds the two live sentences every expanded strategy card shows,
 * computed from the previewed loan's outstanding — never hardcoded, never
 * re-derived in a component. Shared by every card (including Custom, whose
 * `triggerBps` is whatever the granular picker currently reads).
 */
export function buildStrategyLiveCopy(triggerBps: number, outstanding: number): StrategyLiveCopy {
  const targetBps = targetBpsForTriggerBps(triggerBps);
  const floor = collateralFloorForRatioBps(outstanding, triggerBps);
  return {
    stepsIn: `I step in when your Health Ratio touches ${formatPercentBps(triggerBps)} — with this loan, that's when your collateral value falls below ${formatUsd(floor)}.`,
    restores: `I repay just enough from your Shadow Vault to bring you back to ${formatPercentBps(targetBps)} (your restore target).`,
  };
}
