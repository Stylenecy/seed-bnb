# 06 — Demo Runbook

Exact commands for the 3-minute demo (docs/04-scope.md §Demo script), in both modes:

- **Mode A — Standalone frontend (the fallback).** Zero dependencies beyond Node.
  The 5 screens run on an in-memory mock store with the same math as the ledger.
  This is the "never cut" simulation-mode rescue moment; it cannot break.
- **Mode B — Full stack on the local sandbox (the rehearsal environment).** Real
  Daml templates on a Canton sandbox, the real Guard Agent service firing
  `GuardRepay` on-ledger, the frontend polling live ledger state through the
  backend bridge. The sandbox runs the identical DAR and demo scene.
- **Mode C — CN Quickstart LocalNet (the "level blockchain" run).** The same DAR
  deployed to a real Canton Network topology (participant + super validator +
  Splice, Docker Compose), the Guard Agent talking JSON Ledger API **v2** with
  real per-user auth tokens. Proven end-to-end (Task 12); exact commands below.
- **Mode D — Canton DevNet via the Seaport hosted validator (the real,
  shared, multi-party network).** The same DAR on the hackathon's hosted DevNet
  validator, the Guard Agent talking JSON Ledger API **v2** with **OAuth2**
  tokens. Proven end-to-end (Task 14) — rescue + coupon sweep + privacy, live on
  DevNet. No self-run validator, no sponsor wait. Exact commands below.

> **Mode D is the real hackathon deployment**: full status, auth model, the
> shared-client caveat, and the run-your-own appendix are in `docs/07-devnet.md`.

**Routing (Task 19).** `/` (no hash) is now a public landing page — the pitch,
in one scroll, for judges who land on the URL cold. It is pure static content:
no store, no session read, no ledger call, in every mode (verified by an
in-repo test and a live network-tab check — see `.superpowers/sdd/task-19-report.md`).
Clicking **Launch app** (or going straight to `#/app`) enters the product,
which now lives under `#/app`, `#/app/borrow`, `#/app/vault`, `#/app/simulate`.
The old bare hashes (`#/dashboard`, `#/borrow`, `#/vault`, `#/simulate`) still
work — they silently rewrite to their `#/app/...` home, so any old link or
bookmark still lands correctly. Every demo below now opens with a 10-second
beat on the landing page before "Launch app".

Demo numbers to say out loud (identical in both modes): collateral 10,000 mUST @
1.00 → loan 6,000 mUSD → Health Ratio 166%. Price drops to 0.76 → 126.7% →
Cermin repays 758.62 from the Shadow Vault → back to exactly 145%. Quarterly
coupon 112.50 sweeps the loan down further. The pool sees none of it.

---

## Prerequisites

```bash
# Daml SDK 3.4.11 (installs the `daml` assistant into ~/.daml/bin; the repo's
# daml/ is ported to SDK 3.4.11 / LF 2.2 — see STATE.md §6)
curl -sSL https://get.daml.com/ | sh -s 3.4.11

# JDK 17 + Node (any recent Node; repo is tested on v25)
brew install openjdk@17 node

# every shell that runs daml commands needs:
export JAVA_HOME=$(brew --prefix openjdk@17)
export PATH="$JAVA_HOME/bin:$HOME/.daml/bin:$PATH"
```

Docker is **not** required for Modes A/B — only for Mode C (LocalNet).

---

## Mode A — Standalone frontend (fallback, 1 command)

```bash
cd frontend
npm install        # first time only
npm run dev        # → http://localhost:5173 (opens on the Landing page, "/")
```

No `VITE_API_URL` set ⇒ the app runs on its built-in mock store. This is the
default and must stay untouched — it is the demo-day parachute.

### The 3 minutes (Mode A)

1. **(10s) Landing page.** The tagline: "Shadow money. Zero liquidations." One
   scroll sells the pitch — the illustrative chart's two dashed lines ("Cermin
   defends" / "Protection floor") are the whole idea in one glance. Click
   **Launch app**.
2. **(20s) Problem.** Say it over the onboarding screen: "This May, RWA borrowers
   got liquidated by bots that could see their positions. Institutions will never
   accept that."
3. **(30s) Dashboard.** Position, loan, Shadow Vault with the privacy badge.
   "The pool cannot see this vault. Only you and your agent."
