import type { ReactNode } from 'react';
import type { Screen } from '../lib/router';
import { isBackendMode } from '../lib/backend';
import { useCerminStore } from '../store';
import { AddressPill } from './AddressPill';
import { ThemeToggle } from './ThemeToggle';

interface NavBarProps {
  current: Screen;
  onNavigate: (screen: Screen) => void;
}

const HOME_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 10.5 12 3l9 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M5.25 9.75V20a1 1 0 0 0 1 1H9v-6h6v6h2.75a1 1 0 0 0 1-1V9.75"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BORROW_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2.5" y="6.5" width="19" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M6 12h.01M18 12h.01" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);

const VAULT_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 21s7.5-3.6 7.5-9.3V5.6L12 3 4.5 5.6v6.1C4.5 17.4 12 21 12 21Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);

const SIMULATE_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 21v-6M4 11V3M12 21v-8M12 9V3M20 21v-4M20 13V3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M1.5 15H6.5M9.5 9H14.5M17.5 17H22.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const TABS: { screen: Screen; label: string; mobileLabel: string; icon: ReactNode }[] = [
  { screen: 'dashboard', label: 'Home', mobileLabel: 'Home', icon: HOME_ICON },
  { screen: 'borrow', label: 'Borrow', mobileLabel: 'Borrow', icon: BORROW_ICON },
  { screen: 'vault', label: 'Shadow Vault', mobileLabel: 'Vault', icon: VAULT_ICON },
  { screen: 'simulate', label: 'Simulate', mobileLabel: 'Simulate', icon: SIMULATE_ICON },
];

/**
 * The Cermin wordmark + the four main screens' tabs, shared by every screen
 * except Onboarding. Desktop (>=768px) keeps the original pill nav
 * unchanged; below that a fixed bottom tab bar takes over (Task 9 —
 * bottom nav is top-level-screens only, matching this component's own
 * scope), each screen already reserves bottom clearance for it.
 */
export function NavBar({ current, onNavigate }: NavBarProps) {
  const session = useCerminStore((s) => s.session);
  const disconnect = useCerminStore((s) => s.disconnect);
  return (
    <>
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5"
          aria-label="Go to dashboard"
        >
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect width="48" height="48" rx="12" className="fill-surface-sunken" />
            <circle cx="24" cy="24" r="15" stroke="var(--color-gold)" strokeWidth="2.4" />
            <circle
              cx="24"
              cy="24"
              r="15"
              stroke="var(--color-sage)"
              strokeWidth="2.4"
              strokeDasharray="60 200"
              strokeLinecap="round"
              transform="rotate(-90 24 24)"
            />
            <circle cx="24" cy="24" r="4.5" fill="var(--color-gold)" />
          </svg>
          <span className="font-display text-xl text-foreground">Cermin</span>
        </button>

        <nav className="hidden items-center gap-1 rounded-full border border-hairline bg-surface-raised p-1 md:flex">
          {TABS.map((tab) => {
            const active = current === tab.screen;
            return (
              <button
                key={tab.screen}
                type="button"
                onClick={() => onNavigate(tab.screen)}
                aria-current={active ? 'page' : undefined}
                className={`relative rounded-full px-3.5 py-1.5 text-sm transition-colors sm:px-4 ${
                  active ? 'bg-surface-overlay text-foreground' : 'text-foreground-faint hover:text-foreground-muted'
                }`}
              >
                {tab.label}
                {/* Comic touch (Task B): the active tab gets a small hand-inked
                    underline stamp — a whisper of the ink-line language the
                    InkCard frame uses, nothing more (Task C owns deeper nav
                    chrome). Absolutely positioned so it never shifts layout. */}
                {active && (
                  <span aria-hidden="true" className="absolute bottom-[3px] left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full bg-ink-line" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {/* The connected user's party id = their wallet "address" (backend mode). */}
          {isBackendMode() && session && <AddressPill party={session.party} />}
          {/* Wallet-style disconnect: clears the session and returns to Connect
              (App.tsx re-renders on session -> null, no extra routing needed). */}
          {isBackendMode() && session && (
            <button
              type="button"
              onClick={disconnect}
              aria-label="Disconnect"
              title="Disconnect"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-hairline-strong text-foreground-faint transition-colors hover:bg-surface-sunken hover:text-foreground-muted"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 15l4-3-4-3M20 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {/* Truthful data-source badge: when VITE_API_URL is set the store shows
              live ledger state (Mode B/C/D), so don't claim "Mock data". The
              standalone parachute (no backend) keeps its original label.
              Task C: dressed as a small comic stamp — a mini ink frame (2px
              ink-line + a hard 2px offset shadow, the InkCard vocabulary in
              miniature) with a status dot (sage when live, faint when mock). */}
          <span className="inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-ink-line bg-surface-raised px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-foreground-muted shadow-[2px_2px_0_var(--color-ink-line)]">
            <span className={`h-1.5 w-1.5 rounded-full ${isBackendMode() ? 'bg-sage' : 'bg-foreground-faint'}`} />
            {isBackendMode() ? 'Live · BNB Chain testnet' : 'Standalone · Mock data'}
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile bottom tab bar (<768px) — icon + label, active state gets a
          filled pill behind the icon AND a color change (not color-only),
          fixed with safe-area padding so it clears iOS home-indicator
          gestures. Each screen reserves matching bottom clearance so
          nothing renders underneath it. */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface-raised md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-6xl items-stretch">
          {TABS.map((tab) => {
            const active = current === tab.screen;
            return (
              <button
                key={tab.screen}
                type="button"
                onClick={() => onNavigate(tab.screen)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                  active ? 'text-gold' : 'text-foreground-faint'
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-full ${active ? 'bg-surface-sunken' : ''}`}>
                  {tab.icon}
                </span>
                {tab.mobileLabel}
                {/* Same hand-inked underline stamp the desktop nav's active tab
                    carries (Task B) — a whisper of the ink-line language,
                    absolutely positioned so it never shifts the tab layout. */}
                {active && (
                  <span aria-hidden="true" className="absolute bottom-[5px] left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full bg-ink-line" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
