// Shared HTTP helpers for the onboard + transfer-oracle servers (M1).
//
// clientIp: derive the client IP from a TRUSTED proxy hop, not the
// attacker-controlled leftmost X-Forwarded-For token. Behind a single trusted
// proxy (Railway), the proxy appends the real connecting IP, so the entry
// `TRUSTED_PROXY_HOPS` from the right is the one we can trust. Spoofing XFF
// only prepends entries on the left, which we now ignore. Configurable via
// TRUSTED_PROXY_HOPS (default 1); set 0 to ignore XFF entirely (direct bind).
//
// RateLimiter: sliding-window per-key limiter, bounded to `maxKeys` with
// oldest-entry eviction — so a flood of distinct keys (e.g. spoofed XFF, if any
// slips through) can't grow the map without bound or wipe everyone's counters.

import type { IncomingMessage } from 'node:http';

const TRUSTED_PROXY_HOPS = Math.max(0, Number(process.env.TRUSTED_PROXY_HOPS ?? '1'));

export function clientIp(req: IncomingMessage): string {
  const socketIp = req.socket.remoteAddress ?? '0.0.0.0';
  if (TRUSTED_PROXY_HOPS === 0) return socketIp;
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd !== 'string' || fwd.length === 0) return socketIp;
  const parts = fwd.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return socketIp;
  // The hop the closest trusted proxy added: HOPS from the right.
  const idx = Math.max(0, parts.length - TRUSTED_PROXY_HOPS);
  return parts[idx] ?? socketIp;
}

export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly windowMs: number,
    private readonly max: number,
    private readonly maxKeys = 10_000,
  ) {}

  check(key: string): { ok: boolean; retryAfter?: number } {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    let arr = this.hits.get(key);
    if (!arr) {
      // Bound memory: evict the oldest-inserted keys when full (Map preserves
      // insertion order). Fairer + cheaper than clear()-ing every counter.
      while (this.hits.size >= this.maxKeys) {
        const oldest = this.hits.keys().next().value;
        if (oldest === undefined) break;
        this.hits.delete(oldest);
      }
      arr = [];
      this.hits.set(key, arr);
    }

    while (arr.length > 0 && arr[0]! < cutoff) arr.shift();
    if (arr.length >= this.max) {
      const retryAfter = Math.ceil((arr[0]! + this.windowMs - now) / 1000);
      return { ok: false, retryAfter };
    }
    arr.push(now);
    return { ok: true };
  }
}
