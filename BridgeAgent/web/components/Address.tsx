/**
 * Truncated address/hash + explorer link + copy button. Used wherever we
 * surface an EVM address or trade hash. Server component — the copy button
 * inside is client, but the wrapper isn't.
 */

import { activeChain } from "@/lib/chain";
import { fmtAddress, fmtHash } from "@/lib/format";
import { ArrowUpRight } from "lucide-react";
import { CopyButton } from "./CopyButton";

const explorer = activeChain.blockExplorers!.default.url;

export function Address({
  value,
  kind = "address",
  className = "",
  label,
}: {
  value: `0x${string}`;
  kind?: "address" | "hash";
  className?: string;
  label?: string;
}) {
  // Hashes (32 bytes / 64 hex chars) point at the contract page since we
  // don't store the originating tx hash with the trade record. Addresses
  // (20 bytes / 40 hex chars) link directly.
  const href = `${explorer}/address/${value}`;
  const display = kind === "hash" ? fmtHash(value) : fmtAddress(value);

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={value}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="link-quiet group inline-flex items-center gap-1 text-moss-100 hover:text-moss-50"
      >
        <span className="font-mono">{display}</span>
        <ArrowUpRight
          className="h-3 w-3 text-moss-500 transition-colors group-hover:text-moss-300"
          strokeWidth={2}
        />
      </a>
      <CopyButton value={value} label={label ?? kind} />
    </span>
  );
}
