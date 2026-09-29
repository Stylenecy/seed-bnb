/** Small display-formatting helpers shared across cards, the ring, and the activity feed. */

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatUsd(amount: number): string {
  return usd.format(amount);
}

export function formatNumber(amount: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(amount);
}

/** bps -> "166.7%". Caps display at 999.9% so an unfunded loan doesn't print "Infinity%". */
export function formatPercentBps(bps: number): string {
  if (!Number.isFinite(bps)) return '—';
  const pct = Math.min(bps, 999_900) / 100;
  return `${pct.toFixed(1)}%`;
}

export function formatBpsAsRate(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

const shortDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

/** "Jul 10" — no year, for tight spaces like the price chart's x-axis ticks. */
export function formatShortDate(date: Date): string {
  return shortDateFormatter.format(date);
}

/**
 * A sub-$10 collateral price, e.g. "$0.78". Shows a 3rd decimal only when the
 * 2-decimal rounding would actually lose information (e.g. "$0.585", the
 * demo Protection floor price) — most prices in this app round cleanly to
 * cents, and forcing a 3rd digit on every one of them would read as noise.
 */
export function formatPrice(amount: number): string {
  const r3 = Math.round((amount + Number.EPSILON) * 1000) / 1000;
  const r2 = Math.round((amount + Number.EPSILON) * 100) / 100;
  return Math.abs(r3 - r2) < 1e-9 ? `$${r2.toFixed(2)}` : `$${r3.toFixed(3)}`;
}

/** "Just now", "12m ago", "3h ago", or a date once it's more than a day old. */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatDate(then);
}
