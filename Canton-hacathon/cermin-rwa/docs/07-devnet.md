# 07 — DevNet Deployment (Seaport hosted validator)

**Status: DONE. The full rescue + coupon-sweep loop is proven live on the real,
shared Canton DevNet**, via the hackathon's Seaport / Five North hosted
validator — with privacy verified (the pool operator sees zero private
contracts). No self-run validator, no sponsor, no IP-allowlist wait.

This supersedes the run-your-own onboarding path (Task 13), which is retained as
a **post-hackathon appendix** (§6) — its sponsor / IP-allowlist `[USER ACTION]`
steps are **NOT needed for the hackathon**. The hosted validator is now THE
hackathon path.

## 1. What the hackathon provides

The Encode "Build on Canton" hackathon runs a **shared hosted DevNet validator**
(Seaport, by Five North) with direct **JSON Ledger API v2** access — a real,
multi-party Canton network that judges can independently inspect.

| | Endpoint |
|---|---|
| **Ledger REST (JSON Ledger API v2)** | `https://ledger-api.validator.devnet.sandbox.fivenorth.io` |
| **OAuth2 token** | `POST https://auth.sandbox.fivenorth.io/application/o/token/` (`client_credentials`) |
| **WebSocket** (streams; not used by Cermin) | `wss://ledger-api.validator.devnet.sandbox.fivenorth.io` (subprotocols `jwt.token.<token>`, `daml.ws.auth`) |
| **Seaport web workspace** (browser IDE) | `https://app.devnet.seaport.to` |

Cermin does not use the Seaport browser IDE — it deploys and drives the ledger
directly over the JSON API v2 with the same `agent/` + `backend/` seams and
`scripts/seed-ledger.mjs` that already run against LocalNet, only re-pointed and
re-authed. The Seaport guide (`https://github.com/Jatinp26/Seaport-Guide`)
documents the browser workflow; our path is the programmatic one.

## 2. Auth model on Seaport DevNet (verified live)

Auth is **OAuth2 client_credentials**, not LocalNet's shared-secret HS256. All
facts below were verified live on 2026-07-11.

- **Token**: `POST .../application/o/token/`, form body
  `grant_type=client_credentials, client_id=validator-devnet-m2m,
  audience=validator-devnet-m2m, scope=daml_ledger_api, client_secret=…` →
  `{access_token, token_type: Bearer, expires_in: 28800}` (8-hour TTL). The
  seams cache the bearer and refresh it **proactively** (60 s before expiry) and
  **reactively** (force-refresh + one retry on a `401`).
- **The token maps to ledger user `6`** (username `otc-canton-fund-oauth`) on
  participant `5nsandbox-devnet-2::1220a14c…`. That user is a **ParticipantAdmin**
  and additionally holds `CanReadAsAnyParty` + `CanExecuteAsAnyParty`, plus a few
  hundred explicit `CanActAs` grants — but **NOT** `CanActAsAnyParty`.
- **Consequences for deployment** (all exercised by `scripts/seed-ledger.mjs` in
  `oauth2` mode):
  - **DAR upload** (`POST /v2/packages`, octet-stream), **party allocation**
    (`POST /v2/parties`), and **rights grants** (`POST /v2/users/6/rights`) all
    work because user 6 is ParticipantAdmin.
  - Allocating a party does **not** auto-grant the caller `actAs`, and user 6
    lacks `CanActAsAnyParty`, so the seeder **explicitly grants user 6
    `CanActAs`+`CanReadAs` on our 5 parties** before submitting as them.
  - There is only ONE OAuth identity, so — unlike LocalNet's four `cermin-*`
    ledger users — the agent, backend, and seeder all authenticate as user 6 and
    differ only by the `actAs` party. Reads across parties work via
    `CanReadAsAnyParty`.
  - The command `userId` field is **OMITTED** in oauth2 mode: a mismatched
    `userId` is rejected `403`, while an omitted one is accepted (the participant
    defaults it to the authenticated user). Verified both ways.
- **Numerics / template ids** are the same Canton-3/LF-2.x facts LocalNet
  established: Decimal AND Int are JSON strings both ways; requests use
  package-NAME ids `#cermin-rwa:Mod:Ent`, returned events use package-ID ids
  (matched by `:Module:Entity` suffix); ACS reads need `activeAtOffset` from
  `GET /v2/state/ledger-end`.

