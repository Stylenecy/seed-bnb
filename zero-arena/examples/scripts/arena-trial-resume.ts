// Resume the 5-agent perp Arena trial after a partial run.
//
// Scans on-chain AgentMinted events to find runHashes that already have
// tokens, skips those, mints only the missing ones, then creates a fresh
// 10-min perp Season and enrolls all 5 + LiveCertificate.start each.
//
// Run from examples/:
//   npx tsx scripts/arena-trial-resume.ts

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ethers } from 'ethers';
import {
  ZeroArena,
  configFromEnv,
  loadEnv,
  parseDatasetFile,
  runBacktest,
  type BacktestOptions,
  type Certificate,
  type INFT,
} from 'zeroarena';

import PerpMomentum10x      from '../arena-trial/perp-momentum-10x.js';
import VolatilityBreakout5x from '../arena-trial/volatility-breakout-5x.js';
import FundingRateHunter    from '../arena-trial/funding-rate-hunter.js';
import TrendFollower3x      from '../arena-trial/trend-follower-3x.js';
import MeanRevertPerp5x     from '../arena-trial/mean-revert-perp-5x.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_CSV = resolve(HERE, '..', '02-macd-perp-btc', 'data', 'btc-perp-fixture.csv');
const DEPLOY_BLOCK = 33_417_145n;

interface Roster {
  slug: string;
  mintName: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  build: () => any;
  options: BacktestOptions;
}

const ROSTER: Roster[] = [
  { slug: 'perp-momentum-10x',      mintName: 'Perp Momentum 10x',      description: 'MACD momentum at 10× — 1% SL, 4% TP, full size.',           build: () => new PerpMomentum10x(),      options: { initialBalance: 10_000, market: 'perp', leverage: 10, takerFeeBps: 5, slippageBps: 5, liquidationMarginBps: 500 } },
  { slug: 'volatility-breakout-5x', mintName: 'Volatility Breakout 5x', description: 'MACD breakout at 5× — 4% SL, 8% TP, 70% size.',             build: () => new VolatilityBreakout5x(), options: { initialBalance: 10_000, market: 'perp', leverage: 5,  takerFeeBps: 5, slippageBps: 5, liquidationMarginBps: 500 } },
  { slug: 'funding-rate-hunter',    mintName: 'Funding Rate Hunter',    description: 'High-frequency MACD flips — 0.5% SL, 1.5% TP, 50% size.',   build: () => new FundingRateHunter(),    options: { initialBalance: 10_000, market: 'perp', leverage: 5,  takerFeeBps: 5, slippageBps: 5, liquidationMarginBps: 500 } },
  { slug: 'trend-follower-3x',      mintName: 'Trend Follower 3x',      description: 'Slow trend MACD — 6% SL, 12% TP, 60% size, 3× leverage.',   build: () => new TrendFollower3x(),      options: { initialBalance: 10_000, market: 'perp', leverage: 3,  takerFeeBps: 5, slippageBps: 5, liquidationMarginBps: 500 } },
  { slug: 'mean-revert-perp-5x',    mintName: 'Mean Revert Perp 5x',    description: 'Asymmetric stops — 3% SL, 1.5% TP, 80% size.',              build: () => new MeanRevertPerp5x(),     options: { initialBalance: 10_000, market: 'perp', leverage: 5,  takerFeeBps: 5, slippageBps: 5, liquidationMarginBps: 500 } },
];

const SEASON_ABI = [
  'function createSeason((bytes32 datasetSpec, uint64 initialBalance, uint16 feeBps, uint16 slippageBps, uint8 market, uint8 maxLeverage, uint64 startTime, uint64 endTime, uint256 prizePool, address creator, bool settled)) external payable returns (uint256)',
  'function enroll(uint256 seasonId, uint256 tokenId) external',
  'event SeasonCreated(uint256 indexed id, bytes32 indexed datasetSpec, uint64 startTime, uint64 endTime, uint256 prizePool)',
];

const LIVE_ABI = ['function start(uint256 tokenId, bytes32 initialCumulativeHash) external'];
const INFT_ABI = [
  'event AgentMinted(uint256 indexed tokenId, address indexed owner, uint256 indexed certificateId, bytes32 metadataHash, bytes32 storageRoot)',
  'function certificateOf(uint256) view returns (uint256)',
];
const CERT_ABI = [
  'function get(uint256) view returns ((bytes32 runHash, bytes32 storageRootHash, bytes32 datasetHash, bytes32 attestationHash, int128 totalReturnBps, uint128 sharpeX1000, address owner, uint48 createdAt, uint16 maxDrawdownBps, uint16 winRateBps, uint8 trustTier, uint8 market))',
];

interface MintedRecord {
  slug: string;
  cert: Certificate;
  inft: INFT;
}

async function scanExistingMints(rpc: string, inftAddr: string, certAddr: string): Promise<Map<string, { tokenId: bigint; certId: bigint; storageRoot: string; metadataHash: string }>> {
  const provider = new ethers.JsonRpcProvider(rpc);
  const inft = new ethers.Contract(inftAddr, INFT_ABI, provider);
  const cert = new ethers.Contract(certAddr, CERT_ABI, provider);
  const filter = inft.filters.AgentMinted!();
  const logs = await inft.queryFilter(filter, DEPLOY_BLOCK, 'latest');
  const map = new Map<string, { tokenId: bigint; certId: bigint; storageRoot: string; metadataHash: string }>();
  for (const log of logs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = (log as any).args;
    if (!a) continue;
    const tokenId = a.tokenId as bigint;
    const certificateId = a.certificateId as bigint;
    try {
      const c = await cert.get(certificateId);
      map.set(String(c.runHash).toLowerCase(), {
        tokenId,
        certId: certificateId,
        storageRoot: a.storageRoot,
        metadataHash: a.metadataHash,
      });
    } catch {
      // skip unreadable
    }
  }
  return map;
}