4. **(60s) Simulation screen.** Click **"Run the rescue scenario ($0.76)"** (or
   drag the slider down). Ring dips to amber → a beat later Cermin fires → feed
   prints "I repaid $758.62 from your Shadow Vault… you're back to 145%." → ring
   green. "No margin call. No liquidation. Nobody saw it."
5. **(30s) Coupon Sweep.** On the Vault screen flip the **Coupon Sweep** toggle
   on, then back on the Simulation screen click **"Fast-forward to coupon
   date"** — the feed prints the sweep sentence and outstanding shrinks by
   112.50 by itself. "Treasuries pay yield — Cermin turns your collateral into
   your repayment plan."
6. **(20s) Layer story.** "Built on CIP-56 — every asset entering Canton in 2026
   becomes protectable collateral with zero integration."

Reset anytime with the **Reset demo** button on the Simulation screen.

---

## Mode B — Full stack on the local sandbox

### Bring the stack up (1 command)

```bash
scripts/dev.sh
```

This: builds the DAR → starts `daml start` (Canton sandbox :6865 + JSON API
:7575) with `Cermin.Scripts.Demo:demoSetup` as the init-script (seeds the whole
demo scene: five parties, locked collateral, 6,000 loan, private policy +
vault) → extracts the namespaced party ids and the DAR package id → writes
`agent/.env` + `backend/.env` (MOCK_LEDGER=false) → starts the Guard Agent
(polls every 2s) and the backend bridge (:3001). Idempotent — re-running gives a
fresh scene. Logs live in `.dev/`.

Then start the frontend **pointed at the backend**:

```bash
cd frontend
VITE_API_URL=http://localhost:3001 npm run dev   # → http://localhost:5173 (Landing page first, as always)
```

With `VITE_API_URL` set the store polls `GET /api/position` every 4s once
inside the app (modest by design — the same code path serves the shared
DevNet validator in Mode D). The landing page itself never polls, in any
mode — see the routing note above.

### The 3 minutes (Mode B)

Steps 1–3 as in Mode A (Landing → Launch app → Connect screen if no session
yet, else straight to the dashboard, which now shows the seeded on-ledger
position: outstanding 6,000, Health Ratio 166.67%, vault 1,500).

**Step 3 — the rescue, on a real ledger.** On the Simulation screen click
**"Run the rescue scenario ($0.76)"** — in this mode that exercises the real
`PriceFeed.UpdatePrice` through the backend (as the Oracle party). Or from a
terminal:

```bash
curl -s http://localhost:3001/api/sim/price \
  -H 'Content-Type: application/json' -d '{"price":0.76}'
```

Within ~2s (one agent poll) the Guard Agent sees Health Ratio 126.67% < 130%
trigger and exercises `ShadowVault.GuardRepay` **on-ledger**:

```bash
tail -f .dev/agent.log
# Price dipped 24%. Repaid $758.62 from your Shadow Vault. Position safe. — Cermin

curl -s http://localhost:3001/api/position
# outstanding 5241.38, healthRatioBps 14500, vault 741.38, one rescue event
```

**Step 4 — Coupon Sweep, on a real ledger.** Issue the quarterly coupon for the
demo borrower against the running sandbox:

```bash
cd daml
daml script --dar .daml/dist/cermin-rwa-0.0.1.dar \
  --script-name Cermin.Scripts.Demo:payDemoCoupon \
  --ledger-host localhost --ledger-port 6865
```