### 2.1 The shared-client caveat (honest disclosure)

**The `validator-devnet-m2m` OAuth client is shared by every hackathon team.**
Ledger-side party privacy still holds exactly as designed — a contract is only
disclosed to its Daml stakeholders, and our `verify` step proves the pool
operator sees **zero** ShadowVaults / RescueEvents / GuardPolicies on the live
participant. **But** anyone holding the shared secret authenticates as the same
ParticipantAdmin user (`6`), which has `CanReadAsAnyParty` and can therefore
query as any party it can name, including our `cermin-borrower`. That is a
**sandbox constraint of the shared hackathon credential — not a property of
Cermin's design.** In a real deployment each party is a distinct OIDC identity
holding only its own rights (see §6), and the privacy guarantee is enforced by
who-can-authenticate-as-whom on top of the ledger-side stakeholder model. State
this plainly in any demo: the privacy *mechanism* is real and proven; the shared
*credential* is a hackathon convenience, not the production trust boundary.

## 3. Shared-validator etiquette (binding)

This is a live network other teams depend on. The rules:

- **Namespaced party hints**: `cermin-issuer`, `cermin-borrower`,
  `cermin-pool-operator`, `cermin-guard-agent`, `cermin-oracle`. The seeder
  checks for an existing party with each hint **before** allocating (another
  session may already have created it) and reuses it. If a hint ever collides,
  add a short random suffix and record it.
- **Modest polling**: the Guard Agent runs `POLL_MS=5000` on DevNet (vs. 2000 on
  LocalNet).
- **Never touch contracts, parties, packages, or rights that aren't ours.** DAR
  upload is append-only; we never archive or mutate other teams' state.

## 4. Runbook — Mode D (live commands)

Prereqs: Node ≥ 20, the built DAR (`daml build` → `daml/.daml/dist/cermin-rwa-0.0.1.dar`),
and a local **`.env`** (gitignored) with the shared OAuth secret. Never commit
the secret — `.env.example` ships placeholders only.

```bash
# .env (or exported) — DevNet OAuth2 config
LEDGER_AUTH=oauth2
LEDGER_URL=https://ledger-api.validator.devnet.sandbox.fivenorth.io
LEDGER_PACKAGE_NAME=cermin-rwa
AUTH_URL=https://auth.sandbox.fivenorth.io/application/o/token/
AUTH_CLIENT_ID=validator-devnet-m2m
AUTH_CLIENT_SECRET=<shared hackathon secret — do NOT commit>
AUTH_AUDIENCE=validator-devnet-m2m
AUTH_SCOPE=daml_ledger_api
```

```bash
# 0. build the DAR (once)
cd daml && daml build && cd ..

# 1. deploy + seed: upload DAR (idempotent), allocate the 5 namespaced parties
#    (reusing any that exist), grant the OAuth user rights, build the demo scene
node scripts/seed-ledger.mjs            # LEDGER_AUTH=oauth2 in the env selects DevNet
node scripts/seed-ledger.mjs verify     # initial: outstanding 6000 @ 16667, pool 0/0/0

# 2. run the Guard Agent against DevNet (own terminal; POLL_MS=5000)
cd agent
MOCK_LEDGER=false LEDGER_API=v2 POLL_MS=5000 \
  PARTY_GUARD_AGENT="cermin-guard-agent::<namespace>" \
  npx tsx src/index.ts
# (namespace is the ::-suffix printed by the seeder; the demo run used
#  1220a14ca128063b8dc9d1ebb0bd22633be9f2168500f4dbc1ecaeb1855b14e5acf8)

# 3. drive the demo (from the repo root, DevNet env sourced)
node scripts/seed-ledger.mjs price 0.76 # oracle drops the price -> agent rescues
node scripts/seed-ledger.mjs coupon     # pay a coupon -> agent sweeps it
node scripts/seed-ledger.mjs verify      # final: 5128.88 @ 14818, 2 rescues, pool 0/0/0
```

The backend can serve the frontend against DevNet with the same env plus
`LEDGER_API=v2 LEDGER_AUTH=oauth2 PARTY_BORROWER=cermin-borrower::<ns>
PARTY_ORACLE=cermin-oracle::<ns>` (its `/api/borrow` stays 400 by design — the
demo runs against the seeded position).

