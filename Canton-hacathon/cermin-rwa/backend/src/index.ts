// Cermin-RWA thin backend bridge.
//
// One small Express service between the frontend and the CerminRWA contract on BNB Chain.
// All ledger I/O is isolated in ./ledger.ts (MockLedger / JsonApiLedger) — this file
// only wires HTTP routes to that interface and does not talk to the ledger directly.

import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { createLedger, LedgerConflictError, LedgerValidationError } from './ledger.ts';
import type { Ledger } from './ledger.ts';

type AsyncHandler = (req: Request, res: Response) => Promise<void>;

function asyncRoute(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
}

/** The caller's borrower party (self-service session). Undefined falls back to
 * the legacy demo borrower inside the ledger seam. */
function partyOf(req: Request): string | undefined {
  const h = req.header('X-Cermin-Party');
  return h && h.trim() ? h.trim() : undefined;
}

// Public-internet etiquette guard (party creation + faucet claims hit the
// operator's tBNB gas budget on BNB Chain): a per-IP sliding
// window, in-memory only. ponytail: single-process/in-memory, scoped to one
// createApp() call — resets on redeploy and doesn't coordinate across
// replicas; fine for one Railway instance, upgrade to a shared store (Redis)
// only if this ever scales out.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

export function createApp(ledger: Ledger) {
  const app = express();
  // Railway (like most PaaS) terminates TLS at a reverse proxy: without this,
  // req.ip resolves to the proxy's address for every visitor, so the rate
  // limiter below would count all traffic as one IP instead of one per visitor.
  app.set('trust proxy', true);

  // Scoped per createApp() call (not module-level) so every test gets its own
  // fresh counters instead of sharing one across the whole test file.
  const rateLimitHits = new Map<string, number[]>();
  function rateLimit(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip ?? 'unknown';
    const now = Date.now();
    const recent = (rateLimitHits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (recent.length >= RATE_LIMIT_MAX) {
      res.status(429).json({ error: 'Too many requests — please slow down and try again in a minute.' });
      return;
    }
    recent.push(now);
    rateLimitHits.set(ip, recent);
    next();
  }

  // Minimal permissive CORS: the Vite dev server (frontend) runs on a different
  // origin/port than this bridge, so browser fetches need these headers. No
  // dependency, no credentials — this is a local demo bridge, not a public API.
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Cermin-Party');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(express.json());

  // Self-service "login": username -> a provisioned BNB Chain address (the session).
  app.post(
    '/api/onboard',
    rateLimit,
    asyncRoute(async (req, res) => {
      const { username } = req.body ?? {};
      if (typeof username !== 'string' || !username.trim()) {
        throw new LedgerValidationError('username is required');
      }
      res.json(await ledger.onboard(username.trim()));
    }),
  );

  // Faucet: mint 10,000 mock mUST to the caller's party (once per user).
  app.post(
    '/api/faucet',
    rateLimit,
    asyncRoute(async (req, res) => {
      const party = partyOf(req);
      if (!party) throw new LedgerValidationError('X-Cermin-Party header is required to claim the faucet');
      res.json(await ledger.faucet(party));
    }),
  );

  app.get(
    '/api/position',
    asyncRoute(async (req, res) => {
      res.json(await ledger.getPosition(partyOf(req)));
    }),
  );

  app.post(
    '/api/vault/topup',
    asyncRoute(async (req, res) => {
      const { amount } = req.body ?? {};
      res.json(await ledger.vaultTopUp(amount, partyOf(req)));
    }),
  );

  app.post(
    '/api/vault/withdraw',
    asyncRoute(async (req, res) => {
      const { amount } = req.body ?? {};
      res.json(await ledger.vaultWithdraw(amount, partyOf(req)));
    }),
  );

  app.post(
    '/api/borrow',
    asyncRoute(async (req, res) => {
      const { collateralAmount, principal, triggerRatioBps, couponSweep, vaultDeposit } = req.body ?? {};
      res.json(
        await ledger.borrow({ collateralAmount, principal, triggerRatioBps, couponSweep, vaultDeposit }, partyOf(req)),
      );
    }),
  );

  app.post(
    '/api/sim/price',
    asyncRoute(async (req, res) => {
      const { price } = req.body ?? {};
      res.json(await ledger.simPrice(price, partyOf(req)));
    }),
  );

  // Task 17 dashboard price chart: global backfill + observed ticks — no
  // party scoping (the oracle price is the same for everyone).
  app.get(
    '/api/price-history',
    asyncRoute(async (_req, res) => {
      res.json(await ledger.getPriceHistory());
    }),
  );

  // Not-found for anything else under /api.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'not found' });
  });

  // Centralized error handler: validation errors -> 400, state conflicts -> 409,
  // malformed request bodies from express.json() (http-errors) -> their own
  // statusCode, everything else -> 500.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof LedgerConflictError) {
      res.status(409).json({ error: err.message });
      return;
    }
    if (err instanceof LedgerValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    const statusCode =
      typeof err === 'object' && err !== null && 'statusCode' in err
        ? Number((err as { statusCode: unknown }).statusCode)
        : undefined;
    if (statusCode !== undefined && statusCode >= 400 && statusCode < 500) {
      const message = err instanceof Error ? err.message : 'bad request';
      res.status(statusCode).json({ error: message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  });

  return app;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const port = Number(process.env.PORT ?? 3001);
  const app = createApp(createLedger());
  app.listen(port, () => {
    console.log(`Cermin-RWA backend listening on :${port}`);
  });
}
