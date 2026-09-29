// 10-minute multi-agent perp Arena Season on 0G mainnet.
//
// Mirrors the demo video's 5-agent leaderboard:
//   1. Perp Momentum 10x
//   2. Volatility Breakout 5x
//   3. Funding Rate Hunter
//   4. Trend Follower 3x
//   5. Mean Revert Perp 5x
//
// Pipeline per agent: offline backtest against the BTC perp fixture →
// certify on AgentCertificate → mint perp iNFT. Then a single Season
// (perp, 10-min, 0.005 0G prize) is created and all 5 iNFTs are enrolled +
// LiveCertificate-started in sequence. Season-keeper auto-settles after
// endTime.
//
// Run from examples/:
//   npx tsx scripts/arena-trial.ts

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

interface Roster {
  agentModule: string;
  mintName: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  build: () => any;
  /** Per-agent backtest knobs — separate the personalities at cert/optionsHash level. */
  options: BacktestOptions;
}

const ROSTER: Roster[] = [
  {
    agentModule: resolve(HERE, '..', 'arena-trial', 'perp-momentum-10x.ts'),
    mintName: 'Perp Momentum 10x',
    description: 'MACD momentum at 10× leverage — 1% SL, 4% TP, full size.',
    build: () => new PerpMomentum10x(),
    options: { initialBalance: 10_000, market: 'perp', leverage: 10, takerFeeBps: 5, slippageBps: 5, liquidationMarginBps: 500 },
  },
  {
    agentModule: resolve(HERE, '..', 'arena-trial', 'volatility-breakout-5x.ts'),
    mintName: 'Volatility Breakout 5x',
    description: 'MACD breakout at 5× — 4% SL, 8% TP, 70% size; rides expansion regimes.',
    build: () => new VolatilityBreakout5x(),
    options: { initialBalance: 10_000, market: 'perp', leverage: 5, takerFeeBps: 5, slippageBps: 5, liquidationMarginBps: 500 },
  },
  {
    agentModule: resolve(HERE, '..', 'arena-trial', 'funding-rate-hunter.ts'),
    mintName: 'Funding Rate Hunter',
    description: 'High-frequency MACD flips — 0.5% SL, 1.5% TP, 50% size.',
    build: () => new FundingRateHunter(),
    options: { initialBalance: 10_000, market: 'perp', leverage: 5, takerFeeBps: 5, slippageBps: 5, liquidationMarginBps: 500 },
  },
  {
    agentModule: resolve(HERE, '..', 'arena-trial', 'trend-follower-3x.ts'),
    mintName: 'Trend Follower 3x',
    description: 'Slow trend MACD — 6% SL, 12% TP, 60% size, 3× leverage. Patient.',
    build: () => new TrendFollower3x(),
    options: { initialBalance: 10_000, market: 'perp', leverage: 3, takerFeeBps: 5, slippageBps: 5, liquidationMarginBps: 500 },
  },
  {
    agentModule: resolve(HERE, '..', 'arena-trial', 'mean-revert-perp-5x.ts'),
    mintName: 'Mean Revert Perp 5x',
    description: 'Asymmetric stops bet on MACD-extreme fades — 3% SL, 1.5% TP, 80% size.',
    build: () => new MeanRevertPerp5x(),
    options: { initialBalance: 10_000, market: 'perp', leverage: 5, takerFeeBps: 5, slippageBps: 5, liquidationMarginBps: 500 },
  },
];

const SEASON_ABI = [
  'function createSeason((bytes32 datasetSpec, uint64 initialBalance, uint16 feeBps, uint16 slippageBps, uint8 market, uint8 maxLeverage, uint64 startTime, uint64 endTime, uint256 prizePool, address creator, bool settled)) external payable returns (uint256)',
  'function enroll(uint256 seasonId, uint256 tokenId) external',
  'event SeasonCreated(uint256 indexed id, bytes32 indexed datasetSpec, uint64 startTime, uint64 endTime, uint256 prizePool)',
];

const LIVE_ABI = [
  'function start(uint256 tokenId, bytes32 initialCumulativeHash) external',
];

interface MintRecord {
  slug: string;
  cert: Certificate;
  inft: INFT;
}