## 5. Proven on DevNet (2026-07-11) — transcript evidence

Participant `5nsandbox-devnet-2::1220a14c…`, Canton **3.5.7**, real
`global-domain::1220be58…` synchronizer (writes carry a `paidTrafficCost`).
Parties allocated (namespace `1220a14ca128063b8dc9d1ebb0bd22633be9f2168500f4dbc1ecaeb1855b14e5acf8`):
`cermin-issuer`, `cermin-borrower`, `cermin-pool-operator`, `cermin-guard-agent`,
`cermin-oracle`.

```
seed:    outstanding 6000.00  @ 16667 bps   vault 1500.00   pool 0/0/0
price 0.76 -> agent (POLL_MS=5000): "Price dipped 24%. Repaid $758.62 from your Shadow Vault. Position safe. — Cermin"
verify:  outstanding 5241.38  @ 14500 bps   vault  741.38   RescueEvents 1   pool 0/0/0
coupon    -> agent: "Coupon Sweep: applied $112.50 coupon to your loan. — Cermin"
verify:  outstanding 5128.88  @ 14818 bps   vault  741.38   RescueEvents 2   pool 0/0/0   VERIFY_EXIT=0
   - Auto-repay from Shadow Vault restored the Health Ratio | 758.62 | 12667 -> 14500
   - Coupon swept into loan repayment                       | 112.50 | 14500 -> 14818
```

Every number matches the binding demo numbers (STATE.md §2) and the LocalNet
Task 12 run exactly — same DAR (`d5a219e52e59…`), same math, now on the shared
DevNet. Pool-operator privacy holds on the live participant.

## 5.5 Production deployment (2026-07-16, Task 22) — Railway + Vercel, live

The public frontend (`https://cermin-rwa.vercel.app`) no longer runs the mock-only demo in
production — it talks to this same DevNet participant and the same 5 parties above, through a
persistently-running backend + agent on Railway.

```
cermin-rwa.vercel.app (Vercel, VITE_API_URL set)
        │
        ▼
Railway project "cermin-rwa"
  ├─ service: backend  (Express API, always-on, tsx src/index.ts)
  └─ service: agent    (Guard Agent poller, always-on, POLL_MS=5000)
        │
        ▼
Same Seaport DevNet participant + namespaced parties as §5 above
```

- Both services set `MOCK_LEDGER=false LEDGER_API=v2 LEDGER_AUTH=oauth2`, the ledger URL, the
  shared OAuth secret, and the fixed party ids — copied from the already-proven
  `backend/.env`/`agent/.env`, not re-seeded.
