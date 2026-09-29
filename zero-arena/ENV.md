# ENV.md — Single source of truth for environment config

> **BNB Chain migration (2026-09):** Zero Arena contracts now target **BNB Smart Chain** (BSC testnet 97 default, mainnet 56). Encrypted blobs still live on 0G Storage. Any contract address in this file is from the **legacy 0G deployment** and is NOT deployed on BSC yet — see [`MIGRATION-BNB.md`](MIGRATION-BNB.md).

> Created **2026-05-29**. The team kept tripping over many `.env` files with the same keys but different values. This is the canonical map: what each var is, the one correct value, where it lives, and the exact list to update after a redeploy. **If a value here disagrees with a `.env`, this doc + `contracts/deployments/97*.json` win.**

## 0. Source of truth

- **Contract addresses** → `contracts/deployments/97.json` (Cert, Oracle, iNFT) + `contracts/deployments/97-paper-engine.json` (LiveCertificate, Season). Nothing else is authoritative; every `.env` / `contracts.ts` / doc is a *copy* that must match these.
- **Network** → BNB Smart Chain, chainId **97** (testnet) / **56** (mainnet). Galileo (16602) is **sunset** — any Galileo value in a live `.env` is a bug.

## 1. Network constants (NEVER change on redeploy)

| Concept | Value |
| - | - |
| chainId | `97` |
| RPC | `https://data-seed-prebsc-1-s1.bnbchain.org:8545` |
| Storage indexer | `https://indexer-storage-turbo.0g.ai` |
| Storage fee RPC (0G Chain) | `https://evmrpc.0g.ai` (`ZA_STORAGE_RPC`) |
| Explorer | `https://testnet.bscscan.com` |

## 2. Contract addresses (LEGACY 0G mainnet — BSC addresses TBD after deploy)

| Contract | Address | Changes on redeploy? |
| - | - | - |
| AgentCertificate | `0x21a5DEA59cfA07B261d389A9554477e137805c2f` | stable |
| ReencryptionOracle | `0x5514892c89385c0788E223EBbA9d6D6c219836F3` | stable |
| ZeroArenaINFT | `0x6a04821A1C7412D09d7E8c938179C8cAA795B7BC` | stable |
| **LiveCertificate** | `0x3f703dc5d20AdAC3Eda08eD6dd180558EAE8003f` | **CHANGES on R2** (H2 redeploy) |
| **Season** | `0x440c4A3Cf3B97DA7616F7Da457cb1FEF0862a1Ad` | **CHANGES on R1** (C1/C2 redeploy) |

> ✅ Broadcast 2026-06-10: full stack redeployed (Oracle+INFT via `DeployINFTStack`, Live+Season via `DeployPaperEngine`) under the rotated admin `0xF689Bc14903D9E8c13F3A17364217DFCCB4C964c`. AgentCertificate kept + ownership moved to the new admin.

## 3. Same value, different name per service (the confusion source)

| Concept | contracts/.env | zero-arena-bacend + examples | zero-arena-fe (browser) |
| - | - | - | - |
| RPC | `MAINNET_RPC_URL` | `ZA_RPC` | `NEXT_PUBLIC_BSC_RPC_URL` |
| Indexer | — | `ZA_INDEXER` | — |
| AgentCertificate | — | `ZA_ADDR_CERT` | `NEXT_PUBLIC_AGENT_CERTIFICATE_ADDRESS` |
| ReencryptionOracle | — | `ZA_ADDR_ORACLE` | `NEXT_PUBLIC_REENCRYPTION_ORACLE_ADDRESS` |
| ZeroArenaINFT | `ZA_ADDR_INFT` (deploy step 5) | `ZA_ADDR_INFT` | `NEXT_PUBLIC_ZERO_ARENA_INFT_ADDRESS` |
| LiveCertificate | — | `ZA_ADDR_LIVE_CERT` | `NEXT_PUBLIC_LIVE_CERTIFICATE_ADDRESS` |
| Season | — | `ZA_ADDR_SEASON` | `NEXT_PUBLIC_SEASON_ADDRESS` |

> These are intentionally different namespaces (Node services vs `NEXT_PUBLIC_*` browser bundle). They must always hold the **same** address — that's what this doc enforces.

## 4. Secrets — keys & roles (NEVER commit; `.env` only)

Audit fingerprints (sha256 prefix of the value) on 2026-05-29:

