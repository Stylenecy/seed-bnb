# Cermin-RWA Implementation Plan

Execute per subagent-driven development. Lanes A (Daml), B (Agent), C (Frontend), D (Backend) run in parallel worktrees; tasks within a lane are sequential. Task 8 integrates.

## Global Constraints (binding for every task)

1. **Privacy is the product.** Signatory/observer sets are exactly the Privacy Matrix below — no extra observers, ever. The pool operator must never see ShadowVault, GuardPolicy, or RescueEvent contracts.
2. **No forced liquidation in the happy path.** `LastResortDefault` exists on Loan but is never exercised in demo/tests except the one dedicated last-resort test.
3. **Scope = docs/04-scope.md.** No governance, multi-pool, real oracles, mainnet. The demo script in docs/04-scope.md is the acceptance test.
4. **Vocabulary (exact terms in code, UI, docs):** Shadow Vault, Guard Agent, Health Ratio, Guard Trigger, Coupon Sweep.
5. **Conventional commits** (`feat:`, `fix:`, `docs:`, `test:`). Every Daml template gets a doc comment stating who sees what and why.
6. **No secrets in repo**; config via `.env` (gitignored), ship `.env.example`.
7. **Demo numbers (use everywhere — Daml scripts, mock stores, tests):**
   - Borrower holds 10,000 mUST face value, initial price 1.00 → $10,000 collateral value.
   - Loan principal 6,000 mUSD, rate 500 bps → initial Health Ratio 166%.
   - Guard Trigger 13000 bps (130%), target restore 14500 bps (145%), maxRepayPerEvent 2,000.
   - Shadow Vault funded with 1,500 mUSD.
   - Rescue scenario: price drops to 0.76 → ratio 126.7% < 130% → GuardRepay ~759 mUSD → outstanding ~5,241 → ratio back to ~145%.
   - Coupon: 450 bps annual on 10,000 face = 112.50 mUSD quarterly.
8. **Health Ratio** = (collateralAmount × price) / outstanding. Ratios carried as `Int` bps (13000 = 130%); money as `Decimal`.
9. Directory ownership — Lane A: `daml/`, Lane B: `agent/`, Lane C: `frontend/`, Lane D: `backend/`. Do not touch another lane's directory.
10. Daml binary: `~/.daml/bin/daml` (add to PATH). Java: `export JAVA_HOME=$(brew --prefix openjdk@17); export PATH="$JAVA_HOME/bin:$PATH"`.

### Privacy Matrix (verbatim, binding)

| Template | Signatories | Observers | Notes |
|---|---|---|---|
| TreasuryToken | issuer, owner | — | lock noted in field, holder disclosed via `lockedBy` observer only when locked (poolOperator) |
| StableCoin | issuer, owner | — | mock mUSD cash leg |
| PriceFeed | oracle | subscribers: [borrower, guardAgent, poolOperator] | oracle learns nothing about positions |
| Loan | borrower, poolOperator | guardAgent | pool legitimately sees its own loan; guardAgent observes to compute Health Ratio |
| ShadowVault | borrower | guardAgent ONLY | pool must never see it |
| GuardPolicy | borrower | guardAgent ONLY | trigger rules private |
| GracePeriod | borrower, guardAgent | poolOperator | pool must know grace started (docs/02 failure path) |
| RescueEvent | guardAgent, borrower | — | feeds the private activity feed |
| CouponDistribution | issuer, owner | — | |

### Contract shapes (binding field names — agent/backend/frontend code against these)

```
TreasuryToken:  issuer, owner : Party; instrumentId : Text ("mUST-2030"); faceValue : Decimal;
                couponRateBps : Int; maturity : Date; lockedBy : Optional Party
StableCoin:     issuer, owner : Party; amount : Decimal
PriceFeed:      oracle : Party; instrumentId : Text; price : Decimal; subscribers : [Party]
                (choice UpdatePrice by oracle, archive+recreate)
Loan:           borrower, poolOperator, guardAgent : Party; loanId : Text; principal : Decimal;
                outstanding : Decimal; rateBps : Int; collateralInstrumentId : Text;
                collateralAmount : Decimal
                choices: Repay (borrower), ApplyRepayment (borrower — invoked with borrower authority
                from inside ShadowVault.GuardRepay / coupon sweep), TopUpCollateral (borrower),
                LastResortDefault (poolOperator, only after GracePeriod expiry)
ShadowVault:    borrower, guardAgent : Party; balance : Decimal
                choices: TopUp/Withdraw (borrower); GuardRepay (guardAgent) — fetches PriceFeed +
                Loan + GuardPolicy by cid args, asserts healthRatio < triggerRatioBps, repays
                min(needed, maxRepayPerEvent, balance) via Loan.ApplyRepayment (borrower authority
                comes from vault's signatory), recreates vault with reduced balance, creates RescueEvent.
                THE DELEGATION IS PROVABLY NARROW: guardAgent can move vault money ONLY through this
                trigger-checked path.
GuardPolicy:    borrower, guardAgent : Party; triggerRatioBps, targetRatioBps : Int;
                maxRepayPerEvent : Decimal; couponSweep : Bool
GracePeriod:    borrower, guardAgent, poolOperator; loanId : Text; startedAt : Time; expiresAt : Time
RescueEvent:    guardAgent, borrower : Party; loanId : Text; description : Text; amount : Decimal;
                healthBefore, healthAfter : Int (bps); at : Time
CouponDistribution: issuer, owner : Party; instrumentId : Text; amount : Decimal
                choice ClaimCoupon (owner) → StableCoin to owner; SweepToLoan (guardAgent, requires couponSweep=True policy) → Loan.ApplyRepayment
```