async function main() {
  loadEnv(resolve(HERE, '..', '.env'));

  const rpc = process.env.ZA_RPC!;
  const seasonAddr = process.env.ZA_ADDR_SEASON!;
  const liveAddr = process.env.ZA_ADDR_LIVE_CERT!;
  if (!rpc || !seasonAddr || !liveAddr) {
    throw new Error('ZA_RPC + ZA_ADDR_SEASON + ZA_ADDR_LIVE_CERT must be set in examples/.env');
  }

  const za = new ZeroArena(configFromEnv());
  const dataset = await parseDatasetFile(FIXTURE_CSV);
  console.log(`▸ shared dataset (perp fixture): ${dataset.candles.length} candles, datasetHash=${dataset.datasetHash}\n`);

  // ── 1. backtest + certify + mint each agent ─────────────────────────────
  const minted: MintRecord[] = [];
  for (const r of ROSTER) {
    console.log(`━━━ ${r.mintName} ━━━`);
    const agent = r.build();
    const result = await runBacktest(agent, dataset, r.options);
    console.log(`  ▸ backtest: trades=${result.trades.length} return=${(result.metrics.totalReturnBps / 100).toFixed(2)}% sharpe=${(result.metrics.sharpeX1000 / 1000).toFixed(2)} maxDD=${(result.metrics.maxDrawdownBps / 100).toFixed(2)}%`);
    console.log(`  ▸ runHash:  ${result.runHash}`);

    const cert = await za.certify(result);
    console.log(`  ▸ certify:  certId=${cert.certId}  tx=${cert.txHash}`);

    const inft = await za.mintAgent({ agent, certificate: cert, name: r.mintName, description: r.description });
    console.log(`  ▸ mint:     tokenId=${inft.tokenId}  tx=${inft.txHash}\n`);

    minted.push({ slug: r.mintName, cert, inft });
  }

  // ── 2. createSeason (10-min, perp, 0.005 0G prize) ──────────────────────
  console.log('━━━ creating 10-min perp Arena Season ━━━');
  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const season = new ethers.Contract(seasonAddr, SEASON_ABI, wallet);
  const live = new ethers.Contract(liveAddr, LIVE_ABI, wallet);

  const block = await provider.getBlock('latest');
  if (!block) throw new Error('no latest block');
  const now = Number(block.timestamp);
  const enrollSec = 240;       // 4 min window for 5 enroll + 5 start tx
  const runSec = 600;          // 10 min Season runtime
  const prize = ethers.parseEther('0.005');

  const spec = {
    datasetSpec: ethers.keccak256(ethers.toUtf8Bytes('BTCUSDT-15m-perp')),
    initialBalance: 10_000n,
    feeBps: 5,
    slippageBps: 5,
    market: 1, // perp
    maxLeverage: 10,
    startTime: BigInt(now + enrollSec),
    endTime: BigInt(now + enrollSec + runSec),
    prizePool: prize,
    creator: ethers.ZeroAddress,
    settled: false,
  };
  console.log(`  startTime:   ${new Date(Number(spec.startTime) * 1000).toISOString()}`);
  console.log(`  endTime:     ${new Date(Number(spec.endTime) * 1000).toISOString()}`);
  console.log(`  prizePool:   ${ethers.formatEther(prize)} 0G`);

  const txCreate = await season.createSeason(spec, { value: prize });
  const recCreate = await txCreate.wait();
  let seasonId: bigint | undefined;
  for (const log of recCreate?.logs ?? []) {
    try {
      const parsed = season.interface.parseLog({ topics: [...log.topics], data: log.data });
      if (parsed?.name === 'SeasonCreated') {
        seasonId = parsed.args.id as bigint;
        break;
      }
    } catch {
      // not a Season event; ignore
    }
  }
  if (seasonId === undefined) throw new Error('SeasonCreated event not found');
  console.log(`  seasonId:    ${seasonId}`);
  console.log(`  tx:          https://testnet.bscscan.com/tx/${txCreate.hash}\n`);

  // ── 3. enroll + start each iNFT ─────────────────────────────────────────
  for (const m of minted) {
    console.log(`▸ ${m.slug} (token #${m.inft.tokenId})`);
    const txEnroll = await season.enroll(seasonId, m.inft.tokenId);
    await txEnroll.wait();
    console.log(`  enroll:    ${txEnroll.hash}`);
    const txStart = await live.start(m.inft.tokenId, m.cert.runHash);
    await txStart.wait();
    console.log(`  start:     ${txStart.hash}`);
  }

  // ── 4. summary ──────────────────────────────────────────────────────────
  const endIso = new Date(Number(spec.endTime) * 1000).toISOString();
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✓ 5-agent perp Arena live on 0G mainnet.`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Season #${seasonId} ends ${endIso}.`);
  console.log(`\nLeaderboard / detail: https://zero-arena-fe.vercel.app/season/${seasonId}`);
  console.log(`\nTo also stream live epoch commits, delegate each token via /onboard:`);
  for (const m of minted) {
    console.log(`  tokenId=${m.inft.tokenId} (${m.slug})  agentModule=${ROSTER.find((r) => r.mintName === m.slug)!.agentModule}`);
  }
  console.log(`\nWatch:   npx tsx scripts/season-status.ts ${seasonId}`);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? (err.stack ?? err.message) : String(err);
  console.error(msg);
  process.exit(1);
});