| Key | Lives in | Role | Note |
| - | - | - | - |
| `DEPLOYER_PRIVATE_KEY` | `contracts/.env` | Ownable admin of all 5 contracts | **fp `c32ace0aae`** |
| `OPERATOR_PRIVATE_KEY` | `zero-arena-bacend/.env` | LiveCertificate updater + gas payer | **fp `c32ace0aae` — SAME KEY** |
| `PRIVATE_KEY` | `examples/.env` | examples gas/mint | **fp `c32ace0aae` — SAME KEY** |
| `ORACLE_PRIVATE_KEY` | `zero-arena-bacend/.env` | ReencryptionOracle signer | fp `2bd899462b` (distinct ✓) |

✅ **ROTATED 2026-06-10 (C3 executed).** The shared key `0xB1a5402E46d5360D46A9fE0807D3C927b3f50DbD` (fp `c32ace0aae`) was treated as exposed and replaced by three separated wallets; `examples/operator-pool.local.json` deleted. The old key signs nothing after the v0.3.1 redeploy; sweep its residual 0G to the new deployer (§9 step 7).

| Role | Address | Lives in |
| - | - | - |
| Deployer/admin | `0xF689Bc14903D9E8c13F3A17364217DFCCB4C964c` | `contracts/.env` `DEPLOYER_PRIVATE_KEY` |
| Operator | `0x0DCe34908552AC7348A99820Cc97F437e98c1654` | `zero-arena-bacend/.env` `OPERATOR_PRIVATE_KEY` + Railway |
| Examples | `0x5b5CfC2c80549614b95bb3ec96EF452d6597eC2D` | `examples/.env` `PRIVATE_KEY` |
| Oracle signer | `0xDEf4B61EAF80eEd763c2D5C443e2b56cB2d600D1` | unchanged (was already separate, fp `2bd899462b`) |

- **Deployer/admin** → used only for deploys + admin setters; move to the L3 multisig when 0G has Safe support.
- **Operator** → dedicated hot wallet (the daemon needs it online). Per-token authorized by owners (H2).
- **Examples** → throwaway funded with dust. Never the admin key.
- **Oracle signer** → hardware wallet (per MAINNET-DEPLOY.md trust caveat). Already separate ✓.

## 5. ⚠️ Findings from the 2026-05-29 audit

1. **`zero-arena-bacend/.env` was stale Galileo** — `ZA_RPC=evmrpc-testnet…`, `ZA_INDEXER=…testnet-turbo…`, and all 5 `ZA_ADDR_*` were old Galileo addresses. **Fixed to mainnet 2026-05-29** (see §2/§1). Any dev who pulled this ran the backend against a sunset testnet.
2. **Key reuse** (§4) — separate keys, rotate the shared one (C3).
3. `.env` vs `.env.example` "diffs" are **expected** (examples are empty templates) — not bugs.

## 6. Redeploy propagation checklist (R1/R2 → one pass, no drift)

After `DeployPaperEngine --broadcast`, the **only two** values that change are LiveCertificate + Season. Update them everywhere, in this order:

**A. Functional (breaks the product if missed):**
- [ ] `contracts/deployments/97-paper-engine.json` (auto-written by the deploy script)
- [ ] `zero-arena-fe/lib/chain/contracts.ts` (`LiveCertificate`, `Season`) ← FE reads this, not env, by default
- [ ] `zero-arena-fe/.env.local` + Vercel env: `NEXT_PUBLIC_LIVE_CERTIFICATE_ADDRESS`, `NEXT_PUBLIC_SEASON_ADDRESS`
- [ ] `zero-arena-bacend/.env` + **Railway** env: `ZA_ADDR_LIVE_CERT`, `ZA_ADDR_SEASON`
- [ ] `examples/.env`: `ZA_ADDR_LIVE_CERT`, `ZA_ADDR_SEASON`
- [ ] `@zero-arena/contracts` `dist/addresses.json` (`npm run build:abi` in contracts) → republish if consumed
- [ ] Owners must re-`authorizeUpdater(tokenId, operator, true)` + re-`start()` on the new LiveCertificate (H2 — runs reset)

