import { useState } from 'react';
import { useCerminStore } from '../store';
import { ComicTag, InkCard, Mascot } from '../lib/comic';
import { OnboardingStepper } from '../components/OnboardingStepper';

interface ConnectProps {
  onConnected: () => void;
}

/**
 * Self-service connect screen (backend mode only — never rendered in the
 * standalone mock build). The username IS the login: the backend provisions the
 * user their own BNB Chain address (custodial demo account). A returning
 * user typing the same name resolves the same party. First-person Cermin copy,
 * staged as a comic welcome: Cermin greets you from beside the form. The input
 * / button / submit behavior is unchanged.
 */
export function Connect({ onConnected }: ConnectProps) {
  const connect = useCerminStore((s) => s.connect);
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    const result = await connect(username);
    setBusy(false);
    if (result.ok) {
      onConnected();
    } else {
      setError(result.error ?? 'Could not connect. Please try again.');
    }
  }

  return (
    <div className="bg-cermin-atmosphere flex min-h-dvh items-center justify-center px-6 py-14">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect width="48" height="48" rx="12" className="fill-surface-sunken" />
            <circle cx="24" cy="24" r="15" stroke="var(--color-gold)" strokeWidth="2.4" />
            <circle cx="24" cy="24" r="4.5" fill="var(--color-gold)" />
          </svg>
          <span className="font-display text-2xl text-foreground">Cermin</span>
        </div>

        <OnboardingStepper current="connect" />

        <InkCard as="section" className="relative px-8 py-11 sm:px-10">
          <div className="flex flex-col items-center">
            <Mascot pose="watch" size={92} loading="eager" />
            <ComicTag size={22} rotate={-2} className="mt-3 block">
              Let&apos;s get you set up
            </ComicTag>
            <h1 className="mt-3 font-display text-2xl text-foreground">Welcome. I&apos;ll set up your account.</h1>
            <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-foreground-muted">
              Pick a name and I&apos;ll set up your own account on BNB Chain. Come back with the same name and
              you&apos;ll pick up right where you left off.
            </p>
          </div>

          <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Your name"
              aria-label="Your name"
              autoComplete="off"
              autoFocus
              className="min-h-12 w-full rounded-xl border border-hairline-strong bg-surface-sunken px-4 py-3 text-center text-base text-foreground outline-none focus:border-gold"
            />
            {error && <p className="text-sm text-terracotta">{error}</p>}
            <button
              type="submit"
              disabled={busy || !username.trim()}
              className="flex min-h-12 items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-on-gold transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {busy ? 'Creating your account…' : 'Enter'}
            </button>
          </form>
        </InkCard>

        <p className="mt-6 text-xs text-foreground-faint">
          Live on BNB Chain testnet · your name maps to a real on-chain address.
        </p>
      </div>
    </div>
  );
}
