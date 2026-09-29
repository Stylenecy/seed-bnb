#!/usr/bin/env node
// Redeem operator-held $LANCE back to CELO (for gas). The Lance Hub is an
// ERC-4626 vault (asset = CELO, share = $LANCE): each holder calls
// redeem(shares, receiver=deployer, owner=self) and the CELO lands on the
// deployer. Bootstraps gas: redeem the biggest holders first so the proceeds
// fund the next wallet's redeem-gas. STRICT: every tx is status-checked and the
// run HARD-STOPS on the first revert.
//
// Usage:
//   node scripts/redeem-lance.mjs --one        # validate: redeem the single biggest holder
//   node scripts/redeem-lance.mjs [--min 30]   # redeem all holders above --min LANCE
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const CL = join(ROOT, '..', 'Claudelance');
const require = createRequire(join(CL, 'packages/sdk/package.json'));
const { createPublicClient, createWalletClient, http, parseEther, formatEther, getAddress } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { celo } = require('viem/chains');

const args = {};
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a === '--one') args.one = true; else if (a.startsWith('--')) args[a.slice(2)] = process.argv[++i]; }
const ONE = !!args.one;
const MIN = parseEther(args.min || '30'); // skip dust: only redeem holders above this (net-positive after gas)

const RPC = 'https://forno.celo.org';
const HUB = getAddress('0xb70c9Cd73428Afe51eEEA832C49E8840D3f85cA2');
const DEP = getAddress('0x77c4a1cD22005b67Eb9CcEaE7E9577188d7Bca82');
const GAS_FOR_REDEEM = parseEther('0.07'); // target gas float per wallet; 180k x 260gwei upfront check = ~0.047
const FEE = { maxFeePerGas: 260000000000n, maxPriorityFeePerGas: 2000000000n };
const HUB_ABI = [
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'previewRedeem', stateMutability: 'view', inputs: [{ type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'redeem', stateMutability: 'nonpayable', inputs: [{ name: 'shares', type: 'uint256' }, { name: 'receiver', type: 'address' }, { name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
];

const dkey = (() => { const k = readFileSync(join(ROOT, '..', 'Claudelance', 'contracts/.env'), 'utf8').match(/^MAINNET_DEPLOYER_PRIVATE_KEY=(.+)$/m)[1].trim(); return k.startsWith('0x') ? k : `0x${k}`; })();
const deployer = privateKeyToAccount(dkey);
const pub = createPublicClient({ chain: celo, transport: http(RPC) });
const dWallet = createWalletClient({ account: deployer, chain: celo, transport: http(RPC) });
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const f = (x) => (+formatEther(x)).toFixed(3);

async function confirm(hashPromise, label) {
  const hash = await hashPromise;
  const rc = await pub.waitForTransactionReceipt({ hash, timeout: 120000 });
  if (rc.status !== 'success') throw new Error(`REVERT at "${label}" (tx ${hash}) - STOPPING`);
  return rc;
}

// collect every operator wallet key: BingoChain pool + Claudelance workers
function loadKeys() {
  const keys = [];
  const pool = JSON.parse(readFileSync(join(ROOT, 'scripts/out/pool.json'), 'utf8'));
  for (const d of pool) keys.push(d.pk.startsWith('0x') ? d.pk : `0x${d.pk}`);
  for (let i = 1; i <= 29; i++) {
    const wf = join(CL, 'claudelance worker', `worker ${i}`, 'wallet.env');
    if (existsSync(wf)) { const m = readFileSync(wf, 'utf8').match(/^PRIVATE_KEY=(.+)$/m); if (m) keys.push(m[1].trim().startsWith('0x') ? m[1].trim() : `0x${m[1].trim()}`); }
  }
  // BingoChain player wallets (mostly overlap pool.json; a handful are extra)
  const wdir = join(ROOT, 'wallets');
  if (existsSync(wdir)) for (const d of readdirSync(wdir)) { const wf = join(wdir, d, 'wallet.env'); if (existsSync(wf)) { const m = readFileSync(wf, 'utf8').match(/^PRIVATE_KEY=(.+)$/m); if (m) keys.push(m[1].trim().startsWith('0x') ? m[1].trim() : `0x${m[1].trim()}`); } }
  // de-dupe by address
  const seen = new Set(); const out = [];
  for (const k of keys) { const acct = privateKeyToAccount(k); if (!seen.has(acct.address)) { seen.add(acct.address); out.push({ key: k, account: acct, wallet: createWalletClient({ account: acct, chain: celo, transport: http(RPC) }) }); } }
  return out;
}

async function redeemOne(w, lance) {
  const exp = await pub.readContract({ address: HUB, abi: HUB_ABI, functionName: 'previewRedeem', args: [lance] });
  const g = await pub.getBalance({ address: w.account.address });
  if (g < parseEther('0.05')) {
    const nonce = await pub.getTransactionCount({ address: deployer.address, blockTag: 'pending' });
    await confirm(dWallet.sendTransaction({ to: w.account.address, value: GAS_FOR_REDEEM - g, gas: 21000n, nonce, ...FEE }), `gas ${w.account.address.slice(0, 8)}`);
  }
  // redeem actually uses ~130k; keep the limit modest so the node's upfront
  // (gasLimit x maxFeePerGas) balance check fits the small gas float we fund.
  await confirm(w.wallet.writeContract({ address: HUB, abi: HUB_ABI, functionName: 'redeem', args: [lance, DEP, w.account.address], gas: 180000n, ...FEE }), `redeem ${w.account.address.slice(0, 8)} (${f(lance)} LANCE)`);
  log(`  redeemed ${w.account.address.slice(0, 8)}: ${f(lance)} LANCE -> ~${f(exp)} CELO to deployer`);
  return exp;
}

(async () => {
  const wallets = loadKeys();
  // read LANCE balances, keep holders above MIN, sort desc (biggest first to bootstrap gas)
  const holders = [];
  for (const w of wallets) { const b = await pub.readContract({ address: HUB, abi: HUB_ABI, functionName: 'balanceOf', args: [w.account.address] }); if (b >= MIN) holders.push({ w, lance: b }); }
  holders.sort((a, b) => (b.lance > a.lance ? 1 : -1));
  const totalLance = holders.reduce((s, h) => s + h.lance, 0n);
  log(`redeem-lance: ${holders.length} holders above ${f(MIN)} LANCE, total ${f(totalLance)} LANCE`);
  const before = await pub.getBalance({ address: deployer.address });
  log(`deployer CELO before: ${f(before)}`);

  const list = ONE ? holders.slice(0, 1) : holders;
  let recovered = 0n;
  for (const h of list) { recovered += await redeemOne(h.w, h.lance); }

  await new Promise((r) => setTimeout(r, 3000));
  const after = await pub.getBalance({ address: deployer.address });
  log(`DONE: redeemed ${list.length} wallets, ~${f(recovered)} CELO expected; deployer CELO ${f(before)} -> ${f(after)} (+${f(after - before)})`);
})().catch((e) => { console.error('\nSTOPPED ON ERROR:', e.message || e); process.exit(1); });