**B. Docs (cosmetic, but keep honest):**
- [ ] root `CLAUDE.md` + `README.md` address tables
- [ ] `contracts/README.md`, `sdk/README.md`, `examples/README.md`, `zero-arena-fe/README.md`, `zero-arena-bacend/README.md`
- [ ] `zero-arena-fe/INTEGRATION.md`, `zero-arena-bacend/INTEGRATION.md`
- [ ] `docs/03-timeline-roadmap.md`, `docs/07-smart-contracts.md`
- [ ] this file (§2)

> ✅ **Automated.** From the contracts repo: `npm run sync:addresses` (dry-run preview) → `npm run sync:addresses -- --write` (apply). It reads `deployments/97*.json`, diffs against `deployments/.synced-addresses.json` (the lockfile — primed 2026-05-29 with the current addresses), and string-replaces every changed address across all 20 files above (A **and** B) in one pass. So after a redeploy you run it once and nothing drifts. It also warns if any `.env` still holds a testnet/Galileo URL. Commit the lockfile so the whole team shares the same baseline. (`node scripts/sync-addresses.mjs [--write]` works too.)

## 7. Railway env (backend services) — set on the Railway dashboard

`onboard`, `transfer-oracle`, `season-keeper`, paper daemons read these (NOT the local `.env`):

| Var | Value |
| - | - |
| `ZA_RPC` | `https://data-seed-prebsc-1-s1.bnbchain.org:8545` |
| `ZA_INDEXER` | `https://indexer-storage-turbo.0g.ai` |
| `ZA_ADDR_INFT` | `0x6a04821A1C7412D09d7E8c938179C8cAA795B7BC` |
| `ZA_ADDR_LIVE_CERT` | `0x3f703dc5d20AdAC3Eda08eD6dd180558EAE8003f` |
| `ZA_ADDR_SEASON` | `0x440c4A3Cf3B97DA7616F7Da457cb1FEF0862a1Ad` |
| `OPERATOR_PRIVATE_KEY` | dedicated operator key (C3-rotated, addr `0x0DCe34908552AC7348A99820Cc97F437e98c1654`) |
| `ORACLE_PRIVATE_KEY` | oracle signer key (transfer-oracle service) |
| `ONBOARD_AUTH_TOKEN` | bearer for write routes (recommended; without it onboard is open) |

## 8. Vercel env (FE) — set on the Vercel dashboard

FE ships hardcoded addresses in `lib/chain/contracts.ts`; `NEXT_PUBLIC_*` only override. After redeploy, update BOTH `contracts.ts` (committed) and the Vercel `NEXT_PUBLIC_*` (if set), then redeploy.

| Var | Value |
| - | - |
| `NEXT_PUBLIC_BSC_RPC_URL` | `https://data-seed-prebsc-1-s1.bnbchain.org:8545` |
| `NEXT_PUBLIC_AGENT_CERTIFICATE_ADDRESS` | `0x21a5DEA59cfA07B261d389A9554477e137805c2f` |
| `NEXT_PUBLIC_REENCRYPTION_ORACLE_ADDRESS` | `0x5514892c89385c0788E223EBbA9d6D6c219836F3` |
| `NEXT_PUBLIC_ZERO_ARENA_INFT_ADDRESS` | `0x6a04821A1C7412D09d7E8c938179C8cAA795B7BC` |
| `NEXT_PUBLIC_LIVE_CERTIFICATE_ADDRESS` | `0x3f703dc5d20AdAC3Eda08eD6dd180558EAE8003f` |
| `NEXT_PUBLIC_SEASON_ADDRESS` | `0x440c4A3Cf3B97DA7616F7Da457cb1FEF0862a1Ad` |
| `NEXT_PUBLIC_ONBOARD_URL` | `https://onboard-production-ed6c.up.railway.app` |
| `NEXT_PUBLIC_TRANSFER_ORACLE_URL` | `https://transfer-oracle-production-f390.up.railway.app` |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | (real WalletConnect project id) |

## 9. Key separation & rotation (C3)

Today **one key** (`0xB1a5402E46d5360D46A9fE0807D3C927b3f50DbD`, fp `c32ace0aae`) is admin + operator + examples (§4). It also lived in the un-gitignored `examples/operator-pool.local.json` → treat as **potentially exposed, rotate it**. Compose this with the R1/R2 redeploy so the new contracts are born under clean keys.

> Run `cast wallet new` **locally**. NEVER paste a private key into a committed file, a PR, or a chat. New keys go only into gitignored `.env` files, Railway/Vercel secrets, and your password manager.

