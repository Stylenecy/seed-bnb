# 6. SDK Reference — `zeroarena`

> **BNB Chain migration (2026-09):** Zero Arena contracts now target **BNB Smart Chain** (BSC testnet 97 default, mainnet 56). Encrypted blobs still live on 0G Storage. Any contract address in this file is from the **legacy 0G deployment** and is NOT deployed on BSC yet — see [`MIGRATION-BNB.md`](../MIGRATION-BNB.md).

```bash
npm install zeroarena    # currently v0.5.0
```

Public API is locked at `0.x`; breaking changes bump the minor.

---

## 6.1. `ZeroArena` class

```ts
class ZeroArena {
  constructor(config: ZeroArenaConfig);

  uploadDataset(csvPath: string): Promise<Dataset>;
  loadDataset(opts: { rootHash: string }): Promise<Dataset>;
  backtest(agent: Agent, dataset: Dataset, opts: BacktestOptions): Promise<BacktestResult>;
  certify(result: BacktestResult, opts?: CertifyOptions): Promise<Certificate>;
  mintAgent(opts: { agent: Agent; certificate: Certificate; name: string; description?: string }): Promise<INFT>;
  transferAgent(opts: { tokenId: bigint; to: string; recipientPubKey: string }): Promise<TransferResult>;
}
```

| Method | What it does |
| - | - |
| `uploadDataset(csvPath)` | Normalizes a Binance OHLCV CSV, hashes (`datasetHash`), uploads encrypted to 0G Storage, returns `{ rootHash, datasetHash, candles, meta }`. |
| `loadDataset({ rootHash })` | Downloads + decrypts a previously uploaded dataset. |
| `backtest(agent, dataset, opts)` | Runs `BacktestEngine` deterministically. Returns `{ runHash, agentHash, datasetHash, optionsHash, tradesHash, trades, equityCurve, metrics, options, market }`. |
| `certify(result, opts?)` | Encrypts run log → uploads to 0G Storage → calls `AgentCertificate.submit()`. Returns `Certificate`. `opts.onDuplicate`: `'submit-anyway' \| 'warn' \| 'skip' \| 'throw'`. |
| `mintAgent({...})` | Encrypts agent metadata → uploads to 0G Storage → calls `ZeroArenaINFT.mint()`. Returns `INFT`. |
| `transferAgent({...})` | ERC-7857 transfer. Asks the oracle to re-encrypt the AES key for the recipient's pubkey, then submits `transfer` proof on-chain. Requires `oracle` field in config. |

---

## 6.2. `ZeroArenaConfig`

| Field | Required | Notes |
| - | - | - |
| `rpc` | ✅ | BNB Chain RPC URL |
| `indexer` | ✅ | 0G Storage indexer URL |
| `privateKey` | ✅ | YOUR signer key (hex). Pays gas. Never anyone else's. |
| `addresses.AgentCertificate` | optional | Defaults pulled from `@zero-arena/contracts` |
| `addresses.ZeroArenaINFT` | optional | Same |
| `addresses.ReencryptionOracle` | optional | Same |
| `oracle` | only if calling `transferAgent` | `HttpOracleClient` pointing at the deployed transfer-oracle service |
| `keysDir` | optional | AES-key persistence dir. Default `~/.zeroarena/keys`. |

---

## 6.3. `Agent` base class — your only required override

```ts
abstract class Agent {
  abstract decide(obs: Observation): Promise<Action> | Action;
  toJSON(): Record<string, unknown>;     // override if hyperparams should affect agentHash
}
```

| Field on `Observation` | Meaning |
| - | - |
| `timestamp`, `index` | Candle time (ms) + index in dataset |
| `open`, `high`, `low`, `close`, `volume` | Current bar |
| `rsi14`, `ema12`, `ema26`, `macd`, `macdSignal` | Pre-warmed deterministic indicators |
| `position`, `equity`, `cash`, `leverage` | Portfolio snapshot, refreshed before each `decide()` |

| Field on `Action` | Meaning |
| - | - |
| `direction` | `-1` short / `0` flat / `+1` long |
| `size` | Fraction of equity in `[0, 1]`. Notional = `equity * size * leverage`. |
| `stopLoss?` | Optional protective stop, intra-bar (TradingView convention) |
| `takeProfit?` | Optional take-profit, intra-bar |

---

## 6.4. Key types

### `Certificate`

| Field | Type | Meaning |
| - | - | - |
| `certId` | `bigint` | On-chain ID |
| `runHash` | `0x…` | Canonical agent+dataset+options+trades hash |
| `storageRootHash` | `0x…` | 0G Storage root for encrypted run log |
| `datasetHash` | `0x…` | Identity of the dataset |
| `attestationHash` | `0x…` | `0x0` for T1/T2; TEE quote root for T3 |
| `trustTier` | `'T1' \| 'T2' \| 'T3'` | |
| `market` | `'spot' \| 'perp'` | |
| `metrics` | `Metrics` | See below |
| `txHash` | `0x…` | Submission tx |

### `INFT`

| Field | Type |
| - | - |
| `tokenId`, `certificateId` | `bigint` |
| `owner` | `0x…` |
| `metadataHash`, `storageRoot`, `txHash` | `0x…` |

### `BacktestOptions`

