// One-shot diagnostic — verifies the live-paper architecture end-to-end with
// a single test run. Onboards 5 daemons (interval=1s, AlwaysLongPerp), waits
// 45 seconds capturing chain state at t0 and t1, then offboards everyone.
// Does NOT create a new Season — daemon commits write to LiveCertificate
// directly; Season membership only affects leaderboard ranking and is
// orthogonal to this test.
//
// What it answers:
//   • Did the WS aggTrade stream connect? (look at Railway logs)
//   • Are pool wallets assigned distinctly per token? (Railway logs)
//   • Did the mutex drop concurrent candles? (Railway logs)
//   • Submit → commit latency? (Railway logs)
//   • End-to-end chain commit rate per daemon? (this script's report)
//
// Run from examples/:
//   ONBOARD_AUTH_TOKEN=<token> npx tsx scripts/diagnostic-1s.ts

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { ethers, Wallet } from 'ethers';
import { HttpOnboardClient, loadEnv } from 'zeroarena';

const HERE = dirname(fileURLToPath(import.meta.url));

const ROSTER = [
  { tokenId: 2n, leverage: 10 },
  { tokenId: 3n, leverage: 5 },
  { tokenId: 4n, leverage: 5 },
  { tokenId: 5n, leverage: 3 },
  { tokenId: 6n, leverage: 5 },
];

const LIVE_ABI = [
  'function get(uint256) view returns ((bytes32 cumulativeHash, uint64 startedAt, uint64 lastUpdatedAt, uint64 epochCount, uint8 status, uint16 liveMaxDrawdownBps, uint16 liveWinRateBps, int128 liveTotalReturnBps, uint128 liveSharpeX1000))',
];
const INFT_ABI = ['function certificateOf(uint256) view returns (uint256)'];
const CERT_ABI = [
  'function get(uint256) view returns ((bytes32 runHash, bytes32 storageRootHash, bytes32 datasetHash, bytes32 attestationHash, int128 totalReturnBps, uint128 sharpeX1000, address owner, uint48 createdAt, uint16 maxDrawdownBps, uint16 winRateBps, uint8 trustTier, uint8 market))',
];

const TEST_DURATION_S = 35;
const INTERVAL = '1s';

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

interface TokenSnapshot {
  tokenId: bigint;
  epochCount: number;
  cumulativeHash: string;
  lastUpdatedAt: number;
}

async function snapshot(live: ethers.Contract, tokenIds: bigint[]): Promise<TokenSnapshot[]> {
  const out: TokenSnapshot[] = [];
  for (const t of tokenIds) {
    const r = (await live.getFunction('get')(t)) as {
      cumulativeHash: string;
      epochCount: bigint;
      lastUpdatedAt: bigint;
    };
    out.push({
      tokenId: t,
      epochCount: Number(r.epochCount),
      cumulativeHash: r.cumulativeHash,
      lastUpdatedAt: Number(r.lastUpdatedAt),
    });
  }
  return out;
}

