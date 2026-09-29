# Production DevNet Deployment — Railway + Vercel (Task 22)

User decision (2026-07-16): the public FE (`cermin-rwa.vercel.app`) stops being a mock-only demo
and goes **live against real Canton DevNet** — real self-service login (Canton party creation),
real faucet, real Guard Agent protection — hosted on Railway, wired to the SAME shared DevNet
participant + parties already proven in Tasks 14–16. No mock fallback in production; local
`npm run dev` stays the dev-only mock parachute.

## Decisions (locked before implementation)

1. **Credentials:** reuse the existing shared hackathon `validator-devnet-m2m` OAuth2 secret
   (same one proven in Tasks 14–16) rather than pursuing a dedicated validator (2–7 day wait).
   Disclosed openly per docs/07-devnet.md §2.1's existing shared-client caveat.
2. **Hosting:** Railway, two separate always-on services — `backend` (Express API) and `agent`
   (Guard Agent poller) — rather than one combined process, so a crash/restart in one doesn't
   kill the other.
3. **Prod fallback:** none. Production is live-only; a Railway/DevNet outage degrades the public
   site with no mock safety net (accepted trade-off — mock stays a local dev tool only).
4. **Abuse guard:** a light per-IP rate limiter on `/api/onboard` + `/api/faucet` (no new
   dependency) since public traffic now reaches a validator shared by every hackathon team.
5. **UX polish (network badge, on-chain step feedback, progress stepper, disconnect control)**
   deliberately OUT of scope here — a separate, independent follow-up (this infra work has no
   dependency on it, and vice versa).

## What shipped

- **Railway project `cermin-rwa`** (new — separate from the user's unrelated pre-existing
  Mezo-network `cermin-agent` Railway project at a different path, which was investigated
  read-only and left untouched), two services:
  - `backend`: deployed via `railway up ./backend --path-as-root --service backend`.
  - `agent`: deployed via `railway up ./agent --path-as-root --service agent`.
  Both env-configured with `MOCK_LEDGER=false LEDGER_API=v2 LEDGER_AUTH=oauth2`, the DevNet
  ledger URL, the shared OAuth secret, and the 5 namespaced parties already recorded in
  STATE.md §6 (`cermin-issuer`/`cermin-borrower`/`cermin-pool-operator`/`cermin-guard-agent`/
  `cermin-oracle`, namespace `1220a14ca128063b8dc9d1ebb0bd22633be9f2168500f4dbc1ecaeb1855b14e5acf8`)
  — pulled straight from the already-proven local `backend/.env`/`agent/.env`, no re-seeding.
- **`backend/package.json` + `agent/package.json`**: moved `tsx` from `devDependencies` to real
  `dependencies`. Railway's Nixpacks build runs `npm ci` in production mode (confirmed live in
  the build log: `npm warn config production`), which PRUNES devDependencies — without this fix
  the container would boot and immediately fail to find the `tsx` binary.
- **`backend/package.json`**: `start` script changed from `node --env-file-if-exists=.env
  src/index.ts` (relies on Node's native TS-stripping, only reliable on very new Node — not
  guaranteed on Railway's build image) to `tsx src/index.ts`, matching the `agent` package's
  already-working pattern.
- **`backend/src/index.ts`**: small in-memory per-IP sliding-window rate limiter (5 req/60s),
  applied to `POST /api/onboard` and `POST /api/faucet`. Scoped *inside* `createApp()` (not
  module-level) so each test run gets fresh counters instead of accumulating across the whole
  test file. `app.set('trust proxy', true)` added so `req.ip` reflects the real visitor behind
  Railway's reverse proxy rather than the proxy's own address (without this the limiter would
  count all public traffic as one IP). +1 backend test (5 requests succeed, 6th gets 429).
- **Vercel**: `VITE_API_URL` set as a Production env var → the existing `isBackendMode()` gate
  (already env-driven, no code change needed) makes prod always live. Redeployed + aliased to
  `cermin-rwa.vercel.app`.

## Verification (live, this task — no browser extension available in this sandbox, so driven via
the same HTTP API the frontend calls)

1. `GET /api/position` on the public Railway backend domain returned the real, live DevNet scene
   (outstanding 4275.86, vault 888.36, 3 rescue events) — matching STATE.md's recorded Task 15
   numbers exactly.
2. Onboarded a brand-new `cermin-u-verify-*` self-service party through the public backend URL.
3. **Hit a real bug** (see below), fixed it, then: faucet claim succeeded (10,000 mUST minted),
   borrow succeeded (loan 6000 @ 500bps, vault 1500, trigger 13000/target 14500).
4. Dropped the shared oracle price to 0.70 via `scripts/seed-ledger.mjs price 0.70`. Within one
   5-second poll, the **Railway-hosted** Guard Agent (confirmed via `railway logs --service
   agent`, not a locally-run one) fired the rescue: outstanding 6000→4827.59, health
   11667→14500 bps.
5. Re-verified via `scripts/seed-ledger.mjs verify`: pool operator view still 0 ShadowVaults / 0
   RescueEvents / 0 GuardPolicies — privacy holds for the new party exactly as designed.
6. Reset the shared oracle price back to 1.00 (repo convention — leave the shared ledger neutral
   for other testers/teams).
7. Confirmed the deployed Vercel JS bundle actually bakes in the Railway backend URL (grepped
   the built bundle for the domain string).

## Real bug found and fixed mid-verification

The very first faucet attempt through the new Railway backend failed with a live `403 "A
security-sensitive error has been received"` from `/v2/commands/submit-and-wait-for-transaction`
— reproducible, not transient (distinct `correlationId` per retry). Diagnosis (see STATE.md §4
for the full lesson): the shared `validator-devnet-m2m` OAuth user's explicit `CanActAs` grants
for our fixed parties (`cermin-issuer` etc.), established back in Task 14–16, were **gone** from
the live rights list 5 days later — most likely evicted by a rights-count cap shared across every
hackathon team using the same identity (confirmed by inspecting `GET /v2/users/6/rights`, which
returned a 147-entry flat list containing dozens of other teams' party hints and zero `cermin-`
system parties, while a self-service party granted seconds earlier WAS present). Reads still
worked throughout (blanket `CanReadAsAnyParty` on the shared ParticipantAdmin user), masking the
problem until a write was attempted. Fix: re-ran `node scripts/seed-ledger.mjs` (no subcommand) —
idempotent, re-grants CanActAs/CanReadAs on all 5 fixed parties, safely skipped scene creation
since a Loan was already live. Confirmed fixed by re-running the faucet call successfully.

## Out of scope / follow-up

- The web3 UX pass (network badge, on-chain step feedback copy, progress stepper, disconnect
  control) — separate, independent piece of work, next.
- No dedicated DevNet validator (still using the shared hackathon secret, per decision #1).
- No automated re-grant of the fixed parties' rights if they get evicted again — the fix is a
  one-line manual re-run of `seed-ledger.mjs` for now; worth automating (e.g. a periodic cron, or
  a retry-with-reseed on a 403) if this recurs during the live event.
