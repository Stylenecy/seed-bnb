// Full-flow production session with the fixed orchestrator (REST mode +
// backfill). Reuses already-minted Tokens 2..6 (the 5-agent perp demo),
// creates a fresh 15-min perp Season, enrolls all 5, and delegates each
// to the onboard endpoint so live commits start flowing.
//
// Run from examples/:
//   ONBOARD_AUTH_TOKEN=<token> npx tsx scripts/session-final.ts

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { ethers, Wallet } from 'ethers';
import { HttpOnboardClient, loadEnv } from 'zeroarena';

const HERE = dirname(fileURLToPath(import.meta.url));

// (tokenId, slug, agent path) — must match what we minted earlier.
const ROSTER = [
  { tokenId: 2n, slug: 'perp-momentum-10x',      module: resolve(HERE, '..', 'arena-trial', 'perp-momentum-10x.ts'),      leverage: 10 },
  { tokenId: 3n, slug: 'volatility-breakout-5x', module: resolve(HERE, '..', 'arena-trial', 'volatility-breakout-5x.ts'), leverage: 5  },
  { tokenId: 4n, slug: 'funding-rate-hunter',    module: resolve(HERE, '..', 'arena-trial', 'funding-rate-hunter.ts'),    leverage: 5  },
  { tokenId: 5n, slug: 'trend-follower-3x',      module: resolve(HERE, '..', 'arena-trial', 'trend-follower-3x.ts'),      leverage: 3  },
  { tokenId: 6n, slug: 'mean-revert-perp-5x',    module: resolve(HERE, '..', 'arena-trial', 'mean-revert-perp-5x.ts'),    leverage: 5  },
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

async function main() {
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

  // ── 1. fetch each token's runHash (genesis) from chain ──────────────────
  console.log('▸ resolving runHashes for', ROSTER.length, 'tokens...');
  const enriched: Array<typeof ROSTER[number] & { runHash: string }> = [];
  for (const r of ROSTER) {
    const certId = await inft.certificateOf(r.tokenId);
    const c = await cert.get(certId);
    enriched.push({ ...r, runHash: c.runHash });
    console.log(`  token #${r.tokenId} (${r.slug}) cert #${certId} runHash=${c.runHash}`);
  }

  // ── 2. create Season #3 (perp, 15 min) ─────────────────────────────────
  console.log('\n▸ creating 15-min perp Season...');
  const blk = await provider.getBlock('latest');
  if (!blk) throw new Error('no latest block');
  const now = Number(blk.timestamp);
  const enrollSec = 300;     // 5 min for enroll + onboard
  const runSec = 900;        // 15 min
  const prize = ethers.parseEther('0.005');
  const spec = {
    datasetSpec: ethers.keccak256(ethers.toUtf8Bytes('BTCUSDT-15m-perp')),
    initialBalance: 10_000n,
    feeBps: 5, slippageBps: 5,
    market: 1, maxLeverage: 10,
    startTime: BigInt(now + enrollSec),
    endTime: BigInt(now + enrollSec + runSec),
    prizePool: prize,
    creator: ethers.ZeroAddress,
    settled: false,
  };
  console.log(`  startTime: ${new Date(Number(spec.startTime)*1000).toISOString()}`);
  console.log(`  endTime:   ${new Date(Number(spec.endTime)*1000).toISOString()}`);
  const txC = await season.createSeason(spec, { value: prize });
  const recC = await txC.wait();
  let seasonId: bigint | undefined;
  for (const log of recC?.logs ?? []) {
    try {
      const p = season.interface.parseLog({ topics: [...log.topics], data: log.data });
      if (p?.name === 'SeasonCreated') { seasonId = p.args.id as bigint; break; }
    } catch {}
  }
  if (!seasonId) throw new Error('SeasonCreated not found');
  console.log(`  seasonId:  ${seasonId}  tx=${txC.hash}`);

  // ── 3. enroll each token ────────────────────────────────────────────────
  console.log('\n▸ enrolling tokens...');
  for (const e of enriched) {
    const enrolledAlready: boolean = await season.enrolled(seasonId, e.tokenId);
    if (enrolledAlready) {
      console.log(`  token #${e.tokenId} already enrolled — skip`);
      continue;
    }
    const tx = await season.enroll(seasonId, e.tokenId);
    await tx.wait();
    console.log(`  token #${e.tokenId} (${e.slug}) enrolled  tx=${tx.hash}`);
  }

  // ── 4. /onboard each token (REST mode + backfill via new orchestrator) ──
  console.log('\n▸ delegating to /onboard for live commits...');
  const onboardClient = new HttpOnboardClient({
    url: 'https://onboard-production-ed6c.up.railway.app',
    authToken,
  });
  for (const e of enriched) {
    const agentSource = readFileSync(e.module, 'utf8');
    console.log(`  ▸ /onboard token #${e.tokenId} (${e.slug})...`);
    try {
      const res = await onboardClient.onboard(
        {
          tokenId: e.tokenId,
          agentSource,
          genesisHash: e.runHash,
          symbol: 'btcusdt',
          interval: '15m',
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
  }

  const endIso = new Date(Number(spec.endTime)*1000).toISOString();
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✓ Session #${seasonId} live. Ends ${endIso}.`);
  console.log(`  Dashboard: https://zero-arena-fe.vercel.app/season/${seasonId}`);
  console.log(`  Daemons will REST-poll Binance every 30s; first commit ~30s after next 15m boundary.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : String(err));
  process.exit(1);
});
