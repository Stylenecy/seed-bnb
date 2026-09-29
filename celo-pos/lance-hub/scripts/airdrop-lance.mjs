// Airdrop test funds to the BingoChain pool wallets: GAS (native CELO) + $LANCE.
// Each wallet gets CELO_PER (gas) + LANCE_PER ($LANCE to play with). Nonce-managed
// from the deployer. Reads the existing 90-wallet pool. All operator wallets
// (operator dogfooding — not third-party distribution).
//
// Usage: node scripts/airdrop-lance.mjs   (env: CELO_PER=1, LANCE_PER=200)
//
// Multichain: CHAIN_ID=42220 (default, Celo mainnet — the live deployment) or
// CHAIN_ID=97 / 56 for BNB Chain testnet / mainnet. On BSC, CELO_PER is the native
// BNB gas amount per wallet and LANCE_ADDRESS (the BSC LanceHub proxy) is required.

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const CLAUDELANCE = join(__dir, "..", "..", "Claudelance");
const require = createRequire(join(CLAUDELANCE, "packages/sdk/package.json"));
const { createPublicClient, createWalletClient, http, parseEther, formatEther, parseGwei, getAddress } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { celo, bsc, bscTestnet } = require("viem/chains");

const CHAINS = {
  42220: { chain: celo, rpc: "https://forno.celo.org", lance: "0xb70c9Cd73428Afe51eEEA832C49E8840D3f85cA2", fee: { maxFeePerGas: parseGwei("260"), maxPriorityFeePerGas: parseGwei("2") } },
  97: { chain: bscTestnet, rpc: "https://bsc-testnet-rpc.publicnode.com", lance: "0x56a647A62C68BF7228Cb0b876a937a7331a41bf9" /* BSC testnet LanceHub proxy */, fee: { gasPrice: parseGwei("1") } },
  56: { chain: bsc, rpc: "https://bsc-dataseed.bnbchain.org", lance: undefined /* TODO: BSC mainnet LanceHub proxy */, fee: { gasPrice: parseGwei("1") } },
};
const NET = CHAINS[Number(process.env.CHAIN_ID || 42220)];
if (!NET) throw new Error(`unsupported CHAIN_ID ${process.env.CHAIN_ID}`);
const RPC = process.env.RPC_URL || NET.rpc;
const LANCE = getAddress(process.env.LANCE_ADDRESS || NET.lance || (() => { throw new Error("set LANCE_ADDRESS for this chain"); })());
const POOL_FILE = join(__dir, "..", "..", "Bingo-chain", "scripts", "out", "pool.json");
const CELO_PER = parseEther(process.env.CELO_PER || "1");     // gas per wallet
const LANCE_PER = parseEther(process.env.LANCE_PER || "200"); // $LANCE per wallet (18 dec)
const FEE = NET.fee;

const ERC20 = [
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "v", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] },
];

const deployerKey = readFileSync(join(CLAUDELANCE, "contracts/.env"), "utf8").match(/^MAINNET_DEPLOYER_PRIVATE_KEY=(.+)$/m)[1].trim();
const deployer = privateKeyToAccount(deployerKey.startsWith("0x") ? deployerKey : `0x${deployerKey}`);
const pub = createPublicClient({ chain: NET.chain, transport: http(RPC) });
const wallet = createWalletClient({ account: deployer, chain: NET.chain, transport: http(RPC) });
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

async function main() {
  const pool = JSON.parse(readFileSync(POOL_FILE, "utf8"));
  const need = CELO_PER * BigInt(pool.length) + parseEther("3");
  const bal = await pub.getBalance({ address: deployer.address });
  const lbal = await pub.readContract({ address: LANCE, abi: ERC20, functionName: "balanceOf", args: [deployer.address] });
  const needLance = LANCE_PER * BigInt(pool.length);
  log(`pool ${pool.length} | per-wallet ${formatEther(CELO_PER)} CELO + ${formatEther(LANCE_PER)} LANCE`);
  log(`deployer ${formatEther(bal)} CELO / ${formatEther(lbal)} LANCE | need ${formatEther(need)} CELO + ${formatEther(needLance)} LANCE`);
  if (bal < need) throw new Error(`insufficient CELO: have ${formatEther(bal)}, need ${formatEther(need)}`);
  if (lbal < needLance) throw new Error(`insufficient LANCE: have ${formatEther(lbal)}, need ${formatEther(needLance)}`);

  let nonce = await pub.getTransactionCount({ address: deployer.address });

  // Phase 1: fund CELO (gas) — sequential broadcast w/ explicit nonces, then wait all
  log("funding CELO (gas)…");
  const celoHashes = [];
  for (const w of pool) {
    const h = await wallet.sendTransaction({ to: getAddress(w.address), value: CELO_PER, gas: 30000n, nonce: nonce++, ...FEE });
    celoHashes.push(h);
  }
  for (const h of celoHashes) await pub.waitForTransactionReceipt({ hash: h, timeout: 180000 });
  log(`funded ${pool.length} wallets with CELO ✓`);

  // Phase 2: airdrop $LANCE
  log("airdropping $LANCE…");
  const lanceHashes = [];
  for (const w of pool) {
    const h = await wallet.writeContract({ address: LANCE, abi: ERC20, functionName: "transfer", args: [getAddress(w.address), LANCE_PER], gas: 80000n, nonce: nonce++, ...FEE });
    lanceHashes.push(h);
  }
  let okL = 0;
  for (const h of lanceHashes) { const r = await pub.waitForTransactionReceipt({ hash: h, timeout: 180000 }); if (r.status === "success") okL++; }
  log(`airdropped $LANCE to ${okL}/${pool.length} wallets ✓`);

  // spot-check 3 wallets
  for (const w of pool.slice(0, 3)) {
    const cb = await pub.getBalance({ address: getAddress(w.address) });
    const lb = await pub.readContract({ address: LANCE, abi: ERC20, functionName: "balanceOf", args: [getAddress(w.address)] });
    log(`  ${w.address}: ${formatEther(cb)} CELO, ${formatEther(lb)} LANCE`);
  }
  const finalBal = await pub.getBalance({ address: deployer.address });
  const finalL = await pub.readContract({ address: LANCE, abi: ERC20, functionName: "balanceOf", args: [deployer.address] });
  log(`deployer left: ${formatEther(finalBal)} CELO / ${formatEther(finalL)} LANCE`);

  mkdirSync(join(__dir, "out"), { recursive: true });
  writeFileSync(join(__dir, "out", "airdrop-record.json"), JSON.stringify({ token: LANCE, celoPer: formatEther(CELO_PER), lancePer: formatEther(LANCE_PER), wallets: pool.length }, null, 2));
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
