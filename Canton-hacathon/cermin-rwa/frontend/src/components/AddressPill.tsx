import { useState } from 'react';

/** Truncate the user's id for display. BNB Chain addresses (`0x…`) render as
 * `0x1234…abcd`; legacy Canton party ids (`hint::fingerprint`) keep the hint. */
export function truncateParty(party: string): string {
  if (/^0x[0-9a-fA-F]{40}$/.test(party)) return `${party.slice(0, 6)}…${party.slice(-4)}`;
  const [hint, ns] = party.split('::');
  if (!ns) return party.length > 18 ? `${party.slice(0, 16)}…` : party;
  return `${hint}::${ns.slice(0, 6)}…`;
}

interface AddressPillProps {
  party: string;
}

/** The connected user's party id shown as their wallet "address", with a copy
 * button. Backend mode only (rendered by NavBar / the empty-state Dashboard). */
export function AddressPill({ party }: AddressPillProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(party);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard unavailable — no-op (the id is still visible to select)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={party}
      aria-label={`Copy your address ${party}`}
      className="flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1 text-xs text-foreground-faint transition-colors hover:text-foreground-muted"
    >
      <span className="font-mono tabular-nums">{truncateParty(party)}</span>
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12.5 10 17l9-10" stroke="var(--color-sage)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
          <path d="M5 15V5a2 2 0 0 1 2-2h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