- Deploy: `railway up ./backend --path-as-root --service backend` /
  `railway up ./agent --path-as-root --service agent` from the repo root (monorepo — each
  service's root is scoped via `--path-as-root`, not a separate git repo).
- `tsx` is a real `dependency` (not `devDependency`) in both `backend/package.json` and
  `agent/package.json` — Railway's Nixpacks build runs `npm ci` in production mode, which prunes
  devDependencies, so a build succeeding does not by itself prove the start command will find its
  interpreter.
- `backend/src/index.ts` rate-limits `POST /api/onboard` + `POST /api/faucet` per IP (5/min,
  in-memory) — production now takes public internet traffic against the shared validator.
- Local `npm run dev` (no `VITE_API_URL`) is still the mock parachute — dev-only now, since prod
  has no mock fallback (accepted trade-off, not a bug, if Railway/DevNet has an outage).
- **Operational lesson:** the shared OAuth identity's `CanActAs` grants on our fixed parties can
  be evicted over time by the sheer number of other hackathon teams sharing the same client (see
  STATE.md §4). If self-service writes start 403ing with "a security-sensitive error" while reads
  still work, re-run `node scripts/seed-ledger.mjs` (no subcommand, idempotent, safe against a
  live scene) before assuming anything else is wrong.

Full design + verification transcript: `docs/plans/2026-07-16-railway-devnet-deploy.md`.

---

## 6. Appendix (post-hackathon): running your own DevNet validator

**Not needed for the hackathon** — the Seaport hosted validator (§1–5) is the
hackathon path. This appendix preserves the Task 13 analysis for the roadmap:
becoming a first-party validator operator after the hackathon. Its former
`[USER ACTION]` items (find a sponsor SV, stand up a fixed-egress-IP host, wait
2–7 days for the sponsor's IP allowlist) are **struck as not required** now that
a hosted validator is available; they apply only if/when Cermin runs its own node.

### 6.1 Self-service, but not same-day

Onboarding your own DevNet validator is genuinely self-service, but gated on a
Super Validator (SV) sponsor adopting your validator's egress IP into their
allowlist — the official docs state **2–7 days**, out of your control once
submitted. The DevNet onboarding secret itself is one-click self-service:

```bash
curl -X POST "$SPONSOR_SV_URL/api/sv/v0/devnet/onboard/validator/prepare"   # 1-hour TTL, DevNet only
```

Finding a sponsor is the real friction: there is **no public "pick a sponsor SV"
directory**. Channels are the GSF `#validator-operations` Slack, the
`lists.sync.global` mailing lists, or the `https://canton.foundation/validator-request/`
form (which itself expects an informal sponsor contact already). The staging /
deploy tooling is prepared in `deploy/devnet/` (`fetch-validator-bundle.sh`
downloads the official `splice-node` bundle; `.env.example`; `README.md`).

### 6.2 Auth: OIDC, not shared-secret

A self-run validator's real auth is **OIDC** (Auth0 or Keycloak) via the bundle's
`-a` flag (`AUTH_URL`, `AUTH_JWKS_URL`, `LEDGER_API_AUTH_AUDIENCE`,
`VALIDATOR_AUTH_CLIENT_ID`/`_SECRET`) — each party a distinct identity holding
only its own rights (the production trust boundary referenced in §2.1). Our
seams' `LEDGER_AUTH=oauth2` path already speaks OAuth2 client_credentials, so the
same token machinery carries over; only the IdP endpoints/credentials change.
The bundle's no-`-a` default is a self-signed dev-mode scheme the docs call
"highly insecure" — a smoke-test only.

### 6.3 Hardware

Digital Asset's combined validator+participant table (fetched 2026-07-11):

| Usage | CPUs | Memory | DB CPUs | DB Memory | DB size |
|---|---|---|---|---|---|
| Experiments on local laptop or minimal VM | 1 | 6GB | 1 | 1GB | 1GB |
| Production validator with little activity | 2 | 8GB | 2 | 4GB | 10GB |
| Production validator, app provider, moderate activity | 2 | 16GB | 2 | 4GB | 100GB |

The minimal "experiments" tier (~2 CPU / ~7 GiB combined) fits this laptop's
11 GiB Docker VM with LocalNet stopped, but **not alongside** LocalNet (~4.6 GiB
steady). Run one network at a time, or put the validator on a cloud VM (which
also supplies the fixed egress IP §6.1 wants).

### 6.4 TestNet roadmap (for the pitch)

TestNet is **not** self-service: it requires Tokenomics Committee approval via
the same `canton.foundation/validator-request/` form, positioned as "production
staging" — not hackathon-reachable in days. Roadmap: **DevNet → TestNet (once the
product has real usage and is near production-ready) → MainNet.** DevNet is the
highest tier reachable without a governance/business-approval process, and — via
Seaport — the one the hackathon actually runs on.

### 6.5 Sources (WebFetch-verified 2026-07-11)

- `https://docs.dev.sync.global/validator_operator/validator_onboarding.html` — onboarding flow, self-service secret, network differences
- `https://docs.dev.sync.global/validator_operator/validator_compose.html` — `start.sh` flags, OIDC vs. default dev-mode auth
- `https://docs.sync.global/validator_operator/validator_hardware_requirements.html` — hardware table (§6.3)
- `https://github.com/digital-asset/decentralized-canton-sync/releases` — `splice-node` bundle (v0.6.12), asset name + download verified via `gh api`
- `https://canton.foundation/validator-request/` — sponsor/approval request form
- `https://canton.foundation/sv-network/` — where `MIGRATION_ID` / the live SV list are published (JS-rendered)
- `https://github.com/Jatinp26/Seaport-Guide` — the hosted Seaport workspace walkthrough (browser IDE path)