### JSON API contract (Lane B/D code against this; Task 8 reconciles against the real SDK)

The installed Daml SDK's `daml start` sandbox + HTTP JSON API (default :7575, `/v1/query`,
`/v1/create`, `/v1/exercise`, JWT with actAs party). Isolate ALL ledger HTTP calls in ONE module
per service (`agent/src/ledger.ts`, `backend/src/ledger.ts`) so endpoint-shape drift is a
one-file fix in Task 8. Until Task 8, services must run fully against a mock in-memory ledger
(`MOCK_LEDGER=true` default in `.env.example`).

---

## Task 1: Daml scaffold + tokens + price feed (Lane A, model: sonnet)

Create `daml/` Daml project (`daml.yaml`, project name `cermin-rwa`, latest installed SDK).

Files: `daml/daml/Cermin/Assets.daml` (TreasuryToken, StableCoin), `daml/daml/Cermin/Oracle.daml`
(PriceFeed), `daml/daml/Cermin/Scripts/Setup.daml` (allocate parties Issuer, Borrower, PoolOperator,
GuardAgent, Oracle; mint per demo numbers; publish initial price 1.00), test
`daml/daml/Cermin/Tests/AssetTests.daml`.

Requirements:
- Shapes and privacy matrix from Global Constraints, verbatim.
- TreasuryToken choices: Transfer (owner, propose-accept via simple TransferProposal), Lock/Unlock
  (owner sets `lockedBy`, adds that party as observer via recreate; locked tokens cannot transfer).
- StableCoin choices: Transfer (propose-accept), Split/Merge minimal, Mint via issuer script.
- PriceFeed UpdatePrice by oracle.
- Doc comment on every template: who sees what and why.
- Tests (Daml Script, run with `daml test`): mint→transfer happy path; locked token cannot transfer;
  non-subscriber cannot see PriceFeed (use `queryContractId`/visibility assertions); price update works.
- `daml build` and `daml test` must pass. Commit with conventional commits.

## Task 2: Credit core — Loan, ShadowVault, GuardPolicy, GracePeriod (Lane A, model: opus)

Files: `daml/daml/Cermin/Credit.daml` (Loan + LendingPool offer flow), `daml/daml/Cermin/Guard.daml`
(ShadowVault, GuardPolicy, GracePeriod, RescueEvent), tests `daml/daml/Cermin/Tests/CreditTests.daml`,
`daml/daml/Cermin/Tests/GuardTests.daml`. Extends Task 1 code (already merged).

Requirements:
- Shapes + privacy matrix verbatim. Loan origination: pool offer → borrower accepts by locking
  TreasuryToken (lockedBy=poolOperator) → receives pool's StableCoin.
- ShadowVault.GuardRepay exactly per shape spec: assertion `healthRatioBps < policy.triggerRatioBps`
  computed from fetched PriceFeed cid; repay `min(amountToReachTarget, maxRepayPerEvent, balance)`;
  creates RescueEvent with before/after ratios; fails (assert) if trigger not breached — the narrow
  delegation must be enforceable on-ledger, not by agent goodwill.
- Empty/insufficient vault path: choice StartGracePeriod (guardAgent) creates GracePeriod (72h);
  Loan.LastResortDefault (poolOperator) requires an expired GracePeriod cid — demo never calls it.
- Tests: borrow lifecycle; price drop → GuardRepay restores ratio to ≥ target (demo numbers: 0.76,
  repay ≈759); GuardRepay REFUSED when ratio ≥ trigger; GuardRepay capped by maxRepayPerEvent and
  balance; manual Repay; TopUpCollateral; empty vault → grace → expiry → LastResortDefault works
  (single last-resort test); PRIVACY TESTS: poolOperator cannot see ShadowVault/GuardPolicy/
  RescueEvent (visibility assertions), other-borrower party sees nothing.
- `daml build` && `daml test` pass. Conventional commits.

## Task 3: Coupons + Coupon Sweep + demo script (Lane A, model: sonnet)

Files: `daml/daml/Cermin/Coupon.daml`, tests `daml/daml/Cermin/Tests/CouponTests.daml`,
`daml/daml/Cermin/Scripts/Demo.daml`. Extends Tasks 1–2.

Requirements:
- CouponDistribution per shape spec. Issuer script/choice `PayCoupon` computes quarterly coupon
  (faceValue × couponRateBps / 10000 / 4 = 112.50 on demo numbers).
- ClaimCoupon: if any GuardPolicy for owner has couponSweep=True and a live Loan exists → route
  amount via Loan.ApplyRepayment atomically (one transaction) + RescueEvent-style feed entry
  (description "Coupon swept"); else pay out StableCoin.
