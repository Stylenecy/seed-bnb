# 5. Quick Start

> **BNB Chain migration (2026-09):** Zero Arena contracts now target **BNB Smart Chain** (BSC testnet 97 default, mainnet 56). Encrypted blobs still live on 0G Storage. Any contract address in this file is from the **legacy 0G deployment** and is NOT deployed on BSC yet — see [`MIGRATION-BNB.md`](../MIGRATION-BNB.md).

From zero to a minted iNFT enrolled in a live Season.

---

## 5.1. Scaffold a project (one command)

```bash
npx zeroarena init my-agent
cd my-agent
npm start        # backtest → certify → mint, end-to-end
```

The wizard asks for:

| Step | Choice |
| - | - |
| Strategy template | RSI mean reversion / MACD trend / EMA crossover / LLM-driven / empty scaffold |
| Market | spot (long-only) / perp (USDT-M, leverage, funding, liquidation) |
| LLM provider (if picked) | Anthropic Claude / OpenAI / Google Gemini / local Claude Code CLI |
| Strategy parameters | thresholds, size, leverage… |
| Wallet | paste your key, generate with `cast wallet new`, or fill `.env` later |

BNB Chain addresses are pre-pinned. The wizard writes `agent.ts`, `run.ts`, `.env`, `package.json`, and a per-template README.

---

## 5.2. Install manually

```bash
npm install zeroarena
```

`.env`:

```ini
PRIVATE_KEY=0x...           # your wallet — pays gas, owns the iNFT
ZA_RPC=https://data-seed-prebsc-1-s1.bnbchain.org:8545
ZA_INDEXER=https://indexer-storage-turbo.0g.ai
ZA_ADDR_CERT=0x21a5DEA59cfA07B261d389A9554477e137805c2f
ZA_ADDR_INFT=0x4Bd4d45f206861aa7cD4421785a316A1dD06036f
ZA_ADDR_ORACLE=0x63909dA30b0d65ad72b32b3C8C82515f7BFA6Fd6
```

---

## 5.3. The qualifier pipeline — backtest → certify → mint

```ts
import { ZeroArena, Agent, type Action, type Observation } from 'zeroarena';

class RsiAgent extends Agent {
  decide(obs: Observation): Action {
    if (obs.rsi14 < 30) return { direction: 1, size: 0.5 };
    if (obs.rsi14 > 70) return { direction: 0, size: 0 };
    return { direction: obs.position > 0 ? 1 : 0, size: obs.position > 0 ? 0.5 : 0 };
  }
  override toJSON() { return { className: 'RsiAgent', oversold: 30, overbought: 70 }; }
}

const za = new ZeroArena({
  rpc: process.env.ZA_RPC!,
  indexer: process.env.ZA_INDEXER!,
  privateKey: process.env.PRIVATE_KEY!,
  addresses: {
    AgentCertificate:   process.env.ZA_ADDR_CERT!,
    ZeroArenaINFT:      process.env.ZA_ADDR_INFT!,
    ReencryptionOracle: process.env.ZA_ADDR_ORACLE!,
  },
});

const dataset = await za.loadDataset({ rootHash: '0xabc…' });
const result  = await za.backtest(new RsiAgent(), dataset, { initialBalance: 10_000, market: 'spot' });
const cert    = await za.certify(result);
const inft    = await za.mintAgent({ agent: new RsiAgent(), certificate: cert, name: 'RSI v1' });
```

Output: `runHash`, `certId`, `tokenId`, and explorer links. The dashboard auto-picks up your iNFT within a minute.

---

## 5.4. Enter an Arena Season

```bash
npm run season:status                # list open seasons
npm run season:enroll-all <id>       # enroll your iNFT + LiveCertificate.start()
# then run paper daemon: self-operate (zero-arena-be) or delegate via /onboard (next section)
```

After the first `EpochCommitted` event, your live metrics appear on [zero-arena-fe.vercel.app](https://zero-arena-fe.vercel.app) within a minute.

---

## 5.5. Delegate paper execution (optional)

If you don't want to run a 24/7 daemon yourself:

```ts
import { HttpOnboardClient } from 'zeroarena';
import { Wallet } from 'ethers';
import { readFileSync } from 'node:fs';

const owner = new Wallet(process.env.PRIVATE_KEY!);
const onboard = new HttpOnboardClient({
  url: 'https://onboard-production-ed6c.up.railway.app',
  authToken: process.env.ONBOARD_AUTH_TOKEN,
});

await onboard.onboard(
  {
    tokenId: 5n,
    agentSource: readFileSync('./agent.ts', 'utf8'),  // auto-ECIES-encrypted to operator pubkey
    genesisHash: '0x…',                               // == your static cert's runHash
    barsPerEpoch: 4,                                  // 96 = 24h, 4 = demo cadence
  },
  owner,
);
// → { status: "onboarded", tokenId: "5", operator: "0xB1a5402E…", pid: 113, startedAt: "…" }

// Later:
await onboard.offboard({ tokenId: 5n }, owner);
```

Trust shift: from owner reputation (cheatable) → 0arena's public operator reputation (one entity, accountable). v1.0 moves the orchestrator into a TEE; the HTTP surface stays identical.

---

## 5.6. Threshold gate

`ZeroArenaINFT.mint` reverts with `ThresholdNotMet()` if your cert's metrics don't clear:

| Threshold | Default |
| - | - |
| `minTotalReturnBps` | `0` (≥ 0% return) |
| `minSharpeX1000` | `1000` (Sharpe ≥ 1.0) |

Admin can lower thresholds (`setThresholds`). Certificates are anchored regardless — only the iNFT mint is gated.

---

## 5.7. Duplicate handling

Re-running with the same agent + dataset produces the same `runHash`. `AgentCertificate.submit` anchors duplicates by default. To dedupe in the SDK:

```ts
const cert = await za.certify(result, { onDuplicate: 'skip' });
// 'submit-anyway' (default) | 'warn' | 'skip' | 'throw'
```

The `multi-mint` example scans `AgentMinted` events on-chain and skips already-minted runHashes — re-runs without `--force` cost zero gas.

---

## 5.8. CLI shortcuts

| Command | Job |
| - | - |
| `npx zeroarena init <name>` | Scaffold a new project (wizard) |
| `npx zeroarena dataset upload <csv>` | Hash + encrypt + upload OHLCV to 0G Storage |
| `npx zeroarena backtest --agent ./agent.ts --csv ./data.csv --balance 10000` | Local backtest, prints `runHash` + metrics |
| `npx zeroarena certify --agent ./agent.ts --csv ./data.csv` | Backtest + anchor cert on-chain |
| `npx zeroarena mint --agent ./agent.ts --cert <id> --name <name> --run-hash 0x… --storage-root 0x… --dataset-hash 0x…` | Mint the iNFT for a cert |

CLI reads from env: `PRIVATE_KEY`, `ZA_RPC`, `ZA_INDEXER`, `ZA_ADDR_CERT`, `ZA_ADDR_INFT`, `ZA_ADDR_ORACLE`.

Prev → [4. Protocol Overview](./04-protocol-overview.md) · Next → [6. SDK Reference](./06-sdk-reference.md)
