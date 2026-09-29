# Zero Arena — Audit Remediation Plan (Baseline / Patokan)

> Created **2026-05-29** from a full multi-repo security + architecture audit (contracts, sdk, zero-arena-bacend, zero-arena-fe, examples).
> This is the **canonical tracking doc**. All 17 findings are in scope. Order of attack: **Critical → High → Medium → Low**.
> Status legend: ⬜ todo · 🔵 in-progress · ✅ done · ⏸ blocked-on-user (mainnet redeploy / key rotation / ownership move)

Live task list mirrors this doc (TaskList in-session). This file is the durable spec; tasks are the checklist.

---

## 0. Sequencing & redeploy batching

Contract changes cost a **real mainnet redeploy** + a `@zero-arena/contracts` version bump (FE + SDK inline ABIs, so they must follow). Don't redeploy per-finding — batch:

| Batch | What | Findings | Needs |
| - | - | - | - |
| **Hotfix** | gitignore + key rotation | C3 | gitignore done by Claude; **key rotation = user** |
| **R1 — Season.sol** (emergency) | settle completeness/uniqueness + refund surplus + season-windowed metric | C1, C2, L2, (L1 if feasible) | redeploy `Season` + bump contracts pkg + FE/SDK addr update |
| **R2 — INFT/Live/Oracle** (coordinated) | per-token operator auth + proof nonce | H2, M3 | redeploy `LiveCertificate` + `ReencryptionOracle` + `ZeroArenaINFT`; **major** contracts bump (struct/iface change) → FE + SDK + backend update in lockstep |
| **Off-chain PRs** (no redeploy) | everything else | H1, H3, H4, M1, M2, M4, M5, L4, L5 | per-repo PRs, ship independently |
| **Ops** | admin → multisig + timelock | L3 | `Ownable2Step.transferOwnership` on all 5 contracts; **user** holds keys |

**Rule:** Claude writes + tests all code and proves fixes locally (forge test / npm test / typecheck). Claude does **not** broadcast mainnet tx, rotate keys, or `transferOwnership` — those are flagged ⏸ and handed to the user with the exact command.

**Env source of truth:** see [`ENV.md`](./ENV.md) — canonical addresses/RPC, the var-name map across services, the redeploy propagation checklist (the 2 changing addresses live in ~15 places each), and the key roster. Findings (2026-05-29): `zero-arena-bacend/.env` was stale **Galileo** (fixed → mainnet); one private key is reused as DEPLOYER + OPERATOR + examples (separate as part of C3/L3). Dry-run R1/R2 verified clean (no broadcast); predicted Live `0xcC4a…d08A`, Season `0xeC77…DBf9` (nonce-dependent). **Tooling ready:** `contracts/scripts/sync-addresses.mjs` (`npm run sync:addresses -- --write`) propagates new addresses across all 20 files in one pass (lockfile primed); `MAINNET-DEPLOY.md` corrected for H2 (per-token auth, no `setUpdater`). Remaining ⏸-user before redeploy: separate/rotate the shared deployer=operator=examples key (C3), set Railway + Vercel env (ENV.md §7/§8).

---

## 1. Status table

