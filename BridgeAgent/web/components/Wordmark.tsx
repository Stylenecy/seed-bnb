/**
 * Tiny BridgeAgent wordmark — paired with the live badge in the page
 * header. Pure SVG so it scales sharply and never depends on a font
 * loading. The motif is two converging lines (a "bridge") collapsed
 * into a stylized B. Subtle, geometric, terminal-feel.
 */

export function Wordmark() {
  return (
    <a
      href="/"
      aria-label="BridgeAgent"
      className="group inline-flex items-center gap-2.5 text-moss-100 transition-colors hover:text-moss-50"
    >
      <svg
        viewBox="0 0 18 18"
        width="18"
        height="18"
        fill="none"
        aria-hidden
        className="text-moss-300 transition-colors group-hover:text-moss-50"
      >
        {/* Two horizontal "spans" (the bridge) plus a vertical pier on the
            left, forming a minimal, near-glyphic B. */}
        <path
          d="M2 3 H14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
        <path
          d="M2 9 H11"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
        <path
          d="M2 15 H14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
        <path
          d="M2 3 V15"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
        <circle
          cx="14"
          cy="3"
          r="1"
          fill="#4d785f"
        />
      </svg>
      <span className="font-mono text-sm tracking-tight">
        bridgeagent
      </span>
    </a>
  );
}
