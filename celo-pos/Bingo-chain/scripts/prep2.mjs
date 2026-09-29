// Pre-max-vol consolidation: pull all reachable cUSD onto the deployer.
//   1) recover worker-1's leftover cUSD (tie-split) -> deployer
//   2) withdraw the BingoChain treasury's accrued cUSD fees, then move them ->
//      deployer. cUSD ONLY (leave treasury CELO/LANCE untouched).
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
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
const PROXY = getAddress("0x8bE7c07CCF9FF515d82D4c36aB4EB937941432f1");
const CUSD = getAddress("0x765DE816845861e75A25fCA122bb6898B8B1282a");
const FEE = { maxFeePerGas: parseGwei("260"), maxPriorityFeePerGas: parseGwei("2") };
const ERC20T = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ name: "t", type: "address" }, { name: "a", type: "uint256" }], outputs: [{ type: "bool" }] },
];
const WITHDRAW = [
  { type: "function", name: "withdraw", stateMutability: "nonpayable", inputs: [{ name: "token", type: "address" }], outputs: [] },
  { type: "function", name: "earningsOf", stateMutability: "view", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }] },
];
const pub = createPublicClient({ chain: celo, transport: http(RPC) });
const wc = (acct) => createWalletClient({ account: acct, chain: celo, transport: http(RPC) });
const wait = (h) => pub.waitForTransactionReceipt({ hash: h, timeout: 180000 });
const keyAcct = (k) => privateKeyToAccount(k.startsWith("0x") ? k : `0x${k}`);
const cusd = (a) => pub.readContract({ address: CUSD, abi: ERC20T, functionName: "balanceOf", args: [a] });

const env = readFileSync(join(CL, "contracts/.env"), "utf8");
const deployer = keyAcct(env.match(/^MAINNET_DEPLOYER_PRIVATE_KEY=(.+)$/m)[1].trim());
const treasury = keyAcct(env.match(/^MAINNET_TREASURY_PRIVATE_KEY=(.+)$/m)[1].trim());
const wenv = readFileSync(join(CL, "claudelance worker", "worker 1", "wallet.env"), "utf8");
const worker = keyAcct(wenv.match(/^PRIVATE_KEY=(.+)$/m)[1].trim());

const fundGas = async (to, min) => {
  const bal = await pub.getBalance({ address: to });
  if (bal < min) { const h = await wc(deployer).sendTransaction({ to, value: min - bal, gas: 30000n, ...FEE }); await wait(h); }
};

// 1) recover worker-1 leftover cUSD
const wcusd = await cusd(worker.address);
console.log(`worker-1 cUSD: ${formatUnits(wcusd, 18)}`);
if (wcusd > 0n) {
  await fundGas(worker.address, parseEther("0.03"));
  const h = await wc(worker).writeContract({ address: CUSD, abi: ERC20T, functionName: "transfer", args: [deployer.address, wcusd], gas: 80000n, ...FEE });
  await wait(h); console.log(`  -> moved ${formatUnits(wcusd, 18)} cUSD to deployer`);
}

// 2) treasury: withdraw cUSD fees, then move to deployer
const owed = await pub.readContract({ address: PROXY, abi: WITHDRAW, functionName: "earningsOf", args: [treasury.address, CUSD] });
console.log(`treasury accrued cUSD: ${formatUnits(owed, 18)} (treasury ${treasury.address})`);
if (owed > 0n) {
  await fundGas(treasury.address, parseEther("0.05"));
  const h1 = await wc(treasury).writeContract({ address: PROXY, abi: WITHDRAW, functionName: "withdraw", args: [CUSD], gas: 150000n, ...FEE });
  await wait(h1); console.log("  -> withdraw(cUSD) from treasury done");
}
const tbal = await cusd(treasury.address);
if (tbal > 0n) {
  const h2 = await wc(treasury).writeContract({ address: CUSD, abi: ERC20T, functionName: "transfer", args: [deployer.address, tbal], gas: 80000n, ...FEE });
  await wait(h2); console.log(`  -> moved ${formatUnits(tbal, 18)} cUSD treasury -> deployer`);
}

const dC = await cusd(deployer.address);
const dN = await pub.getBalance({ address: deployer.address });
console.log(`\ndeployer now: ${formatUnits(dC, 18)} cUSD, ${formatEther(dN)} CELO`);
console.log(`max-vol stake/side next round ~= ${formatUnits((dC * 99n) / 200n, 18)} cUSD`);
