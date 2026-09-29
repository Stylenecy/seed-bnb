"use client";

/**
 * "How to verify this yourself" — a collapsed disclosure that explains the
 * trust model and shows the literal cast/viem call a curious reader can
 * run against BNB Smart Chain. Closed by default to keep the page lean;
 * opening it is a deliberate signal that the viewer wants depth.
 */

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { ADDRESSES } from "@/lib/contracts";
import { activeChain } from "@/lib/chain";

export function VerifyPanel({ agentId }: { agentId: bigint }) {
  const [open, setOpen] = useState(false);

  const castCmd = `cast call ${ADDRESSES.tradeJournal} \\
  "tradesByAgent(uint256,uint256,uint256)((uint256,bytes32,int256,uint64)[])" \\
  ${agentId.toString()} 0 50 \\
  --rpc-url ${activeChain.rpcUrls.default.http[0]}`;

  return (
    <section
      aria-label="Verification"
      className="border-y border-moss-900 bg-[#0a1410]"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-6 text-left transition-colors hover:bg-moss-900/30 sm:px-10"
      >
        <div className="flex items-baseline gap-4">
          <span className="text-[10px] uppercase tracking-[0.28em] text-moss-400">
            §
          </span>
          <span className="font-serif text-xl italic text-bone/90">
            Verify this yourself.
          </span>
        </div>
        <ChevronRight
          className={`h-4 w-4 text-moss-500 transition-transform duration-200 ${
            open ? "rotate-90 text-moss-200" : ""
          }`}
          strokeWidth={2}
        />
      </button>

      <div className="expand-enter" data-open={open}>
        <div>
          <div className="mx-auto max-w-6xl px-6 pb-10 sm:px-10">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr]">
              <div className="space-y-4 text-sm leading-relaxed text-moss-200">
                <p>
                  The agent's identity is an{" "}
                  <span className="text-moss-50">ERC-8004 NFT</span>: tokenId
                  is the agent's ID, ownership is the right to act as it.
                </p>
                <p>
                  Every settled trade is a{" "}
                  <span className="font-mono text-moss-50">TradeRecorded</span>{" "}
                  event on the TradeJournal contract, gated by{" "}
                  <span className="font-mono text-moss-50">
                    ownerOf(agentId)
                  </span>{" "}
                  — only the agent's wallet can append. Nobody else can fake
                  the record.
                </p>
                <p className="text-moss-300">
                  Read the ledger directly with the{" "}
                  <a
                    href="https://book.getfoundry.sh/reference/cast/cast-call"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-quiet text-moss-100"
                  >
                    cast
                  </a>{" "}
                  command on the right, or any RPC client. No API keys, no
                  trust required.
                </p>
              </div>

              <pre className="overflow-x-auto rounded border border-moss-900 bg-moss-950 p-4 font-mono text-[11px] leading-relaxed text-moss-200">
                <code>{castCmd}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
