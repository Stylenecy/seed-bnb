#!/usr/bin/env node
// Recover operator $LANCE stuck as un-withdrawn earnings INSIDE the game/bounty
// contracts, then redeem it to CELO (for gas). Per operator wallet:
//   1. BingoChain: withdraw(LANCE) if earningsOf(wallet, LANCE) > 0
//   2. Claudelance: withdrawAllEarnings([LANCE])  (simulate-first, skips empty)
//   3. redeem the wallet's resulting $LANCE -> CELO to the deployer (Lance Hub ERC-4626)
// Bootstraps gas from the proceeds. STRICT: every tx status-checked, HARD-STOP on revert.
// Usage: node scripts/recover-earnings.mjs [--one]
import { readFileSync, existsSync } from 'node:fs';
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
const { ClaudelanceClient } = require(join(CL, 'packages/sdk/dist/index.cjs'));

const ONE = process.argv.includes('--one');
const RPC = 'https://forno.celo.org';
const HUB = getAddress('0xb70c9Cd73428Afe51eEEA832C49E8840D3f85cA2');
const BINGO = getAddress('0x8bE7c07CCF9FF515d82D4c36aB4EB937941432f1');
const DEP = getAddress('0x77c4a1cD22005b67Eb9CcEaE7E9577188d7Bca82');
const GAS_TARGET = parseEther('0.08');
const FEE = { maxFeePerGas: 260000000000n, maxPriorityFeePerGas: 2000000000n };
const HUB_ABI = [
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'redeem', stateMutability: 'nonpayable', inputs: [{ type: 'uint256' }, { type: 'address' }, { type: 'address' }], outputs: [{ type: 'uint256' }] },
];
const BINGO_ABI = [
  { type: 'function', name: 'earningsOf', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'withdraw', stateMutability: 'nonpayable', inputs: [{ type: 'address' }], outputs: [] },
];

const dkey = (() => { const k = readFileSync(join(CL, 'contracts/.env'), 'utf8').match(/^MAINNET_DEPLOYER_PRIVATE_KEY=(.+)$/m)[1].trim(); return k.startsWith('0x') ? k : `0x${k}`; })();
const deployer = privateKeyToAccount(dkey);
const pub = createPublicClient({ chain: celo, transport: http(RPC) });
const dWallet = createWalletClient({ account: deployer, chain: celo, transport: http(RPC) });
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const f = (x) => (+formatEther(x)).toFixed(2);
const lanceBal = (a) => pub.readContract({ address: HUB, abi: HUB_ABI, functionName: 'balanceOf', args: [a] });
const bingoEarn = (a) => pub.readContract({ address: BINGO, abi: BINGO_ABI, functionName: 'earningsOf', args: [a, HUB] }).catch(() => 0n);

async function confirm(p, label) { const h = await p; const rc = await pub.waitForTransactionReceipt({ hash: h, timeout: 120000 }); if (rc.status !== 'success') throw new Error(`REVERT at "${label}" (tx ${h}) - STOPPING`); return rc; }

// every operator wallet: pool (BingoChain players) + Claudelance workers
function loadWallets() {
  const out = []; const seen = new Set();
  const add = (key, isWorker) => { const account = privateKeyToAccount(key); if (seen.has(account.address)) return; seen.add(account.address); out.push({ account, wallet: createWalletClient({ account, chain: celo, transport: http(RPC) }), cl: isWorker ? ClaudelanceClient.fromPrivateKey({ privateKey: key, network: 'celo' }) : null }); };
  for (const d of JSON.parse(readFileSync(join(ROOT, 'scripts/out/pool.json'), 'utf8'))) add(d.pk.startsWith('0x') ? d.pk : `0x${d.pk}`, false);
  for (let i = 1; i <= 29; i++) { const wf = join(CL, 'claudelance worker', `worker ${i}`, 'wallet.env'); if (existsSync(wf)) { const m = readFileSync(wf, 'utf8').match(/^PRIVATE_KEY=(.+)$/m); if (m) add(m[1].trim().startsWith('0x') ? m[1].trim() : `0x${m[1].trim()}`, true); } }
  return out;
}

async function ensureGas(addr) { const g = await pub.getBalance({ address: addr }); if (g < parseEther('0.05')) { const nonce = await pub.getTransactionCount({ address: deployer.address, blockTag: 'pending' }); await confirm(dWallet.sendTransaction({ to: addr, value: GAS_TARGET - g, gas: 21000n, nonce, ...FEE }), `gas ${addr.slice(0, 8)}`); } }

async function recover(w) {
  let did = false;
  const be = await bingoEarn(w.account.address);
  if (be > 0n) { await ensureGas(w.account.address); await confirm(w.wallet.writeContract({ address: BINGO, abi: BINGO_ABI, functionName: 'withdraw', args: [HUB], gas: 150000n, ...FEE }), `bingo-withdraw ${w.account.address.slice(0, 8)} (${f(be)} LANCE)`); did = true; }
  if (w.cl) {
    await ensureGas(w.account.address);
    const res = await w.cl.withdrawAllEarnings([HUB]);
    for (const { hash } of res) { const rc = await pub.waitForTransactionReceipt({ hash, timeout: 120000 }); if (rc.status !== 'success') throw new Error(`REVERT cl-withdraw ${w.account.address.slice(0, 8)}`); }
    if (res.length) { log(`  cl-withdraw ${w.account.address.slice(0, 8)} (${res.length} tx)`); did = true; }
  }
  const lance = await lanceBal(w.account.address);
  if (lance > 0n) { await ensureGas(w.account.address); await confirm(w.wallet.writeContract({ address: HUB, abi: HUB_ABI, functionName: 'redeem', args: [lance, DEP, w.account.address], gas: 180000n, ...FEE }), `redeem ${w.account.address.slice(0, 8)} (${f(lance)} LANCE)`); did = true; }
  return did;
}

(async () => {
  const wallets = loadWallets();
  // prioritize wallets with BingoChain LANCE earnings (the big chunk)
  const ranked = [];
  for (const w of wallets) ranked.push({ w, be: await bingoEarn(w.account.address) });
  ranked.sort((a, b) => (b.be > a.be ? 1 : -1));
  const before = await pub.getBalance({ address: deployer.address });
  log(`recover-earnings: ${wallets.length} wallets; deployer CELO before ${f(before)}`);
  const list = ONE ? ranked.slice(0, 1) : ranked;
  let n = 0;
  for (const { w } of list) { if (await recover(w)) n++; }
  await new Promise((r) => setTimeout(r, 3000));
  const after = await pub.getBalance({ address: deployer.address });
  log(`DONE: recovered from ${n} wallets; deployer CELO ${f(before)} -> ${f(after)} (+${f(after - before)})`);
})().catch((e) => { console.error('\nSTOPPED ON ERROR:', e.message || e); process.exit(1); });