- `Scripts/Demo.daml`: one `demoSetup : Script` that builds the full demo state (parties, mint,
  price 1.00, loan open, vault 1,500, policy per demo numbers) — used by Task 8 and `daml start`
  init-script; plus `demoRescue : Script` that drops price to 0.76 and exercises GuardRepay
  (proves the 20-second demo moment on-ledger).
- Tests: coupon with sweep on shrinks loan by 112.50 atomically; sweep off pays StableCoin;
  full lifecycle test fund→borrow→drop→auto-repay→coupon→full repay→unlock collateral.
- `daml build` && `daml test` pass.

## Task 4: Guard Agent service (Lane B, model: sonnet)

Create `agent/` — TypeScript Node service (plain `tsx`/`tsc`, no framework). Files:
`agent/package.json`, `agent/src/types.ts` (mirror contract shapes verbatim from Global
Constraints), `agent/src/ledger.ts` (ALL ledger I/O; two impls: MockLedger in-memory + JsonApiLedger
per JSON API contract), `agent/src/health.ts` (pure functions), `agent/src/guard.ts` (the loop),
`agent/src/index.ts`, `agent/.env.example` (LEDGER_URL, PARTY_GUARD_AGENT, POLL_MS=2000,
MOCK_LEDGER=true), `agent/test/health.test.ts`, `agent/test/guard.test.ts` (node:test, no jest).

