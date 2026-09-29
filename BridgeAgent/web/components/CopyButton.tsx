"use client";

/**
 * Copy-to-clipboard button. Shows the click target as a small icon next to
 * a truncated address/hash; flips briefly to a check on success. Stateless
 * server-side — only the icon swap and the 1.2s "copied" hold are client.
 */

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // No-op on failure (e.g. insecure context). The address is visible
      // for manual copy regardless.
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={label ? `Copy ${label}` : "Copy"}
      className="inline-flex h-5 w-5 items-center justify-center rounded text-moss-500 transition-colors hover:text-moss-200 focus:outline-none focus:text-moss-100"
    >
      {copied ? (
        <Check className="h-3 w-3" strokeWidth={2.5} />
      ) : (
        <Copy className="h-3 w-3" strokeWidth={2} />
      )}
    </button>
  );
}
