// Real-time demo session.
//
// What this does:
//   1. Create a fresh perp Season with 30-second synthetic-candle interval
//      and 10× max leverage. Duration short enough for a live demo but long
//      enough to fit a meaningful number of commits.
//   2. Enroll tokens 2..6 into the new Season.
//   3. Onboard each token with the self-contained AlwaysLongPerp agent (zero
//      warmup — opens LONG on bar 1) and PAPER_INTERVAL=1s, barsPerEpoch=1.
//
// Effect: each daemon commits one EpochCommitted tx per 30-second tick.
// Equity moves with BTC price × leverage, so live metrics (return, sharpe,
// drawdown) start updating from the very first commit.
//
// Prereq: the bacend (especially src/paper/binance-ws.ts) must be deployed
// with sub-minute ticker-synthesis support.
//
// Run from examples/:
//   ONBOARD_AUTH_TOKEN=<token> npx tsx scripts/session-realtime.ts

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

const SEASON_ABI = [
  'function createSeason((bytes32 datasetSpec, uint64 initialBalance, uint16 feeBps, uint16 slippageBps, uint8 market, uint8 maxLeverage, uint64 startTime, uint64 endTime, uint256 prizePool, address creator, bool settled)) external payable returns (uint256)',
  'function enroll(uint256 seasonId, uint256 tokenId) external',
  'function enrolled(uint256, uint256) view returns (bool)',
  'event SeasonCreated(uint256 indexed id, bytes32 indexed datasetSpec, uint64 startTime, uint64 endTime, uint256 prizePool)',
];
const CERT_ABI = [
  'function get(uint256) view returns ((bytes32 runHash, bytes32 storageRootHash, bytes32 datasetHash, bytes32 attestationHash, int128 totalReturnBps, uint128 sharpeX1000, address owner, uint48 createdAt, uint16 maxDrawdownBps, uint16 winRateBps, uint8 trustTier, uint8 market))',
];
const INFT_ABI = ['function certificateOf(uint256) view returns (uint256)'];

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  loadEnv(resolve(HERE, '..', '.env'));
  const rpc = process.env.ZA_RPC!;
  const seasonAddr = process.env.ZA_ADDR_SEASON!;
  const inftAddr = process.env.ZA_ADDR_INFT!;
  const certAddr = process.env.ZA_ADDR_CERT!;
  const authToken = process.env.ONBOARD_AUTH_TOKEN;
  if (!rpc || !seasonAddr || !inftAddr || !certAddr) throw new Error('ZA_* env vars required');
  if (!authToken) throw new Error('ONBOARD_AUTH_TOKEN env var required');

  const provider = new ethers.JsonRpcProvider(rpc);
  const owner = new Wallet(process.env.PRIVATE_KEY!, provider);
  const season = new ethers.Contract(seasonAddr, SEASON_ABI, owner);
  const inft = new ethers.Contract(inftAddr, INFT_ABI, provider);
  const cert = new ethers.Contract(certAddr, CERT_ABI, provider);

  const onboardClient = new HttpOnboardClient({
    url: 'https://onboard-production-ed6c.up.railway.app',
    authToken,
  });

  // Load the zero-warmup agent source once.
  const agentSource = readFileSync(resolve(HERE, '..', 'arena-trial', 'always-long-perp.ts'), 'utf8');

  // ── 1. fetch each token's genesis runHash from chain ────────────────────
  console.log('▸ resolving runHashes for', ROSTER.length, 'tokens...');
  const enriched: Array<typeof ROSTER[number] & { runHash: string }> = [];
  for (const r of ROSTER) {
    const certId = await inft.certificateOf(r.tokenId);
    const c = await cert.get(certId);
    enriched.push({ ...r, runHash: c.runHash });
    console.log(`  token #${r.tokenId} cert #${certId} runHash=${c.runHash}`);
  }

  // ── 2. offboard existing daemons (best-effort; Railway redeploy may have
  //       already killed them — chain-seed will resume from on-chain state) ─
  console.log('\n▸ offboarding any leftover daemons (best-effort)...');
  for (const r of ROSTER) {
    try {
      const res = await onboardClient.offboard({ tokenId: r.tokenId }, owner);
      console.log(`  token #${r.tokenId} → ${res.status}`);
    } catch (err) {
      console.log(`  token #${r.tokenId} skip: ${err instanceof Error ? err.message : err}`);
    }
  }
  await sleep(3000);

  // ── 3. create Season ────────────────────────────────────────────────────
  console.log('\n▸ creating 1s-interval perp Season...');
  const blk = await provider.getBlock('latest');
  if (!blk) throw new Error('no latest block');
  const now = Number(blk.timestamp);
  const enrollSec = 90;    // 1.5 min for enroll + onboard
  const runSec = 300;      // 5 min — 1s ticks stress operator nonce throughput,
                            // shorter season keeps the volume of reverts bounded.
  const prize = ethers.parseEther('0.005');
  const spec = {
    datasetSpec: ethers.keccak256(ethers.toUtf8Bytes('BTCUSDT-1s-perp')),
    initialBalance: 10_000n,
    feeBps: 5,
    slippageBps: 5,
    market: 1,
    maxLeverage: 10,
    startTime: BigInt(now + enrollSec),
    endTime: BigInt(now + enrollSec + runSec),
    prizePool: prize,
    creator: ethers.ZeroAddress,
    settled: false,
  };
  console.log(`  startTime: ${new Date(Number(spec.startTime) * 1000).toISOString()}`);
  console.log(`  endTime:   ${new Date(Number(spec.endTime) * 1000).toISOString()}`);
  const txC = await season.createSeason(spec, { value: prize });
  const recC = await txC.wait();
  let seasonId: bigint | undefined;
  for (const logEntry of recC?.logs ?? []) {
    try {
      const p = season.interface.parseLog({ topics: [...logEntry.topics], data: logEntry.data });
      if (p?.name === 'SeasonCreated') {
        seasonId = p.args.id as bigint;
        break;
      }
    } catch { /* ignore */ }
  }
  if (!seasonId) throw new Error('SeasonCreated not found');
  console.log(`  seasonId:  ${seasonId}  tx=${txC.hash}`);

  // ── 4. enroll tokens ────────────────────────────────────────────────────
  console.log('\n▸ enrolling tokens...');
  for (const e of enriched) {
    const enrolledAlready: boolean = await season.enrolled(seasonId, e.tokenId);
    if (enrolledAlready) {
      console.log(`  token #${e.tokenId} already enrolled — skip`);
      continue;
    }
    const tx = await season.enroll(seasonId, e.tokenId);
    await tx.wait();
    console.log(`  token #${e.tokenId} enrolled  tx=${tx.hash}`);
  }

  // ── 5. onboard with 1s interval + AlwaysLongPerp ───────────────────────
  console.log('\n▸ onboarding (1s interval, zero-warmup agent)...');
  for (const e of enriched) {
    console.log(`  ▸ /onboard token #${e.tokenId} (lev=${e.leverage}x)...`);
    try {
      const res = await onboardClient.onboard(
        {
          tokenId: e.tokenId,
          agentSource,
          genesisHash: e.runHash,
          symbol: 'btcusdt',
          interval: '1s',
          market: 'perp',
          barsPerEpoch: 1,
          initialBalance: 10_000,
          leverage: e.leverage,
          feeBps: 5,
          slippageBps: 5,
        },
        owner,
      );
      console.log(`    onboarded  pid=${res.pid}  startedAt=${res.startedAt}`);
    } catch (err) {
      console.error(`    ✗ onboard failed: ${err instanceof Error ? err.message : err}`);
    }
    // Tiny stagger so the daemons don't all hit the first boundary at exactly
    // the same instant — eases operator-wallet nonce pressure.
    await sleep(800);
  }

  const endIso = new Date(Number(spec.endTime) * 1000).toISOString();
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✓ Season #${seasonId} live. Ends ${endIso}.`);
  console.log(`  Dashboard: https://zero-arena-fe.vercel.app/season/${seasonId}`);
  console.log(`  Daemons commit one tx per 30-second tick.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : String(err));
  process.exit(1);
});
