# 7. Smart Contracts

> **BNB Chain migration (2026-09):** Zero Arena contracts now target **BNB Smart Chain** (BSC testnet 97 default, mainnet 56). Encrypted blobs still live on 0G Storage. Any contract address in this file is from the **legacy 0G deployment** and is NOT deployed on BSC yet — see [`MIGRATION-BNB.md`](../MIGRATION-BNB.md).

Solidity `0.8.24`, OpenZeppelin v5.1, Foundry. Two layers — qualifier (cert + iNFT + oracle) and arena (live cert + season). All deployed and verified on BNB Chain (chainId `97`).

| Contract | Address |
| - | - |
| `AgentCertificate` | [`0x21a5DEA59cfA07B261d389A9554477e137805c2f`](https://chainscan.0g.ai/address/0x21a5DEA59cfA07B261d389A9554477e137805c2f) |
| `ZeroArenaINFT` | [`0x6a04821A1C7412D09d7E8c938179C8cAA795B7BC`](https://chainscan.0g.ai/address/0x6a04821A1C7412D09d7E8c938179C8cAA795B7BC) |
| `ReencryptionOracle` | [`0x5514892c89385c0788E223EBbA9d6D6c219836F3`](https://chainscan.0g.ai/address/0x5514892c89385c0788E223EBbA9d6D6c219836F3) |
| `LiveCertificate` | [`0x3f703dc5d20AdAC3Eda08eD6dd180558EAE8003f`](https://chainscan.0g.ai/address/0x3f703dc5d20AdAC3Eda08eD6dd180558EAE8003f) |
| `Season` | [`0x440c4A3Cf3B97DA7616F7Da457cb1FEF0862a1Ad`](https://chainscan.0g.ai/address/0x440c4A3Cf3B97DA7616F7Da457cb1FEF0862a1Ad) |

---

## 7.1. `AgentCertificate.sol`

Append-only registry of backtest certificates. Anchors `runHash` + metrics + storage roots. **The entrance ticket.**

| Function | Purpose |
| - | - |
| `submit(runHash, storageRootHash, datasetHash, attestationHash, totalReturnBps, sharpeX1000, maxDrawdownBps, winRateBps, trustTier, market)` | Anchor a backtest cert. Returns `certId`. Reverts on empty hash, invalid tier (`1`/`2`/`3`), invalid market (`0`=spot or `1`=perp), or attestation mismatch (T3 must carry attestation; T1/T2 must not). |
| `get(certId)` | Read the full `Certificate` struct. Reverts `UnknownCertificate` if not set. |
| `exists(certId)` | Bool. |

| Event | Indexed | Non-indexed |
| - | - | - |
| `CertificateSubmitted` | `certId`, `owner`, `runHash` | `storageRootHash`, `trustTier`, `market` |

| `Certificate` struct field | Type | Note |
| - | - | - |
| `runHash` | `bytes32` | Canonical hash |
| `storageRootHash` | `bytes32` | 0G Storage root |
| `datasetHash` | `bytes32` | Dataset identity |
| `attestationHash` | `bytes32` | `0x0` for T1/T2 |
| `totalReturnBps` | `int128` | Signed |
| `sharpeX1000` | `uint128` | |
| `owner` | `address` | `msg.sender` |
| `createdAt` | `uint48` | `block.timestamp` |
| `maxDrawdownBps`, `winRateBps` | `uint16` | |
| `trustTier`, `market` | `uint8` | |

`Ownable2Step` admin is reserved for v0.6+ — no admin functions exposed in v0.5. Submissions are immutable.

---

## 7.2. `ZeroArenaINFT.sol` (ERC-7857)

Mints require a certificate that clears the threshold. Vanilla `transferFrom`/`safeTransferFrom` are **disabled** — ownership moves only through `transfer` / `clone`, which require an oracle proof that the sealed key was re-encrypted for the recipient.

| Function | Purpose |
| - | - |
| `mint(certificateId, metadataHash, storageRoot)` | Cert owner mints. Reverts if `cert.owner != msg.sender`, or if metrics don't clear `minTotalReturnBps` / `minSharpeX1000`. |
| `transfer(from, to, tokenId, sealedKey, proof)` | ERC-7857 transfer. `proof = abi.encode(bytes32 newMetadataHash, uint256 deadline, bytes signature)`. Verified against `ReencryptionOracle`. |
| `clone(from, to, tokenId, sealedKey, proof)` | Mints a new iNFT for the recipient with the same metadata/storage references — copy, not move. |
| `setOracle(address)` | Admin only. |
| `setThresholds(int128 minReturn, uint128 minSharpe)` | Admin only. |

| Mapping | Use |
| - | - |
| `metadataHashes[tokenId]` | Current encrypted-metadata hash |
| `storageRoots[tokenId]` | 0G Storage root for the bundle |
| `certificateOf[tokenId]` | Backing static cert ID |

| Event | Indexed | Non-indexed |
| - | - | - |
| `AgentMinted` | `tokenId`, `owner`, `certificateId` | `metadataHash`, `storageRoot` |
| `SealedKeyDelivered` | `tokenId`, `to` | `sealedKey` |
| `MetadataUpdated` | `tokenId` | `metadataHash` |
| `OracleUpdated` | `oldOracle`, `newOracle` | — |
| `ThresholdsUpdated` | — | `minTotalReturnBps`, `minSharpeX1000` |

Default thresholds: `minTotalReturnBps = 0` and `minSharpeX1000 = 1000` (Sharpe ≥ 1.0).

---

## 7.3. `ReencryptionOracle.sol`

v0.1 / v0.5 **trusted-ECDSA stub**. The off-chain transfer-oracle service signs an EIP-191 digest over `(chainId, inftAddress, tokenId, from, to, sealedKeyHash, newMetadataHash, deadline)`; this contract recovers the signer and verifies it matches the registered oracle signer address.

| Function | Purpose |
| - | - |
| `verifyProof(...)` | Recovers signer from `signature`, asserts equals `signer()`. |
| `setSigner(address)` | Admin only. |
| `signer()` | Current authorized signer (compare against transfer-oracle `/health`). |

In v1.0 the verifier is swapped for **0G Compute TEE-quote verification**; same call shape, only the trust root changes. Until v1.0 ships, the mainnet oracle key is the trust root for every ERC-7857 transfer — treat the signer wallet as a custody root (hardware-wallet recommended, rotate via `setSigner()` on any suspicion).

---

## 7.4. `LiveCertificate.sol`

Append-only **hash chain** extending each iNFT's static `runHash` with one operator-signed epoch at a time. The arena's source of truth for live performance.

| Function | Purpose |
| - | - |
| `start(tokenId, initialCumulativeHash)` | Owner-only. Opens the live cert. `initialCumulativeHash` must equal the static cert's `runHash` (`GenesisMismatch` revert otherwise). |
| `stop(tokenId)` | Owner-only. Halts updates. Status → `STOPPED`. |
| `update(tokenId, epochIndex, epochHash, liveTotalReturnBps, liveSharpeX1000, liveMaxDrawdownBps, liveWinRateBps)` | Authorized operator only. Enforces `epochIndex == r.epochCount` (`EpochOutOfOrder` otherwise). Sets `cumulativeHash := keccak256(prev ‖ epochHash)`. |
| `markLiquidated(tokenId)` | Authorized operator only. Status → `LIQUIDATED`. |
| `setUpdater(address, bool)` | Admin only. Global authorized-operators mapping. |
| `get(tokenId)` | Reads the full `LiveRun` struct. |
| `isActive(tokenId)` | Bool. |

| Event | Indexed | Non-indexed |
| - | - | - |
| `PaperRunStarted` | `tokenId`, `owner` | `startedAt`, `initialCumulativeHash` |
| `EpochCommitted` | `tokenId`, `epochIndex` | `cumulativeHash`, `epochHash`, `liveTotalReturnBps`, `liveSharpeX1000` |
| `PaperRunStopped` | `tokenId` | `status`, `stoppedAt` |
| `UpdaterSet` | `updater` | `allowed` |

| `LiveRun` struct field | Type | Note |
| - | - | - |
| `cumulativeHash` | `bytes32` | Latest hash-chain head |
| `startedAt`, `lastUpdatedAt` | `uint64` | |
| `epochCount` | `uint64` | Strictly monotonic |
| `status` | `uint8` | `0`=ACTIVE / `1`=STOPPED / `2`=LIQUIDATED |
| `liveMaxDrawdownBps`, `liveWinRateBps` | `uint16` | |
| `liveTotalReturnBps` | `int128` | Signed |
| `liveSharpeX1000` | `uint128` | |

**Verification**: any third party replays from the static `runHash` and arrives at the on-chain `cumulativeHash`. Cherry-picking is detectable — every commit fingerprints the previous state.

---

## 7.5. `Season.sol`

A scheduled competition window. Fixed `(dataset, balance, fees, market, maxLeverage)` per season. Top-3 paid 50% / 30% / 20% of the prize pool by `liveTotalReturnBps`.

| Function | Purpose |
| - | - |
| `createSeason(spec)` (payable, admin only) | Open a season. `msg.value >= spec.prizePool`. Reverts on invalid window. |
| `enroll(seasonId, tokenId)` | iNFT owner enrolls. Reverts after `startTime` (`EnrollmentClosed`), on market mismatch (`MarketMismatch`), or duplicate enroll. |
| `settle(seasonId, sortedTokens)` | **Permissionless** after `endTime`. Caller passes a leaderboard hint sorted-descending by `liveTotalReturnBps`; contract verifies monotonicity in O(N) and pays the top 3. Idempotent (`AlreadySettled`). |
| `getParticipants(seasonId)`, `participantCount(seasonId)` | Read helpers. |

| Event | Indexed | Non-indexed |
| - | - | - |
| `SeasonCreated` | `id`, `datasetSpec` | `startTime`, `endTime`, `prizePool` |
| `Enrolled` | `seasonId`, `tokenId`, `owner` | — |
| `Settled` | `seasonId` | `sortedWinners`, `paidOut` |
| `PrizeAwarded` | `seasonId`, `tokenId`, `winner` | `amount` |

| `SeasonSpec` struct field | Type | Note |
| - | - | - |
| `datasetSpec` | `bytes32` | e.g. `keccak("BTCUSDT-15m-spot")` |
| `initialBalance` | `uint64` | Quote currency |
| `feeBps`, `slippageBps` | `uint16` | |
| `market` | `uint8` | `0`=spot / `1`=perp |
| `maxLeverage` | `uint8` | `1..10` |
| `startTime`, `endTime` | `uint64` | Unix seconds |
| `prizePool` | `uint256` | Wei |
| `creator` | `address` | |
| `settled` | `bool` | Idempotent flag |

| Prize split | Share |
| - | - |
| 1st | 50% (`FIRST_PRIZE_BPS = 5000`) |
| 2nd | 30% (`SECOND_PRIZE_BPS = 3000`) |
| 3rd | 20% (`THIRD_PRIZE_BPS = 2000`) |

---

## 7.6. Build, test, deploy

```bash
git submodule update --init --recursive
forge build
forge test
FOUNDRY_PROFILE=ci forge test                # heavy fuzz + invariant

forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $MAINNET_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast
```

| Env | For |
| - | - |
| `MAINNET_RPC_URL` | `https://data-seed-prebsc-1-s1.bnbchain.org:8545` |
| `DEPLOYER_PRIVATE_KEY` | Deployer wallet (must hold mainnet 0G to pay gas) |
| `DEPLOYER_ADDRESS` | Same wallet's address (for verification constructor args) |
| `ORACLE_SIGNER_ADDRESS` | Off-chain transfer-oracle signer (hardware-wallet recommended) |
| `OPERATOR_ADDRESS` | Paper-engine operator authorized in `LiveCertificate.authorizedUpdaters` |

Full mainnet deploy runbook with sanity checks + rollback notes: [`zero-arena-contracts/MAINNET-DEPLOY.md`](https://github.com/Zero-Arena/zero-arena-contracts/blob/main/MAINNET-DEPLOY.md).

---

## 7.7. Source verification (block explorer)

```bash
forge verify-contract \
  --chain-id 97 --num-of-optimizations 200 \
  --compiler-version "v0.8.24+commit.e11b9ed9" \
  --verifier custom --verifier-url https://testnet.bscscan.com/open/api \
  --verifier-api-key PLACEHOLDER \
  <addr> src/<Path>.sol:<Contract>
```

| Contract | Constructor signature |
| - | - |
| `AgentCertificate` | `constructor(address admin)` |
| `ReencryptionOracle` | `constructor(address admin, address signer)` |
| `ZeroArenaINFT` | `constructor(address admin, address oracle, address cert)` |
| `LiveCertificate` | `constructor(address admin, address inft)` |
| `Season` | `constructor(address admin, address live, address inft)` |

Append `--constructor-args $(cast abi-encode "<sig>" <args>)`. Status polling (`forge verify-check` is flaky on 0G explorers — poll the API directly):

```bash
curl -s "https://testnet.bscscan.com/open/api?module=contract&action=checkverifystatus&guid=<GUID>"
```

---

## 7.8. Release flow

After every redeploy:

| Step | Action |
| - | - |
| 1 | Tag `zero-arena-contracts` `vX.Y.Z` |
| 2 | CI publishes `@zero-arena/contracts@X.Y.Z` (ABIs + addresses) |
| 3 | SDK bumps the dep and cuts a matching `zeroarena` release |
| 4 | FE consumes new ABIs (`lib/chain/contracts.ts` mirrors the published package) |

Prev → [6. SDK Reference](./06-sdk-reference.md) · Back to [Index](./README.md)
