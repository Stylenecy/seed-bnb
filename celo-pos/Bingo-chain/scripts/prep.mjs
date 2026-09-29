// Consolidate the operator's own dust into the deployer so it can run the cUSD
// duel: (1) move all cUSD from the holding player wallet, (2) sweep worker CELO
// (except worker 1, which plays) into the deployer for gas. All reversible.
import { createRequire } from "node:module";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..");
const CL = join(ROOT, "..", "Claudelance");
const require = createRequire(join(CL, "packages/sdk/package.json"));
const { createPublicClient, createWalletClient, http, getAddress, parseEther, parseGwei, formatEther, formatUnits } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { celo } = require("viem/chains");

const RPC = process.env.CELO_RPC || "https://forno.celo.org";
const CUSD = getAddress("0x765DE816845861e75A25fCA122bb6898B8B1282a");
const FEE = { maxFeePerGas: parseGwei("260"), maxPriorityFeePerGas: parseGwei("2") };
const ERC20T = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ name: "t", type: "address" }, { name: "a", type: "uint256" }], outputs: [{ type: "bool" }] },
];
const pub = createPublicClient({ chain: celo, transport: http(RPC) });
const wc = (acct) => createWalletClient({ account: acct, chain: celo, transport: http(RPC) });
const keyOf = (p) => { const m = readFileSync(p, "utf8").match(/^PRIVATE_KEY=(.+)$/m); const k = m[1].trim(); return k.startsWith("0x") ? k : `0x${k}`; };

const dkey = readFileSync(join(CL, "contracts/.env"), "utf8").match(/^MAINNET_DEPLOYER_PRIVATE_KEY=(.+)$/m)[1].trim();
const deployer = privateKeyToAccount(dkey.startsWith("0x") ? dkey : `0x${dkey}`);
const cusd = (a) => pub.readContract({ address: CUSD, abi: ERC20T, functionName: "balanceOf", args: [a] });
const wait = (h) => pub.waitForTransactionReceipt({ hash: h, timeout: 180000 });

// 1) cUSD holder → deployer (player-02 holds it all per the distribution probe)
const holderEnv = process.env.CUSD_HOLDER_ENV || join(ROOT, "wallets", "player-02", "wallet.env");
const holder = privateKeyToAccount(keyOf(holderEnv));
const hCusd = await cusd(holder.address);
console.log(`cUSD holder ${holder.address}: ${formatUnits(hCusd, 18)} cUSD`);
if (hCusd > 0n) {
  const hNative = await pub.getBalance({ address: holder.address });
  if (hNative < parseEther("0.03")) {
    const h = await wc(deployer).sendTransaction({ to: holder.address, value: parseEther("0.03") - hNative, gas: 30000n, ...FEE });
    await wait(h); console.log("  funded holder 0.03 CELO for gas");
  }
  const h = await wc(holder).writeContract({ address: CUSD, abi: ERC20T, functionName: "transfer", args: [deployer.address, hCusd], gas: 80000n, ...FEE });
  await wait(h); console.log(`  swept ${formatUnits(hCusd, 18)} cUSD → deployer`);
}

// 2) worker CELO (skip worker 1) → deployer
const wdir = join(CL, "claudelance worker");
const workers = readdirSync(wdir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /worker/i.test(d.name) && !/worker\s*1$/i.test(d.name))
  .map((d) => keyOf(join(wdir, d.name, "wallet.env")))
  .map((k) => privateKeyToAccount(k));
const reserve = 25000n * FEE.maxFeePerGas; // leave enough for the sweep tx
let recovered = 0n, swept = 0;
await Promise.all(workers.map(async (acct) => {
  try {
    const bal = await pub.getBalance({ address: acct.address });
    if (bal <= reserve * 3n) return;
    const value = bal - reserve * 2n;
    const h = await wc(acct).sendTransaction({ to: deployer.address, value, gas: 21000n, ...FEE });
    await wait(h); recovered += value; swept++;
  } catch (e) { console.log(`  sweep ${acct.address.slice(0, 10)} failed: ${e.shortMessage || e.message}`); }
}));
console.log(`swept ~${formatEther(recovered)} CELO from ${swept} workers → deployer`);

const dC = await cusd(deployer.address);
const dN = await pub.getBalance({ address: deployer.address });
console.log(`\ndeployer now: ${formatUnits(dC, 18)} cUSD, ${formatEther(dN)} CELO`);
