// Consolidate native CELO from every pool wallet (scripts/out/pool.json) back to
// the deployer/poster so it can be reused (gas top-ups, etc). Keeps each wallet's
// $LANCE untouched (that is the play stake). Best-effort, parallel in chunks.
// Usage: node scripts/sweep-pool.mjs [--keep 0.002] [--chunk 12]
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..");
const CLAUDELANCE = join(ROOT, "..", "Claudelance");
const require = createRequire(join(CLAUDELANCE, "packages/sdk/package.json"));
const { createPublicClient, createWalletClient, http, parseEther, formatEther, parseGwei } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { celo } = require("viem/chains");

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];
const KEEP = parseEther(args.keep ?? "0.002");
const CHUNK = Number(args.chunk ?? 12);

const deployerKey = readFileSync(join(CLAUDELANCE, "contracts/.env"), "utf8").match(/^MAINNET_DEPLOYER_PRIVATE_KEY=(.+)$/m)[1].trim();
const POSTER = privateKeyToAccount(deployerKey.startsWith("0x") ? deployerKey : `0x${deployerKey}`).address;
const pool = JSON.parse(readFileSync(join(__dir, "out", "pool.json"), "utf8"));

const pub = createPublicClient({ chain: celo, transport: http("https://forno.celo.org") });
const FEE = { maxFeePerGas: parseGwei("260"), maxPriorityFeePerGas: parseGwei("2") };

let total = 0n, sent = 0;
for (let i = 0; i < pool.length; i += CHUNK) {
  const batch = pool.slice(i, i + CHUNK);
  await Promise.all(batch.map(async (w) => {
    try {
      const account = privateKeyToAccount(w.pk);
      const bal = await pub.getBalance({ address: account.address });
      const gasCost = 21000n * (FEE.maxFeePerGas);
      const value = bal - KEEP - gasCost;
      if (value <= 0n) return;
      const wallet = createWalletClient({ account, chain: celo, transport: http("https://forno.celo.org") });
      const nonce = await pub.getTransactionCount({ address: account.address, blockTag: "pending" });
      const hash = await wallet.sendTransaction({ to: POSTER, value, gas: 21000n, nonce, ...FEE });
      await pub.waitForTransactionReceipt({ hash, timeout: 120000 });
      total += value; sent++;
    } catch { /* skip dust/failed wallet */ }
  }));
  process.stdout.write(`.${i + batch.length}`);
}
console.log(`\nswept ${formatEther(total)} CELO from ${sent} pool wallets -> deployer`);