The agent's next poll sweeps it via `CouponDistribution.SweepToLoan`
(outstanding 5241.38 → 5128.88, i.e. −112.50; the feed shows "Coupon swept into
loan repayment").

**Privacy proof (optional flourish for judges):** query as the pool operator —
it can see the Loan but no ShadowVault/GuardPolicy/RescueEvent contracts exist
in its view. The rescue is invisible to the counterparty.

### Tear down

```bash
scripts/stop.sh
```

---

## Mode C — CN Quickstart LocalNet (real Canton network)

Proven end-to-end (Task 12): the identical DAR on a real Canton 3.5.x
participant with a super validator and Splice, the Guard Agent on **JSON Ledger
API v2** (`LEDGER_API=v2`) with real per-user auth. Everything below is the
exact command set that ran.

**Requirements:** Docker Desktop with **≥ 10 GiB** VM memory (the lean stack's
steady state is ~4.6 GiB of containers — canton 2.3 GiB, splice 1.2 GiB,
postgres 1.1 GiB — but boot spikes higher; 8 GiB is tight, 11 GiB is
comfortable). Raise it in Docker Desktop → Settings → Resources.

### 1. Clone cn-quickstart (sibling of this repo) and boot the lean LocalNet

```bash
cd ..   # to the directory containing cermin-rwa/
git clone https://github.com/digital-asset/cn-quickstart

cd cermin-rwa
scripts/localnet.sh up        # pull images (~3 GB first time) + start, detached
```

`scripts/localnet.sh` boots a **lean profile**: the Splice LocalNet modules
(canton + splice + postgres + splice-onboarding + wallet/scan UIs) in
**shared-secret auth mode**, WITHOUT the quickstart's own licensing app,
Keycloak, PQS, or the observability stack — none of which the Cermin demo
needs. (The quickstart's `make build`/`make start` path needs its Nix devshell
toolchain — dpm, gradle, npm — which is why we drive docker compose directly;
the network containers are identical.) Wait until `scripts/localnet.sh ps`
shows `canton` **healthy** (~1–2 min after images are present).

Useful endpoints once up: App Provider participant JSON API v2 →
`http://localhost:3975/v2/`, its OpenAPI → `http://localhost:3975/docs/openapi`,
Scan UI → `http://scan.localhost:4000`.

### 2. Build the DAR, upload, allocate parties, seed the scene (1 command)

```bash
cd daml && daml build && cd ..     # → daml/.daml/dist/cermin-rwa-0.0.1.dar
node scripts/seed-localnet.mjs
```

The seeder talks JSON API v2 directly and is **safe to re-run**: DAR upload,
party allocation, and user provisioning are idempotent, and the scene step
skips itself when a live Loan already exists (contract creates are NOT
idempotent — for a fresh scene, `scripts/localnet.sh clean` first). It:
- uploads the DAR (`POST /v2/packages`),
- allocates the five parties (`POST /v2/parties`) — party ids come back as
  `<Hint>::<participant-namespace>`, e.g. `Borrower::122099d5ad0f...` (the
  namespace changes on every fresh LocalNet, so ALWAYS copy the printed ids),
- creates ledger **users** with actAs/readAs rights (`POST /v2/users`,
  `/v2/users/<id>/rights`): `cermin` (super — all five parties, seeding only),
  `cermin-guard` (GuardAgent), `cermin-borrower` (Borrower), `cermin-oracle`
  (Oracle),
- builds the exact pre-rescue demo scene (collateral 10,000 @ 1.00, loan 6,000
  @ 500 bps, Guard Policy 13000/14500/2000 with Coupon Sweep ON, Shadow Vault
  1,500) — the same scene as `Cermin.Scripts.Demo:demoSetup`.

Why not `daml script demoSetup` here? Under LocalNet's per-user tokens the
script's token would need actAs rights on parties it only allocates mid-run —
the JSON-API seeder provisions users first, then submits with them, and
exercises the exact v2 path the services use.

**Auth model (shared-secret mode):** every request carries an HS256 JWT signed
with the secret `unsafe`, payload `{"sub": "<ledger-user-id>", "aud":
"https://canton.network.global"}`. The participant resolves the user's
actAs/readAs rights — the token names a USER, not a party (unlike the v1
sandbox JWT). The seeder and both services mint these internally; nothing to
configure beyond the env below. (If you re-run `cn-quickstart`'s `make setup`
and pick OAuth2 mode instead, tokens must come from its Keycloak
`client_credentials` flow — not covered here; shared-secret is the LocalNet
default and what `scripts/localnet.sh` pins.)

### 3. Run the Guard Agent against LocalNet (JSON API v2)

```bash
cd agent
MOCK_LEDGER=false LEDGER_API=v2 \
  LEDGER_URL=http://localhost:3975 \
  PARTY_GUARD_AGENT="GuardAgent::<namespace-from-step-2>" \
  npm start
# → [cermin-guard-agent] LEDGER_API=v2 — JSON Ledger API v2 (LocalNet).
```

(`LEDGER_USER_ID=cermin-guard`, `LEDGER_AUDIENCE`, `LEDGER_JWT_SECRET=unsafe`,
`LEDGER_PACKAGE_NAME=cermin-rwa` all default correctly for LocalNet — see
`agent/.env.example`.)

Optional — backend + frontend on LocalNet, same pattern:

```bash
cd backend
MOCK_LEDGER=false LEDGER_API=v2 LEDGER_URL=http://localhost:3975 \
  PARTY_BORROWER="Borrower::<ns>" PARTY_ORACLE="Oracle::<ns>" npm start
# frontend: VITE_API_URL=http://localhost:3001 npm run dev
```

### 4. The rescue moment (what actually ran)

```bash
node scripts/seed-localnet.mjs price 0.76     # oracle exercises UpdatePrice
# agent log, next poll (~2s):
#   Price dipped 24%. Repaid $758.62 from your Shadow Vault. Position safe. — Cermin
# on-ledger: outstanding 5241.38, Health Ratio 12667 → exactly 14500 bps,
#            RescueEvent(amount 758.62); PoolOperator sees NO RescueEvent, NO Vault.

node scripts/seed-localnet.mjs coupon         # issuer pays the 112.50 quarterly coupon
# agent log, next poll:
#   Coupon Sweep: applied $112.50 coupon to your loan. — Cermin
# on-ledger: outstanding 5128.88 @ 14818 bps, coupon contract consumed.

node scripts/seed-localnet.mjs verify         # on-ledger acceptance + PRIVACY check
# BORROWER view: outstanding 5128.88, vault 741.38, Health Ratio 14818 bps,
#   both RescueEvents listed.
# POOL OPERATOR view (privacy check — all MUST be 0):
#   ShadowVaults: 0  RescueEvents: 0  GuardPolicies: 0
# (exits non-zero if the pool can see any private contract)
```

### 5. Tear down / reset

```bash
scripts/localnet.sh down     # stop containers, KEEP ledger state (volumes)
scripts/localnet.sh up       # resume where you left off
scripts/localnet.sh clean    # full reset (down -v) — new namespace, re-seed after
```

### Mode C gotchas (all hit for real, all in the seams now)

- **v2 numerics are strings BOTH ways.** Outbound create/exercise arguments
  must send Daml `Decimal` AND `Int` as JSON strings (`"450"`, not `450` —
  the API errors with `Expected ujson.Str`); inbound payloads return them as
  strings too (`"6000.0000000000"`, `"500"`), coerced at the seam.
- **Template ids are asymmetric.** Requests (ACS filters, commands) use the
  package-NAME form `#cermin-rwa:Cermin.Credit:Loan`; events come BACK with
  package-ID template ids — the seams match created events by
  `:Module:Entity` suffix.
- **Reads need an offset.** `/v2/state/active-contracts` requires
  `activeAtOffset`; fetch `GET /v2/state/ledger-end` first (the seams do).
- **A wrong `aud` or unknown `sub` is a 401** — unlike the v1 sandbox's
  silent 0-row behavior, v2 auth failures are loud.
- **Docker restart = participant comes back by itself, state intact** (postgres
  volume), but containers without `restart: always` (postgres, web UIs) stay
  down after a daemon restart — `scripts/localnet.sh up` heals the stack.

---

## Mode D — Canton DevNet (Seaport hosted validator, the real network)

The same DAR + seams + seeder as Mode C, re-pointed at the hackathon's **hosted
DevNet validator** and re-authed to **OAuth2**. No Docker, no LocalNet, no
self-run validator. Full detail + the shared-client caveat: `docs/07-devnet.md`.

**1. `.env` (gitignored — never commit the shared secret):**

```bash
LEDGER_AUTH=oauth2
LEDGER_URL=https://ledger-api.validator.devnet.sandbox.fivenorth.io
LEDGER_PACKAGE_NAME=cermin-rwa
AUTH_URL=https://auth.sandbox.fivenorth.io/application/o/token/
AUTH_CLIENT_ID=validator-devnet-m2m
AUTH_CLIENT_SECRET=<shared hackathon secret>
AUTH_AUDIENCE=validator-devnet-m2m
AUTH_SCOPE=daml_ledger_api
```

**2. Build + deploy + seed** (from repo root, with the env above sourced):

```bash
(cd daml && daml build)                 # -> daml/.daml/dist/cermin-rwa-0.0.1.dar
node scripts/seed-ledger.mjs            # upload DAR (idempotent) + allocate the 5
                                        #   cermin-* parties + grant rights + seed scene
node scripts/seed-ledger.mjs verify     # initial: 6000 @ 16667, pool 0/0/0
```

The seeder prints the 5 party ids and the participant namespace — copy the
namespace for the agent below.

**3. Run the Guard Agent against DevNet** (own terminal, `POLL_MS=5000`):

```bash
cd agent
MOCK_LEDGER=false LEDGER_API=v2 LEDGER_AUTH=oauth2 POLL_MS=5000 \
  LEDGER_URL=https://ledger-api.validator.devnet.sandbox.fivenorth.io \
  AUTH_URL=https://auth.sandbox.fivenorth.io/application/o/token/ \
  AUTH_CLIENT_ID=validator-devnet-m2m AUTH_CLIENT_SECRET=<secret> \
  AUTH_AUDIENCE=validator-devnet-m2m AUTH_SCOPE=daml_ledger_api \
  PARTY_GUARD_AGENT="cermin-guard-agent::<namespace>" \
  npx tsx src/index.ts
```

**4. Drive the demo** (repo root, env sourced):

```bash
node scripts/seed-ledger.mjs price 0.76   # oracle UpdatePrice -> agent rescues on its next 5s poll
node scripts/seed-ledger.mjs coupon       # pay the 112.50 coupon -> agent sweeps it
node scripts/seed-ledger.mjs verify        # final: 5128.88 @ 14818, 2 rescues, pool 0/0/0
```

**5. The frontend on DevNet (the full user-facing chain, live).** Proven E2E in
Task 15: React FE → backend (v2 + OAuth2) → Seaport hosted validator. Give the
backend a `backend/.env` (gitignored) with the live config **and the two
namespaced party ids** the seeder printed:

```bash
# backend/.env
PORT=3001
MOCK_LEDGER=false
LEDGER_API=v2
LEDGER_AUTH=oauth2
LEDGER_URL=https://ledger-api.validator.devnet.sandbox.fivenorth.io
LEDGER_PACKAGE_NAME=cermin-rwa
PARTY_BORROWER=cermin-borrower::<namespace>
PARTY_ORACLE=cermin-oracle::<namespace>
AUTH_URL=https://auth.sandbox.fivenorth.io/application/o/token/
AUTH_CLIENT_ID=validator-devnet-m2m
AUTH_CLIENT_SECRET=<shared hackathon secret>
AUTH_AUDIENCE=validator-devnet-m2m
AUTH_SCOPE=daml_ledger_api
```

```bash
(cd backend && npm start)                    # reads backend/.env; :3001, live DevNet reads/writes
curl -s http://localhost:3001/api/position   # sanity: real outstanding/vault/ratio + ledger rescueEvents
cd frontend && VITE_API_URL=http://localhost:3001 npm run dev   # :5173
```

With `VITE_API_URL` set the app is in **backend mode**: it still opens on the
public Landing page (`/`) first — click **Launch app** to reach the
**Connect screen** (Task 16 self-service — see 5b), not the mock onboarding. The
`backend/.env` above ALSO needs the origination parties (`PARTY_ISSUER`,
`PARTY_POOL_OPERATOR`, `PARTY_GUARD_AGENT`) for the faucet + live borrow, and a
polite `LEDGER_MAX_CONCURRENCY` (default 4; 3 on a constrained path). Every
number is live ledger state (polled every 4s — ≥3s etiquette on the shared
validator, each tick fans into ~6 ACS reads behind the backend); the header badge
reads **"Live · Canton ledger"** and shows the connected user's party id as their
copyable **address**, and *Cermin's notes* renders the ledger's `RescueEvent`s
(auto-repay + coupon sweep), not mock sentences. `payCoupon` / `setCouponSweep`
are hidden in backend mode; the vault top-up drops its mock "wallet" gating
(there is no on-ledger wallet — TopUp just credits the vault).

**5b. The self-service journey (Task 16 — EVM-testnet UX parity, zero hardcoded
users).** Any visitor drives the whole lifecycle from the UI, live on DevNet:

1. **Connect** — type a username → `POST /api/onboard` slugifies it to a
   `cermin-u-<slug>` party hint, check-before-allocates the party, grants the
   OAuth writer `CanActAs`/`CanReadAs` on it, and stores it in `localStorage`.
   A returning user typing the same name resolves the **same** party.
2. **Faucet** — the empty-state Dashboard shows **"Claim 10,000 test mUST"** →
   `POST /api/faucet` mints one `TreasuryToken` to the party (refuses a second
   claim with a clear **409**).
3. **Borrow** — the borrow flow's strategy cards create the **real** GuardPolicy:
   `POST /api/borrow` runs full origination as issuer+pool+borrower (stage
   liquidity → offer → `AcceptOffer` locks the collateral → Loan) + GuardPolicy
   (`target = trigger + 1500`, maxRepay 2000) + ShadowVault. A second live loan
   for the same party is refused **409**.
4. **Protect** — fund the vault, drop the price on Simulate, and the Guard Agent
   rescues **this user's** loan on its next poll — every user independently, each
   seeing only their own loan/vault/rescues. Every request carries the party in
   the `X-Cermin-Party` header, so the backend scopes reads/writes to it. The
   pool never sees any of it (verify shows `0/0/0`).

Two users at once (the multi-user proof): open the app in two separate browser
profiles (each keeps its own `localStorage` session), connect as different names,
and run steps 2–4 in each. One price drop rescues both, independently, to each
one's own strategy target. Per-party ledger evidence:
`node scripts/seed-ledger.mjs verify --party "cermin-u-<slug>::<namespace>"`.

**6. Demo reset loop (repeatable, UI + API — no new choices, no re-seed).** Keep
the Guard Agent from step 3 running (`POLL_MS=5000`). Then:

```bash
# a. reset the oracle price (real UpdatePrice) — ratio jumps well clear of the trigger, no rescue
curl -s http://localhost:3001/api/sim/price -H 'Content-Type: application/json' -d '{"price":1.0}'
```

- **b.** In the UI: **Shadow Vault → Add funds →** type an amount (e.g. `1000`) **→
  Add.** This is a **real `ShadowVault.TopUp` on DevNet** — it gives the guard
  enough to fully restore to 145%.
- **c.** On **Simulate**, slide the price down past the **live-computed breach**:
  the breach price is `1.30 × outstanding ÷ 10000` for the **current**
  outstanding (compute it each run — outstanding changes run-to-run). The Guard
  Agent exercises `GuardRepay` on its next 5s poll; the FE poll picks it up — the
  ring dips **amber** ("Action suggested"), then a beat later recovers **green**
  ("Protected"), and a **new ledger rescue event** appears at the top of the feed.
- **d.** `node scripts/seed-ledger.mjs verify` — on-ledger confirmation + the
  privacy check (PoolOperator still sees `0/0/0`).

**Expected numbers (the FE shows live truth; narration adapts).** Worked example
from the Task 15 run, scene starting at outstanding **5128.88**:

| step | price | outstanding | Health Ratio | vault | rescues |
|---|---|---|---|---|---|
| reset | 1.00 | 5128.88 | 195.0% (safe) | 741.38 | 2 |
| top up +1000 | 1.00 | 5128.88 | 195.0% | 1741.38 | 2 |
| slide → 0.62 | 0.62 | 5128.88 | **120.9%** (breach) | 1741.38 | 2 |
| agent GuardRepay | 0.62 | **4275.86** | **145.0%** (green) | 888.36 | **3** |

The agent repaid **853.02** (`120.9% → 145.0%`). Breach threshold here was
`1.30 × 5128.88 / 10000 = 0.667`, so `0.62` breaches cleanly.

> **Runway caveat.** Each live rescue permanently lowers outstanding (there is no
> re-borrow in live mode), so the breach price falls each loop. The slider floor
> is **$0.50**, so the loop stays demoable while outstanding **> ~3846**
> (`0.50 × 10000 / 1.30`). Below that the slider can no longer breach 130% —
> allocate a **fresh suffixed party set** (`PARTY_HINT_*`) and re-seed rather
> than improvising. DevNet parties are permanent; the scene persists by design.

### Mode D gotchas (DevNet-specific; all in the seams/seeder now)

- **Auth is OAuth2, not shared-secret.** `LEDGER_AUTH=oauth2` fetches a
  `client_credentials` bearer, caches it (8h TTL), and refreshes proactively +
  on a 401. The token maps to a shared ParticipantAdmin user — see the
  **shared-client caveat** in `docs/07-devnet.md` §2.1.
- **Command `userId` is omitted.** A mismatched `userId` is rejected 403; an
  omitted one defaults to the authenticated OAuth user (what the seams do).
- **Parties are namespaced + permanent.** Hints `cermin-issuer` …
  `cermin-oracle`; the seeder reuses any that already exist and never touches
  other teams' state. There is no `clean` — a fresh scene needs fresh hints.
- **Modest polling.** `POLL_MS=5000` on the shared validator (vs. 2000 local).
- **The "Run the rescue scenario ($0.76)" button may not breach live.** It hard-
  jumps to $0.76, which only breaches 130% when outstanding ≈ 6000 (the freshly
  seeded scene). Once earlier rescues have shrunk outstanding, $0.76 sits *above*
  the trigger — drive the slider to the **live-computed** breach price (step 6c).
- **Vault top-up needs no wallet.** In backend mode the top-up field is not gated
  on a mock wallet balance (there is no on-ledger wallet); `Add` submits a real
  `ShadowVault.TopUp`. Withdraw is still gated on the live vault balance.
- The v2 numerics / template-id / offset facts from Mode C all still apply.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `daml start: Not in project` | `daml start` must run from `daml/` (where daml.yaml is). `scripts/dev.sh` does this for you. |
| Ports 6865 / 7575 / 3001 already in use | A previous stack is still up: `scripts/stop.sh` (kills by pidfile *and* by port, so stale pidfiles are fine). |
| Queries return **0 contracts** but no error | The JWT's `ledgerId` claim doesn't match the participant (sandbox = `sandbox`). This fails *silently* — wrong ledger id means empty result sets, not a 4xx. Set `LEDGER_ID` correctly. |
| `LEDGER_ID_MISMATCH` 404s in agent/backend logs | Same root cause as above on setups that do validate; fix `LEDGER_ID`. |
| `JsonReaderError ... Expected JsString(<packageId>:<module>:<entity>)` | Template ids must be package-qualified. `LEDGER_PACKAGE_ID` is missing/stale — re-run `scripts/dev.sh`, or extract manually: `daml damlc inspect-dar <dar> --json` → `main_package_id`. |
| Agent/backend see nothing after editing Daml code | The package id changed with the rebuild but `.env` still has the old one — stale `.env`. Re-run `scripts/dev.sh` (it rewrites both .env files each run). |
| Party ids rejected / `PARTY_NOT_KNOWN` | `.env` still holds party ids from a previous sandbox run (each restart allocates a fresh namespace). Re-run `scripts/dev.sh`. |
| `/api/sim/price` 500s | Backend can't reach the JSON API, or `PARTY_ORACLE` is missing/stale (UpdatePrice must be submitted as the Oracle). Check `.dev/backend.log`. |
| Agent never fires after the price drop | Check `.dev/agent.log`. Verify `MOCK_LEDGER=false` in `agent/.env` and that the Guard Agent party id matches `list-parties` output. |
| Coupon sweep does nothing | `payDemoCoupon` is a deliberate no-op when it can't find the demo parties — make sure you ran it against the *running* sandbox (`--ledger-host/--ledger-port`), not a fresh in-memory one. |
| Live-mode `/api/borrow` returns 409 | Expected when the party already has a live loan (single-loan per borrower) — the UI shows an "already borrowing" state. A 409 on `/api/faucet` means the user already holds ≥10,000 mUST (one claim per user). |
| Live-mode `/api/borrow` / `/api/faucet` needs origination parties | The v2 seam mints as the issuer and originates as the pool, so `PARTY_ISSUER`, `PARTY_POOL_OPERATOR`, `PARTY_GUARD_AGENT` must be set (namespaced ids from the seeder). Missing them throws a clear error. (v1 / `daml start` Mode B does not support self-service borrow.) |
| `getPosition` 500s intermittently on a constrained network | A fan-out of ACS reads can overwhelm a throttled path. The seam caps concurrency (`LEDGER_MAX_CONCURRENCY`, default 4) and retries a request once on a transient throw; lower it to 3 if you still see connect timeouts. |
| Frontend shows mock data during a live demo | `VITE_API_URL` wasn't set when the dev server started. Vite reads env at startup: stop it and restart with `VITE_API_URL=http://localhost:3001 npm run dev`. |
| First `scripts/dev.sh` run is slow | First `daml start` downloads/warm-starts Canton (~60–90s). Later runs are faster. |
| Browser calls to :3001 blocked by CORS | The backend sends permissive CORS headers itself (no proxy needed). If you still see CORS errors, the backend crashed — check `.dev/backend.log`. |