| ID | Sev | Title | Repo(s) | Redeploy | Status |
| - | - | - | - | - | - |
| C3 | 🔴 | Leaked operator key file not gitignored | examples | no | ✅ **EXECUTED 2026-06-10**: 3 separated wallets (admin `0xF689…964c`, operator `0x0DCe…1654`, examples `0x5b5C…eC2D`), pool file deleted, old Wallet A swept to dust, ownership of all 5 contracts moved to new admin |
| C1 | 🔴 | `Season.settle` accepts incomplete/duplicate winners → pool theft | contracts | R1 | ✅ **DEPLOYED 2026-06-10** — Season `0x440c4A3Cf3B97DA7616F7Da457cb1FEF0862a1Ad` |
| C2 | 🔴 | Unpaid prize pool locked forever; `settle([])` griefing | contracts | R1 | ✅ **DEPLOYED 2026-06-10** (withdraw() + remainder refund live) |
| H1 | 🟠 | Untrusted agent inherits full env (operator key pool) | bacend | no | ✅ env stripped (residual own key → M4/TEE) |
| H2 | 🟠 | `authorizedUpdaters` global, not per-token (trust-model mismatch) | contracts, fe, bacend | R2 | ✅ **DEPLOYED 2026-06-10** — LiveCertificate `0x3f703dc5d20AdAC3Eda08eD6dd180558EAE8003f`; all 8 re-minted tokens authorized the new operator per-token |
| H3 | 🟠 | Backend ships 4 high npm vulns (axios SSRF), no `overrides` | bacend | no | ✅ axios pinned → 0 high (4 moderate ethers → L5) |
| H4 | 🟠 | Onboard signature doesn't bind agent/params; nonce unused | bacend, sdk, fe | no | ✅ payload binds agentHash+params, nonce consumed, BE/SDK/FE digest unified (typecheck ×3 green) |
| M1 | 🟡 | Rate-limit bypass via spoofed XFF + unbounded Map DoS | bacend | no | ✅ shared `http-util`: trusted-hop clientIp (`TRUSTED_PROXY_HOPS`) + bounded RateLimiter (LRU evict, no `clear()`) |
| M2 | 🟡 | Transfer oracle blind-signs (no ownership check / no re-encryption) | bacend | no | ✅ `assertSignable`: chainId guard + on-chain `ownerOf(from)` check before signing |
| M3 | 🟡 | No nonce in ERC-7857 proof → replay within deadline | contracts, sdk, bacend, fe | R2+ | ✅ code+test: per-token `transferNonce` in INFT, bound into oracle digest; SDK/backend/FE clients carry `nonce` (FE `MintINftDialog` reads it; backend `assertSignable` rejects stale). 78/78 forge incl. replay test; SDK 109/109+build; backend tsc vs local SDK; FE tsc. ⚠️ **Deploy = heaviest:** redeploys `ZeroArenaINFT` + `ReencryptionOracle` → orphans existing iNFTs (re-mint migration) + needs SDK 0.5.2 publish. **DEPLOYED 2026-06-10** (not deferred to v0.6): Oracle `0x5514892c89385c0788E223EBbA9d6D6c219836F3` + INFT `0x6a04821A1C7412D09d7E8c938179C8cAA795B7BC`; 8 agents re-minted (5 spot + 3 perp) under the new examples wallet — orphaning cost was zero (all 6 old tokens were self-owned). SDK 0.5.2 tagged; npm publish blocked on expired NPM_TOKEN (user). |
| M4 | 🟡 | No CPU/mem/time limits on spawned agent daemons | bacend | no | ✅ heap cap (`NODE_OPTIONS --max-old-space-size`, `ONBOARD_DAEMON_MAX_MB`) + concurrency cap (`ONBOARD_MAX_DAEMONS`); full CPU/sandbox = TEE v1.0 |
| M5 | 🟡 | Live-cert ingest (Bybit/REST) ≠ canonical Binance → unverifiable | sdk, bacend | no | ✅ epoch envelope commits a `source` tag (schema v1→v2) via `BinanceWS.sourceTag()` — verifiability boundary explicit. Binance-reachability (proxy/region) = infra, separate. |
| L1 | ⚪ | Season metric is all-time, not windowed to [startTime,endTime] | contracts | R1 | ✅ **DEPLOYED 2026-06-10**. code+test: Season snapshots `baselineReturnBps` at enroll; settle + keeper rank on in-season delta (current−baseline). 77/77 forge. Rides R1. Residual: window≈[enroll,settle]; exact [start,end] needs LiveCertificate timestamped history (v0.6). |
| L2 | ⚪ | `createSeason` keeps `msg.value` surplus, no refund | contracts | R1 | ✅ **DEPLOYED 2026-06-10** (folded into C2) |
| L3 | ⚪ | Single-EOA admin on all contracts → multisig + timelock | contracts/ops | no (tx) | ⏸ user — **unblocked**: canonical Safe v1.3.0/v1.4.1 singletons verified deployed on 0G 16661 (SafeL2 `0x3E5c…D36E`/`0x29fc…C762`, factories `0xa6B7…6AB2`/`0x4e1D…ec67`). Needs ≥2 user-controlled owner keys (hardware wallet) — create proxy via factory, then Ownable2Step transfer from `0xF689…964c`. Admin is now a fresh, single-purpose EOA (post-C3), so exposure is reduced meanwhile. |
| L4 | ⚪ | Doc drift (oracle "v0.2 TEE", FE per-token badge vs global) | docs, fe | no | ✅ oracle comments v0.2→v1.0; backend config + FE operators.ts + root CLAUDE.md trust-model updated to per-token (H2); runbook fixed (task B). FE badge table was already per-token. |
| L5 | ⚪ | SDK 3 moderate advisories; verify FE audit clean | sdk, fe | no | ✅ ALL 3 JS repos → 0 vulns: SDK `ws`→8.21.0 (override ≥8.20.1; tests 109/109), backend +ws override, FE `pnpm.overrides {ws≥8.20.1, postcss≥8.5.10}`. (npm's "no fix" was wrong — `ws` patched ≥8.20.1.) NB: FE has a pre-existing rainbowkit\@2.2.11 ↔ wagmi\@3.6.14 peer-mismatch warning — separate compat follow-up. |

---

## 2. Details + fix spec

### 🔴 C3 — Leaked operator key file
- **Where:** `examples/operator-pool.local.json` (held `privateKey` + `0x…64hex`), not matched by `examples/.gitignore`.
- **Fix:** ✅ added `*.local.json` + `operator-pool*.json` to `examples/.gitignore`. Verify `git -C examples check-ignore operator-pool.local.json` returns the file.
- **⏸ User action:** if these keys were ever authorized on mainnet `LiveCertificate`, **rotate**: generate new operator wallet(s), `setUpdater(oldAddr,false)` + `setUpdater(newAddr,true)`, update Railway env. Treat the old keys as burned.
- **Done when:** check-ignore passes (✅) AND user confirms rotation (or confirms keys were never mainnet-authorized).

### 🔴 C1 — `Season.settle` winner-set not verified complete/unique
- **Where:** `contracts/src/Season.sol:121-161`.
- **Root cause:** only checks each token enrolled + monotone-decreasing return; never checks the hint contains the *actual* top performers, never rejects duplicates. `settle` is permissionless (keeper is convenience, `season/keeper.ts:8`).
- **Exploit:** `settle(id, [myTok,myTok,myTok])` → 50+30+20 = 100% pool to attacker. Or 3 owned low-rank tokens.
- **Fix:** require `sortedTokens.length == participants[id].length`; reject duplicates (bitmap/seen-set keyed by tokenId); verify monotone-decreasing; pay top-3 from the verified-complete ranking. (Alt: keep prefix form but additionally assert every non-included participant has `ret <= ` the 3rd-place return.)
- **Verify:** new Foundry PoC test that currently steals the pool must **revert** after fix; existing settle tests still pass; add fuzz/invariant: "sum of payouts ≤ prizePool && winners are the true top-3".

### 🔴 C2 — Unpaid pool locked forever + empty-hint griefing
- **Where:** `contracts/src/Season.sol` (no `withdraw`/`sweep`/`refund`).
- **Root cause:** `settle([])` sets `settled=true`, pays 0; with <3 winners the remainder is stranded; no recovery path even for admin.
- **Fix:** at end of `settle`, refund `prizePool - totalPaid` to `s.creator`; AND reject `settle` with a winner-set that is empty/short when more eligible participants exist (ties into C1's completeness rule). Optionally add `reclaimUnsettled(seasonId)` for the creator after a grace period if never settled.
- **Verify:** test: 1-winner season refunds 50% to creator; empty season refunds 100%; total in == total out (no wei stranded).

### 🟠 H1 — Untrusted agent inherits full operator env
- **Where:** `zero-arena-bacend/src/onboard/orchestrator.ts:88-132` (`env: { ...process.env }`).
- **Root cause:** owner-supplied agent runs in-process (`tsx` import) with full Node caps; child sees `OPERATOR_KEYS_POOL` + every other secret → exfiltration → can `update()` any token (chains to C1/H2).
- **Fix:** build an explicit **allowlist** env for the child — only `PAPER_*` vars + the single assigned `OPERATOR_PRIVATE_KEY` it needs; never pass `OPERATOR_KEYS_POOL` or unrelated secrets. Strip `process.env` spread. Longer term (R2/v1.0): run agent in a separate hardened sandbox; keep the signing key in the parent.
- **Verify:** test/inspect spawned env contains no pool/oracle keys; daemon still commits epochs.

### 🟠 H2 — Global `authorizedUpdaters` ≠ documented per-token consent
- **Where:** `contracts/src/LiveCertificate.sol:66-69,106-146`; docs say `authorizedUpdaters[tokenId][operator]` (`zero-arena-fe/CLAUDE.md`).
- **Root cause:** any authorized operator can write epochs/metrics (incl. `liveTotalReturnBps`, which drives Season payouts) for **any** started token. Owner consent is off-chain only. "Owner-operated" is impossible without globally trusting that owner.
- **Fix (R2):** make authorization per-token. Option A: `mapping(uint256 tokenId => mapping(address => bool)) tokenUpdaters` set by token owner (`setTokenUpdater`), checked in `update`/`markLiquidated`. Option B: store owner's signed-consent hash at `start()` and require the updater to match. Allow owner-self-update for owner-operated mode. Update FE badge source + onboard `auth.ts` accordingly.
- **Verify:** operator can only update tokens that delegated to it; owner can self-update; cross-token write reverts. **Major** contracts bump (storage/event change) → FE+SDK+backend lockstep.
- **DONE (code):** `LiveCertificate.authorizedUpdaters` now `mapping(tokenId=>mapping(operator=>bool))`; `authorizeUpdater(tokenId,updater,allowed)` (owner-only); `update`/`markLiquidated` allow owner-self-op OR delegated operator. `UpdaterSet` event gains `tokenId`. Backend `auth.ts` checks 2-arg per-token. FE `contracts.ts`/dialog were already written per-token. Deploy script drops global `setUpdater`. 75/75 forge tests + backend tsc green.
- **⚠️ Follow-up (R2 operational):** with an operator key POOL the orchestrator assigns a per-token wallet by `tokenId % pool`, but `/health` advertises only the primary operator — so after H2 the owner could authorize a different wallet than the daemon signs with → `update` reverts. Fix: `/health` (+FE) must expose the per-token assigned operator, OR collapse the pool to the primary. Single-wallet default is unaffected.

### 🟠 H3 — Backend npm vulns (axios SSRF)
- **Where:** `zero-arena-bacend/package.json` (no `overrides`); `npm audit --omit=dev` → 2 moderate + 4 high incl. GHSA-m7pr-hjqh-92cm.
- **Fix:** add `"overrides": { "axios": ">=1.12.0" }` (mirror SDK), `npm install`, re-audit to 0 high. Confirm CI `audit.yml` gate (`--audit-level=high`) goes green; don't bypass.
- **Verify:** `npm audit --omit=dev` shows 0 high/critical; CI green.

### 🟠 H4 — Onboard signature unbound + nonce unused
- **Where:** `onboard/auth.ts:32-44` (`digestFor` omits agent/params), `onboard/server.ts:184-256` (nonce never stored/checked).
- **Fix:** include `keccak256(canonical(agentBundle))` + all run params (genesisHash, symbol, interval, market, barsPerEpoch, initialBalance, leverage, feeBps, slippageBps) in the signed digest. Persist + reject used nonces (per-owner highwater or used-set). Update SDK `OnboardClient`/FE `DelegateAgentDialog` to sign the new digest in lockstep.
- **Verify:** tampering with any param after signing → 403; replay of a used nonce → 403; happy path still onboards.

### 🟡 M1 — Rate-limit XFF bypass + unbounded Map
- **Where:** `onboard/server.ts:59-63,30-57`; `transfer-oracle/server.ts:121-125,28`.
- **Fix:** derive client IP from a **trusted** proxy hop (Railway sets a known header / use rightmost XFF entry from the trusted edge), not the attacker-controlled leftmost token. Bound the limiter Map (LRU/size cap) instead of `hits.clear()` flush-all.
- **Verify:** spoofed XFF can't reset another IP's window; Map size bounded under flood.

### 🟡 M2 — Transfer oracle blind-signs
- **Where:** `transfer-oracle/validate.ts`, `signer.ts` (no ownership check, no real re-encryption).
- **Fix:** before signing, verify on-chain `inft.ownerOf(tokenId) == from` (read via provider). Document that v0.5 oracle is a signing stub (no real re-encryption) until v1.0 TEE; don't market the sealed-key guarantee as enforced.
- **Verify:** sign request where `from != ownerOf` → rejected.

### 🟡 M3 — No nonce in ERC-7857 proof
- **Where:** `oracle/ReencryptionOracle.sol:48-53`, `ZeroArenaINFT.sol:95-152`, SDK `LocalOracleClient`/`HttpOracleClient`, backend signer, FE transfer-oracle client.
- **Fix (R2):** add a per-token transfer nonce stored on `ZeroArenaINFT`, include it in the signed digest + `verifyTransfer` params, increment on `transfer`/`clone`. Bump SDK signing scheme + all clients in lockstep.
- **Verify:** replaying a consumed proof reverts; happy path works.

### 🟡 M4 — No resource limits on agent daemons
- **Where:** `onboard/orchestrator.ts:88`.
- **Fix:** cap child CPU/mem (e.g. spawn with `--max-old-space-size`, cgroup/ulimit, or container quota) + a watchdog/heartbeat timeout that kills a stuck daemon. Cap concurrent daemons.
- **Verify:** a runaway agent is killed and doesn't take down peers.

### 🟡 M5 — Live-cert data source unverifiable
- **Where:** daemon ingests Bybit/REST (`orchestrator.ts:121`, memory realtime-arch) vs canonical Binance backtest.
- **Fix:** tag the exchange/source in the dataset spec + epoch envelope so a verifier knows what to re-run against; OR resolve Binance reachability (proxy/region/private node). At minimum stop implying the live cert is Binance-verifiable.
- **Verify:** epoch envelope records source; docs state the verifiability boundary.

### ⚪ L1 — Season metric not windowed
- **Where:** `Season.settle` reads all-time `live.runs(tokenId).liveTotalReturnBps`.
- **Fix:** snapshot each participant's live return at `endTime` (e.g. Season records `returnAtSettle` from the first epoch with `lastUpdatedAt >= endTime`, or LiveCertificate exposes a windowed accessor), and rank on the in-window delta from `startTime`. Ride R1 if cheap, else R2.
- **Verify:** a token with great pre-season but flat in-season return does not win.

### ⚪ L2 — createSeason surplus locked
- **Where:** `Season.sol:80`. **Folded into C2** (refund path covers surplus too). Verify `msg.value > prizePool` surplus is refunded or rejected.

### ⚪ L3 — Admin centralization
- **⏸ User:** transfer ownership of all 5 contracts to a multisig (e.g. Safe) + add a timelock for sensitive setters (`setOracle`, `setSigner`, `setUpdater`, `setThresholds`). `Ownable2Step` already supports the 2-step transfer.

### ⚪ L4 — Doc drift
- **Fix:** correct `ReencryptionOracle.sol` comment ("v0.2 → TEE" should be v1.0); fix `zero-arena-fe/CLAUDE.md` badge source (global vs per-token — align with whatever H2 ships); sweep CLAUDE.md trust-model copy.

### ⚪ L5 — Residual advisories
- **Fix:** resolve SDK's 3 moderate advisories (bump/override); run `npm audit` on FE and confirm 0 high/critical; add `overrides` if a transitive dep is stuck.

---

## 3. Done-definition for the whole plan
- [ ] All 17 rows ✅ or ⏸-with-user-owning-the-step.
- [ ] Two redeploys (R1, R2) broadcast by user with `@zero-arena/contracts` bumps; FE+SDK addr/ABI updated.
- [ ] `forge test` green incl. new PoC/invariant tests; `npm audit` 0-high across sdk+bacend+fe; typecheck green.
- [ ] CLAUDE.md trust-model copy matches deployed code.


---

## 4. Execution log — 2026-06-10 (full redeploy session)

- **G1 (new, found in this session):** `keeper.ts` still sent a `slice(0,3)` hint; new `Season.settle` requires the complete ranking → fixed (full `sortedTokens`, `IncompleteHint`/`DuplicateInHint` added to permanent-error matcher).
- **G2 (new):** deployed FE signed `{action,tokenId,nonce,deadline}` vs BE's `{action,deadline,nonce,tokenId}` → dashboard delegation always failed sig recovery. Fixed by the canonical sorted-keys digest (H4) across FE/SDK/BE.
- **Deploys (chainId 16661, admin `0xF689Bc14903D9E8c13F3A17364217DFCCB4C964c`):** DeployINFTStack → Oracle `0x5514892c89385c0788E223EBbA9d6D6c219836F3`, INFT `0x6a04821A1C7412D09d7E8c938179C8cAA795B7BC`; DeployPaperEngine → LiveCertificate `0x3f703dc5d20AdAC3Eda08eD6dd180558EAE8003f`, Season `0x440c4A3Cf3B97DA7616F7Da457cb1FEF0862a1Ad`. AgentCertificate kept (`0x21a5…05c2f`), ownership moved old→new admin via Ownable2Step. INFT `setThresholds(-1000000, 0)` re-applied (constructor default blocked mints).
- **State restored:** 8 iNFTs minted (5 spot via multi:mint, 3 perp via multi:mint:perp; 1 perp skipped — its deterministic runHash collides with old-wallet cert #1 → `CertificateNotOwned`). All 8 `authorizeUpdater(tokenId, 0x0DCe…1654, true)`.
- **Propagation:** `sync:addresses --write` (108 edits / 20 files); Railway env set (onboard, season-keeper: new addrs + rotated operator key, `--skip-deploys`); Vercel production env updated (4 addrs), preview now falls back to code DEFAULTS; FE pushed to org + Vercel fork.
- **Commits/pushes:** contracts v0.4.0, sdk v0.5.2 (+vitest audit fix), fe, examples pushed; **bacend committed locally, push held** until `zeroarena@0.5.2` is on npm (Railway build would fail).
- **BLOCKED on user:** npm `NPM_TOKEN` secret in `Zero-Arena/zero-arena-sdk` returns E404 on publish (token expired/revoked) → regenerate Granular token for `zeroarena` (npmjs.com → Settings → Tokens), update repo secret, re-run the `publish` workflow for tag v0.5.2.
- **After publish (queued):** bacend `npm i zeroarena@^0.5.2` + push (Railway auto-deploy), examples dep bump, re-onboard the 8 tokens via `/onboard`, restart live runs.
