# Cermin-RWA — DevNet Validator (prep only)

**Status:** prep, not a live deployment. The external clock (sponsor SV +
IP allowlist, 2–7 days) has not been started yet — that requires you. Full
honest status page, timing, and the TestNet roadmap: **`docs/07-devnet.md`**.
This file only covers the mechanics once you're ready to act.

## Why no docker-compose.yml in this repo

Digital Asset ships the validator's `docker-compose.yml` + `start.sh` as part
of a versioned release bundle (`splice-node`), not as a standalone file to
copy. Vendoring a hand-copied compose file into this repo would silently
drift out of date — the bundle moved from v0.6.11 to v0.6.12 in the two days
between Task 12 (LocalNet) and Task 13 (this prep), confirmed via
`gh api repos/digital-asset/decentralized-canton-sync/releases`. Fabricating
or freezing a stale copy is exactly the risk CLAUDE.md's "no secrets/no
fabrication" spirit warns against. Instead this directory holds a thin,
honest wrapper:

- **`.env.example`** — every variable the official `start.sh` needs, with
  `[USER ACTION]` markers on anything only you can supply.
- **`fetch-validator-bundle.sh`** — downloads + extracts the pinned official
  bundle from its real GitHub Releases URL (verified reachable 2026-07-11,
  HTTP 200 via a real download). Does not start anything.

## Steps (mechanical — see `docs/07-devnet.md` for status/timing of each)

1. **[USER ACTION]** Line up a sponsor Super Validator. No public "pick a
   sponsor" self-service page exists in the docs — the practical channels
   are the GSF's `#validator-operations` Slack (Slack Connect,
   `https://daholdings.slack.com/archives/C08AP9QR7K4`), the `sync.global`
   mailing lists (`https://lists.sync.global/`, `validator-announce` /
   `main` lists), or submitting
   `https://canton.foundation/validator-request/` (routes to
   `tokenomics@lists.sync.global`; the form itself asks for the name/email
   of an SV contact who has *already* agreed to sponsor you, so line up the
   informal contact first).
2. `cp .env.example .env`, fill in `SPONSOR_SV_URL` (the sponsor's `sv.`
   app URL, not `scan.`) and `PARTY_HINT`.
3. **[USER ACTION]** Give your sponsor your validator's fixed, distinct
   egress IP for allowlisting (one IP per network — DevNet/TestNet/MainNet
   each need their own). **This is the 2–7 day wait.**
4. Once your sponsor confirms the allowlist propagated: verify from your
   validator's egress IP by curling Scan endpoints across the SV set — no
   timeouts means you've cleared.
5. Mint a fresh onboarding secret **right before step 7** (1-hour TTL):
   ```bash
   curl -X POST "$SPONSOR_SV_URL/api/sv/v0/devnet/onboard/validator/prepare"
   ```
   Put the returned value in `.env` as `ONBOARDING_SECRET`.
6. **[USER ACTION]** Look up the current `MIGRATION_ID` at
   `https://canton.foundation/sv-network/` (browser only — it's a
   JS-rendered dashboard, not fetchable as static HTML) and put it in `.env`.
7. `./fetch-validator-bundle.sh` — stages the official bundle under
   `./splice-node/`.
8. From wherever `fetch-validator-bundle.sh` printed `start.sh`, run Digital
   Asset's own script with the values from `.env`:
   ```bash
   source .env
   ./start.sh -s "$SPONSOR_SV_URL" -o "$ONBOARDING_SECRET" -p "$PARTY_HINT" -m "$MIGRATION_ID" -w
   # add -a to run with real OIDC auth instead of the bundle's default
   # dev-mode self-signed-JWT auth — see docs/07-devnet.md "Auth model"
   ```
9. Verify onboarding succeeded and tap the wallet UI faucet for test CC —
   see `docs/07-devnet.md` §5.
10. Deploy the Cermin DAR, allocate parties, seed the demo scene — see
    `docs/07-devnet.md` §"DAR upload / party allocation / seeding: DevNet
    vs LocalNet" (the JSON API v2 request shapes from Task 12's
    `JsonApiV2Ledger` should carry over almost unchanged; only the token
    minting differs).
11. **[USER ACTION, ongoing]** Keep the validator online for the demo
    window — no staking/slashing/minimum-uptime penalty exists, but a live
    demo needs a live node.

## How this differs from our LocalNet deployment (Task 12)

| | LocalNet (`scripts/localnet.sh`) | DevNet (`deploy/devnet/`) |
|---|---|---|
| Network | Our own throwaway Canton topology — participant + SV + mediator + sequencer, all local, wiped on `clean` | The REAL shared DevNet Global Synchronizer; we run one participant + validator, everyone else's SVs already exist |
| Auth | Shared-secret HS256, fixed literal secret `unsafe` | Bundle default: dev-mode self-signed-JWT ("highly insecure" per Digital Asset's own docs); `-a` flag switches to real OIDC (Auth0/Keycloak) via `AUTH_URL`/`VALIDATOR_AUTH_CLIENT_ID`/`VALIDATOR_AUTH_CLIENT_SECRET` etc. |
| Party allocation | `POST /v2/parties`, fresh namespace every `localnet.sh clean` | Same request shape, but the party is **permanent** (survives until DevNet's own ~3-month reset) — there is no "clean and re-seed" |
| DAR upload | `POST /v2/packages` against our own local participant, instant, free | Same endpoint/protocol; propagates to the real domain and consumes the same Canton-Coin-denominated traffic model as all DevNet activity (free base-rate tier, then paid in test CC from the wallet-UI faucet — not a real cost, but not literally free either) |
| Hardware | ~4.6 GiB steady-state for the FULL 3-participant local topology (Task 12, measured) | ~7 GiB combined minimum for validator+participant+db ALONE (Digital Asset's stated minimum) — lighter per-node because DevNet's own SV/mediator/sequencer already run elsewhere |

Full resource verdict for this laptop (11 GiB Docker VM) and every source URL:
`docs/07-devnet.md`.