async function main() {
  loadEnv(resolve(HERE, '..', '.env'));
  const rpc = process.env.ZA_RPC!;
  const seasonAddr = process.env.ZA_ADDR_SEASON!;
  const liveAddr = process.env.ZA_ADDR_LIVE_CERT!;
  const inftAddr = process.env.ZA_ADDR_INFT!;
  const certAddr = process.env.ZA_ADDR_CERT!;
  if (!rpc || !seasonAddr || !liveAddr || !inftAddr || !certAddr) {
    throw new Error('All ZA_* env vars required');
  }

  const za = new ZeroArena(configFromEnv());
  const dataset = await parseDatasetFile(FIXTURE_CSV);
  console.log(`▸ dataset: ${dataset.candles.length} candles, datasetHash=${dataset.datasetHash}`);

  console.log(`▸ scanning existing mints from chain...`);
  const existing = await scanExistingMints(rpc, inftAddr, certAddr);
  console.log(`  found ${existing.size} mints on chain`);

  const minted: MintedRecord[] = [];

  for (const r of ROSTER) {
    console.log(`\n━━━ ${r.mintName} ━━━`);
    const agent = r.build();
    const result = await runBacktest(agent, dataset, r.options);
    console.log(`  runHash:  ${result.runHash}`);
    console.log(`  metrics:  return=${(result.metrics.totalReturnBps/100).toFixed(2)}% sharpe=${(result.metrics.sharpeX1000/1000).toFixed(2)} trades=${result.trades.length}`);

    const prior = existing.get(result.runHash.toLowerCase());
    if (prior) {
      console.log(`  ↺ already minted as token #${prior.tokenId} cert #${prior.certId} — reusing`);
      const certData = await new ethers.Contract(certAddr, CERT_ABI, new ethers.JsonRpcProvider(rpc)).get(prior.certId);
      const reusedCert: Certificate = {
        certId: prior.certId,
        runHash: result.runHash,
        storageRootHash: certData.storageRootHash,
        datasetHash: result.datasetHash,
        attestationHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        trustTier: 'T2',
        market: 'perp',
        metrics: result.metrics,
        txHash: '0x',
      };
      const reusedInft: INFT = {
        tokenId: prior.tokenId,
        owner: process.env.PRIVATE_KEY ? new ethers.Wallet(process.env.PRIVATE_KEY).address : '',
        certificateId: prior.certId,
        metadataHash: prior.metadataHash,
        storageRoot: prior.storageRoot,
        txHash: '0x',
      };
      minted.push({ slug: r.slug, cert: reusedCert, inft: reusedInft });
      continue;
    }

    console.log(`  ▸ certify…`);
    const cert = await za.certify(result);
    console.log(`    certId=${cert.certId} tx=${cert.txHash}`);
    console.log(`  ▸ mint…`);
    const inft = await za.mintAgent({ agent, certificate: cert, name: r.mintName, description: r.description });
    console.log(`    tokenId=${inft.tokenId} tx=${inft.txHash}`);
    minted.push({ slug: r.slug, cert, inft });
  }

  // ── Create new 10-min perp Season + enroll all 5 ──────────────────────
  console.log('\n━━━ creating 10-min perp Arena Season ━━━');
  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const season = new ethers.Contract(seasonAddr, SEASON_ABI, wallet);
  const live = new ethers.Contract(liveAddr, LIVE_ABI, wallet);

  const block = await provider.getBlock('latest');
  if (!block) throw new Error('no latest block');
  const now = Number(block.timestamp);
  const enrollSec = 240;
  const runSec = 600;
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
  console.log(`  prize:     ${ethers.formatEther(prize)} 0G`);

  const txCreate = await season.createSeason(spec, { value: prize });
  const rec = await txCreate.wait();
  let seasonId: bigint | undefined;
  for (const log of rec?.logs ?? []) {
    try {
      const parsed = season.interface.parseLog({ topics: [...log.topics], data: log.data });
      if (parsed?.name === 'SeasonCreated') { seasonId = parsed.args.id as bigint; break; }
    } catch {}
  }
  if (seasonId === undefined) throw new Error('SeasonCreated not found');
  console.log(`  seasonId:  ${seasonId}`);
  console.log(`  tx:        https://testnet.bscscan.com/tx/${txCreate.hash}`);

  for (const m of minted) {
    console.log(`\n▸ ${m.slug} (token #${m.inft.tokenId})`);
    try {
      const txE = await season.enroll(seasonId, m.inft.tokenId);
      await txE.wait();
      console.log(`  enroll:  ${txE.hash}`);
    } catch (err) {
      console.error(`  enroll FAILED: ${err instanceof Error ? err.message : err}`);
    }
    try {
      const txS = await live.start(m.inft.tokenId, m.cert.runHash);
      await txS.wait();
      console.log(`  start:   ${txS.hash}`);
    } catch (err) {
      console.error(`  start FAILED: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\n✓ 5-agent perp Arena live as Season #${seasonId}.`);
  console.log(`  Dashboard: https://zero-arena-fe.vercel.app/season/${seasonId}`);
  console.log(`  Season ends: ${new Date(Number(spec.endTime)*1000).toISOString()}`);
}

main().catch((err: unknown) => {
  console.error('\n✗ FAILED');
  console.error(err instanceof Error ? (err.stack ?? err.message) : String(err));
  process.exit(1);
});