| Field | Default | Meaning |
| - | - | - |
| `initialBalance` | _required_ | Quote currency starting balance |
| `market` | _required_ | `'spot' \| 'perp'` — must match dataset |
| `leverage` | `1` | Perp only, capped at 10 |
| `takerFeeBps` | 10 (spot) / 5 (perp) | Per-fill fee |
| `makerFeeBps` | reserved | v0.2 limit-order support |
| `slippageBps` | `5` | Per-fill slippage |
| `liquidationMarginBps` | `500` | Perp MMR (5%) |
| `maintenanceAmount` | `0` | Perp "cum" amount |
| `feeBps` _(deprecated)_ | — | Use `takerFeeBps` |

### `Metrics`

| Field | Type | Meaning |
| - | - | - |
| `totalReturnBps` | `int128` | Signed bps (+500 = +5%) |
| `sharpeX1000` | `uint128` | Annualized Sharpe × 1000 |
| `sortinoX1000` | `uint128` | Annualized Sortino × 1000 |
| `maxDrawdownBps` | `uint16` | Peak-to-trough drawdown |
| `profitFactorX1000` | `uint128` | Capped at 100000 (= 100×) |
| `winRateBps` | `uint16` | Of closed positions |
| `numTrades` | `number` | Executed trade count |
| `finalEquity` | `number` | End equity in quote |

### `Trade`

| Field | Type |
| - | - |
| `index`, `timestamp` | candle position |
| `side` | `'buy' \| 'sell'` |
| `price`, `size`, `fee`, `realizedPnl` | numeric |
| `reason` | `'open' \| 'close' \| 'flip' \| 'liquidation' \| 'stop_loss' \| 'take_profit'` |

### `TransferResult`

| Field | Type |
| - | - |
| `tokenId` | `bigint` |
| `from`, `to`, `newMetadataHash`, `txHash` | `0x…` |

---

## 6.5. Onboard client — delegate paper execution

```ts
import { HttpOnboardClient, encryptAgentSource } from 'zeroarena';

const client = new HttpOnboardClient({ url, authToken /* optional */ });
await client.onboard(params, ownerSigner);   // auto-ECIES-encrypts agentSource
await client.offboard({ tokenId }, ownerSigner);
```

| `onboard` param | Meaning |
| - | - |
| `tokenId` | Your iNFT |
| `agentSource` | Plaintext source string (auto-encrypted to operator pubkey) OR pre-encrypted `EncryptedAgentBundle` |
| `genesisHash` | Must equal your static cert's `runHash` |
| `symbol`, `interval`, `market` | Binance stream params (`btcusdt`, `15m`, `spot`/`perp`) |
| `barsPerEpoch` | Default `96` (= 24h at 15m). Use `4` for fast demo. |
| `initialBalance`, `leverage`, `feeBps`, `slippageBps` | Paper engine config (must match the season's spec) |

Manual encryption (e.g. multi-sig signing in a separate process):

```ts
import { encryptAgentSource } from 'zeroarena';

const health = await fetch('https://onboard-production-ed6c.up.railway.app/health').then(r => r.json());
const bundle = encryptAgentSource(readFileSync('./agent.ts', 'utf8'), health.operatorPubKey);
// bundle = { scheme: "ecies-secp256k1-aes256gcm-v1", blob: "<base64>" }
```

---

## 6.6. Oracle client (ERC-7857 transfer)

```ts
import { ZeroArena, HttpOracleClient } from 'zeroarena';

const za = new ZeroArena({
  ...,
  oracle: new HttpOracleClient({
    url: 'https://transfer-oracle-production-f390.up.railway.app',
  }),
});

await za.transferAgent({ tokenId, to, recipientPubKey });
```

The SDK has **no** `ORACLE_PRIVATE_KEY` field — that key only lives inside the transfer-oracle service.

---

## 6.7. Re-exports (useful utilities)

| Symbol | Use |
| - | - |
| `runBacktest`, `WARMUP` | Lower-level backtest entrypoint (no Storage / chain) |
| `PaperEngine`, `PAPER_WARMUP` | Bar-by-bar live engine (used by the paper daemon) |
| `StreamingIndicators` | Incremental RSI / EMA / MACD for live use |
| `computeMetrics` | Compute `Metrics` from an equity curve + trade list |
| `composeRunHash`, `hashAgent`, `hashJson`, `hashOptions`, `hashTrades`, `stableStringify` | Canonical hash helpers |
| `rsi`, `ema`, `macd` | Reference indicator implementations |
| `keccak256`, `toUtf8Bytes` | Re-exported from `ethers` so consumers don't need to pull `ethers` directly |
| `parseDatasetFile`, `StorageAdapter` | 0G Storage helpers |
| `loadEnv`, `configFromEnv` | CLI env loader |
| `CANONICAL_DATASETS` | Registry of canonical BNB Chain datasets (mirrored by FE) |
| `oracleDigest` | EIP-191 digest helper for transfer proofs |
| `digestForOnboard` | EIP-191 digest helper for `/onboard` payloads |

---

## 6.8. Determinism rules (when writing your own agent)

| Rule | Effect on `runHash` |
| - | - |
| Don't call `Math.random()` | Seed a PRNG from `obs.timestamp` if needed; otherwise `runHash` drifts run-to-run. |
| Don't call `Date.now()` / `new Date()` | Use `obs.timestamp`. |
| Don't iterate objects with `for…in` in hot paths | Order is implementation-defined. Use `Object.keys().sort()` or explicit arrays. |
| Override `toJSON()` to include hyperparameters | Tuning a parameter then yields a different `agentHash` → different `runHash` → fresh cert identity. |
| LLM calls in `decide()` are allowed | Cert stays at T2 (responses recorded in run log; reproducibility conditional on the API). |

Prev → [5. Quick Start](./05-quick-start.md) · Next → [7. Smart Contracts](./07-smart-contracts.md)
