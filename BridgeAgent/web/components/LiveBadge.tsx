"use client";

/**
 * Live data indicator. Shows a pulsing dot, a "LIVE" label, and a self-
 * updating "last read Ns ago" label. Pure client component — receives the
 * server-render timestamp as a prop, then ticks locally each second so the
 * "Ns ago" stays accurate without forcing a re-fetch.
 *
 * The outer page already has `revalidate = 30` so a hard refresh happens
 * server-side every 30s; this component just narrates that to the viewer.
 */

import { useEffect, useState } from "react";
import { CHAIN_LABEL } from "@/lib/chain";

export function LiveBadge({ readAtMs }: { readAtMs: number }) {
  const [now, setNow] = useState(readAtMs);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsed = Math.max(0, Math.floor((now - readAtMs) / 1000));
  const relative =
    elapsed < 60
      ? `${elapsed}s ago`
      : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s ago`;

  return (
    <div className="flex items-center gap-2.5 text-[10px] uppercase tracking-[0.22em] text-moss-300">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inset-0 animate-pulse-soft rounded-full bg-moss-400" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-moss-400" />
      </span>
      <span className="text-moss-200">LIVE</span>
      <span className="text-moss-700">·</span>
      <span>{CHAIN_LABEL}</span>
      <span className="text-moss-700">·</span>
      <span className="tabular-nums">last read {relative}</span>
    </div>
  );
}
