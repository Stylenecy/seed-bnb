// One-off: report cUSD + native CELO across all local wallet sets + the deployer.
// Reads only the public ADDRESS= field from each wallet.env (never the key).
// ponytail: multicall3 in one batch instead of 270 sequential RPC calls.
import { createRequire } from "node:module";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..");
const CLAUDELANCE = join(ROOT, "..", "Claudelance");
const require = createRequire(join(CLAUDELANCE, "packages/sdk/package.json"));
const { createPublicClient, http, getAddress, formatEther, formatUnits } = require("viem");
const { celo } = require("viem/chains");

const RPC = process.env.CELO_RPC || "https://forno.celo.org";
const CUSD = getAddress("0x765DE816845861e75A25fCA122bb6898B8B1282a");
const MC3 = getAddress("0xcA11bde05977b3631167028862bE2a173976CA11");
const ERC20 = [{ type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] }];
const MC3_ABI = [{ type: "function", name: "getEthBalance", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] }];

const addrOf = (p) => {
  const m = readFileSync(p, "utf8").match(/^ADDRESS=(.+)$/m);
  return m ? getAddress(m[1].trim()) : null;
};
const dirsIn = (base, re) => readdirSync(base, { withFileTypes: true })
  .filter((d) => d.isDirectory() && re.test(d.name))
  .map((d) => join(base, d.name, "wallet.env"));

const deployer = getAddress(readFileSync(join(CLAUDELANCE, "contracts/.env"), "utf8").match(/^MAINNET_DEPLOYER_ADDRESS=(.+)$/m)[1].trim());
const workers = dirsIn(join(CLAUDELANCE, "claudelance worker"), /worker/i).map(addrOf).filter(Boolean);
const players = dirsIn(join(ROOT, "wallets"), /^player-/).map(addrOf).filter(Boolean);

const pub = createPublicClient({ chain: celo, transport: http(RPC, { batch: true }) });

const all = [deployer, ...workers, ...players];
const contracts = all.flatMap((a) => [
  { address: CUSD, abi: ERC20, functionName: "balanceOf", args: [a] },
  { address: MC3, abi: MC3_ABI, functionName: "getEthBalance", args: [a] },
]);
const res = await pub.multicall({ contracts, allowFailure: true });

const bal = new Map();
all.forEach((a, i) => bal.set(a, {
  cusd: res[2 * i].status === "success" ? res[2 * i].result : 0n,
  celo: res[2 * i + 1].status === "success" ? res[2 * i + 1].result : 0n,
}));

const sum = (addrs) => addrs.reduce((acc, a) => {
  const b = bal.get(a);
  acc.cusd += b.cusd; acc.celo += b.celo;
  return acc;
}, { cusd: 0n, celo: 0n });

const fmt = (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 4 });
const row = (label, n, t) => `${label.padEnd(28)} ${String(n).padStart(4)}  cUSD ${fmt(formatUnits(t.cusd, 18)).padStart(12)}   CELO ${fmt(formatEther(t.celo)).padStart(12)}`;

const dep = bal.get(deployer);
const wT = sum(workers), pT = sum(players);
const grand = { cusd: dep.cusd + wT.cusd + pT.cusd, celo: dep.celo + wT.celo + pT.celo };

console.log("\n=== Local wallet balances (Celo mainnet) ===");
console.log(`deployer ${deployer}`);
console.log(row("  deployer", 1, dep));
console.log(row("Claudelance workers", workers.length, wT));
console.log(row("BingoChain players", players.length, pT));
console.log("-".repeat(70));
console.log(row("GRAND TOTAL (incl. deployer)", all.length, grand));

// non-empty wallets, for the play step
const fundedWorkers = workers.filter((a) => bal.get(a).cusd > 0n || bal.get(a).celo > 0n);
console.log(`\nworkers with any balance: ${fundedWorkers.length}/${workers.length}`);