**1. Generate 3 new wallets**
```bash
cast wallet new   # ADMIN/DEPLOYER  (prefer a Safe multisig — see note in step 4)
cast wallet new   # OPERATOR        (hot; lives in the daemon + season-keeper)
cast wallet new   # EXAMPLES        (throwaway, dust only)
```
Oracle signer (`0xDEf4B61E…`) is already separate — rotate only if you suspect it (it is the transfer "custody root" per MAINNET-DEPLOY; hardware-wallet it).

**2. Fund them** (from the old key or any on-ramp)
```bash
RPC=https://data-seed-prebsc-1-s1.bnbchain.org:8545
cast send <NEW_DEPLOYER> --value 0.2ether --rpc-url $RPC --private-key <OLD_KEY>   # R1/R2 (~0.015) + admin tx
cast send <NEW_OPERATOR> --value 0.5ether --rpc-url $RPC --private-key <OLD_KEY>   # ongoing epoch/settle gas
cast send <NEW_EXAMPLES> --value 0.1ether --rpc-url $RPC --private-key <OLD_KEY>
```

**3. Put the new keys in the gitignored `.env` files**

| File | Set |
| - | - |
| `contracts/.env` | `DEPLOYER_PRIVATE_KEY`=new admin · `DEPLOYER_ADDRESS`=new admin addr · `OPERATOR_ADDRESS`=new operator addr · **add `ZA_ADDR_INFT=0x6a04821A1C7412D09d7E8c938179C8cAA795B7BC`** (DeployPaperEngine needs it) |
| `zero-arena-bacend/.env` | `OPERATOR_PRIVATE_KEY`=new operator |
| `examples/.env` | `PRIVATE_KEY`=new throwaway |
| `examples/operator-pool.local.json` | regenerate with new operator key(s), or delete if unused (now gitignored) |

**4. Deploy R1/R2 under the new admin** — per MAINNET-DEPLOY §5 (`forge script DeployPaperEngine --broadcast`). New LiveCertificate + Season are owned by the new admin; the new operator is what owners authorize per-token (H2).

> **Multisig (L3):** `forge script --private-key` can't sign from a Safe. Either (a) deploy with a fresh EOA admin now then `transferOwnership` → Safe later (L3), or (b) keep the EOA admin for this redeploy and migrate to Safe in the L3 step.

**5. Move the 3 unchanged contracts to the new admin** (LiveCertificate + Season are already new-admin-owned; Cert/Oracle/iNFT still belong to the old key — Ownable2Step = transfer + accept):
```bash
RPC=https://data-seed-prebsc-1-s1.bnbchain.org:8545
CONTRACTS="0x21a5DEA59cfA07B261d389A9554477e137805c2f 0x5514892c89385c0788E223EBbA9d6D6c219836F3 0x6a04821A1C7412D09d7E8c938179C8cAA795B7BC"
for C in $CONTRACTS; do cast send $C "transferOwnership(address)" <NEW_ADMIN> --rpc-url $RPC --private-key <OLD_KEY>; done
for C in $CONTRACTS; do cast send $C "acceptOwnership()"          --rpc-url $RPC --private-key <NEW_ADMIN_KEY>; done
```

**6. Propagate + infra**
- `cd contracts && npm run sync:addresses -- --write`  (new Live+Season → all 20 files)
- Railway: `OPERATOR_PRIVATE_KEY`=new operator, `ZA_ADDR_LIVE_CERT`/`ZA_ADDR_SEASON`=new (§7)
- Vercel: `NEXT_PUBLIC_LIVE_CERTIFICATE_ADDRESS`/`NEXT_PUBLIC_SEASON_ADDRESS`=new (§8) + redeploy
- Owners re-`authorizeUpdater(tokenId, newOperator, true)` + re-`start()` on the new LiveCertificate

**7. Retire the old key** — once everything works on the new keys, sweep remaining 0G from `0xB1a5402E…` to the new deployer and stop using it. (It was operator on the now-orphaned old LiveCertificate — irrelevant.)

**Verify**
```bash
RPC=https://data-seed-prebsc-1-s1.bnbchain.org:8545
cast call 0x21a5DEA59cfA07B261d389A9554477e137805c2f "owner()(address)" --rpc-url $RPC  # AgentCertificate = NEW_ADMIN after step 5
cast call <NEW_LIVE_CERT> "owner()(address)" --rpc-url $RPC                              # = NEW_ADMIN
```