async function main(): Promise<void> {
  loadEnv(resolve(HERE, '..', '.env'));
  const rpc = process.env.ZA_RPC!;
  const inftAddr = process.env.ZA_ADDR_INFT!;
  const certAddr = process.env.ZA_ADDR_CERT!;
  const liveAddr = process.env.ZA_ADDR_LIVE_CERT!;
  const authToken = process.env.ONBOARD_AUTH_TOKEN;
  if (!authToken) throw new Error('ONBOARD_AUTH_TOKEN env required');

  const provider = new ethers.JsonRpcProvider(rpc);
  const owner = new Wallet(process.env.PRIVATE_KEY!, provider);
  const inft = new ethers.Contract(inftAddr, INFT_ABI, provider);
  const cert = new ethers.Contract(certAddr, CERT_ABI, provider);
  const live = new ethers.Contract(liveAddr, LIVE_ABI, provider);

  const onboardClient = new HttpOnboardClient({
    url: 'https://onboard-production-ed6c.up.railway.app',
    authToken,
  });

  console.log('▸ resolving runHashes...');
  const enriched: Array<typeof ROSTER[number] & { runHash: string }> = [];
  for (const r of ROSTER) {
    const cid = await inft.getFunction('certificateOf')(r.tokenId);
    const c = (await cert.getFunction('get')(cid)) as { runHash: string };
    enriched.push({ ...r, runHash: c.runHash });
  }

  console.log('\n▸ onboarding 5 daemons (interval=1s)...');
  const agentSource = readFileSync(
    resolve(HERE, '..', 'arena-trial', 'always-long-perp.ts'),
    'utf8',
  );
  for (const e of enriched) {
    try {
      const res = await onboardClient.onboard(
        {
          tokenId: e.tokenId,
          agentSource,
          genesisHash: e.runHash,
          symbol: 'btcusdt',
          interval: INTERVAL,
          market: 'perp',
          // 60 ticks per epoch = 1 chain commit per minute when interval=1s.
          // The daemon trades real-time per-second off-chain; only the
          // anchor commit hits the chain at a sane cadence.
          barsPerEpoch: 60,
          initialBalance: 10_000,
          leverage: e.leverage,
          feeBps: 5,
          slippageBps: 5,
        },
        owner,
      );
      console.log(`  #${e.tokenId} onboarded pid=${res.pid}`);
    } catch (err) {
      console.log(`  #${e.tokenId} onboard FAILED: ${err instanceof Error ? err.message : err}`);
    }
    await sleep(400);
  }

  // Allow WS to connect + first bucket to fire before t0 snapshot.
  console.log('\n▸ waiting 3s for WS to settle...');
  await sleep(3000);

  console.log('\n▸ capturing t0 chain state...');
  const t0 = Date.now();
  const before = await snapshot(live, ROSTER.map((r) => r.tokenId));
  for (const s of before) {
    console.log(`  #${s.tokenId}  epoch=${s.epochCount}  lastUpdated=${new Date(s.lastUpdatedAt * 1000).toISOString().slice(11, 19)}`);
  }

  console.log(`\n▸ running ${TEST_DURATION_S}s observation window...`);
  await sleep(TEST_DURATION_S * 1000);

  console.log('\n▸ capturing t1 chain state...');
  const t1 = Date.now();
  const after = await snapshot(live, ROSTER.map((r) => r.tokenId));
  const elapsedS = (t1 - t0) / 1000;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`OBSERVATION WINDOW: ${elapsedS.toFixed(1)}s`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Token | Before  After   Δ    Rate(/s)  Avg Gap');
  let totalDelta = 0;
  for (let i = 0; i < before.length; i++) {
    const b = before[i]!;
    const a = after[i]!;
    const d = a.epochCount - b.epochCount;
    totalDelta += d;
    const rate = d / elapsedS;
    const gap = d > 0 ? elapsedS / d : Infinity;
    console.log(
      `  #${b.tokenId}  | ${b.epochCount.toString().padStart(5)} → ${a.epochCount.toString().padStart(5)}  Δ=${d.toString().padStart(2)}   ${rate.toFixed(3)}      ${gap === Infinity ? '∞' : gap.toFixed(2) + 's'}`,
    );
  }
  const aggregateRate = totalDelta / elapsedS;
  console.log(`\nAGGREGATE: ${totalDelta} commits / ${elapsedS.toFixed(1)}s = ${aggregateRate.toFixed(2)} tx/s across 5 wallets`);
  console.log(`PER-DAEMON AVG: ${(aggregateRate / 5).toFixed(2)} tx/s/daemon`);
  console.log(`TARGET 1s/daemon: ${aggregateRate / 5 >= 0.5 ? 'PASS ✓' : 'FAIL ✗ (got ' + (aggregateRate / 5).toFixed(2) + ')'}`);

  console.log('\n▸ offboarding all daemons (cleanup)...');
  for (const e of enriched) {
    try {
      const res = await onboardClient.offboard({ tokenId: e.tokenId }, owner);
      console.log(`  #${e.tokenId} ${res.status}`);
    } catch (err) {
      console.log(`  #${e.tokenId} offboard ERR: ${err instanceof Error ? err.message?.slice(0, 80) : err}`);
    }
  }

  console.log('\n✓ Done. Now check Railway logs for:');
  console.log('  - "binance-aggTrade stream connected" × 5     (WS, not REST)');
  console.log('  - "operatorIndex" values per spawn            (pool distribution 0..4)');
  console.log('  - "dropping candle"                           (mutex serializing)');
  console.log('  - submit → committed gap from log timestamps  (tx.wait() latency)');
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : String(err));
  process.exit(1);
});