Requirements:
- Loop every POLL_MS: read PriceFeed + Loans + GuardPolicies + ShadowVaults visible to GuardAgent →
  compute Health Ratio (pure fn in health.ts: `healthRatioBps(collateralAmount, price, outstanding)`,
  `repayAmountToTarget(...)` = min(needed-for-target, maxRepayPerEvent, vaultBalance)) → if ratio <
  trigger: exercise ShadowVault.GuardRepay → log human sentence ("Price dipped X%. Repaid $Y from
  your Shadow Vault. Position safe. — Cermin").
- Insufficient vault (balance < 1 unit of repay) → exercise StartGracePeriod once (idempotent:
  skip if GracePeriod already live for loanId).
- CouponDistribution visible with couponSweep=True → exercise ClaimCoupon.
- Idempotency/no-thrash: after a GuardRepay, skip re-fire while ratio ≥ trigger; never fire twice
  on the same price observation (track last acted contractId).
- Tests via MockLedger: trigger fires at 126.7% & repays 759 to reach 145% (demo numbers); no fire
  at 166%; cap by maxRepayPerEvent; cap by balance; empty vault → grace exactly once; coupon sweep
  claim. All `npm test` green. No real network calls in tests.

## Task 5: Frontend scaffold + design system + Dashboard (Lane C, model: sonnet)

Create `frontend/` — Vite + React + TypeScript + Tailwind. Read `docs/03-ux.md` FIRST and follow it
exactly. Use the frontend-design skill if available.

Files: scaffold + `frontend/src/store.ts` (Zustand or plain context — in-memory mock store seeded
with the demo numbers from Global Constraints; actions: setPrice, guardRepay, payCoupon, borrow,
topUpVault, withdrawVault — mirroring ledger semantics incl. trigger check & repay-to-target math),
`frontend/src/components/` (HealthRing, Card, PrivacyBadge, ActivityFeed), Dashboard screen.

Requirements:
- Neobank aesthetic per docs/03-ux.md: calm, premium, Revolut/N26-like. NO degen-neon, no confetti.
  Health Ratio ring is the hero: green "Protected" (≥150%), amber "Guarded" (130–150%), "Action
  suggested" below trigger. Status words exactly those three.
- Cards: Collateral (mUST balance, current value, next coupon date), Loan (outstanding, rate),
  Shadow Vault (balance + "Only you can see this" privacy badge).
- Activity feed: first-person Cermin sentences, short, zero jargon (copy tone per docs/03-ux.md §Copy).
- Store must expose `healthRatioBps` computed identically to Global Constraints formula.
- `npm run build` passes; include `npm run dev` instructions in frontend/README.md.
- A few vitest tests on store math (trigger/repay-to-target with demo numbers).

## Task 6: Frontend — Borrow flow, Shadow Vault, Onboarding, Simulation mode (Lane C, model: sonnet)

Extends Task 5 (merged). Screens per docs/03-ux.md: Onboarding (3 slides), Borrow flow (max 3 steps,
live Health Ratio preview, "what if price drops 10%?" line, Guard Trigger default 130% with
"recommended" chip, Coupon Sweep toggle), Shadow Vault screen (top-up/withdraw, protection runway:
"Your vault can absorb an N% price drop" — N computed from store), Simulation mode (price slider
styled as market simulator; sliding down MUST animate: ring dips to amber → store fires guardRepay →
feed prints rescue sentence → ring returns green — the 20-second demo moment, all client-side).

Requirements: routing (react-router or simple state router), all 5 screens navigable, build passes,
store tests still green, runway math tested (runway% = 1 − outstanding×trigger/(collateral×price×10000⁻¹…
derive correctly and test with demo numbers: vault 1,500 absorbs ≈23% drop shown in docs/03-ux.md).

## Task 7: Thin backend bridge (Lane D, model: sonnet)

Create `backend/` — one small Express (or Fastify) TypeScript service. Files: `backend/src/index.ts`,
`backend/src/ledger.ts` (same two-impl pattern as agent: MockLedger default / JsonApiLedger),
`backend/.env.example` (PORT=3001, LEDGER_URL, PARTY_BORROWER, MOCK_LEDGER=true), tests with node:test.

Endpoints (REST, JSON):
- `GET /api/position` → { collateral: {instrumentId, amount, price, value, nextCouponDate},
  loan: {loanId, principal, outstanding, rateBps}, vault: {balance}, policy: {triggerRatioBps,
  targetRatioBps, couponSweep}, healthRatioBps, rescueEvents: [...] }
- `POST /api/vault/topup` {amount}, `POST /api/vault/withdraw` {amount}
- `POST /api/borrow` {collateralAmount, principal, triggerRatioBps, couponSweep}
- `POST /api/sim/price` {price} (dev-only, mock mode: sets price; real mode: exercises Oracle
  UpdatePrice) — powers Simulation mode.
- MockLedger seeded with demo numbers; GuardRepay simulation NOT here (agent owns it) but mock mode
  applies the same trigger math so /api/position reflects a rescue after /api/sim/price drop
  (mark rescueEvents accordingly).
- Tests: position math with demo numbers; sim price drop produces rescue event in mock mode.

## Task 8: Integration + demo runbook (model: opus)

Everything merged. Wire the real path end-to-end on the local sandbox:
- `daml start` (sandbox + JSON API) with `Scripts/Demo.demoSetup` as init-script; write
  `scripts/dev.sh` orchestrating: build dar, start sandbox+JSON API, allocate/report party IDs to
  `.env`, start agent (MOCK_LEDGER=false), start backend (MOCK_LEDGER=false), start frontend
  pointing at backend (`VITE_API_URL`).
- Fix any drift between plan shapes and real JSON API payloads inside the two `ledger.ts` files only
  (that's what the isolation was for). Frontend switches store to backend polling when
  `VITE_API_URL` set; otherwise stays standalone mock (demo fallback).
- Scripted verification: price 1.00→0.76 via `POST /api/sim/price` → agent fires GuardRepay
  on-ledger → `GET /api/position` shows outstanding ≈5,241, ratio ≈145%, rescue event present.
  Coupon path: trigger PayCoupon script → outstanding shrinks 112.50.
- Write `docs/06-demo-runbook.md`: exact commands for the 3-minute demo per docs/04-scope.md,
  including LocalNet (CN Quickstart) deployment notes as the target for demo day and sandbox as
  the rehearsal environment.
- All test suites (daml test, agent, backend, frontend) green at HEAD.

---

## Task 9: Dual theme + responsive mobile layout (Lane C, model: sonnet)

Frontend only. The user LOVES the existing palette and typography — do not change hues, fonts, or scale. The current look becomes the DARK theme verbatim.

Requirements:
- Semantic theme tokens: refactor the @theme colors in `frontend/src/index.css` into semantic surface/text/border tokens with per-theme values (dark = current values byte-for-byte; light = same hue family mapped to light surfaces — desaturated/lightened, NOT naive inversion). No component may keep a raw dark-only class that breaks in light mode.
- Theme switching: respects `prefers-color-scheme` by default; in-app toggle (Dashboard header / nav, subtle icon button, 44px target); persisted to localStorage; no flash-of-wrong-theme on load.
- Contrast: body text ≥4.5:1 and secondary ≥3:1 in BOTH themes (verify the sage/amber/terracotta status colors on light surfaces; adjust lightness only as needed, keep hue).
- Responsive: mobile-first at 375px — no horizontal scroll; desktop keeps current top nav; <768px switches to a bottom nav bar (the 4 existing tabs, icons + labels, active state highlighted, `min-h-dvh`, safe-area padding via env(safe-area-inset-bottom), content bottom-inset so nothing hides behind the bar). Touch targets ≥44px throughout (chips, toggle, slider thumbs).
- HealthRing hero, cards, borrow steps, vault, simulation all usable at 375px and at desktop widths; the 20-second rescue demo must read perfectly in both themes and both sizes.
- Icons: any new icons are inline SVG (lucide-style), consistent stroke; no emoji.
- All 35 vitest + build + lint green; add a small test only if new pure logic appears (theme persistence helper).

## Task 10: Guard Trigger strategy presets (Lane C, model: sonnet)

Frontend only, on top of Task 9. Replace the raw percent chips in the Borrow flow's Guard Trigger step with named strategy cards + progressive disclosure (Amendment 4 pins names/values).

Requirements:
- Three named strategies + Custom (Amendment 4). Cards show: name, one-line first-person Cermin summary, the trigger % as secondary info. Selected state obvious (not color-only). "Balanced" carries the "Recommended" chip and is default.
- Progressive disclosure: tapping a card expands details in place (150-300ms, transform/opacity only): when Cermin steps in expressed in today's numbers ("that's when your collateral value falls below $X"), what it means for borrowing room, and the repay-to-target behavior. One card expanded at a time.
- Custom: expands to the existing granular picker (chips or slider, 120–150%, 44px targets).
- Store contract unchanged: still ends in `triggerRatioBps` — no math or store changes beyond mapping strategy→bps via one constant in lib (single source; BorrowFlow renders it).
- Copy: first-person Cermin, zero jargon, calm. No "liquidation" scare words; "I step in" language.
- Live Health Ratio preview + "what if price drops 10%?" line and the confirm guard from Task 6 must keep working.
- Vault screen: display the active strategy name alongside the trigger (read-only mapping; unnamed bps shows as "Custom").
- Tests: strategy→bps mapping pinned; existing 35+ suite, build, lint green.

---

## Task 11: Port Daml to SDK 3.5.2 / LF 2.x (Lane A, model: sonnet)

Port `daml/` from SDK 2.10.4 to SDK 3.5.2 (the cn-quickstart pin) so the DAR is deployable on Canton 3.x (LocalNet/DevNet). Behavior must be byte-equivalent: same templates, same shapes, same privacy matrix, same demo numbers.

Requirements:
- daml.yaml: sdk-version 3.5.2, correct LF target for Canton 3.5.x, dependencies updated (daml-script package name changes in 3.x).
- Known breaks to handle: `allocatePartyWithHint`→`allocatePartyByHint`; contract keys are removed in LF2 (we use NONE — verify and keep it that way); any Daml.Script API drift (submit/submitMustFail/queryContractId/setTime signatures); Prelude changes (verify `round` still half-away-from-zero — a doc comment depends on it).
- ALL 29 existing test scripts must pass under `daml test` on 3.5.2, including demoSetup/demoRescue and every privacy visibility assertion.
- No template/field/choice renames — the TS seams depend on the exact names. If 3.x forces a rename, STOP and report BLOCKED with the specifics.
- `daml build` clean; note the produced DAR path/name. Update STATE.md §6 checkbox + any new lesson.

## Task 12: CN Quickstart LocalNet deployment + JSON API v2 seams (model: opus)

Boot CN Quickstart LocalNet (Docker), deploy the 3.5.2 DAR, allocate the five parties, seed the demo scene, and port both TS services' JsonApiLedger to JSON Ledger API v2 with real OAuth2 — end-to-end rescue proven on LocalNet.

Requirements:
- Clone/scaffold cn-quickstart per its README (make setup/build/start); document resource needs; raise Docker VM memory if OOM (report if user action needed).
- DAR upload (splice-onboarding mount or POST /v2/packages), party allocation (POST /v2/parties), demo seeding (port Scripts/Demo runner or ledger-api script runner against LocalNet).
- New `JsonApiV2Ledger` implementations in `agent/src/ledger.ts` + `backend/src/ledger.ts`: /v2/commands/submit-and-wait, /v2/state/active-contracts; OAuth2 client_credentials token flow (Keycloak on LocalNet); all changes stay inside the seam files + .env plumbing. Keep the v1 impl for `daml start` mode behind a config flag (LEDGER_API=v1|v2).
- Verify end-to-end on LocalNet with real transcript evidence: sim price 0.76 → agent GuardRepay on LocalNet → position 5241.38 @ 14500; coupon sweep −112.50. All four suites still green.
- Extend docs/06-demo-runbook.md with a working "Mode C: LocalNet" section (replaces the aspirational LocalNet notes). Update STATE.md.

## Task 13: DevNet onboarding prep (model: sonnet)

Prepare everything needed to join Canton DevNet; start the external clock (sponsor/IP-allowlist takes 2–7 days).

Requirements:
- `deploy/devnet/`: splice validator docker compose (from official splice docs), .env.example (party hint, sponsor SV URL, onboarding secret placeholder), README with the exact self-service onboarding steps (sponsor SV, IP allowlist request, 1-hour onboarding secret, wallet-UI faucet for test CC) and where the DAR upload + party allocation differ from LocalNet.
- docs/07-devnet.md: honest status page — what is ready, what waits on the allowlist clock, TestNet roadmap (GSF approval path) for the pitch.
- NO fabricated onboarding: if a step needs the user (choosing a sponsor SV, submitting the allowlist request with a public IP, keeping a validator online), list it as a user action with exact instructions. Update STATE.md.

---

## Task 14: DevNet deployment via Seaport hosted validator (model: opus)

The hackathon provides a SHARED hosted DevNet validator (Seaport / Five North) with direct JSON Ledger API v2 access — no self-run validator, no sponsor wait. Deploy Cermin-RWA to Canton DevNet and prove the rescue there.

Facts (from hackathon docs; full guide: https://github.com/Jatinp26/Seaport-Guide):
- REST: https://ledger-api.validator.devnet.sandbox.fivenorth.io/ (paths /v2/... as LocalNet)
- WS: wss://ledger-api.validator.devnet.sandbox.fivenorth.io (subprotocols: `jwt.token.<token>`, `daml.ws.auth` — order matters)
- Auth: OAuth2 client_credentials at https://auth.sandbox.fivenorth.io/application/o/token/ (client validator-devnet-m2m, audience validator-devnet-m2m, scope daml_ledger_api); token expires 8h → services must cache + refresh (on expiry AND on 401).

Requirements:
- Read the Seaport guide repo first; verify endpoint behavior with a ledger-end call before anything else.
- OAuth2 token flow added to both seams' `token()` (config-driven: AUTH_URL/CLIENT_ID/CLIENT_SECRET/AUDIENCE/SCOPE; LEDGER_AUTH=shared-secret|oauth2). Secret NEVER committed — .env only; .env.example placeholders.
- SHARED validator etiquette: party hints namespaced (`cermin-issuer`, `cermin-borrower`, ...); modest polling (POLL_MS ≥ 5000 on DevNet); no cleanup of others' data; treat as external production-ish service.
- Deploy DAR, allocate the 5 namespaced parties, seed demo scene (seed-localnet.mjs generalized: LEDGER_URL + auth mode flags — rename or alias to seed-ledger), run agent (LEDGER_API=v2, oauth2) → rescue + sweep + verify (privacy 0/0/0) ON DEVNET with real transcript evidence.
- Honest caveat documented: the m2m client is shared by all hackathon teams — ledger-side party privacy still holds, but anyone with the shared secret can query as any party they can name; state this in docs/07-devnet.md (it's a sandbox constraint, not a product property).
- Update docs/07-devnet.md (hosted path replaces/augments run-your-own; strike the sponsor/allowlist user-actions as NOT NEEDED for hackathon), runbook Mode D → live commands, STATE.md §6/§7.
- All suites stay green; mock/v1/LocalNet modes untouched.

---

## Task 15: Frontend fully integrated to DevNet (model: opus)

Close Task 14's flagged gap: drive the FULL chain live — React frontend (VITE_API_URL) → backend (MOCK_LEDGER=false, LEDGER_API=v2, LEDGER_AUTH=oauth2) → Seaport hosted DevNet validator — and make it demo-repeatable.

Facts/state:
- DevNet scene EXISTS and persists (post-rescue): outstanding 5128.88 @ 14818, vault 741.38, 2 RescueEvents, price 0.76, parties cermin-*::<ns> (ids in the Task 14 report / seeder output; re-derivable via seed-ledger.mjs).
- Backend live mode: /api/position, vault topup/withdraw (real TopUp/Withdraw), /api/sim/price (real Oracle UpdatePrice as cermin-oracle); /api/borrow 400 by design. Mutating endpoints return full PositionView. CORS present.
- FE backend mode: polls /api/position, actions apply returned PositionView; payCoupon/setCouponSweep hidden in backend mode; onboarding skipped.
- Known minor: backend OAuth2 token cold-start race (benign, 5 parallel token fetches) — fix with an in-flight promise guard while you're there.

Requirements:
1. Run backend against DevNet (party env from the live namespace) + FE with VITE_API_URL; fix whatever the live chain surfaces — seam/env/FE-mapping fixes only (no math changes). Kill any stray vite on :5173 first.
2. Demo repeatability: document + verify the "demo reset loop" using ONLY existing choices — via UI/API: set price back to 1.00 (sim), top up vault (UI), then slide price down → agent (running against DevNet, POLL_MS=5000) rescues again live. Compute and document the expected numbers for the CURRENT scene state (outstanding changes run to run — the FE shows live truth; demo narration adapts). If the scene state makes a clean demo impossible, escalate with options (e.g. fresh suffixed party set) — do NOT silently allocate new parties.
3. VERIFY LIVE with evidence: browser screenshots (Dashboard showing real DevNet position + feed; Simulate slider driving a REAL on-ledger rescue end-to-end: price drop → agent fires → poll picks up → ring recovers) + backend logs + a seed-ledger verify run. The FE feed must show rescue events sourced from the ledger (via PositionView.rescueEvents), not mock sentences.
4. Runbook Mode D: add the FE section (exact env/commands incl. VITE_API_URL + demo reset loop); STATE.md §6 update + lessons. All suites green; mock/v1/LocalNet untouched.

---

## Task 16: Self-service testnet — onboarding, faucet, live borrow (model: opus)

Kill the hardcoded single-borrower demo. EVM-testnet UX parity: any user can onboard (own party), claim mock RWA from a faucet, borrow, fund a vault, set a policy, and be protected by the agent — all live on DevNet, mirroring production.

PM decisions (binding):
- "Login" = party provisioning: FE Connect screen takes a username → backend allocates party `cermin-u-<slug>` (check-before-allocate, matchesPartyHint boundary rules) + user rights → FE stores the full party id in localStorage as the session. Show the party id in the UI (truncated, copyable) — that's the "wallet address".
- Faucet = backend endpoint `/api/faucet` acting as Issuer: mints 10,000 mUST-2030 to the caller's party (idempotent-ish: refuse if the party already holds ≥10,000 unlocked mUST — one claim per user; loud clear error). EVM-faucet semantics, on-ledger delivery.
- `/api/borrow` becomes REAL in live mode: full origination per Credit.daml (pool offer → borrower accepts → collateral locked → Loan) + creates GuardPolicy (from the chosen strategy/trigger + couponSweep) + ShadowVault (initial balance from the flow's vault step, or 0 + top-up after). Backend orchestrates as poolOperator+borrower (m2m sandbox rights). Multi-loan-per-borrower stays forbidden (clear 409 if a live loan exists).
- Money model unchanged (STATE.md binding): vault/outstanding abstract Decimal; faucet mints the COLLATERAL token. No StableCoin faucet.
- Session plumbing: FE sends its party id (header `X-Cermin-Party` or body field) on every call; backend derives borrower-scoped queries from it. The old PARTY_BORROWER env becomes the fallback/demo party only.
- Oracle/PriceFeed stays global per instrument (price moves affect every user — realistic). Sim slider keeps working; new users' loans react to the same feed.
- Agent untouched in behavior: it already guards every loan observed by guardAgent. Verify multi-loan/multi-user isolation (per-item error isolation exists) — if the vault/policy borrower-matching breaks with >1 borrower, fix in the agent seam with tests.

Requirements:
1. Backend: POST /api/onboard {username} → {party}, POST /api/faucet {party} → mint evidence, POST /api/borrow live per above, GET /api/position?party=... (or header) per-user. Etiquette: hints `cermin-u-*`, no allocation storms (409 on duplicate username → suggest reuse), amounts fixed.
2. FE: Connect screen (username → onboard → session; existing users re-enter by username — backend resolves the party), faucet claim CTA when the user holds no mUST (empty-state dashboard), Borrow flow live-enabled end-to-end (strategy cards → real GuardPolicy), per-user vault/policy views. Mode A (mock) UNTOUCHED: connect screen only in backend mode.
3. Multi-user proof ON DEVNET: two fresh users via the UI → each claims faucet → each borrows different amounts → price drop → agent rescues BOTH independently → each user sees only their own position/vault/rescues (privacy between users at ledger level — extend seed-ledger verify or show per-party ACS evidence). Real transcripts + screenshots.
4. All suites green + new tests (backend: onboard/faucet/borrow happy + guard paths vs MockLedger; FE: connect-screen gating). Mock/v1/LocalNet defaults untouched. Runbook Mode D §"self-service journey"; STATE.md §6 + lessons; docs/07-devnet.md caveat unchanged.

---

## Task 17: Dashboard price chart + defense lines (Mezo-parity UX) (model: sonnet)

Bring Cermin v1 (Mezo) dashboard clarity to Cermin-RWA: one 30-day price chart that instantly answers "where is the price, where does Cermin defend, where does protection run out."

Reference (user-supplied screenshots of Cermin v1): area price chart with current price big top-right (+Δ% 30d), dashed DEFENSE line labeled with price, dashed LIQUIDATION line labeled with price, current-price dot; hero strip with ICR ring + status + liquidation price + drop-buffer %; cards: collateral (locked·never sold, borrowed-against % progress bar vs max), spendable, strategy (self-driving rules + keeper badge).

Cermin-RWA mapping (binding):
- DEFENSE line = price where Health Ratio hits the Guard Trigger: P_defense = triggerRatioBps × outstanding / (collateralAmount × 10000). Label: "Cermin defends · $X" (gold/amber).
- PROTECTION FLOOR line = price where even the full vault can't restore the trigger: P_floor = triggerRatioBps × (outstanding − vaultBalance) / (collateralAmount × 10000). Label: "Protection floor · $Y" (terracotta). NOT called "liquidation" — copy explains below this Cermin starts a grace period instead of a fire-sale (our differentiator; one-line tooltip/caption).
- Drop buffer % = existing protection runway (selectProtectionRunway) — show in hero next to the ring.
- Both derived prices as pure functions in lib/health.ts (+tests with demo numbers: outstanding 6000, vault 1500, trigger 13000, collateral 10000 → defense 0.78, floor 0.585).

Requirements:
1. Backend: GET /api/price-history → {points:[{at,price}]} — in-memory ring buffer of observed prices (append on every position read/sim update; dedupe consecutive equal prices) + synthetic 30-day gentle random-walk backfill anchored to end at the earliest observed price (deterministic seed so refreshes don't rewrite history; clearly marked `synthetic:true` per backfill point). Mock mode: FE generates the equivalent client-side in the store (same shape).
2. FE PriceChart component — hand-rolled SVG, NO chart library: area fill under the line, dashed defense + floor lines with right-aligned labels (exactly like the reference), current-price dot pulsing subtly, big current price + Δ% top-right, x-axis 3 date ticks, tooltip on hover/tap showing price+date (44px touch target; keyboard reachable). Semantic tokens only, both themes, responsive 375px+desktop (chart scrolls/scales, never overflows). Lines recompute live as outstanding/vault change (post-rescue the defense line drops — narrate that in the feed copy already there).
3. Dashboard layout rework toward the reference: chart card full-width under the hero; hero gains liquidation-floor price + drop buffer %; cards row: Collateral (add "Borrowed against mUST N%" progress bar vs max LTV ~83% i.e. 1/1.2, locked·never sold sub-copy), Loan/Spendable, Strategy (strategy name chip, defend below X%, restore to Y%, max per rescue, Coupon Sweep on/off, "Guard Agent · watching every 5s" badge in live mode / "Simulation" in mock).
4. Works in BOTH modes (mock + live) and both themes; Mode A rescue demo moment must still read perfectly (ring + chart both react). All suites green + new pure-fn tests; no new deps beyond what exists (framer-motion ok). Chart a11y: role=img + aria-label summary sentence.
5. Copy first-person Cermin, zero jargon ("liquidation" appears only in the floor explainer as the thing that never happens).

---

## Task 18: Chart prominence — two lines must read instantly (Lane C, model: sonnet)

The price chart is the dashboard's hero but reads cramped: enlarge it and make the defense + floor lines unmissable.

Requirements:
- Chart height up substantially (reference feel: ~420-480px desktop, ~280-320px mobile; pick what breathes).
- Y-domain MUST span from min(protectionFloorPrice × 0.95, series min) to max(series max, defensePrice) × 1.05 — both dashed lines always fully visible with padding, never clipped or hugging an edge, regardless of position state (post-rescue the gap widens — domain adapts).
- Lines visually distinct: slightly thicker dashes, labels larger (readable at a glance, per reference screenshots: label + price right-aligned ON the line), defense=gold, floor=terracotta, keep the +12px anti-collision offset.
- Price line/area stays calm; gridlines (if any) faint. Big current price + Δ% top-right unchanged.
- Both themes, 375px + desktop, reduced-motion respected; all 125 FE tests green (adjust y-domain tests), build+lint clean. No dep changes. Mode A demo moment intact.

## Task 19: Route migration — landing page at `/` (Lane C, model: sonnet)

`/` becomes a public landing page explaining Cermin-RWA; the app moves behind it. The heaviest UX task: first impression for judges.

Requirements:
- Routing: extend lib/router.ts — `/` (empty hash) → Landing; app screens move to `#/app` (dashboard), `#/app/borrow`, `#/app/vault`, `#/app/simulate`; legacy hashes (`#/dashboard` etc.) redirect to `#/app/...` equivalents (deep links keep working). NavBar (top + mobile bottom) renders ONLY inside the app; Landing has its own minimal header (logo, "How it works" anchor, theme toggle, primary CTA "Launch app").
- "Launch app" → app entry respecting existing flows: backend mode → Connect screen (or dashboard if session exists); mock mode → onboarding slides (first visit) or dashboard.
- Landing content (source: README.md + docs/01-concept.md — rewrite in landing voice, first-person Cermin where natural, zero jargon):
  1. Hero: tagline "Shadow money. Zero liquidations." + one-paragraph pitch + CTA + a subtle visual (reuse HealthRing or a static mini PriceChart with the two lines — sell the "defense line" idea immediately).
  2. Problem → Solution strip (public liquidations are theater on EVM; on Canton nobody sees your position, reserve, or rescue).
  3. How it works: 3 steps (Post collateral → Fund your Shadow Vault → Sleep well) mirroring onboarding copy.
  4. "Who sees what" privacy row (the pitch table: pool sees loan only; vault/policy/rescues invisible) — simple, visual.
  5. Built on Canton + live-on-DevNet badge (honest: hackathon build, mock RWA per CIP-56 style).
  6. Footer: repo pointer, track/hackathon note.
- Design: same design system (tokens/typography frozen), calm premium neobank, anti-goals apply (no confetti/neon); both themes; 375px + desktop; landing is content — semantic HTML (h1 hierarchy, landmarks), keyboard/AT friendly.
- Mode A AND backend mode both get the landing (it's static content — no ledger calls on `/`).
- Tests: router mapping incl. legacy redirects; landing render smoke; all suites green; build+lint clean. Update runbook (URLs change: demo starts at `/` → Launch app) + STATE.md.

---

## Task 20: Chart state-awareness + polish (Lane C, model: sonnet)

User screenshot exposed real-state failures the demo numbers never hit. Fix the chart for ALL position states, not just the happy demo scene.

Observed failures (screenshot: fresh user, vault=0, outstanding≈6640, trigger 15000, global price 0.62):
1. Vault=0 → defense and floor coincide ($0.996) → two stacked dashed labels overlap illegibly.
2. Price BELOW the lines (breach + empty vault) → chart reads broken; huge dead space above the lines.
3. Stale tooltip stuck mid-chart after pointer left.
4. Big current-price header appeared detached/cramped from the chart top area.

Requirements (BINDING):
1. **Coincident-line rule**: when |floorY − defenseY| < 14px OR vault ≤ 0 → render ONE dashed line with ONE label ("Cermin defends · $X"); the floor caption under the chart becomes a nudge: "Fund your Shadow Vault to open a buffer below this line — that's where I repay from." Never render two stacked labels.
2. **State-aware coloring/copy** (derive from existing healthStatus — no new math): price ≥ defense → current styling; price < defense (breach) → defense line + label switch to terracotta, caption becomes Cermin voice: vault>0 "I'm stepping in on my next check." / vault=0 "Your vault is empty — top up so I can act." Chart must look intentional in every state, not broken.
3. **Y-domain tightening**: padding proportional to the plotted span (≈4% of (max−min), min absolute epsilon), not 5% of absolute values; no giant dead bands when lines sit above/below the series.
4. **Tooltip lifecycle**: hide on pointerleave/blur ALWAYS (including after touch); never persists when the pointer is gone.
5. Header: big price + Δ% must stay visually attached to the chart card at all sizes (no orphaned Δ% line).
6. Tests for: coincident-line rule (vault=0 single label), breach-state class/copy switch, proportional padding, tooltip hide-on-leave. All existing 152 green; build+lint clean; both themes; 375px+desktop; reduced-motion.
7. Verify in browser incl. the EXACT screenshot scenario (vault 0, borrow ~6640 @ Conservative, price 0.62) and the healthy demo scene; screenshots of both.
